import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { usePeaPositions } from "@/hooks/usePeaPositions";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/cn";
import { formatMoney, toNumber } from "@/lib/money";
import type { PeaPosition } from "@/integrations/supabase/types";

const emptyForm = {
  ticker: "",
  isin: "",
  label: "",
  quantity: "",
  avg_cost: "",
  notes: "",
};

export function PeaPositionsPage() {
  const { peaSpace } = useWorkspace();
  const toast = useToast();
  const {
    positions,
    isLoading,
    positionValue,
    createPosition,
    updatePosition,
    deletePosition,
    refreshQuotes,
  } = usePeaPositions(peaSpace?.id);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PeaPosition | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const autoRefreshed = useRef(false);

  useEffect(() => {
    if (isLoading || positions.length === 0 || autoRefreshed.current) return;
    autoRefreshed.current = true;
    void refreshQuotes.mutateAsync({ force: false }).catch(() => undefined);
  }, [isLoading, positions.length, refreshQuotes]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function openEdit(row: PeaPosition) {
    setEditing(row);
    setForm({
      ticker: row.ticker,
      isin: row.isin ?? "",
      label: row.label,
      quantity: String(row.quantity),
      avg_cost: String(row.avg_cost),
      notes: row.notes ?? "",
    });
    setError(null);
    setOpen(true);
  }

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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const quantity = toNumber(form.quantity);
    const avgCost = toNumber(form.avg_cost);
    if (!form.ticker.trim()) {
      setError("Ticker obligatoire (ex. PSP5).");
      return;
    }
    if (quantity <= 0) {
      setError("La quantité doit être positive.");
      return;
    }

    const payload = {
      ticker: form.ticker,
      isin: form.isin || null,
      label: form.label.trim() || form.ticker.trim(),
      quantity,
      avg_cost: avgCost,
      last_price: null as number | null,
      notes: form.notes || null,
    };

    try {
      if (editing) {
        await updatePosition.mutateAsync({
          id: editing.id,
          ticker: payload.ticker,
          isin: payload.isin,
          label: payload.label,
          quantity: payload.quantity,
          avg_cost: payload.avg_cost,
          notes: payload.notes,
        });
        await refreshQuotes.mutateAsync({ force: true });
        toast.success("Position mise à jour + cours live.");
      } else {
        await createPosition.mutateAsync(payload);
        toast.success("Position ajoutée avec cours live.");
      }
      setOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur d’enregistrement";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      <Seo title="Positions PEA" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title font-display text-2xl text-ink-900 dark:text-ink-50">
          Positions
        </h1>
        <div className="flex flex-wrap gap-2">
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
            Cours
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="size-4" aria-hidden />
            Ajouter
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-500 dark:text-ink-300">Chargement…</p>
      ) : null}

      <ul className="space-y-2">
        {positions.map((row) => (
          <li
            key={row.id}
            className="list-row rounded-xl border-l-4 border-accent bg-white/95 px-3 py-2.5 shadow-soft ring-1 ring-ink-100/80 dark:bg-ink-900/85 dark:ring-ink-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900 dark:text-ink-50">
                  {row.label}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">
                  {row.ticker}
                  {row.isin ? ` · ${row.isin}` : ""} · {Number(row.quantity)}{" "}
                  × {formatMoney(Number(row.last_price ?? row.avg_cost))}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <p className="mr-1 font-display text-lg text-ink-900 dark:text-ink-50">
                  {formatMoney(positionValue(row))}
                </p>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-lg text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:text-ink-100 dark:hover:bg-white/10"
                  aria-label={`Modifier ${row.label}`}
                  onClick={() => openEdit(row)}
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-lg text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
                  aria-label={`Supprimer ${row.label}`}
                  onClick={() => {
                    if (!confirm(`Supprimer ${row.label} ?`)) return;
                    void deletePosition
                      .mutateAsync(row.id)
                      .then(() => toast.success("Position supprimée."))
                      .catch((err: unknown) =>
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : "Suppression impossible",
                        ),
                      );
                  }}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!isLoading && positions.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Aucune position. Exemple ticker PEA : CW8.PA, PE500.PA…
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-ink-950/40 p-4 sm:place-items-center">
          <form
            onSubmit={onSubmit}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-soft dark:bg-ink-900 dark:text-ink-50"
          >
            <h2 className="font-display text-xl">
              {editing ? "Modifier" : "Nouvelle position"}
            </h2>
            <div className="mt-4 grid gap-3">
              <Field
                id="ticker"
                label="Ticker"
                value={form.ticker}
                onChange={(value) => setForm((f) => ({ ...f, ticker: value }))}
                required
                hint="Ex. PSP5 (devient PSP5.PA) — cours récupéré automatiquement"
              />
              <Field
                id="label"
                label="Libellé"
                value={form.label}
                onChange={(value) => setForm((f) => ({ ...f, label: value }))}
                hint="Ex. Amundi PEA S&P 500 — sinon ticker / nom Yahoo"
              />
              <Field
                id="isin"
                label="ISIN (optionnel)"
                value={form.isin}
                onChange={(value) => setForm((f) => ({ ...f, isin: value }))}
                hint="Ex. FR0011871128"
              />
              <Field
                id="quantity"
                label="Quantité"
                type="number"
                value={form.quantity}
                onChange={(value) =>
                  setForm((f) => ({ ...f, quantity: value }))
                }
                required
              />
              <Field
                id="avg_cost"
                label="PRU (€)"
                type="number"
                value={form.avg_cost}
                onChange={(value) =>
                  setForm((f) => ({ ...f, avg_cost: value }))
                }
                required
                hint="Ton prix de revient unitaire (pour le latent)"
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
              <button type="submit" className="btn-primary flex-1">
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
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
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
        step={type === "number" ? "0.0001" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50"
      />
      {hint ? (
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{hint}</p>
      ) : null}
    </div>
  );
}
