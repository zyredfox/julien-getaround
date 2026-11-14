import { Link } from "react-router-dom";
import { Car, LogOut, Percent } from "lucide-react";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/hooks/useAuth";

export function MorePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4">
      <Seo title="Plus" />
      <h1 className="font-display text-2xl">Plus</h1>
      <p className="text-sm text-ink-500">Connecté : {user?.email}</p>

      <nav className="space-y-2" aria-label="Actions">
        <Link
          to="/vehicule"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ink-800 bg-white px-4 font-semibold text-ink-900 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900"
        >
          <Car className="size-5 text-accent-dark" aria-hidden />
          Véhicule
        </Link>
        <Link
          to="/impots"
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ink-800 bg-white px-4 font-semibold text-ink-900 shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900"
        >
          <Percent className="size-5 text-accent-dark" aria-hidden />
          Impôts (estimation)
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 border-red-700 bg-red-50 px-4 text-left font-semibold text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          <LogOut className="size-5" aria-hidden />
          Se déconnecter
        </button>
      </nav>
    </div>
  );
}
