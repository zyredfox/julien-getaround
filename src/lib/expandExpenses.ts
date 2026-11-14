import {
  addMonths,
  format,
  formatISO,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { Expense } from "@/integrations/supabase/types";
import { inRange } from "@/lib/period";

export type ExpenseOccurrence = Expense & {
  occurrence_on: string;
};

/** Convertit `yyyy-MM` (input month) en date `yyyy-MM-01`. */
export function monthInputToDate(monthValue: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(monthValue)) {
    return formatISO(startOfMonth(parseISO(monthValue)), {
      representation: "date",
    });
  }
  return `${monthValue}-01`;
}

export function dateToMonthInput(isoDate: string): string {
  return format(startOfMonth(parseISO(isoDate)), "yyyy-MM");
}

/**
 * Déplie les abonnements en une occurrence par mois
 * (du mois de début jusqu'à repeat_until, ou jusqu'au mois courant si ouvert).
 */
export function expandExpensesForPeriod(
  expenses: Expense[],
  periodFrom: string | null,
  periodTo: string | null,
  now = new Date(),
): ExpenseOccurrence[] {
  const occurrences: ExpenseOccurrence[] = [];
  const openEndedCap = startOfMonth(now);

  for (const expense of expenses) {
    if (!expense.is_recurring) {
      if (inRange(expense.spent_on, periodFrom, periodTo)) {
        occurrences.push({ ...expense, occurrence_on: expense.spent_on });
      }
      continue;
    }

    const start = startOfMonth(parseISO(expense.spent_on));
    // Fin connue = jusqu'à ce mois inclus ; sinon = en cours jusqu'au mois actuel
    const hardEnd = expense.repeat_until
      ? startOfMonth(parseISO(expense.repeat_until))
      : openEndedCap;

    let cursor = start;
    while (cursor <= hardEnd) {
      const occurrenceOn = formatISO(cursor, { representation: "date" });
      if (inRange(occurrenceOn, periodFrom, periodTo)) {
        occurrences.push({ ...expense, occurrence_on: occurrenceOn });
      }
      cursor = addMonths(cursor, 1);
    }
  }

  return occurrences;
}

export function formatSubscriptionLabel(expense: Expense): string {
  const from = format(parseISO(expense.spent_on), "MM/yyyy");
  if (!expense.repeat_until) {
    return `Abonnement depuis ${from}`;
  }
  const to = format(parseISO(expense.repeat_until), "MM/yyyy");
  return `Abonnement ${from} → ${to}`;
}
