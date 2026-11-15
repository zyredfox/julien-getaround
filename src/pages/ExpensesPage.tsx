import { useMemo, useState, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { ArrowDownUp, Copy, Pencil, Trash2 } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
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

type ChronoOrder = "desc" | "asc";

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
  const toast = useToast();
  const { data, isLoading, createExpense, updateExpense, deleteExpense } =
    useExpenses(vehicle?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [chronoOrder, setChronoOrder] = useState<ChronoOrder>("desc");

  const groupedExpenses = useMemo(() => {
    const byChrono = (a: Expense, b: Expense) => {
      const byDate =
        chronoOrder === "desc"
          ? b.spent_on.localeCompare(a.spent_on)
          : a.spent_on.localeCompare(b.spent_on);
      if (byDate !== 0) return byDate;
      return (a.notes ?? "")
        .toLowerCase()
        .localeCompare((b.notes ?? "").toLowerCase(), "fr");
    };

    const groups = [
      {
        key: "recurring",
        label: "Mensualités",
        items: (data ?? []).filter((expense) => expense.is_recurring),
      },
      {
        key: "one_shot",
        label: "Ponctuelles",
        items: (data ?? []).filter((expense) => !expense.is_recurring),
      },
    ] as const;

    return groups
      .map((group) => ({
        ...group,
        items: [...group.items].sort(byChrono),
      }))
      .filter((group) => group.items.length > 0);
  }, [data, chronoOrder]);

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

  function fillFormFromExpense(expense: Expense) {
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
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    fillFormFromExpense(expense);
    setError(null);
    setOpen(true);
  }

  function openDuplicate(expense: Expense) {
    setEditing(null);
    fillFormFromExpense(expense);
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
        toast.success("Dépense mise à jour.");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Dépense enregistrée.");
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
      <Seo title="Dépenses" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title font-display text-2xl text-ink-900 dark:text-ink-50">
          Dépenses
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:border-ink-500 dark:bg-ink-900 dark:text-ink-50 dark:hover:bg-ink-800"
            aria-pressed={chronoOrder === "asc"}
            aria-label={
              chronoOrder === "desc"
                ? "Ordre actuel : plus récent d’abord. Inverser."
                : "Ordre actuel : plus ancien d’abord. Inverser."
            }
            onClick={() =>
              setChronoOrder((order) => (order === "desc" ? "asc" : "desc"))
            }
          >
            <ArrowDownUp className="size-4" aria-hidden />
            {chronoOrder === "desc" ? "Plus récent" : "Plus ancien"}
          </button>
          <button type="button" onClick={openCreate} className="btn-signal">
            Ajouter
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-500 dark:text-ink-200">Chargement…</p>
      ) : null}

      <div className="space-y-4">
        {groupedExpenses.map((group) => (
          <section key={group.key} aria-labelledby={`type-${group.key}`}>
            <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
              <h2
                id={`type-${group.key}`}
                className="text-sm font-semibold uppercase tracking-wide text-ink-800 dark:text-ink-100"
              >
                {group.label}
              </h2>
              <p className="text-xs font-semibold tabular-nums text-ink-700 dark:text-ink-200">
                {group.items.length} ·{" "}
                {formatMoney(
                  group.items.reduce((sum, item) => sum + Number(item.amount), 0),
                )}
                {group.key === "recurring" ? " / mois" : ""}
              </p>
            </div>
            <ul className="space-y-2">
              {group.items.map((expense) => (
                <li
                  key={expense.id}
                  className="list-row rounded-xl border-l-4 border-signal bg-white/95 px-3 py-2.5 shadow-soft ring-1 ring-ink-100/80 dark:bg-ink-800 dark:ring-ink-600"
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base leading-tight text-ink-900 dark:text-ink-50">
                        {expense.notes?.trim() ||
                          categoryLabel(expense.category)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-200">
                        {categoryLabel(expense.category)}
                        {" · "}
                        {expense.is_recurring
                          ? formatSubscriptionLabel(expense)
                          : format(parseISO(expense.spent_on), "dd/MM/yy")}
                      </p>
                    </div>
                    <div className="w-[5.75rem] shrink-0 text-right tabular-nums">
                      <p className="font-display text-lg leading-none text-ink-900 dark:text-ink-50">
                        {formatMoney(Number(expense.amount))}
                      </p>
                      {expense.is_recurring ? (
                        <p className="mt-0.5 text-xs font-medium text-ink-500 dark:text-ink-200">
                          / mois
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        className="grid size-11 place-items-center rounded-lg text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:text-ink-100 dark:hover:bg-white/10"
                        aria-label="Dupliquer la dépense"
                        onClick={() => openDuplicate(expense)}
                      >
                        <Copy className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="grid size-11 place-items-center rounded-lg text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:text-ink-100 dark:hover:bg-white/10"
                        aria-label="Modifier la dépense"
                        onClick={() => openEdit(expense)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="grid size-11 place-items-center rounded-lg text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:text-red-300 dark:hover:bg-red-950/50"
                        aria-label="Supprimer la dépense"
                        onClick={() => {
                          if (!confirm("Supprimer cette dépense ?")) return;
                          void deleteExpense
                            .mutateAsync(expense.id)
                            .then(() => toast.success("Dépense supprimée."))
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
          </section>
        ))}
      </div>

      {!isLoading && (data?.length ?? 0) === 0 ? (
        <p className="text-sm text-ink-500 dark:text-ink-200">
          Aucune dépense. Ajoute assurance, boîtier, pneus…
        </p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-30 grid place-items-end bg-ink-950/40 p-4 sm:place-items-center">
          <form
            onSubmit={onSubmit}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-soft dark:bg-ink-900 dark:text-ink-50"
          >
            <h2 className="font-display text-xl">
              {editing ? "Modifier" : "Nouvelle dépense"}
            </h2>
            <div className="mt-4 grid gap-3">
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-ink-800"
                >
                  Titre
                </label>
                <input
                  id="title"
                  required
                  placeholder="ex. MAIF, carte grise, parking…"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 outline-none ring-accent focus:ring-2"
                />
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
                    Mensualité (répétée chaque mois)
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
                  htmlFor="category"
                  className="text-sm font-medium text-ink-800"
                >
                  Catégorie{" "}
                  <span className="font-normal text-ink-500">
                    (classement)
                  </span>
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
