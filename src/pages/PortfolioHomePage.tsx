import { Link } from "react-router-dom";
import { ArrowRight, PieChart } from "lucide-react";
import { Seo } from "@/components/Seo";
import { usePortfolio } from "@/hooks/usePortfolio";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";
import { SPACE_REGISTRY } from "@/spaces/registry";

export function PortfolioHomePage() {
  const { isLoading, total, slices } = usePortfolio();

  return (
    <div className="space-y-4">
      <Seo title="Portefeuille" />

      <section className="panel anim-fade-up relative overflow-hidden rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark dark:text-accent-bright">
          Vue d’ensemble
        </p>
        <h1 className="page-title mt-1 font-display text-3xl tracking-tight text-ink-900 dark:text-ink-50">
          Portefeuille
        </h1>
        <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
          Total agrégé Getaround + PEA + Crypto
        </p>
        <p
          className={cn(
            "mt-4 font-display text-4xl tracking-tight",
            total >= 0
              ? "text-accent-dark dark:text-accent-bright"
              : "text-warn",
          )}
        >
          {isLoading ? "…" : formatMoney(total)}
        </p>
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-accent/15 blur-2xl"
          aria-hidden
        />
      </section>

      {!isLoading && slices.some((s) => Math.abs(s.value) > 0) ? (
        <section className="panel rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600">
          <div className="mb-3 flex items-center gap-2">
            <PieChart className="size-4 text-accent-dark dark:text-accent-bright" aria-hidden />
            <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              Répartition
            </h2>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            {slices.map((slice) =>
              slice.percent > 0 ? (
                <span
                  key={slice.kind}
                  className={slice.barClass}
                  style={{ width: `${slice.percent}%` }}
                  title={`${slice.label} ${slice.percent}%`}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {slices.map((slice) => (
              <li
                key={slice.kind}
                className="flex justify-between gap-3 text-ink-700 dark:text-ink-200"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn("size-2.5 rounded-full", slice.barClass)}
                    aria-hidden
                  />
                  {slice.label}
                </span>
                <span className="tabular-nums font-medium">
                  {slice.percent}% · {formatMoney(slice.value)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3" aria-label="Espaces">
        {SPACE_REGISTRY.map((space) => {
          const slice = slices.find((item) => item.kind === space.kind);
          return (
            <Link
              key={space.kind}
              to={space.path}
              className="panel flex items-center gap-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink-200 transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-ink-900 dark:ring-ink-600"
            >
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-2xl",
                  space.accentClass,
                )}
              >
                <space.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900 dark:text-ink-50">
                  {space.label}
                </p>
                <p className="truncate text-sm text-ink-600 dark:text-ink-300">
                  {slice?.hint ?? space.description}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl text-ink-900 dark:text-ink-50">
                  {isLoading ? "…" : formatMoney(slice?.value ?? 0)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark dark:text-accent-bright">
                  Ouvrir
                  <ArrowRight className="size-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
