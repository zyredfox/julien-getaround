import { useEffect, useState, type FormEvent } from "react";
import { Seo } from "@/components/Seo";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toNumber } from "@/lib/money";

export function VehiclePage() {
  const { vehicle, updateVehicle } = useWorkspace();
  const [label, setLabel] = useState("");
  const [plate, setPlate] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [acquisitionOn, setAcquisitionOn] = useState("");
  const [amortMonths, setAmortMonths] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicle) return;
    setLabel(vehicle.label);
    setPlate(vehicle.plate ?? "");
    setMakeModel(vehicle.make_model ?? "");
    setAcquisitionCost(
      vehicle.acquisition_cost != null ? String(vehicle.acquisition_cost) : "",
    );
    setAcquisitionOn(vehicle.acquisition_on ?? "");
    setAmortMonths(
      vehicle.amort_months != null ? String(vehicle.amort_months) : "",
    );
  }, [vehicle]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await updateVehicle.mutateAsync({
        label: label.trim() || "Ma voiture Getaround",
        plate: plate.trim() || null,
        make_model: makeModel.trim() || null,
        acquisition_cost: acquisitionCost
          ? toNumber(acquisitionCost)
          : null,
        acquisition_on: acquisitionOn || null,
        amort_months: amortMonths ? Math.round(toNumber(amortMonths)) : null,
      });
      setMessage("Véhicule enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="space-y-4">
      <Seo title="Véhicule" />
      <h1 className="font-display text-2xl">Véhicule</h1>
      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl bg-white/90 p-4 shadow-soft ring-1 ring-ink-100"
      >
        <Field id="label" label="Nom" value={label} onChange={setLabel} required />
        <Field
          id="make_model"
          label="Marque / modèle"
          value={makeModel}
          onChange={setMakeModel}
        />
        <Field
          id="plate"
          label="Immatriculation"
          value={plate}
          onChange={setPlate}
        />
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
        <p className="text-xs text-ink-500">
          Ex. 60 mois → prix d’achat ÷ 60 chaque mois, du mois d’acquisition
          jusqu’à la fin de la durée. Inclus dans le bilan (net économique,
          graphs, estimation d’impôt en mode réel).
        </p>
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
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Enregistrer
        </button>
      </form>
    </div>
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
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
      />
    </div>
  );
}
