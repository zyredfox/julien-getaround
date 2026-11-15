import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Car,
  Landmark,
  PiggyBank,
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
import { defaultPeriodSelection, type PeriodSelection } from "@/lib/period";

export function BilanPage() {
  const [period, setPeriod] = useState<PeriodSelection>(() =>
    defaultPeriodSelection("month"),
  );
  const { vehicle, taxSettings } = useWorkspace();
  const { data: rentals } = useRentals(vehicle?.id);
  const { data: expenses } = useExpenses(vehicle?.id);
  const bilan = useBilan(rentals, expenses, taxSettings, period, vehicle);
  const isEmpty =
    bilan.rentalCount === 0 &&
    bilan.totalExpenses === 0 &&
    bilan.amortization === 0;

  return (
    <div className="space-y-4">
      <Seo title="Bilan" />

      <section className="panel anim-fade-up relative overflow-hidden rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-600">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark dark:text-accent-bright">
              Tableau de bord
            </p>
            <h1 className="page-title mt-1 font-display text-3xl tracking-tight text-ink-900 dark:text-ink-50">
              Bilan
            </h1>
            <p className="mt-1 capitalize text-ink-600 dark:text-ink-300">
              {bilan.period.label}
            </p>
          </div>
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-accent/15 blur-2xl dark:bg-accent/25"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 right-10 size-32 rounded-full bg-signal/15 blur-2xl dark:bg-signal/20"
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
          hint="abos projetés sur la période"
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

      {bilan.tax ? (
        <section className="anim-fade-up relative overflow-hidden rounded-3xl bg-accent-soft/70 p-5 shadow-soft ring-1 ring-accent/30 dark:bg-ink-900 dark:ring-accent/40">
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-accent-dark dark:text-accent-soft">
                Super net (après IR + PS)
              </p>
              <p
                className={`mt-1 font-display text-3xl tracking-tight ${
                  bilan.tax.netAfterTax >= 0
                    ? "text-accent-dark dark:text-accent-bright"
                    : "text-warn dark:text-signal-soft"
                }`}
              >
                {formatMoney(bilan.tax.netAfterTax)}
              </p>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                Cash net {formatMoney(bilan.cashNet)} − impôts{" "}
                {formatMoney(bilan.tax.estimatedTax)}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl bg-white/80 p-2.5 ring-1 ring-ink-100 dark:bg-white/10 dark:ring-0">
                  <dt className="text-ink-600 dark:text-ink-300">IR</dt>
                  <dd className="mt-0.5 font-semibold text-ink-900 dark:text-white">
                    {formatMoney(bilan.tax.incomeTax)}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/80 p-2.5 ring-1 ring-ink-100 dark:bg-white/10 dark:ring-0">
                  <dt className="text-ink-600 dark:text-ink-300">PS</dt>
                  <dd className="mt-0.5 font-semibold text-ink-900 dark:text-white">
                    {formatMoney(bilan.tax.socialContributions)}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/80 p-2.5 ring-1 ring-ink-100 dark:bg-white/10 dark:ring-0">
                  <dt className="text-ink-600 dark:text-ink-300">Total impôts</dt>
                  <dd className="mt-0.5 font-semibold text-ink-900 dark:text-white">
                    {formatMoney(bilan.tax.estimatedTax)}
                  </dd>
                </div>
              </dl>
              {taxSettings?.mode === "micro_bic_like" ? (
                <p className="mt-3 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                  Impôts calculés sur le CA micro (
                  {formatMoney(bilan.tax.ca)} −{" "}
                  {taxSettings.micro_allowance_percent}% ={" "}
                  {formatMoney(bilan.tax.taxableBase)} ×{" "}
                  {taxSettings.flat_rate_percent}% +{" "}
                  {taxSettings.social_rate_percent ?? 17.2}%), pas sur le cash.
                </p>
              ) : null}
            </div>
            <Link
              to="/impots"
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border-2 border-ink-800 bg-white px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:border-white/80 dark:outline-white"
            >
              Paramètres
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <p className="relative mt-3 text-xs text-ink-600 dark:text-ink-300">
            Estimation indicative — ne remplace pas un expert-comptable /
            impots.gouv.
          </p>
        </section>
      ) : (
        <KpiCard
          label="Super net (après impôts)"
          value="—"
          hint="Configure les paramètres fiscaux"
          icon={PiggyBank}
          tone="default"
        />
      )}

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
            hint="cash − amortissement (hors impôts)"
            icon={TrendingDown}
            tone={bilan.economicNet >= 0 ? "positive" : "negative"}
          />
        </div>
      ) : (
        <section className="rounded-2xl border border-dashed border-ink-300 bg-white/70 p-4 text-sm text-ink-700 dark:border-ink-600 dark:bg-ink-900/70 dark:text-ink-200">
          Amortissement non configuré. Renseigne le{" "}
          <Link
            to={vehicle ? `/vehicules/${vehicle.id}` : "/vehicules"}
            className="font-semibold text-accent-dark underline dark:text-accent-bright"
          >
            prix d’achat
          </Link>{" "}
          et la durée (mois) sur la fiche véhicule pour l’inclure au bilan.
        </section>
      )}

      {isEmpty ? (
        <section className="anim-fade-up rounded-3xl border border-dashed border-accent/40 bg-white/80 p-5 shadow-soft dark:bg-ink-900/80 dark:border-accent/30">
          <p className="font-display text-xl text-ink-900 dark:text-ink-50">
            Ton bilan attend sa première course
          </p>
          <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
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
