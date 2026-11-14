import { useEffect, useState, type FormEvent } from "react";
import { Seo } from "@/components/Seo";
import { useBilan } from "@/hooks/useBilan";
import { useExpenses } from "@/hooks/useExpenses";
import { useRentals } from "@/hooks/useRentals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatMoney, toNumber } from "@/lib/money";
import { DEFAULT_TAX_MODE, TAX_MODE_LABELS } from "@/lib/taxEstimate";
import type { TaxMode } from "@/integrations/supabase/types";

export function TaxesPage() {
  const { vehicle, taxSettings, updateTaxSettings } = useWorkspace();
  const { data: rentals } = useRentals(vehicle?.id);
  const { data: expenses } = useExpenses(vehicle?.id);
  const bilan = useBilan(rentals, expenses, taxSettings, "year", vehicle);

  const [mode, setMode] = useState<TaxMode>(DEFAULT_TAX_MODE);
  const [rate, setRate] = useState("30");
  const [allowance, setAllowance] = useState("50");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taxSettings) return;
    setMode(taxSettings.mode);
    setRate(String(taxSettings.flat_rate_percent));
    setAllowance(String(taxSettings.micro_allowance_percent));
  }, [taxSettings]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await updateTaxSettings.mutateAsync({
        mode,
        flat_rate_percent: toNumber(rate),
        micro_allowance_percent: toNumber(allowance),
      });
      setMessage("Paramètres enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  const isMicro = (taxSettings?.mode ?? mode) === "micro_bic_like";

  return (
    <div className="space-y-4">
      <Seo title="Impôts" />
      <h1 className="font-display text-2xl">Impôts</h1>
      <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Estimation indicative uniquement. Ne remplace pas un expert-comptable
        ni impots.gouv. En micro, l’impôt part du <strong>CA</strong> même si
        ton cash est négatif.
      </p>

      <section className="rounded-2xl bg-white/90 p-4 shadow-soft ring-1 ring-ink-100">
        <h2 className="text-sm font-semibold text-ink-800">
          Aperçu année en cours
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-ink-500">CA (prix bruts)</dt>
            <dd className="font-display text-xl">
              {formatMoney(bilan.grossRevenue)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Cash net</dt>
            <dd className="font-display text-xl">
              {formatMoney(bilan.cashNet)}
            </dd>
          </div>
          {isMicro && bilan.tax ? (
            <>
              <div>
                <dt className="text-ink-500">
                  Abattement ({taxSettings?.micro_allowance_percent ?? 50}%)
                </dt>
                <dd className="font-display text-xl">
                  −{formatMoney(bilan.tax.allowanceAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">Base taxable (après abattement)</dt>
                <dd className="font-display text-xl">
                  {formatMoney(bilan.tax.taxableBase)}
                </dd>
              </div>
            </>
          ) : (
            <div>
              <dt className="text-ink-500">Base taxable approx.</dt>
              <dd className="font-display text-xl">
                {formatMoney(bilan.tax?.taxableBase ?? 0)}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-ink-500">
              Impôt estimé (× {taxSettings?.flat_rate_percent ?? 30}% IR)
            </dt>
            <dd className="font-display text-xl text-warn">
              {formatMoney(bilan.tax?.estimatedTax ?? 0)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-500">Net après impôt approx.</dt>
            <dd className="font-display text-xl text-accent-dark">
              {formatMoney(bilan.tax?.netAfterTax ?? 0)}
            </dd>
          </div>
        </dl>
        {isMicro ? (
          <p className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
            Formule micro :{" "}
            <span className="font-medium text-ink-800">
              CA × (1 − {taxSettings?.micro_allowance_percent ?? 50}%) ×{" "}
              {taxSettings?.flat_rate_percent ?? 30}%
            </span>
            . Les dépenses, abonnements et amortissement n’entrent pas dans
            cette base (déjà couverts par l’abattement forfaitaire).
          </p>
        ) : null}
      </section>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl bg-white/90 p-4 shadow-soft ring-1 ring-ink-100"
      >
        <div>
          <label htmlFor="mode" className="text-sm font-medium text-ink-800">
            Mode de simulation
          </label>
          <select
            id="mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as TaxMode)}
            className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
          >
            {(Object.keys(TAX_MODE_LABELS) as TaxMode[]).map((key) => (
              <option key={key} value={key}>
                {TAX_MODE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rate" className="text-sm font-medium text-ink-800">
            Taux IR indicatif (%)
          </label>
          <input
            id="rate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
          />
        </div>
        {mode === "micro_bic_like" ? (
          <div>
            <label
              htmlFor="allowance"
              className="text-sm font-medium text-ink-800"
            >
              Abattement forfaitaire sur le CA (%)
            </label>
            <input
              id="allowance"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
            />
          </div>
        ) : null}
        {message ? (
          <p className="text-sm text-accent-dark" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn-primary w-full">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
