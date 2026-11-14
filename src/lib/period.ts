import {
  endOfMonth,
  endOfYear,
  formatISO,
  startOfMonth,
  startOfYear,
} from "date-fns";

export type PeriodKey = "month" | "year" | "all";

export type DateRange = {
  from: string | null;
  to: string | null;
  label: string;
};

export function resolvePeriod(key: PeriodKey, now = new Date()): DateRange {
  if (key === "all") {
    return { from: null, to: null, label: "Tout" };
  }
  if (key === "year") {
    return {
      from: formatISO(startOfYear(now), { representation: "date" }),
      to: formatISO(endOfYear(now), { representation: "date" }),
      label: formatISO(now, { representation: "date" }).slice(0, 4),
    };
  }
  return {
    from: formatISO(startOfMonth(now), { representation: "date" }),
    to: formatISO(endOfMonth(now), { representation: "date" }),
    label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
  };
}

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

export function inRange(
  isoDate: string,
  from: string | null,
  to: string | null,
): boolean {
  const value = toDateKey(isoDate);
  if (from && value < toDateKey(from)) return false;
  if (to && value > toDateKey(to)) return false;
  return true;
}
