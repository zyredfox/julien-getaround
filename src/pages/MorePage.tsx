import { Link } from "react-router-dom";
import {
  Car,
  LogOut,
  Moon,
  Percent,
  Rows3,
  Sun,
} from "lucide-react";
import { Seo } from "@/components/Seo";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { useUiPrefs } from "@/hooks/useUiPrefs";

export function MorePage() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const { theme, density, toggleTheme, toggleDensity } = useUiPrefs();

  return (
    <div className="space-y-4">
      <Seo title="Plus" />
      <h1 className="page-title font-display text-2xl text-ink-900 dark:text-ink-50">
        Plus
      </h1>
      <p className="text-sm text-ink-500 dark:text-ink-300">
        Connecté : {user?.email}
      </p>

      <section
        className="panel space-y-2 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-ink-200 dark:bg-ink-900 dark:ring-ink-700"
        aria-label="Affichage"
      >
        <h2 className="px-1 text-sm font-semibold text-ink-700 dark:text-ink-200">
          Affichage
        </h2>
        <button
          type="button"
          onClick={() => {
            toggleTheme();
            toast.success(
              theme === "dark" ? "Mode clair activé." : "Mode sombre activé.",
            );
          }}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-ink-800 bg-white px-4 text-left font-semibold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:border-ink-500 dark:bg-ink-950 dark:text-ink-50"
          aria-pressed={theme === "dark"}
        >
          {theme === "dark" ? (
            <Sun className="size-5 text-accent-bright" aria-hidden />
          ) : (
            <Moon className="size-5 text-accent-dark" aria-hidden />
          )}
          <span className="flex-1">
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </span>
          <span className="text-xs font-medium text-ink-500 dark:text-ink-300">
            {theme === "dark" ? "Activé" : "Désactivé"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            toggleDensity();
            toast.success(
              density === "compact"
                ? "Densité confortable."
                : "Densité compacte.",
            );
          }}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-ink-800 bg-white px-4 text-left font-semibold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:border-ink-500 dark:bg-ink-950 dark:text-ink-50"
          aria-pressed={density === "compact"}
        >
          <Rows3 className="size-5 text-accent-dark dark:text-accent-bright" aria-hidden />
          <span className="flex-1">
            {density === "compact" ? "Densité confortable" : "Densité compacte"}
          </span>
          <span className="text-xs font-medium text-ink-500 dark:text-ink-300">
            {density === "compact" ? "Compact" : "Normal"}
          </span>
        </button>
      </section>

      <nav className="space-y-2" aria-label="Actions">
        <Link
          to="/getaround/vehicules"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ink-800 bg-white px-4 font-semibold text-ink-900 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:border-ink-500 dark:bg-ink-900 dark:text-ink-50"
        >
          <Car className="size-5 text-accent-dark dark:text-accent-bright" aria-hidden />
          Mes véhicules
        </Link>
        <Link
          to="/getaround/impots"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ink-800 bg-white px-4 font-semibold text-ink-900 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 dark:border-ink-500 dark:bg-ink-900 dark:text-ink-50"
        >
          <Percent className="size-5 text-accent-dark dark:text-accent-bright" aria-hidden />
          Impôts (estimation)
        </Link>
        <button
          type="button"
          onClick={() => {
            void signOut().then(() => toast.success("Déconnecté."));
          }}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-red-700 bg-red-50 px-4 text-left font-semibold text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:bg-red-950/40 dark:text-red-200"
        >
          <LogOut className="size-5" aria-hidden />
          Se déconnecter
        </button>
      </nav>
    </div>
  );
}
