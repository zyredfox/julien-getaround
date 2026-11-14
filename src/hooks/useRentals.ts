import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Rental } from "@/integrations/supabase/types";

type RentalInput = {
  vehicle_id: string;
  start_at: string;
  end_at: string;
  gross_amount: number;
  platform_fees: number;
  net_amount: number;
  notes?: string | null;
};

export function useRentals(vehicleId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["rentals", user?.id, vehicleId];

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id && vehicleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rentals")
        .select("*")
        .eq("vehicle_id", vehicleId!)
        .eq("owner_id", user!.id)
        .order("start_at", { ascending: false });
      if (error) throw error;
      return data as Rental[];
    },
  });

  const createRental = useMutation({
    mutationFn: async (input: RentalInput) => {
      const { data, error } = await supabase
        .from("rentals")
        .insert({ ...input, owner_id: user!.id })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });

  const updateRental = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: RentalInput & { id: string }) => {
      const { data, error } = await supabase
        .from("rentals")
        .update(input)
        .eq("id", id)
        .eq("owner_id", user!.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });

  const deleteRental = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rentals")
        .delete()
        .eq("id", id)
        .eq("owner_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    },
  });

  return { ...query, createRental, updateRental, deleteRental };
}
