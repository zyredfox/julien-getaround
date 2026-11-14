import { useState, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { Seo } from "@/components/Seo";
import { useRentals } from "@/hooks/useRentals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { formatMoney, toNumber } from "@/lib/money";
import type { Rental } from "@/integrations/supabase/types";

const emptyForm = {
  start_at: "",
  end_at: "",
  gross_amount: "",
  platform_fees: "",
  net_amount: "",
  notes: "",
};

export function RentalsPage() {
  const { vehicle } = useWorkspace();
  const { data, isLoading, createRental, updateRental, deleteRental } =
    useRentals(vehicle?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rental | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(rental: Rental) {
    setEditing(rental);
    setForm({
      start_at: rental.start_at.slice(0, 10),
      end_at: rental.end_at.slice(0, 10),
      gross_amount: String(rental.gross_amount),
      platform_fees: String(rental.platform_fees),
      net_amount: String(rental.net_amount),
      notes: rental.notes ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!vehicle?.id) return;
    setError(null);

    if (form.end_at < form.start_at) {
      setError("La date de fin doit être après la date de début.");
      return;
    }

    const payload = {
      vehicle_id: vehicle.id,
      start_at: form.start_at,
      end_at: form.end_at,
      gross_amount: toNumber(form.gross_amount),
      platform_fees: toNumber(form.platform_fees),
      net_amount: toNumber(form.net_amount),
      notes: form.notes.trim() || null,
    };

    try {
      if (editing) {
        await updateRental.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createRental.mutateAsync(payload);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d’enregistrement");
    }
  }

  return (
    <div className="space-y-4">
      <Seo title="Locations" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Locations</h1>
        <button
          type="button"
          onClick={openCreate}
          className="btn-primary"
        >
          Ajouter
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-500">Chargement…</p>
      ) : null}

      <ul className="space-y-3">
        {(data ?? []).map((rental) => (
          <li
            key={rental.id}
            className="rounded-2xl border-l-4 border-accent bg-white/95 p-4 shadow-soft ring-1 ring-ink-100/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">
                  {format(parseISO(rental.start_at), "dd/MM/yyyy")} →{" "}
                  {format(parseISO(rental.end_at), "dd/MM/yyyy")}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Brut {formatMoney(Number(rental.gross_amount))} · Frais{" "}
                  {formatMoney(Number(rental.platform_fees))}
                </p>
                {rental.notes ? (
                  <p className="mt-1 text-sm text-ink-600">{rental.notes}</p>
                ) : null}
              </div>
              <p className="font-display text-xl text-accent-dark">
                {formatMoney(Number(rental.net_amount))}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => openEdit(rental)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (confirm("Supprimer cette location ?")) {
                    void deleteRental.mutateAsync(rental.id);
                  }
                }}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && (data?.length ?? 0) === 0 ? (
        <p className="text-sm text-ink-500">
          Aucune location. Ajoute ta première entrée.
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-ink-950/40 p-4 sm:place-items-center">
          <form
            onSubmit={onSubmit}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-soft"
            aria-label={editing ? "Modifier location" : "Nouvelle location"}
          >
            <h2 className="font-display text-xl">
              {editing ? "Modifier" : "Nouvelle location"}
            </h2>
            <div className="mt-4 grid gap-3">
              <Field
                id="start_at"
                label="Date de début"
                type="date"
                value={form.start_at}
                onChange={(value) => setForm((f) => ({ ...f, start_at: value }))}
                required
              />
              <Field
                id="end_at"
                label="Date de fin"
                type="date"
                value={form.end_at}
                onChange={(value) => setForm((f) => ({ ...f, end_at: value }))}
                required
              />
              <Field
                id="gross_amount"
                label="Prix brut (€)"
                type="number"
                inputMode="decimal"
                value={form.gross_amount}
                onChange={(value) =>
                  setForm((f) => ({ ...f, gross_amount: value }))
                }
                required
              />
              <Field
                id="platform_fees"
                label="Frais Getaround (€)"
                type="number"
                inputMode="decimal"
                value={form.platform_fees}
                onChange={(value) =>
                  setForm((f) => ({ ...f, platform_fees: value }))
                }
              />
              <Field
                id="net_amount"
                label="Net perçu (€)"
                type="number"
                inputMode="decimal"
                value={form.net_amount}
                onChange={(value) =>
                  setForm((f) => ({ ...f, net_amount: value }))
                }
                required
              />
              <Field
                id="notes"
                label="Notes"
                value={form.notes}
                onChange={(value) => setForm((f) => ({ ...f, notes: value }))}
              />
            </div>
            {error ? (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setOpen(false)}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      ) : null}
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
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "decimal";
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
      />
    </div>
  );
}
