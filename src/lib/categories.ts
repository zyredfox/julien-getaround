import type { ExpenseCategory } from "@/integrations/supabase/types";

export const EXPENSE_CATEGORIES: {
  value: ExpenseCategory;
  label: string;
}[] = [
  { value: "insurance", label: "Assurance" },
  { value: "getaround_box", label: "Boîtier Getaround" },
  { value: "tires_repair", label: "Pneus / réparation" },
  { value: "fuel", label: "Essence / énergie" },
  { value: "platform_fees", label: "Frais plateforme" },
  { value: "cost_basis", label: "Prix de revient" },
  { value: "other", label: "Autre" },
];

export function categoryLabel(category: ExpenseCategory): string {
  return (
    EXPENSE_CATEGORIES.find((item) => item.value === category)?.label ??
    category
  );
}
