import {
  addMonths,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  formatISO,
  parseISO,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";

export type PeriodMode = "month" | "semester" | "year" | "all";

/** @deprecated Prefer PeriodMode — kept for gradual migration. */
export type PeriodKey = PeriodMode;

export type PeriodSelection = {
  mode: PeriodMode;
  /** Jour d’ancrage dans le mois / semestre / année (ISO `yyyy-MM-dd`). */
  anchor: string;
};

export type DateRange = {
  from: string | null;
  to: string | null;
  label: string;
};

export function defaultPeriodSelection(
  mode: PeriodMode = "month",
  now = new Date(),
): PeriodSelection {
  return {
    mode,
    anchor: formatISO(startOfMonth(now), { representation: "date" }),
  };
}

function semesterStart(anchor: Date): Date {
  const year = anchor.getFullYear();
  return anchor.getMonth() < 6
    ? new Date(year, 0, 1)
    : new Date(year, 6, 1);
}

function normalizeAnchor(mode: PeriodMode, anchorDate: Date): Date {
  if (mode === "semester") return startOfMonth(semesterStart(anchorDate));
  if (mode === "year") return startOfYear(anchorDate);
  if (mode === "all") return startOfMonth(anchorDate);
  return startOfMonth(anchorDate);
}

export function withPeriodMode(
  selection: PeriodSelection,
  mode: PeriodMode,
): PeriodSelection {
  const anchorDate = normalizeAnchor(mode, parseISO(selection.anchor));
  return {
    mode,
    anchor: formatISO(anchorDate, { representation: "date" }),
  };
}

export function shiftPeriod(
  selection: PeriodSelection,
  direction: -1 | 1,
): PeriodSelection {
  if (selection.mode === "all") return selection;

  const current = parseISO(selection.anchor);
  let next: Date;
  switch (selection.mode) {
    case "month":
      next = addMonths(current, direction);
      break;
    case "semester":
      next = addMonths(semesterStart(current), direction * 6);
      break;
    case "year":
      next = addYears(startOfYear(current), direction);
      break;
    default:
      next = current;
  }

  return {
    mode: selection.mode,
    anchor: formatISO(normalizeAnchor(selection.mode, next), {
      representation: "date",
    }),
  };
}

export function resolvePeriod(
  selection: PeriodSelection | PeriodMode,
  now = new Date(),
): DateRange {
  const resolved: PeriodSelection =
    typeof selection === "string"
      ? defaultPeriodSelection(selection, now)
      : selection;

  const anchor = parseISO(resolved.anchor);

  if (resolved.mode === "all") {
    return { from: null, to: null, label: "Tout" };
  }

  if (resolved.mode === "year") {
    return {
      from: formatISO(startOfYear(anchor), { representation: "date" }),
      to: formatISO(endOfYear(anchor), { representation: "date" }),
      label: String(anchor.getFullYear()),
    };
  }

  if (resolved.mode === "semester") {
    const start = semesterStart(anchor);
    const isH1 = start.getMonth() === 0;
    const end = isH1
      ? endOfMonth(new Date(start.getFullYear(), 5, 1))
      : endOfYear(start);
    return {
      from: formatISO(start, { representation: "date" }),
      to: formatISO(end, { representation: "date" }),
      label: isH1
        ? `Janv. – juin ${start.getFullYear()}`
        : `Juil. – déc. ${start.getFullYear()}`,
    };
  }

  return {
    from: formatISO(startOfMonth(anchor), { representation: "date" }),
    to: formatISO(endOfMonth(anchor), { representation: "date" }),
    label: format(anchor, "MMMM yyyy", { locale: fr }),
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
