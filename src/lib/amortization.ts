import {
  addMonths,
  format,
  formatISO,
  parseISO,
  startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Vehicle } from "@/integrations/supabase/types";
import { inRange } from "@/lib/period";

export type AmortMonth = {
  key: string;
  label: string;
  amount: number;
  occurrence_on: string;
};

export function monthlyAmortAmount(vehicle: Vehicle | undefined): number | null {
  if (!vehicle) return null;
  const cost = Number(vehicle.acquisition_cost);
  const months = vehicle.amort_months;
  if (!Number.isFinite(cost) || cost <= 0) return null;
  if (!months || months <= 0) return null;
  return cost / months;
}

function amortStart(vehicle: Vehicle): Date {
  const raw =
    vehicle.acquisition_on || vehicle.active_from || vehicle.created_at;
  return startOfMonth(parseISO(raw.slice(0, 10)));
}

/** Mois d'amortissement qui tombent dans la période (début → début + N-1 mois). */
export function expandAmortizationForPeriod(
  vehicle: Vehicle | undefined,
  periodFrom: string | null,
  periodTo: string | null,
): AmortMonth[] {
  const monthly = monthlyAmortAmount(vehicle);
  if (!vehicle || monthly == null || !vehicle.amort_months) return [];

  const start = amortStart(vehicle);
  const end = addMonths(start, vehicle.amort_months - 1);
  const rows: AmortMonth[] = [];

  let cursor = start;
  while (cursor <= end) {
    const occurrenceOn = formatISO(cursor, { representation: "date" });
    if (inRange(occurrenceOn, periodFrom, periodTo)) {
      rows.push({
        key: format(cursor, "yyyy-MM"),
        label: format(cursor, "MMM yy", { locale: fr }),
        amount: monthly,
        occurrence_on: occurrenceOn,
      });
    }
    cursor = addMonths(cursor, 1);
  }

  return rows;
}
