import type { TaxMode, TaxSettings } from "@/integrations/supabase/types";

export type TaxEstimateInput = {
  grossRevenue: number;
  netRevenue: number;
  expenses: number;
  settings: Pick<
    TaxSettings,
    "mode" | "flat_rate_percent" | "micro_allowance_percent"
  >;
};

export type TaxEstimateResult = {
  mode: TaxMode;
  cashNet: number;
  taxableBase: number;
  estimatedTax: number;
  netAfterTax: number;
};

export function estimateTax(input: TaxEstimateInput): TaxEstimateResult {
  const cashNet = input.netRevenue - input.expenses;
  const rate = input.settings.flat_rate_percent / 100;
  const allowance = input.settings.micro_allowance_percent / 100;

  let taxableBase = 0;

  switch (input.settings.mode) {
    case "micro_bic_like":
      taxableBase = Math.max(input.grossRevenue * (1 - allowance), 0);
      break;
    case "flat_rate":
    case "simplified_real":
    default:
      taxableBase = Math.max(cashNet, 0);
      break;
  }

  const estimatedTax = taxableBase * rate;

  return {
    mode: input.settings.mode,
    cashNet,
    taxableBase,
    estimatedTax,
    netAfterTax: cashNet - estimatedTax,
  };
}

export const TAX_MODE_LABELS: Record<TaxMode, string> = {
  simplified_real: "Réel simplifié (revenus − dépenses)",
  flat_rate: "Taux simple sur le net cash",
  micro_bic_like: "Type micro-BIC (abattement sur le brut)",
};
