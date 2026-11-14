import type { TaxMode, TaxSettings } from "@/integrations/supabase/types";

export const DEFAULT_SOCIAL_RATE_PERCENT = 17.2;

export type TaxEstimateInput = {
  /** Chiffre d'affaires (somme des prix bruts des locations). */
  grossRevenue: number;
  netRevenue: number;
  expenses: number;
  settings: Pick<
    TaxSettings,
    | "mode"
    | "flat_rate_percent"
    | "micro_allowance_percent"
    | "social_rate_percent"
  >;
};

export type TaxEstimateResult = {
  mode: TaxMode;
  cashNet: number;
  /** CA utilisé pour le micro (brut locations). */
  ca: number;
  allowanceAmount: number;
  taxableBase: number;
  /** Impôt sur le revenu (TMI × base). */
  incomeTax: number;
  /** Prélèvements sociaux (CSG/CRDS/solidarité × base). */
  socialContributions: number;
  /** Total IR + prélèvements sociaux. */
  estimatedTax: number;
  netAfterTax: number;
};

/**
 * Micro (défaut) : base = CA × (1 − abattement), puis IR + PS.
 * Les dépenses / pertes cash ne réduisent PAS l'impôt en micro.
 */
export function estimateTax(input: TaxEstimateInput): TaxEstimateResult {
  const cashNet = input.netRevenue - input.expenses;
  const rate = input.settings.flat_rate_percent / 100;
  const socialRate =
    (input.settings.social_rate_percent ?? DEFAULT_SOCIAL_RATE_PERCENT) / 100;
  const allowancePct = input.settings.micro_allowance_percent / 100;
  const ca = Math.max(input.grossRevenue, 0);

  let taxableBase = 0;
  let allowanceAmount = 0;

  switch (input.settings.mode) {
    case "micro_bic_like":
      allowanceAmount = ca * allowancePct;
      taxableBase = Math.max(ca - allowanceAmount, 0);
      break;
    case "flat_rate":
      taxableBase = Math.max(cashNet, 0);
      break;
    case "simplified_real":
      taxableBase = Math.max(cashNet, 0);
      break;
    default:
      allowanceAmount = ca * allowancePct;
      taxableBase = Math.max(ca - allowanceAmount, 0);
      break;
  }

  const incomeTax = taxableBase * rate;
  const socialContributions = taxableBase * socialRate;
  const estimatedTax = incomeTax + socialContributions;

  return {
    mode: input.settings.mode,
    cashNet,
    ca,
    allowanceAmount,
    taxableBase,
    incomeTax,
    socialContributions,
    estimatedTax,
    netAfterTax: cashNet - estimatedTax,
  };
}

export const TAX_MODE_LABELS: Record<TaxMode, string> = {
  micro_bic_like: "Micro (CA − abattement, puis IR + PS) — recommandé",
  simplified_real: "Réel simplifié (revenus nets − dépenses)",
  flat_rate: "Taux simple sur le net cash",
};

export const DEFAULT_TAX_MODE: TaxMode = "micro_bic_like";
