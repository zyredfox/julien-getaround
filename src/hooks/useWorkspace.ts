import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TaxSettings, Vehicle } from "@/integrations/supabase/types";
import { siteConfig } from "@/config/site";

async function ensureWorkspace(userId: string): Promise<{
  spaceId: string;
  vehicle: Vehicle;
  taxSettings: TaxSettings;
}> {
  const { data: spaces, error: spacesError } = await supabase
    .from("spaces")
    .select("*")
    .eq("owner_id", userId)
    .eq("kind", "getaround")
    .limit(1);

  if (spacesError) throw spacesError;

  let spaceId = spaces?.[0]?.id;

  if (!spaceId) {
    const { data: createdSpace, error } = await supabase
      .from("spaces")
      .insert({
        owner_id: userId,
        kind: "getaround",
        name: "Getaround",
      })
      .select("*")
      .single();
    if (error) throw error;
    spaceId = createdSpace.id;
  }

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId)
    .eq("space_id", spaceId)
    .limit(1);

  if (vehiclesError) throw vehiclesError;

  let vehicle = vehicles?.[0] as Vehicle | undefined;

  if (!vehicle) {
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
    vehicle = createdVehicle;
  }

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
        mode: "simplified_real",
        flat_rate_percent: siteConfig.defaultTaxRatePercent,
        micro_allowance_percent: 50,
      })
      .select("*")
      .single();
    if (error) throw error;
    taxSettings = createdTax;
  }

  return { spaceId, vehicle, taxSettings };
}

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

  const updateVehicle = useMutation({
    mutationFn: async (patch: Partial<Vehicle>) => {
      if (!query.data?.vehicle.id || !user?.id) {
        throw new Error("Véhicule introuvable");
      }
      const { data, error } = await supabase
        .from("vehicles")
        .update(patch)
        .eq("id", query.data.vehicle.id)
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

  const updateTaxSettings = useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          TaxSettings,
          "mode" | "flat_rate_percent" | "micro_allowance_percent" | "notes"
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
    vehicle: query.data?.vehicle,
    taxSettings: query.data?.taxSettings,
    updateVehicle,
    updateTaxSettings,
  };
}
