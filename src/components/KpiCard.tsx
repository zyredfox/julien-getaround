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

const TONE_STYLES = {
  default: {
    wrap: "from-white to-ink-50/80",
    icon: "bg-ink-900 text-accent-bright",
    value: "text-ink-900",
  },
  positive: {
    wrap: "from-accent-soft/80 to-white",
    icon: "bg-accent text-white",
    value: "text-accent-dark",
  },
  negative: {
    wrap: "from-signal-soft/90 to-white",
    icon: "bg-signal text-white",
    value: "text-warn",
  },
  accent: {
    wrap: "from-accent-soft to-white",
    icon: "bg-accent-bright text-ink-950",
    value: "text-accent",
  },
  signal: {
    wrap: "from-signal-soft to-white",
    icon: "bg-signal text-white",
    value: "text-signal",
  },
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
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-4 shadow-soft ring-1 ring-ink-100/80 transition hover:-translate-y-0.5 hover:shadow-lift",
        styles.wrap,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink-700">{label}</p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className={cn("mt-3 font-display text-2xl tracking-tight", styles.value)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}
