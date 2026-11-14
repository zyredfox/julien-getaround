import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Car } from "lucide-react";
import { Seo } from "@/components/Seo";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      const message =
        mode === "login"
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password);
      if (message) {
        setError(message);
      } else if (mode === "signup") {
        setInfo(
          "Compte créé. Si la confirmation email est activée, vérifie ta boîte mail, sinon tu peux te connecter.",
        );
        setMode("login");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell grid min-h-dvh place-items-center px-4">
      <Seo title="Connexion" />
      <div className="anim-fade-up w-full max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-lift ring-1 ring-ink-100">
        <div className="relative bg-ink-950 px-6 py-7 text-white">
          <div
            className="pointer-events-none absolute -right-6 -top-8 size-36 rounded-full bg-accent/40 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 left-8 size-28 rounded-full bg-signal/30 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-3">
            <div className="brand-mark" aria-hidden>
              <Car className="size-5" />
            </div>
            <div>
              <p className="font-display text-3xl tracking-tight">
                {siteConfig.siteName}
              </p>
              <p className="mt-1 text-sm text-ink-300">{siteConfig.siteTagline}</p>
            </div>
          </div>
        </div>

        <form className="space-y-4 p-6" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink-800">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 text-ink-900 outline-none ring-accent focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-ink-800"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full min-h-11 rounded-xl border border-ink-100 bg-ink-50 px-3 text-ink-900 outline-none ring-accent focus:ring-2"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="text-sm text-accent-dark" role="status">
              {info}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-4 font-semibold text-white transition hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
          >
            {submitting
              ? "Patiente…"
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>

        <button
          type="button"
          className="min-h-11 w-full px-6 pb-5 text-sm font-medium text-ink-600 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={() => {
            setMode((current) => (current === "login" ? "signup" : "login"));
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "login"
            ? "Pas encore de compte ? Créer mon compte"
            : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  );
}
