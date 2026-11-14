import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Expense, ExpenseCategory } from "@/integrations/supabase/types";

type ExpenseInput = {
  vehicle_id: string;
  spent_on: string;
  category: ExpenseCategory;
  amount: number;
  notes?: string | null;
  is_recurring: boolean;
  repeat_until?: string | null;
};

export function useExpenses(vehicleId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["expenses", user?.id, vehicleId];

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id && vehicleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("vehicle_id", vehicleId!)
        .eq("owner_id", user!.id)
        .order("spent_on", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const createExpense = useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({ ...input, owner_id: user!.id })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: ExpenseInput & { id: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(input)
        .eq("id", id)
        .eq("owner_id", user!.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("owner_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return { ...query, createExpense, updateExpense, deleteExpense };
}
