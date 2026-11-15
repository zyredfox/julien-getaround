import { useEffect, useState, type FormEvent } from "react";
import { toNumber } from "@/lib/money";
import type { Vehicle } from "@/integrations/supabase/types";
import type { VehicleInput } from "@/hooks/useWorkspace";

type VehicleFormProps = {
  initial?: Vehicle | null;
  submitLabel: string;
  onSubmit: (input: VehicleInput) => Promise<void>;
};

export function VehicleForm({
  initial,
  submitLabel,
  onSubmit,
}: VehicleFormProps) {
  const [label, setLabel] = useState("");
  const [plate, setPlate] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [acquisitionOn, setAcquisitionOn] = useState("");
  const [amortMonths, setAmortMonths] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLabel(initial?.label ?? "");
    setPlate(initial?.plate ?? "");
    setMakeModel(initial?.make_model ?? "");
    setAcquisitionCost(
      initial?.acquisition_cost != null ? String(initial.acquisition_cost) : "",
    );
    setAcquisitionOn(initial?.acquisition_on ?? "");
    setAmortMonths(
      initial?.amort_months != null ? String(initial.amort_months) : "",
    );
  }, [initial]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        label: label.trim() || "Ma voiture Getaround",
        plate: plate.trim() || null,
        make_model: makeModel.trim() || null,
        acquisition_cost: acquisitionCost ? toNumber(acquisitionCost) : null,
        acquisition_on: acquisitionOn || null,
        amort_months: amortMonths ? Math.round(toNumber(amortMonths)) : null,
      });
      setMessage("Véhicule enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel space-y-3 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-700"
    >
      <Field id="label" label="Nom" value={label} onChange={setLabel} required />
      <Field
        id="make_model"
        label="Marque / modèle"
        value={makeModel}
        onChange={setMakeModel}
      />
      <Field id="plate" label="Immatriculation" value={plate} onChange={setPlate} />
      <Field
        id="acquisition_cost"
        label="Prix de revient / achat (€)"
        type="number"
        value={acquisitionCost}
        onChange={setAcquisitionCost}
      />
      <Field
        id="acquisition_on"
        label="Date d’acquisition"
        type="date"
        value={acquisitionOn}
        onChange={setAcquisitionOn}
      />
      <Field
        id="amort_months"
        label="Durée d’amortissement (mois)"
        type="number"
        value={amortMonths}
        onChange={setAmortMonths}
      />
      <p className="text-xs text-ink-500 dark:text-ink-300">
        Ex. 60 mois → prix d’achat ÷ 60 chaque mois, du mois d’acquisition
        jusqu’à la fin de la durée. Inclus dans le bilan (net économique,
        graphs, estimation d’impôt en mode réel).
      </p>
      {message ? (
        <p className="text-sm text-accent-dark dark:text-accent-bright" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium text-ink-800 dark:text-ink-200"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2 dark:border-ink-600 dark:bg-ink-950 dark:text-ink-50"
      />
    </div>
  );
}
