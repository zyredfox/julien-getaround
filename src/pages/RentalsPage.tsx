import { useMemo, useState, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { Copy, Pencil, Search, Trash2, X } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { useRentals } from "@/hooks/useRentals";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  feesFromGrossNet,
  formatAmountInput,
  formatMoney,
  toNumber,
} from "@/lib/money";
import type { Rental } from "@/integrations/supabase/types";

const emptyForm = {
  start_at: "",
  end_at: "",
  gross_amount: "",
  platform_fees: "",
  net_amount: "",
  notes: "",
};

function withAutoFees(
  patch: Partial<typeof emptyForm>,
  current: typeof emptyForm,
): typeof emptyForm {
  const next = { ...current, ...patch };
  const fees = feesFromGrossNet(next.gross_amount, next.net_amount);
  next.platform_fees =
    next.gross_amount === "" && next.net_amount === ""
      ? ""
      : formatAmountInput(fees);
  return next;
}

const emptyFilters = {
  query: "",
  from: "",
  to: "",
  minNet: "",
  maxNet: "",
};

export function RentalsPage() {
  const { vehicle } = useWorkspace();
  const toast = useToast();
  const { data, isLoading, createRental, updateRental, deleteRental } =
    useRentals(vehicle?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rental | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(emptyFilters);

  const filteredRentals = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const minNet = filters.minNet ? toNumber(filters.minNet) : null;
    const maxNet = filters.maxNet ? toNumber(filters.maxNet) : null;

    return (data ?? []).filter((rental) => {
      const start = rental.start_at.slice(0, 10);
      const end = rental.end_at.slice(0, 10);
      const net = Number(rental.net_amount);

      if (filters.from && end < filters.from) return false;
      if (filters.to && start > filters.to) return false;
      if (minNet != null && net < minNet) return false;
      if (maxNet != null && net > maxNet) return false;

      if (!query) return true;

      const haystack = [
        start,
        end,
        format(parseISO(rental.start_at), "dd/MM/yyyy"),
        format(parseISO(rental.end_at), "dd/MM/yyyy"),
        String(rental.gross_amount),
        String(rental.net_amount),
        rental.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [data, filters]);

  const filtersActive =
    Boolean(filters.query.trim()) ||
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    Boolean(filters.minNet) ||
    Boolean(filters.maxNet);

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

  function openDuplicate(rental: Rental) {
    setEditing(null);
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

    const gross = toNumber(form.gross_amount);
    const net = toNumber(form.net_amount);
    const payload = {
      vehicle_id: vehicle.id,
      start_at: form.start_at,
      end_at: form.end_at,
      gross_amount: gross,
      platform_fees: feesFromGrossNet(gross, net),
      net_amount: net,
      notes: form.notes.trim() || null,
    };

    try {
      if (editing) {
        await updateRental.mutateAsync({ id: editing.id, ...payload });
        toast.success("Location mise à jour.");
      } else {
        await createRental.mutateAsync(payload);
        toast.success("Location enregistrée.");
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
      <Seo title="Locations" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title font-display text-2xl text-ink-900 dark:text-ink-50">
          Locations
        </h1>
        <button type="button" onClick={openCreate} className="btn-primary">
          Ajouter
        </button>
      </div>

      <section
        className="panel filter-panel rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink-200 dark:bg-ink-800 dark:ring-ink-600"
        aria-label="Filtres locations"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-700 dark:text-ink-200"
            aria-hidden
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) =>
              setFilters((current) => ({ ...current, query: e.target.value }))
            }
            placeholder="Rechercher (dates, notes, montant…)"
            className="filter-input w-full min-h-11 rounded-xl border border-ink-200 bg-ink-50 py-2 pl-10 pr-3 text-sm text-ink-900 outline-none ring-accent focus:ring-2 dark:border-ink-600 dark:bg-ink-950 dark:text-ink-50"
          />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="filter-label block text-xs font-semibold text-ink-800 dark:text-ink-100">
            Du
            <input
              type="date"
              value={filters.from}
              onChange={(e) =>
                setFilters((current) => ({ ...current, from: e.target.value }))
              }
              className="filter-input mt-1 w-full min-h-11 rounded-xl border border-ink-200 bg-ink-50 px-2 text-sm text-ink-900 outline-none ring-accent focus:ring-2 dark:border-ink-600 dark:bg-ink-950 dark:text-ink-50"
            />
          </label>
          <label className="filter-label block text-xs font-semibold text-ink-800 dark:text-ink-100">
            Au
            <input
              type="date"
              value={filters.to}
              onChange={(e) =>
                setFilters((current) => ({ ...current, to: e.target.value }))
              }
              className="filter-input mt-1 w-full min-h-11 rounded-xl border border-ink-200 bg-ink-50 px-2 text-sm text-ink-900 outline-none ring-accent focus:ring-2 dark:border-ink-600 dark:bg-ink-950 dark:text-ink-50"
            />
          </label>
          <label className="filter-label block text-xs font-semibold text-ink-800 dark:text-ink-100">
            Net min €
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={filters.minNet}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  minNet: e.target.value,
                }))
              }
              className="filter-input mt-1 w-full min-h-11 rounded-xl border border-ink-200 bg-ink-50 px-2 text-sm text-ink-900 outline-none ring-accent focus:ring-2 dark:border-ink-600 dark:bg-ink-950 dark:text-ink-50"
            />
          </label>
          <label className="filter-label block text-xs font-semibold text-ink-800 dark:text-ink-100">
            Net max €
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={filters.maxNet}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  maxNet: e.target.value,
                }))
              }
              className="filter-input mt-1 w-full min-h-11 rounded-xl border border-ink-200 bg-ink-50 px-2 text-sm text-ink-900 outline-none ring-accent focus:ring-2 dark:border-ink-600 dark:bg-ink-950 dark:text-ink-50"
            />
          </label>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">
            {filteredRentals.length} / {(data ?? []).length} location
            {(data ?? []).length > 1 ? "s" : ""}
          </p>
          {filtersActive ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:text-ink-100 dark:hover:bg-ink-700"
              onClick={() => setFilters(emptyFilters)}
            >
              <X className="size-4" aria-hidden />
              Effacer
            </button>
          ) : null}
        </div>
      </section>

      {isLoading ? (
        <p className="text-sm text-ink-500 dark:text-ink-300">Chargement…</p>
      ) : null}

      <ul className="space-y-2">
        {filteredRentals.map((rental) => (
          <li
            key={rental.id}
            className="list-row rounded-xl border-l-4 border-accent bg-white/95 px-3 py-2.5 shadow-soft ring-1 ring-ink-100/80 dark:bg-ink-900/85 dark:ring-ink-700"
          >
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                  {format(parseISO(rental.start_at), "dd/MM/yy")} →{" "}
                  {format(parseISO(rental.end_at), "dd/MM/yy")}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-300">
                  Brut {formatMoney(Number(rental.gross_amount))} · Frais{" "}
                  {formatMoney(Number(rental.platform_fees))}
                  {rental.notes ? ` · ${rental.notes}` : ""}
                </p>
              </div>
              <div className="w-[5.75rem] shrink-0 text-right tabular-nums">
                <p className="font-display text-lg leading-none text-accent-dark dark:text-accent-bright">
                  {formatMoney(Number(rental.net_amount))}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-lg text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:text-ink-100 dark:hover:bg-white/10"
                  aria-label="Dupliquer la location"
                  onClick={() => openDuplicate(rental)}
                >
                  <Copy className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-lg text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:text-ink-100 dark:hover:bg-white/10"
                  aria-label="Modifier la location"
                  onClick={() => openEdit(rental)}
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className="grid size-11 place-items-center rounded-lg text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
                  aria-label="Supprimer la location"
                  onClick={() => {
                    if (!confirm("Supprimer cette location ?")) return;
                    void deleteRental
                      .mutateAsync(rental.id)
                      .then(() => toast.success("Location supprimée."))
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

      {!isLoading && (data?.length ?? 0) === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Aucune location. Ajoute ta première entrée.
        </p>
      ) : null}

      {!isLoading && (data?.length ?? 0) > 0 && filteredRentals.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-300">
          Aucune location ne correspond aux filtres.
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-ink-950/40 p-4 sm:place-items-center">
          <form
            onSubmit={onSubmit}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-soft dark:bg-ink-900 dark:text-ink-50"
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
                  setForm((f) => withAutoFees({ gross_amount: value }, f))
                }
                required
                hint="Sur Getaround : prix de la location (ex. 91 €). Base micro / impôts."
              />
              <Field
                id="net_amount"
                label="Vos revenus (€)"
                type="number"
                inputMode="decimal"
                value={form.net_amount}
                onChange={(value) =>
                  setForm((f) => withAutoFees({ net_amount: value }, f))
                }
                required
                hint="Sur Getaround : « Vos revenus » (ex. 76,61 €). Cash réellement perçu."
              />
              <Field
                id="platform_fees"
                label="Frais / écart (€)"
                type="number"
                inputMode="decimal"
                value={form.platform_fees}
                onChange={() => undefined}
                readOnly
                hint="Calculé auto : brut − revenus (commission + carburant, etc.)."
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
  inputMode,
  hint,
  readOnly,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  inputMode?: "decimal";
  hint?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink-800 dark:text-ink-200">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        required={required}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          readOnly
            ? "mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-100/80 px-3 text-ink-800 outline-none dark:border-ink-700 dark:bg-ink-950 dark:text-ink-200"
            : "mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-50"
        }
      />
      {hint ? (
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-300">{hint}</p>
      ) : null}
    </div>
  );
}
