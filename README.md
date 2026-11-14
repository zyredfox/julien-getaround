# Julien Getaround

App privée (PC + mobile) pour suivre locations Getaround, dépenses, bilan graphique et estimation d’impôts indicative.

Voir le cadrage complet : [`BRIEF-PROJET.md`](./BRIEF-PROJET.md).

## Stack

- Vite + React + TypeScript + Tailwind
- Supabase (Auth email/mot de passe + Postgres + RLS) — **projet dédié**, isolé de Sainte-Barbe
- React Query, React Router, Recharts

## Démarrage

```bash
npm install
cp .env.example .env.local
# renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

Port local : `5175` (`host: true` → URL Network affichée).

## Premier compte

1. Ouvre l’app → **Créer mon compte** (email + mot de passe)
2. À la première connexion, un espace Getaround + véhicule + paramètres fiscaux sont créés automatiquement

## Sécurité

- Toutes les pages sont en `noindex`
- RLS : chaque ligne n’est accessible qu’au `owner_id` = `auth.uid()`
- Ne jamais committer `.env.local`
