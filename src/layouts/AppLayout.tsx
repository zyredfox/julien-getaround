import { NavLink, Outlet } from "react-router-dom";
import {
  Car,
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/hooks/useWorkspace";

const NAV = [
  { to: "/", label: "Bilan", icon: LayoutDashboard, end: true },
  { to: "/locations", label: "Locations", icon: Car },
  { to: "/depenses", label: "Dépenses", icon: Receipt },
  { to: "/plus", label: "Plus", icon: MoreHorizontal },
];

export function AppLayout() {
  const { isLoading, isError, error, vehicle } = useWorkspace();

  return (
    <div className="app-shell min-h-dvh text-ink-900">
      <header className="border-b border-white/60 bg-ink-950/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight tracking-tight">
              {siteConfig.siteName}
            </p>
            <p className="truncate text-xs text-ink-300">
              {vehicle?.label ?? siteConfig.siteTagline}
            </p>
          </div>
          <div className="brand-mark" aria-hidden>
            <Car className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-signal animate-pulse-dot" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
        {isLoading ? (
          <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink-700 shadow-soft">
            Préparation de ton espace…
          </p>
        ) : null}
        {isError ? (
          <p
            className="rounded-2xl bg-signal-soft p-3 text-sm text-warn ring-1 ring-signal/30"
            role="alert"
          >
            Impossible de charger l’espace :{" "}
            {error instanceof Error ? error.message : "erreur inconnue"}
          </p>
        ) : (
          <Outlet />
        )}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 backdrop-blur"
        aria-label="Navigation principale"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    isActive
                      ? "nav-active-glow text-accent-dark"
                      : "text-ink-500 hover:text-ink-800",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-xl transition",
                        isActive ? "bg-accent-soft text-accent-dark" : "bg-transparent",
                      )}
                    >
                      <item.icon className="size-5" aria-hidden />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
