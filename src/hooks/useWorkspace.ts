import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Space, TaxSettings, Vehicle } from "@/integrations/supabase/types";
import { siteConfig } from "@/config/site";
import { DEFAULT_TAX_MODE } from "@/lib/taxEstimate";

function activeVehicleStorageKey(userId: string) {
  return `julien-getaround:active-vehicle:${userId}`;
}

function readStoredVehicleId(userId: string): string | null {
  try {
    return localStorage.getItem(activeVehicleStorageKey(userId));
  } catch {
    return null;
  }
}

function writeStoredVehicleId(userId: string, vehicleId: string) {
  try {
    localStorage.setItem(activeVehicleStorageKey(userId), vehicleId);
  } catch {
    // ignore quota / private mode
  }
}

function pickActiveVehicle(vehicles: Vehicle[], userId: string): Vehicle {
  const stored = readStoredVehicleId(userId);
  return vehicles.find((item) => item.id === stored) ?? vehicles[0];
}

async function ensureSpace(
  userId: string,
  kind: "getaround" | "pea" | "crypto",
  name: string,
): Promise<Space> {
  const { data: spaces, error: spacesError } = await supabase
    .from("spaces")
    .select("*")
    .eq("owner_id", userId)
    .eq("kind", kind)
    .limit(1);

  if (spacesError) throw spacesError;

  if (spaces?.[0]) return spaces[0] as Space;

  const { data: createdSpace, error } = await supabase
    .from("spaces")
    .insert({
      owner_id: userId,
      kind,
      name,
    })
    .select("*")
    .single();
  if (error) throw error;
  return createdSpace as Space;
}

async function ensureWorkspace(userId: string): Promise<{
  getaroundSpace: Space;
  peaSpace: Space;
  cryptoSpace: Space;
  spaces: Space[];
  spaceId: string;
  vehicles: Vehicle[];
  vehicle: Vehicle;
  taxSettings: TaxSettings;
}> {
  const getaroundSpace = await ensureSpace(userId, "getaround", "Getaround");
  const peaSpace = await ensureSpace(userId, "pea", "PEA");
  const cryptoSpace = await ensureSpace(userId, "crypto", "Crypto");
  const spaceId = getaroundSpace.id;

  const { data: vehicleRows, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId)
    .eq("space_id", spaceId)
    .order("created_at", { ascending: true });

  if (vehiclesError) throw vehiclesError;

  let vehicles = (vehicleRows ?? []) as Vehicle[];

  if (vehicles.length === 0) {
    const { data: createdVehicle, error } = await supabase
      .from("vehicles")
      .insert({
        owner_id: userId,
        space_id: spaceId,
        label: "Ma voiture Getaround",
      })
      .select("*")
      .single();
    if (error) throw error;
    vehicles = [createdVehicle];
  }

  const vehicle = pickActiveVehicle(vehicles, userId);
  writeStoredVehicleId(userId, vehicle.id);

  const { data: taxRows, error: taxError } = await supabase
    .from("tax_settings")
    .select("*")
    .eq("owner_id", userId)
    .eq("space_id", spaceId)
    .limit(1);

  if (taxError) throw taxError;

  let taxSettings = taxRows?.[0] as TaxSettings | undefined;

  if (!taxSettings) {
    const { data: createdTax, error } = await supabase
      .from("tax_settings")
      .insert({
        owner_id: userId,
        space_id: spaceId,
        mode: DEFAULT_TAX_MODE,
        flat_rate_percent: siteConfig.defaultTaxRatePercent,
        micro_allowance_percent: 50,
        social_rate_percent: siteConfig.defaultSocialRatePercent,
      })
      .select("*")
      .single();
    if (error) throw error;
    taxSettings = createdTax;
  }

  return {
    getaroundSpace,
    peaSpace,
    cryptoSpace,
    spaces: [getaroundSpace, peaSpace, cryptoSpace],
    spaceId,
    vehicles,
    vehicle,
    taxSettings,
  };
}

export type VehicleInput = {
  label: string;
  plate?: string | null;
  make_model?: string | null;
  acquisition_cost?: number | null;
  acquisition_on?: string | null;
  amort_months?: number | null;
};

export function useWorkspace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["workspace", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) throw new Error("Non authentifié");
      return ensureWorkspace(user.id);
    },
  });

  const setActiveVehicle = useMutation({
    mutationFn: async (vehicleId: string) => {
      if (!user?.id || !query.data) {
        throw new Error("Espace introuvable");
      }
      const found = query.data.vehicles.find((item) => item.id === vehicleId);
      if (!found) throw new Error("Véhicule introuvable");
      writeStoredVehicleId(user.id, vehicleId);
      return found;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace", user?.id] });
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (input: VehicleInput) => {
      if (!user?.id || !query.data?.spaceId) {
        throw new Error("Espace introuvable");
      }
      const { data, error } = await supabase
        .from("vehicles")
        .insert({
          owner_id: user.id,
          space_id: query.data.spaceId,
          label: input.label.trim() || "Nouveau véhicule",
          plate: input.plate?.trim() || null,
          make_model: input.make_model?.trim() || null,
          acquisition_cost: input.acquisition_cost ?? null,
          acquisition_on: input.acquisition_on || null,
          amort_months: input.amort_months ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      writeStoredVehicleId(user.id, data.id);
      return data as Vehicle;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace", user?.id] });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<VehicleInput> & { id: string }) => {
      if (!user?.id) throw new Error("Non authentifié");
      const { data, error } = await supabase
        .from("vehicles")
        .update(patch)
        .eq("id", id)
        .eq("owner_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Vehicle;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace", user?.id] });
    },
  });

  const updateTaxSettings = useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          TaxSettings,
          | "mode"
          | "flat_rate_percent"
          | "micro_allowance_percent"
          | "social_rate_percent"
          | "notes"
        >
      >,
    ) => {
      if (!query.data?.taxSettings.id || !user?.id) {
        throw new Error("Paramètres fiscaux introuvables");
      }
      const { data, error } = await supabase
        .from("tax_settings")
        .update(patch)
        .eq("id", query.data.taxSettings.id)
        .eq("owner_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workspace", user?.id] });
    },
  });

  return {
    ...query,
    spaceId: query.data?.spaceId,
    getaroundSpace: query.data?.getaroundSpace,
    peaSpace: query.data?.peaSpace,
    cryptoSpace: query.data?.cryptoSpace,
    spaces: query.data?.spaces ?? [],
    vehicles: query.data?.vehicles ?? [],
    vehicle: query.data?.vehicle,
    taxSettings: query.data?.taxSettings,
    setActiveVehicle,
    createVehicle,
    updateVehicle,
    updateTaxSettings,
  };
}
