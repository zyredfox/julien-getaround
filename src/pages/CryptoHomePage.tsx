import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Wallet } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { useCryptoPositions } from "@/hooks/useCryptoPositions";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatMoney, formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";

export function CryptoHomePage() {
  const { cryptoSpace } = useWorkspace();
  const toast = useToast();
  const {
    positions,
    marketValue,
    marketValueUsd,
    invested,
    latent,
    positionValue,
    positionValueUsd,
    isLoading,
    refreshQuotes,
  } = useCryptoPositions(cryptoSpace?.id);
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
        toast.success(`Cours actualisés (${result.updated}).`);
      } else if (result.skipped > 0 && result.failed.length === 0) {
        toast.success("Cours encore frais (< 15 min).");
      } else if (result.failed.length > 0) {
        toast.error(`Cours introuvables : ${result.failed.join(", ")}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Actualisation impossible",
      );
    }
  }

  return (
    <div className="space-y-4">
      <Seo title="Crypto" />

      <section className="panel rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">
              Espace Crypto
            </p>
            <h1 className="page-title mt-1 font-display text-3xl text-ink-900 dark:text-ink-50">
              Valorisation
            </h1>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
              Cours CoinGecko (EUR) — cache 15 min · ex. BTC ou bitcoin
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-950/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">
              Solde €
            </p>
            <p
              className={cn(
                "mt-1 font-display text-3xl tracking-tight",
                marketValue >= 0
                  ? "text-accent-dark dark:text-accent-bright"
                  : "text-warn",
              )}
            >
              {isLoading || refreshQuotes.isPending
                ? "…"
                : formatMoney(marketValue)}
            </p>
          </div>
          <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-950/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-600 dark:text-ink-300">
              Solde $
            </p>
            <p className="mt-1 font-display text-3xl tracking-tight text-ink-900 dark:text-ink-50">
              {isLoading || refreshQuotes.isPending
                ? "…"
                : formatUsd(marketValueUsd)}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-950/50">
            <dt className="text-ink-600 dark:text-ink-300">Investi (PRU €)</dt>
            <dd className="mt-0.5 font-display text-xl text-ink-900 dark:text-ink-50">
              {formatMoney(invested)}
            </dd>
          </div>
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-950/50">
            <dt className="text-ink-600 dark:text-ink-300">Latent €</dt>
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
        <section className="rounded-3xl border border-dashed border-signal/40 bg-white/80 p-5 shadow-soft dark:bg-ink-900/80">
          <p className="font-display text-xl text-ink-900 dark:text-ink-50">
            Ajoute ton premier crypto
          </p>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
            Ticker <strong>BTC</strong> ou <strong>bitcoin</strong>, quantité +
            PRU — le cours EUR se charge tout seul.
          </p>
          <Link to="/crypto/positions" className="btn-signal mt-4 inline-flex">
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
              to="/crypto/positions"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-signal"
            >
              Gérer
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="space-y-2">
            {positions.slice(0, 5).map((row) => {
              const value = positionValue(row);
              const valueUsd = positionValueUsd(row);
              const weight =
                marketValue > 0
                  ? Math.round((value / marketValue) * 1000) / 10
                  : 0;
              const unitEur = Number(row.last_price ?? row.avg_cost);
              const unitUsd = Number(row.last_price_usd ?? 0);
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
                      {formatMoney(unitEur)}
                      {unitUsd > 0 ? ` / ${formatUsd(unitUsd)}` : ""} · {weight}%
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg text-ink-900 dark:text-ink-50">
                      {formatMoney(value)}
                    </p>
                    <p className="text-xs font-medium text-ink-500 dark:text-ink-300">
                      {unitUsd > 0 ? formatUsd(valueUsd) : "— $"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
            <Wallet className="mt-0.5 size-4 shrink-0" aria-hidden />
            Valorisation indicative hors fiscalité crypto (PFU, etc.).
          </p>
        </section>
      )}
    </div>
  );
}
