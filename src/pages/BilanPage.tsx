import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Car,
  Landmark,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { BilanCharts } from "@/components/charts/BilanCharts";
import { KpiCard } from "@/components/KpiCard";
import { PeriodSelect } from "@/components/PeriodSelect";
import { Seo } from "@/components/Seo";
import { useBilan } from "@/hooks/useBilan";
import { useExpenses } from "@/hooks/useExpenses";
import { useRentals } from "@/hooks/useRentals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatMoney } from "@/lib/money";
import type { PeriodKey } from "@/lib/period";

export function BilanPage() {
  const [periodKey, setPeriodKey] = useState<PeriodKey>("month");
  const { vehicle, taxSettings } = useWorkspace();
  const { data: rentals } = useRentals(vehicle?.id);
  const { data: expenses } = useExpenses(vehicle?.id);
  const bilan = useBilan(rentals, expenses, taxSettings, periodKey, vehicle);
  const isEmpty =
    bilan.rentalCount === 0 &&
    bilan.totalExpenses === 0 &&
    bilan.amortization === 0;

  return (
    <div className="space-y-4">
      <Seo title="Bilan" />

      <section className="anim-fade-up relative overflow-hidden rounded-3xl bg-ink-950 p-5 text-white shadow-lift">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-bright">
              Tableau de bord
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">Bilan</h1>
            <p className="mt-1 capitalize text-ink-300">{bilan.period.label}</p>
          </div>
          <PeriodSelect value={periodKey} onChange={setPeriodKey} dark />
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-accent/30 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 right-10 size-32 rounded-full bg-signal/25 blur-2xl"
          aria-hidden
        />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          className="anim-fade-up anim-delay-1"
          label="Revenus nets"
          value={formatMoney(bilan.netRevenue)}
          icon={TrendingUp}
          tone="positive"
        />
        <KpiCard
          className="anim-fade-up anim-delay-2"
          label="Dépenses cash"
          value={formatMoney(bilan.totalExpenses)}
          icon={TrendingDown}
          tone="negative"
        />
        <KpiCard
          className="anim-fade-up anim-delay-3"
          label="Cash net"
          value={formatMoney(bilan.cashNet)}
          hint="hors amortissement"
          icon={Wallet}
          tone={bilan.cashNet >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          className="anim-fade-up anim-delay-4"
          label="Locations"
          value={String(bilan.rentalCount)}
          hint="sur la période"
          icon={Car}
          tone="accent"
        />
      </div>

      {bilan.hasAmortConfig ? (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            label="Amortissement"
            value={formatMoney(bilan.amortization)}
            hint={
              bilan.monthlyAmort != null
                ? `${formatMoney(bilan.monthlyAmort)} / mois`
                : undefined
            }
            icon={Landmark}
            tone="signal"
          />
          <KpiCard
            label="Net économique"
            value={formatMoney(bilan.economicNet)}
            hint="cash − amortissement"
            icon={TrendingDown}
            tone={bilan.economicNet >= 0 ? "positive" : "negative"}
          />
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-ink-300 bg-white/70 p-4 text-sm text-ink-700">
          Amortissement non configuré. Renseigne le{" "}
          <Link to="/vehicule" className="font-semibold text-accent-dark underline">
            prix d’achat
          </Link>{" "}
          et la durée (mois) sur la fiche véhicule pour l’inclure au bilan.
        </section>
      )}

      {bilan.tax ? (
        <section className="anim-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-accent-dark p-5 text-white shadow-lift">
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-accent-soft">Estimation d’impôt</p>
              <p className="mt-1 font-display text-3xl tracking-tight">
                {formatMoney(bilan.tax.estimatedTax)}
              </p>
              <p className="mt-1 text-sm text-ink-300">
                Net après impôt approx. {formatMoney(bilan.tax.netAfterTax)}
              </p>
              {bilan.hasAmortConfig && taxSettings?.mode !== "micro_bic_like" ? (
                <p className="mt-1 text-xs text-ink-300">
                  Base : cash − amortissement (mode réel / taux).
                </p>
              ) : null}
            </div>
            <Link
              to="/impots"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl border-2 border-white/80 bg-white px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Paramètres
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="relative mt-3 text-xs text-ink-300">
            Estimation indicative — ne remplace pas un expert-comptable /
            impots.gouv.
          </p>
        </section>
      ) : null}

      {isEmpty ? (
        <section className="anim-fade-up rounded-3xl border border-dashed border-accent/40 bg-white/80 p-5 shadow-soft">
          <p className="font-display text-xl text-ink-900">
            Ton bilan attend sa première course
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Ajoute une location ou une dépense pour animer les graphiques et
            suivre ta marge.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/locations"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Ajouter une location
            </Link>
            <Link
              to="/depenses"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900"
            >
              Ajouter une dépense
            </Link>
          </div>
        </section>
      ) : (
        <BilanCharts
          cashflow={bilan.cashflow}
          cumulative={bilan.cumulative}
          byCategory={bilan.byCategory}
        />
      )}
    </div>
  );
}
