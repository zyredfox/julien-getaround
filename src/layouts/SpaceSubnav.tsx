import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import type { SpaceNavItem } from "@/spaces/registry";

type SpaceSubnavProps = {
  items: SpaceNavItem[];
  label: string;
};

export function SpaceSubnav({ items, label }: SpaceSubnavProps) {
  return (
    <nav
      className="mb-4 flex gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600"
      aria-label={label}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold whitespace-nowrap transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              isActive
                ? "bg-ink-900 text-white dark:bg-accent"
                : "text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800",
            )
          }
        >
          <item.icon className="size-4 shrink-0" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
