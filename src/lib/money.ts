const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return eur.format(Number.isFinite(value) ? value : 0);
}

export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value == null || value === "") return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
