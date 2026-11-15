import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Wallet } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { usePeaPositions } from "@/hooks/usePeaPositions";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

export function PeaHomePage() {
  const { peaSpace } = useWorkspace();
  const toast = useToast();
  const {
    positions,
    marketValue,
    invested,
    latent,
    positionValue,
    isLoading,
    refreshQuotes,
  } = usePeaPositions(peaSpace?.id);
  const autoRefreshed = useRef(false);

  useEffect(() => {
    if (isLoading || positions.length === 0 || autoRefreshed.current) return;
    autoRefreshed.current = true;
    void refreshQuotes.mutateAsync({ force: false }).catch(() => undefined);
  }, [isLoading, positions.length, refreshQuotes]);

  async function onRefresh() {
    try {
      const result = await refreshQuotes.mutateAsync({ force: true });
      if (result.updated > 0) {
        toast.success(
          `Cours actualisés (${result.updated} position${result.updated > 1 ? "s" : ""}).`,
        );
      } else if (result.skipped > 0 && result.failed.length === 0) {
        toast.success("Cours encore frais (< 15 min).");
      } else if (result.failed.length > 0) {
        toast.error(`Cours introuvables : ${result.failed.join(", ")}`);
      } else {
        toast.success("Rien à actualiser.");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Actualisation impossible",
      );
    }
  }

  return (
    <div className="space-y-4">
      <Seo title="PEA" />

      <section className="panel rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark dark:text-accent-bright">
              Espace PEA
            </p>
            <h1 className="page-title mt-1 font-display text-3xl text-ink-900 dark:text-ink-50">
              Valorisation
            </h1>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Cours Yahoo / Euronext — cache 15 min · ex. PSP5 → PSP5.PA
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => void onRefresh()}
            disabled={refreshQuotes.isPending || positions.length === 0}
          >
            <RefreshCw
              className={cn(
                "size-4",
                refreshQuotes.isPending && "animate-spin",
              )}
              aria-hidden
            />
            {refreshQuotes.isPending ? "Maj…" : "Actualiser"}
          </button>
        </div>
        <p
          className={cn(
            "mt-4 font-display text-4xl tracking-tight",
            marketValue >= 0
              ? "text-accent-dark dark:text-accent-bright"
              : "text-warn",
          )}
        >
          {isLoading || refreshQuotes.isPending ? "…" : formatMoney(marketValue)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-950/50">
            <dt className="text-ink-600 dark:text-ink-300">Investi (PRU)</dt>
            <dd className="mt-0.5 font-display text-xl text-ink-900 dark:text-ink-50">
              {formatMoney(invested)}
            </dd>
          </div>
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-950/50">
            <dt className="text-ink-600 dark:text-ink-300">Latent</dt>
            <dd
              className={cn(
                "mt-0.5 font-display text-xl",
                latent >= 0
                  ? "text-accent-dark dark:text-accent-bright"
                  : "text-warn",
              )}
            >
              {latent >= 0 ? "+" : ""}
              {formatMoney(latent)}
            </dd>
          </div>
        </dl>
      </section>

      {positions.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-accent/40 bg-white/80 p-5 shadow-soft dark:bg-ink-900/80">
          <p className="font-display text-xl text-ink-900 dark:text-ink-50">
            Ton PEA attend sa première ligne
          </p>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
            Ajoute ton ETF : ticker <strong>PSP5</strong>, ISIN FR0011871128 —
            le cours se charge tout seul.
          </p>
          <Link to="/pea/positions" className="btn-primary mt-4 inline-flex">
            Ajouter une position
          </Link>
        </section>
      ) : (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-800 dark:text-ink-100">
              Positions ({positions.length})
            </h2>
            <Link
              to="/pea/positions"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-dark dark:text-accent-bright"
            >
              Gérer
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {positions.slice(0, 5).map((row) => {
              const value = positionValue(row);
              const weight =
                marketValue > 0
                  ? Math.round((value / marketValue) * 1000) / 10
                  : 0;
              return (
                <li
                  key={row.id}
                  className="list-row flex items-center justify-between gap-3 rounded-xl bg-white/95 px-3 py-2.5 shadow-soft ring-1 ring-ink-100/80 dark:bg-ink-900/85 dark:ring-ink-700"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900 dark:text-ink-50">
                      {row.label}
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-300">
                      {row.ticker} · {Number(row.quantity)} ×{" "}
                      {formatMoney(Number(row.last_price ?? row.avg_cost))} ·{" "}
                      {weight}%
                    </p>
                  </div>
                  <p className="shrink-0 font-display text-lg text-ink-900 dark:text-ink-50">
                    {formatMoney(value)}
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            <Wallet className="mt-0.5 size-4 shrink-0" aria-hidden />
            Cours de marché indicatifs (souvent delayed). Pas un conseil
            d’investissement.
          </p>
        </section>
      )}
    </div>
  );
}
