import { useState, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { Seo } from "@/components/Seo";
import { useExpenses } from "@/hooks/useExpenses";
import { useWorkspace } from "@/hooks/useWorkspace";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/lib/categories";
import {
  dateToMonthInput,
  formatSubscriptionLabel,
  monthInputToDate,
} from "@/lib/expandExpenses";
import { formatMoney, toNumber } from "@/lib/money";
import type { Expense, ExpenseCategory } from "@/integrations/supabase/types";

const emptyForm = {
  spent_on: "",
  start_month: "",
  end_month: "",
  is_recurring: false,
  category: "insurance" as ExpenseCategory,
  amount: "",
  notes: "",
};

export function ExpensesPage() {
  const { vehicle } = useWorkspace();
  const { data, isLoading, createExpense, updateExpense, deleteExpense } =
    useExpenses(vehicle?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    const today = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setForm({
      ...emptyForm,
      spent_on: today,
      start_month: dateToMonthInput(today),
    });
    setError(null);
    setOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setForm({
      spent_on: expense.spent_on,
      start_month: dateToMonthInput(expense.spent_on),
      end_month: expense.repeat_until
        ? dateToMonthInput(expense.repeat_until)
        : "",
      is_recurring: expense.is_recurring,
      category: expense.category,
      amount: String(expense.amount),
      notes: expense.notes ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!vehicle?.id) return;
    setError(null);

    const spentOn = form.is_recurring
      ? monthInputToDate(form.start_month)
      : form.spent_on;
    const repeatUntil =
      form.is_recurring && form.end_month
        ? monthInputToDate(form.end_month)
        : null;

    if (form.is_recurring && !form.start_month) {
      setError("Indique le mois de début de l’abonnement.");
      return;
    }
    if (repeatUntil && repeatUntil < spentOn) {
      setError("Le mois de fin doit être après le mois de début.");
      return;
    }

    const payload = {
      vehicle_id: vehicle.id,
      spent_on: spentOn,
      category: form.category,
      amount: toNumber(form.amount),
      notes: form.notes.trim() || null,
      is_recurring: form.is_recurring,
      repeat_until: form.is_recurring ? repeatUntil : null,
    };

    try {
      if (editing) {
        await updateExpense.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d’enregistrement");
    }
  }

  return (
    <div className="space-y-4">
      <Seo title="Dépenses" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Dépenses</h1>
        <button
          type="button"
          onClick={openCreate}
          className="btn-signal"
        >
          Ajouter
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-500">Chargement…</p>
      ) : null}

      <ul className="space-y-3">
        {(data ?? []).map((expense) => (
          <li
            key={expense.id}
            className="rounded-2xl border-l-4 border-signal bg-white/95 p-4 shadow-soft ring-1 ring-ink-100/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink-900">
                    {categoryLabel(expense.category)}
                  </p>
                  {expense.is_recurring ? (
                    <span className="rounded-md bg-signal-soft px-2 py-0.5 text-xs font-semibold text-warn">
                      Abo / mois
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {expense.is_recurring
                    ? formatSubscriptionLabel(expense)
                    : format(parseISO(expense.spent_on), "dd/MM/yyyy")}
                </p>
                {expense.notes ? (
                  <p className="mt-1 text-sm text-ink-600">{expense.notes}</p>
                ) : null}
              </div>
              <p className="font-display text-xl text-ink-900">
                {formatMoney(Number(expense.amount))}
                {expense.is_recurring ? (
                  <span className="block text-xs font-sans font-medium text-ink-500">
                    / mois
                  </span>
                ) : null}
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => openEdit(expense)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  if (confirm("Supprimer cette dépense ?")) {
                    void deleteExpense.mutateAsync(expense.id);
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
          Aucune dépense. Ajoute assurance, boîtier, pneus…
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-ink-950/40 p-4 sm:place-items-center">
          <form
            onSubmit={onSubmit}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-soft"
          >
            <h2 className="font-display text-xl">
              {editing ? "Modifier" : "Nouvelle dépense"}
            </h2>
            <div className="mt-4 grid gap-3">
              <div>
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-ink-800"
                >
                  Catégorie
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      category: e.target.value as ExpenseCategory,
                    }))
                  }
                  className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="text-sm font-medium text-ink-800"
                >
                  Montant (€){form.is_recurring ? " / mois" : ""}
                </label>
                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
                />
              </div>

              <fieldset className="rounded-2xl bg-ink-50 p-3 ring-1 ring-ink-100">
                <legend className="px-1 text-sm font-semibold text-ink-800">
                  Récurrence
                </legend>
                <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        is_recurring: e.target.checked,
                        start_month:
                          f.start_month ||
                          dateToMonthInput(
                            f.spent_on || new Date().toISOString().slice(0, 10),
                          ),
                      }))
                    }
                    className="size-5 rounded border-ink-300 text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-ink-800">
                    Abonnement mensuel (répété chaque mois)
                  </span>
                </label>

                {form.is_recurring ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="start_month"
                        className="text-sm font-medium text-ink-800"
                      >
                        Mois de début
                      </label>
                      <input
                        id="start_month"
                        type="month"
                        required
                        value={form.start_month}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            start_month: e.target.value,
                          }))
                        }
                        className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-white px-3 outline-none ring-accent focus:ring-2"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="end_month"
                        className="text-sm font-medium text-ink-800"
                      >
                        Mois de fin{" "}
                        <span className="font-normal text-ink-500">
                          (optionnel)
                        </span>
                      </label>
                      <input
                        id="end_month"
                        type="month"
                        value={form.end_month}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            end_month: e.target.value,
                          }))
                        }
                        className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-white px-3 outline-none ring-accent focus:ring-2"
                      />
                      <p className="mt-1 text-xs text-ink-500">
                        Vide = en cours (compté jusqu’au mois actuel).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <label
                      htmlFor="spent_on"
                      className="text-sm font-medium text-ink-800"
                    >
                      Date
                    </label>
                    <input
                      id="spent_on"
                      type="date"
                      required
                      value={form.spent_on}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, spent_on: e.target.value }))
                      }
                      className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-white px-3 outline-none ring-accent focus:ring-2"
                    />
                  </div>
                )}
              </fieldset>

              <div>
                <label
                  htmlFor="notes"
                  className="text-sm font-medium text-ink-800"
                >
                  Notes
                </label>
                <input
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
                />
              </div>
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
