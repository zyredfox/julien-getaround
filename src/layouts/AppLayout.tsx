import { Link, NavLink, Outlet } from "react-router-dom";
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

function DesktopNavLink({
  to,
  label,
  icon: Icon,
  end,
}: (typeof NAV)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          isActive
            ? "bg-white/15 text-accent-bright"
            : "text-ink-300 hover:bg-white/10 hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn("size-4", isActive ? "text-accent-bright" : "")}
            aria-hidden
          />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function AppLayout() {
  const { isLoading, isError, error, vehicle } = useWorkspace();

  return (
    <div className="app-shell min-h-dvh text-ink-900 dark:text-ink-100">
      <header className="surface-inverse border-b border-white/60 bg-ink-950/95 text-white backdrop-blur dark:border-ink-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight tracking-tight text-white">
              {siteConfig.siteName}
            </p>
            <p className="truncate text-xs text-ink-300">
              {vehicle?.label ?? siteConfig.siteTagline}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Navigation bureau"
            >
              {NAV.map((item) => (
                <DesktopNavLink key={item.to} {...item} />
              ))}
            </nav>

            <Link
              to="/vehicules"
              className="brand-mark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Mes véhicules"
              title="Mes véhicules"
            >
              <Car className="size-5" aria-hidden />
              <span
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-signal animate-pulse-dot"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="app-main mx-auto max-w-5xl px-4 pb-28 pt-5 md:pb-10">
        {isLoading ? (
          <p className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink-700 shadow-soft dark:bg-ink-900/80 dark:text-ink-200">
            Préparation de ton espace…
          </p>
        ) : null}
        {isError ? (
          <p
            className="rounded-2xl bg-signal-soft p-3 text-sm text-warn ring-1 ring-signal/30 dark:bg-signal/20 dark:text-signal-soft"
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
        className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-100 bg-white/95 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95 md:hidden"
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
                      ? "nav-active-glow text-accent-dark dark:text-accent-bright"
                      : "text-ink-500 hover:text-ink-800 dark:text-ink-300 dark:hover:text-ink-50",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-xl transition",
                        isActive
                          ? "bg-accent-soft text-accent-dark"
                          : "bg-transparent",
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
