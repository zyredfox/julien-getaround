import { useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  Expense,
  Rental,
  TaxSettings,
  Vehicle,
} from "@/integrations/supabase/types";
import { expandAmortizationForPeriod, monthlyAmortAmount } from "@/lib/amortization";
import { categoryLabel } from "@/lib/categories";
import { expandExpensesForPeriod } from "@/lib/expandExpenses";
import {
  inRange,
  resolvePeriod,
  type PeriodMode,
  type PeriodSelection,
} from "@/lib/period";
import { estimateTax } from "@/lib/taxEstimate";

export type MonthDetailLine = {
  label: string;
  amount: number;
};

export type CashflowPoint = {
  key: string;
  month: string;
  revenus: number;
  depenses: number;
  net: number;
  revenuDetails: MonthDetailLine[];
  depenseDetails: MonthDetailLine[];
};

export type CumulativePoint = {
  key: string;
  month: string;
  net: number;
  monthRevenus: number;
  monthDepenses: number;
  monthNet: number;
  revenuDetails: MonthDetailLine[];
  depenseDetails: MonthDetailLine[];
};

type MonthBucket = {
  key: string;
  month: string;
  revenus: number;
  depenses: number;
  revenuDetails: Map<string, number>;
  depenseDetails: Map<string, number>;
};

function emptyBucket(key: string, month: string): MonthBucket {
  return {
    key,
    month,
    revenus: 0,
    depenses: 0,
    revenuDetails: new Map(),
    depenseDetails: new Map(),
  };
}

function addDetail(map: Map<string, number>, label: string, amount: number) {
  map.set(label, (map.get(label) ?? 0) + amount);
}

function toLines(map: Map<string, number>): MonthDetailLine[] {
  return [...map.entries()]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function useBilan(
  rentals: Rental[] | undefined,
  expenses: Expense[] | undefined,
  taxSettings: TaxSettings | undefined,
  periodSelection: PeriodSelection | PeriodMode,
  vehicle?: Vehicle,
) {
  return useMemo(() => {
    const period = resolvePeriod(periodSelection);
    const filteredRentals = (rentals ?? []).filter((rental) =>
      inRange(rental.start_at, period.from, period.to),
    );
    const filteredExpenses = expandExpensesForPeriod(
      expenses ?? [],
      period.from,
      period.to,
    );
    const amortMonths = expandAmortizationForPeriod(
      vehicle,
      period.from,
      period.to,
    );

    const grossRevenue = filteredRentals.reduce(
      (sum, item) => sum + Number(item.gross_amount),
      0,
    );
    const netRevenue = filteredRentals.reduce(
      (sum, item) => sum + Number(item.net_amount),
      0,
    );
    const totalExpenses = filteredExpenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const amortization = amortMonths.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const cashNet = netRevenue - totalExpenses;
    const economicNet = cashNet - amortization;
    const monthlyAmort = monthlyAmortAmount(vehicle);

    // Micro : CA brut + abattement — les charges ne baissent pas l'impôt.
    // Réel / taux : cash (± amort) comme base approx.
    const expensesForTax =
      !taxSettings || taxSettings.mode === "micro_bic_like"
        ? totalExpenses
        : totalExpenses + amortization;

    const tax = taxSettings
      ? estimateTax({
          grossRevenue,
          netRevenue,
          expenses: expensesForTax,
          settings: taxSettings,
        })
      : null;

    const monthMap = new Map<string, MonthBucket>();

    function bucketFor(isoDate: string, labelDate = isoDate): MonthBucket {
      const key = format(startOfMonth(parseISO(isoDate)), "yyyy-MM");
      const existing = monthMap.get(key);
      if (existing) return existing;
      const created = emptyBucket(
        key,
        format(startOfMonth(parseISO(labelDate)), "MMM yy", { locale: fr }),
      );
      monthMap.set(key, created);
      return created;
    }

    for (const rental of filteredRentals) {
      const bucket = bucketFor(rental.start_at);
      const amount = Number(rental.net_amount);
      bucket.revenus += amount;
      const label = rental.notes?.trim()
        ? `Location — ${rental.notes.trim()}`
        : `Location ${format(parseISO(rental.start_at), "dd/MM")} → ${format(parseISO(rental.end_at), "dd/MM")}`;
      addDetail(bucket.revenuDetails, label, amount);
    }

    for (const expense of filteredExpenses) {
      const bucket = bucketFor(expense.occurrence_on);
      const amount = Number(expense.amount);
      bucket.depenses += amount;
      const title = expense.notes?.trim();
      const label = title
        ? expense.is_recurring
          ? `${title} (mensualité)`
          : title
        : expense.is_recurring
          ? `${categoryLabel(expense.category)} (mensualité)`
          : categoryLabel(expense.category);
      addDetail(bucket.depenseDetails, label, amount);
    }

    for (const amort of amortMonths) {
      const bucket = monthMap.get(amort.key) ?? emptyBucket(amort.key, amort.label);
      if (!monthMap.has(amort.key)) monthMap.set(amort.key, bucket);
      bucket.depenses += amort.amount;
      addDetail(bucket.depenseDetails, "Amortissement véhicule", amort.amount);
    }

    const cashflow: CashflowPoint[] = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        key: value.key,
        month: value.month,
        revenus: value.revenus,
        depenses: value.depenses,
        net: value.revenus - value.depenses,
        revenuDetails: toLines(value.revenuDetails),
        depenseDetails: toLines(value.depenseDetails),
      }));

    let running = 0;
    const cumulative: CumulativePoint[] = cashflow.map((row) => {
      running += row.net;
      return {
        key: row.key,
        month: row.month,
        net: running,
        monthRevenus: row.revenus,
        monthDepenses: row.depenses,
        monthNet: row.net,
        revenuDetails: row.revenuDetails,
        depenseDetails: row.depenseDetails,
      };
    });

    const byCategoryMap = new Map<string, number>();
    for (const expense of filteredExpenses) {
      const label = categoryLabel(expense.category);
      byCategoryMap.set(
        label,
        (byCategoryMap.get(label) ?? 0) + Number(expense.amount),
      );
    }
    if (amortization > 0) {
      byCategoryMap.set(
        "Amortissement",
        (byCategoryMap.get("Amortissement") ?? 0) + amortization,
      );
    }
    const byCategory = [...byCategoryMap.entries()].map(([name, value]) => ({
      name,
      value,
    }));

    return {
      period,
      rentalCount: filteredRentals.length,
      grossRevenue,
      netRevenue,
      totalExpenses,
      amortization,
      monthlyAmort,
      cashNet,
      economicNet,
      tax,
      cashflow,
      cumulative,
      byCategory,
      hasAmortConfig: monthlyAmort != null,
    };
  }, [rentals, expenses, taxSettings, periodSelection, vehicle]);
}
