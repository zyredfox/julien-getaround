import { differenceInCalendarDays, parseISO } from "date-fns";

/** Nombre de jours inclusifs d’une location (min. 1). */
export function rentalDayCount(startAt: string, endAt: string): number {
  const start = parseISO(startAt.slice(0, 10));
  const end = parseISO(endAt.slice(0, 10));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(differenceInCalendarDays(end, start) + 1, 1);
}

/** Revenu net moyen par jour de location. */
export function rentalDailyNet(
  startAt: string,
  endAt: string,
  netAmount: number,
): number {
  const days = rentalDayCount(startAt, endAt);
  const net = Number.isFinite(netAmount) ? netAmount : 0;
  return net / days;
}
