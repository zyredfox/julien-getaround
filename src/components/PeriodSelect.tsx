import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  resolvePeriod,
  shiftPeriod,
  withPeriodMode,
  type PeriodMode,
  type PeriodSelection,
} from "@/lib/period";
import { cn } from "@/lib/cn";

const OPTIONS: { value: PeriodMode; label: string }[] = [
  { value: "month", label: "Mois" },
  { value: "semester", label: "6 mois" },
  { value: "year", label: "Année" },
  { value: "all", label: "Tout" },
];

type PeriodSelectProps = {
  value: PeriodSelection;
  onChange: (value: PeriodSelection) => void;
  dark?: boolean;
};

export function PeriodSelect({
  value,
  onChange,
  dark = false,
}: PeriodSelectProps) {
  const range = resolvePeriod(value);
  const canNavigate = value.mode !== "all";

  return (
    <div className="flex w-full flex-col items-stretch gap-2">
      <div
        className={cn(
          "flex w-full rounded-xl p-1",
          dark
            ? "bg-white/15 ring-1 ring-white/30"
            : "bg-ink-100 ring-1 ring-ink-200 dark:bg-ink-800 dark:ring-ink-600",
        )}
        role="group"
        aria-label="Type de période"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "min-h-11 flex-1 rounded-lg px-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              value.mode === option.value
                ? dark
                  ? "bg-accent text-white shadow-soft"
                  : "bg-ink-900 text-white shadow-sm dark:bg-accent"
                : dark
                  ? "text-white/80 hover:text-white"
                  : "text-ink-800 hover:bg-white hover:text-ink-950 dark:text-ink-100 dark:hover:bg-ink-700",
            )}
            aria-pressed={value.mode === option.value}
            onClick={() => onChange(withPeriodMode(value, option.value))}
          >
            {option.label}
          </button>
        ))}
      </div>

      {canNavigate ? (
        <div
          className={cn(
            "inline-flex w-full items-center gap-1 rounded-xl p-1",
            dark
              ? "bg-white/10 ring-1 ring-white/25"
              : "bg-white ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600",
          )}
        >
          <button
            type="button"
            className={cn(
              "grid size-11 place-items-center rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              dark
                ? "text-white hover:bg-white/15"
                : "text-ink-800 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800",
            )}
            aria-label="Période précédente"
            onClick={() => onChange(shiftPeriod(value, -1))}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <p
            className={cn(
              "min-w-[9.5rem] flex-1 text-center text-sm font-semibold capitalize",
              dark ? "text-white" : "text-ink-900 dark:text-ink-50",
            )}
            aria-live="polite"
          >
            {range.label}
          </p>
          <button
            type="button"
            className={cn(
              "grid size-11 place-items-center rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              dark
                ? "text-white hover:bg-white/15"
                : "text-ink-800 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800",
            )}
            aria-label="Période suivante"
            onClick={() => onChange(shiftPeriod(value, 1))}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
