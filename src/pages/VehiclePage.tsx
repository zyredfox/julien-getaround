import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { VehicleForm } from "@/components/VehicleForm";
import { useWorkspace } from "@/hooks/useWorkspace";

export function VehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    vehicles,
    vehicle: activeVehicle,
    createVehicle,
    updateVehicle,
    setActiveVehicle,
  } = useWorkspace();

  const isNew = id === "nouveau";
  const current = isNew ? null : vehicles.find((item) => item.id === id);

  if (!isNew && id && vehicles.length > 0 && !current) {
    return <Navigate to="/getaround/vehicules" replace />;
  }

  return (
    <div className="space-y-4">
      <Seo title={isNew ? "Nouveau véhicule" : current?.label ?? "Véhicule"} />
      <div className="flex items-center gap-3">
        <Link
          to="/getaround/vehicules"
          className="grid size-11 place-items-center rounded-xl bg-white text-ink-800 shadow-soft ring-1 ring-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:bg-ink-900 dark:text-ink-100 dark:ring-ink-600"
          aria-label="Retour aux véhicules"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <div>
          <h1 className="page-title font-display text-2xl text-ink-900 dark:text-ink-50">
            {isNew ? "Nouveau véhicule" : (current?.label ?? "Véhicule")}
          </h1>
          {!isNew && current && activeVehicle?.id === current.id ? (
            <p className="text-sm text-accent-dark dark:text-accent-bright">
              Suivi actif sur ce véhicule
            </p>
          ) : null}
        </div>
      </div>

      {!isNew && current && activeVehicle?.id !== current.id ? (
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => {
            void setActiveVehicle
              .mutateAsync(current.id)
              .then(() => toast.success(`Suivi : ${current.label}`))
              .catch((err: unknown) =>
                toast.error(
                  err instanceof Error ? err.message : "Changement impossible",
                ),
              );
          }}
        >
          Utiliser pour le suivi
        </button>
      ) : null}

      <VehicleForm
        initial={current}
        submitLabel={isNew ? "Créer le véhicule" : "Enregistrer"}
        onSubmit={async (input) => {
          if (isNew) {
            const created = await createVehicle.mutateAsync(input);
            navigate(`/getaround/vehicules/${created.id}`, { replace: true });
            return;
          }
          if (!current) throw new Error("Véhicule introuvable");
          await updateVehicle.mutateAsync({ id: current.id, ...input });
        }}
      />
    </div>
  );
}
