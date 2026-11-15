import { Link } from "react-router-dom";
import { Car, Check, Plus } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { useWorkspace } from "@/hooks/useWorkspace";
import { cn } from "@/lib/cn";

export function VehiclesPage() {
  const toast = useToast();
  const { vehicles, vehicle, setActiveVehicle } = useWorkspace();

  return (
    <div className="space-y-4">
      <Seo title="Mes véhicules" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title font-display text-2xl text-ink-900 dark:text-ink-50">
            Mes véhicules
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
            Le suivi (locations, dépenses, bilan) porte sur le véhicule actif.
          </p>
        </div>
        <Link
          to="/getaround/vehicules/nouveau"
          className="btn-signal inline-flex min-h-11 items-center gap-2"
        >
          <Plus className="size-4" aria-hidden />
          Ajouter
        </Link>
      </div>

      <ul className="space-y-3">
        {vehicles.map((item) => {
          const isActive = item.id === vehicle?.id;
          return (
            <li key={item.id}>
              <div
                className={cn(
                  "panel rounded-2xl bg-white p-4 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-700",
                  isActive && "ring-2 ring-accent",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/getaround/vehicules/${item.id}`}
                    className="min-w-0 flex-1 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-dark dark:bg-accent/25 dark:text-accent-bright">
                        <Car className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900 dark:text-ink-50">
                          {item.label}
                        </p>
                        <p className="truncate text-sm text-ink-500 dark:text-ink-300">
                          {[item.make_model, item.plate]
                            .filter(Boolean)
                            .join(" · ") || "Fiche à compléter"}
                        </p>
                      </div>
                    </div>
                  </Link>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-dark dark:bg-accent/25 dark:text-accent-bright">
                      <Check className="size-3.5" aria-hidden />
                      Actif
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="min-h-11 rounded-xl border border-ink-200 px-3 text-sm font-semibold text-ink-800 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-ink-500 dark:text-ink-100 dark:hover:bg-ink-800"
                      onClick={() => {
                        void setActiveVehicle
                          .mutateAsync(item.id)
                          .then(() =>
                            toast.success(`Suivi : ${item.label}`),
                          )
                          .catch((err: unknown) =>
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : "Changement impossible",
                            ),
                          );
                      }}
                    >
                      Suivre
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
