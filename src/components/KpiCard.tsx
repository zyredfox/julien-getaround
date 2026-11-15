import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative" | "accent" | "signal";
  className?: string;
};

/** Cartes clairement lisibles : fond clair en light, fond sombre + texte clair en dark. */
const TONE_STYLES = {
  default: {
    wrap: "bg-white dark:bg-ink-800",
    icon: "bg-ink-900 text-accent-bright",
    value: "text-ink-900 dark:text-white",
  },
  positive: {
    wrap: "bg-white dark:bg-ink-800",
    icon: "bg-accent text-white",
    value: "text-accent-dark dark:text-accent-bright",
  },
  negative: {
    wrap: "bg-white dark:bg-ink-800",
    icon: "bg-signal text-white",
    value: "text-warn dark:text-[#fdba74]",
  },
  accent: {
    wrap: "bg-white dark:bg-ink-800",
    icon: "bg-accent-bright text-ink-950",
    value: "text-accent dark:text-accent-bright",
  },
  signal: {
    wrap: "bg-white dark:bg-ink-800",
    icon: "bg-signal text-white",
    value: "text-signal dark:text-[#fdba74]",
  },
} as const;

const TONE_BAR = {
  default: "bg-ink-700 dark:bg-ink-300",
  positive: "bg-accent",
  negative: "bg-signal",
  accent: "bg-accent-bright",
  signal: "bg-signal",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: KpiCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "kpi-card relative overflow-hidden rounded-2xl p-4 shadow-soft ring-1 ring-ink-200/90 transition hover:-translate-y-0.5 hover:shadow-lift dark:ring-ink-600",
        styles.wrap,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          TONE_BAR[tone],
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
          {label}
        </p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p
        className={cn(
          "mt-3 font-display text-2xl tracking-tight",
          styles.value,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs font-medium text-ink-600 dark:text-ink-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
