import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { rentalDailyNet, rentalDayCount } from "@/lib/rentalStats";
import { cn } from "@/lib/cn";
import type { Rental } from "@/integrations/supabase/types";

type RentalsCalendarProps = {
  rentals: Rental[];
  onSelectRental: (rental: Rental) => void;
  onCreateOnDay: (isoDate: string) => void;
};

function rentalCoversDay(rental: Rental, day: Date): boolean {
  const dayKey = format(day, "yyyy-MM-dd");
  const start = rental.start_at.slice(0, 10);
  const end = rental.end_at.slice(0, 10);
  return dayKey >= start && dayKey <= end;
}

export function RentalsCalendar({
  rentals,
  onSelectRental,
  onCreateOnDay,
}: RentalsCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), {
      weekStartsOn: 1,
      locale: fr,
    });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1, locale: fr });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const rentalsByDay = useMemo(() => {
    const map = new Map<string, Rental[]>();
    for (const day of days) {
      if (!isSameMonth(day, month)) continue;
      const key = format(day, "yyyy-MM-dd");
      const matches = rentals.filter((rental) => rentalCoversDay(rental, day));
      if (matches.length > 0) map.set(key, matches);
    }
    return map;
  }, [days, month, rentals]);

  const selectedKey = format(selectedDay, "yyyy-MM-dd");
  const selectedRentals = useMemo(
    () => rentals.filter((rental) => rentalCoversDay(rental, selectedDay)),
    [rentals, selectedDay],
  );

  const monthRentalCount = useMemo(() => {
    const ids = new Set<string>();
    for (const list of rentalsByDay.values()) {
      for (const rental of list) ids.add(rental.id);
    }
    return ids.size;
  }, [rentalsByDay]);

  const weekdays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <section className="space-y-3" aria-label="Calendrier des locations">
      <div className="panel rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-ink-100 dark:hover:bg-ink-800"
            aria-label="Mois précédent"
            onClick={() => setMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 text-center">
            <p className="font-display text-lg capitalize text-ink-900 dark:text-ink-50">
              {format(month, "MMMM yyyy", { locale: fr })}
            </p>
            <p className="text-xs font-semibold text-ink-600 dark:text-ink-300">
              {monthRentalCount} résa{monthRentalCount > 1 ? "s" : ""} ce mois
            </p>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-ink-100 dark:hover:bg-ink-800"
            aria-label="Mois suivant"
            onClick={() => setMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-accent-dark hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-accent-bright"
            onClick={() => {
              const today = new Date();
              setMonth(startOfMonth(today));
              setSelectedDay(today);
            }}
          >
            Aujourd’hui
          </button>
        </div>

        <div
          className="mt-2 grid grid-cols-7 gap-1"
          role="grid"
          aria-label={format(month, "MMMM yyyy", { locale: fr })}
        >
          {weekdays.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-xs font-semibold text-ink-600 dark:text-ink-300"
              role="columnheader"
            >
              {label}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, month);
            const dayRentals = rentalsByDay.get(key) ?? [];
            const occupied = dayRentals.length > 0;
            const selected = isSameDay(day, selectedDay);
            const today = isToday(day);

            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-selected={selected}
                aria-label={`${format(day, "EEEE d MMMM", { locale: fr })}${
                  occupied
                    ? `, ${dayRentals.length} réservation${dayRentals.length > 1 ? "s" : ""}`
                    : ""
                }`}
                disabled={!inMonth}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-start rounded-xl px-0.5 py-1 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  !inMonth && "invisible",
                  inMonth && !occupied && "text-ink-800 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800",
                  occupied &&
                    !selected &&
                    "bg-accent/15 text-ink-900 hover:bg-accent/25 dark:bg-accent/20 dark:text-ink-50 dark:hover:bg-accent/30",
                  selected &&
                    "bg-accent text-white hover:bg-accent dark:bg-accent dark:text-white",
                  today &&
                    !selected &&
                    "ring-2 ring-inset ring-accent/60 dark:ring-accent-bright/70",
                )}
              >
                <span
                  className={cn(
                    "font-semibold tabular-nums leading-none",
                    selected ? "text-white" : undefined,
                  )}
                >
                  {format(day, "d")}
                </span>
                {occupied ? (
                  <span
                    className={cn(
                      "mt-1 max-w-full truncate text-xs font-semibold leading-none",
                      selected
                        ? "text-white/90"
                        : "text-accent-dark dark:text-accent-bright",
                    )}
                  >
                    {dayRentals.length === 1
                      ? `${formatMoney(
                          rentalDailyNet(
                            dayRentals[0].start_at,
                            dayRentals[0].end_at,
                            Number(dayRentals[0].net_amount),
                          ),
                        ).replace(/\s/g, "\u00a0")}/j`
                      : `${dayRentals.length}`}
                  </span>
                ) : (
                  <span className="mt-1 h-2.5" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-ink-100">
            {format(selectedDay, "EEEE d MMMM", { locale: fr })}
          </h2>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-accent-dark hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-accent-bright"
            onClick={() => onCreateOnDay(selectedKey)}
          >
            Ajouter
          </button>
        </div>

        {selectedRentals.length === 0 ? (
          <p className="rounded-xl bg-ink-50 px-3 py-3 text-sm text-ink-600 dark:bg-ink-950/50 dark:text-ink-300">
            Aucune réservation ce jour.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedRentals.map((rental) => {
              const days = rentalDayCount(rental.start_at, rental.end_at);
              const daily = rentalDailyNet(
                rental.start_at,
                rental.end_at,
                Number(rental.net_amount),
              );
              return (
                <li key={rental.id}>
                  <button
                    type="button"
                    onClick={() => onSelectRental(rental)}
                    className="list-row flex w-full items-center justify-between gap-3 rounded-xl border-l-4 border-accent bg-white/95 px-3 py-2.5 text-left shadow-soft ring-1 ring-ink-100/80 transition hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-ink-900/85 dark:ring-ink-700 dark:hover:bg-ink-800"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                        {format(parseISO(rental.start_at), "dd/MM")} →{" "}
                        {format(parseISO(rental.end_at), "dd/MM")}
                        <span className="font-normal text-ink-500 dark:text-ink-300">
                          {" "}
                          · {days} j
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">
                        {formatMoney(daily)}/j · Brut{" "}
                        {formatMoney(Number(rental.gross_amount))}
                        {rental.notes ? ` · ${rental.notes}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg text-accent-dark dark:text-accent-bright">
                        {formatMoney(Number(rental.net_amount))}
                      </p>
                      <p className="text-xs font-semibold text-ink-500 dark:text-ink-300">
                        {formatMoney(daily)}/j
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
