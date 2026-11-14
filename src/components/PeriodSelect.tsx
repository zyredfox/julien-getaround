import type { PeriodKey } from "@/lib/period";
import { cn } from "@/lib/cn";

const OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
  { value: "all", label: "Tout" },
];

type PeriodSelectProps = {
  value: PeriodKey;
  onChange: (value: PeriodKey) => void;
  dark?: boolean;
};

export function PeriodSelect({ value, onChange, dark = false }: PeriodSelectProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl p-1",
        dark ? "bg-white/15 ring-1 ring-white/30" : "bg-ink-100 ring-1 ring-ink-300",
      )}
      role="group"
      aria-label="Période"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "min-h-11 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            value === option.value
              ? dark
                ? "bg-accent text-white shadow-soft"
                : "bg-ink-900 text-white shadow-sm"
              : dark
                ? "text-white/80 hover:text-white"
                : "text-ink-800 hover:bg-white hover:text-ink-950",
          )}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
