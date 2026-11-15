const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return eur.format(Number.isFinite(value) ? value : 0);
}

export function formatUsd(value: number): string {
  return usd.format(Number.isFinite(value) ? value : 0);
}

export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value == null || value === "") return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Frais Getaround (commission + ajustements) = brut − net, arrondi à 2 décimales. */
export function feesFromGrossNet(
  gross: string | number,
  net: string | number,
): number {
  const fees = toNumber(gross) - toNumber(net);
  if (!Number.isFinite(fees)) return 0;
  return Math.round(Math.max(fees, 0) * 100) / 100;
}

export function formatAmountInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return value === 0 ? "0" : "";
  return String(value);
}
