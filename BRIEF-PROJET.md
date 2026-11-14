# Julien Getaround — Brief projet

Document de cadrage avant développement. Mis à jour après clarification du besoin (dépenses, bilan graphique, estimation d’impôts, vision multi-investissements).

---

## 1. Besoin (version clarifiée)

### Objectif produit

Applis web **privée**, **mobile-first** (PC aussi), pour :

1. Saisir et suivre les **dépenses** liées à la voiture Getaround (assurance, boîtier, pneus/réparations, prix de revient, etc.)
2. Saisir les **revenus de location** (prix / net)
3. Voir un **bilan** clair avec **graphiques** (pas un tableur)
4. **Prévisualiser approximativement** les impôts dus sur le net cumulé
5. Plus tard : élargir vers d’**autres investissements** (PEA, crypto, etc.)

### Pourquoi pas un tableau

Validé : un sheet sur téléphone est **peu pratique** et **désagréable** pour le suivi au fil de l’eau. L’app se justifie par :

- saisie rapide (gros boutons, catégories, 2–3 champs)
- bilan visuel (courbes / barres)
- estimation fiscale lisible
- base pour un futur « portefeuille perso »

### Ce que ce n’est pas

- Pas un site vitrine / SEO (contrairement à Sainte-Barbe, Tata Carotte…)
- Pas un logiciel comptable certifié ni un conseil fiscal
- Pas une sync automatique Getaround en V1

---

## 2. Challenge du besoin

### 2.1 Verdict « tableur vs app »

**Challenge précédent retiré.** Avec saisie mobile + graphs + preview impôts, le custom app a du sens. On ne propose plus Sheets comme alternative principale.

### 2.2 Site public vs outil privé

Inchangé : **app privée**, Auth, `noindex`, RLS stricte. Les rules SEO vitrine du monorepo ne s’appliquent pas telles quelles.

### 2.3 Fiscalité : utile mais dangereuse si mal cadrée

« Prévisualiser les impôts sur mon net cumulé approximatif » est le point le plus risqué du brief.

En France, les revenus de location de véhicule entre particuliers peuvent relever (selon cas) du **micro-BIC**, du **réel**, parfois d’autres traitements — abattements, charges déductibles, CSG/CRDS, etc. Ça change selon situation et année.

**Règles produit imposées :**

- Libellé honnête partout : **« Estimation indicative — ne remplace pas un expert-comptable / impots.gouv »**
- Paramètres **éditables** par l’utilisateur (pas de taux magiques hardcodés sans affichage) :
  - régime simulé : ex. `micro_bic` | `taux_effectif_perso`
  - abattement % (ex. 50 % micro-BIC — valeur par défaut configurable)
  - ou **taux d’imposition effectif** saisi manuellement (ex. 30 %) pour une approx ultra simple
- Base taxable V1 = **net d’activité approximatif** = revenus locations − dépenses saisies (selon règles choisies)
- **Pas** de déclaration préremplie, **pas** de PDF fiscal officiel en V1

**Question ouverte (bloquante pour le moteur fiscal) :**  
Tu veux plutôt :

- **A)** simulateur simple « net × mon taux » (rapide, transparent)  
- **B)** micro-BIC style (abattement forfaitaire sur le brut, charges ignorées côté déductible)  
- **C)** « réel simplifié » (revenus − dépenses = bénéfice, puis × taux)  

Recommandation V1 : **C + curseur de taux** (ou A), avec disclaimer. Le micro-BIC (B) peut être un second scénario comparable côte à côte plus tard.

### 2.4 « Prix de revient » — à définir précisément

Ambiguïté fréquente :

| Sens possible | Traitement proposé |
|---------------|-------------------|
| Prix d’achat / valeur du véhicule | **Actif / coût d’acquisition** sur la fiche véhicule (+ option amortissement linéaire simple pour le bilan « économique ») |
| Coût pour rendre une location possible (prépa, etc.) | **Dépense** liée ou non à une location |
| Coût de revient unitaire (par jour / par km) | **Indicateur calculé**, pas une ligne saisie |

**Proposition V1 :** champ `acquisition_cost` sur le véhicule + dépenses courantes à part. Le dashboard peut montrer :

- marge cash (revenus − dépenses)
- marge « économique » optionnelle (cash − amortissement estimé)

À confirmer lequel tu appelles « prix de revient ».

### 2.5 Catégories de dépenses (figées pour V1)

Alignées sur ton usage réel :

| Clé | Libellé |
|-----|---------|
| `insurance` | Assurance |
| `getaround_box` | Boîtier Getaround |
| `tires_repair` | Pneus / réparation |
| `fuel` | Essence / énergie (utile même si non cité) |
| `platform_fees` | Frais plateforme (si hors ligne location) |
| `cost_basis` | Prix de revient / acquisition (si saisi en dépense plutôt qu’en fiche véhicule) |
| `other` | Autre |

Éviter de **doubler** : boîtier + assurance en dépenses récurrentes ; frais Getaround par trajet plutôt dans la fiche **location** (champ `platform_fees`).

### 2.6 Graphs : lesquels valent le coup en V1

Trop de charts = dashboard inutile. **3 graphs max en V1 :**

1. **Cashflow mensuel** : revenus vs dépenses (barres groupées)
2. **Net cumulé** dans le temps (ligne)
3. **Répartition des dépenses** par catégorie (donut / barres)

Plus tard : occupation, €/km, scénarios d’impôt.

Lib : `recharts` (déjà dans Sainte-Barbe) — OK mobile si hauteur/largeur contrôlées.

### 2.7 Vision PEA / crypto : oui, mais pas dans le même sprint

Élargir vers « tous mes investissements » est cohérent **produit**, dangereux **scope**.

PEA ≠ Getaround ≠ crypto (ordres, plus-values, fiscalité 30 % PFU, valorisations live, etc.).

**Architecture prévue dès V1 (sans coder PEA/crypto) :**

- Notion de **`portfolio` / `space`** (ex. `getaround_car`, plus tard `pea`, `crypto`)
- Toutes les tables métier portent un `space_id` (ou `vehicle_id` reste le premier space concret)
- Navigation future : switcher « Espaces » en haut

**V1 livrée = uniquement l’espace Getaround / véhicule.**  
PEA & crypto = V2+ (nouveaux modules, pas un god-formulaire unique).

### 2.8 Sécurité & données sensibles — **décidé**

Soldes, impôts estimés, plus tard PEA/crypto → données très sensibles.

**Décisions verrouillées :**

- **Nouveau projet Supabase dédié** — **pas** le projet Sainte-Barbe. Isolation totale (URL, clés, Auth, BDD, Storage).
- **Auth obligatoire** dès V1 (pas d’app ouverte même « temporairement »).
- RLS sur toutes les tables métier.
- Pas de `service_role` / secret key dans le front (uniquement clé publishable / `anon` + RLS).
- Pas d’indexation Google (`noindex`, `robots.txt` Disallow).

**Pourquoi isoler de Sainte-Barbe :**

- Surfaces d’attaque et politiques RLS différentes (site public vs finances perso)
- Rotation de clés / incidents sans impact croisé
- Quotas, backups et accès dashboard séparés
- Zéro risque de mélange de schémas ou de fuites via une policy trop large

**Setup attendu :**

1. Créer un projet Supabase neuf (org au choix, nom ex. `julien-getaround`)
2. Activer Auth **email + mot de passe** (pas de magic link comme mode principal)
3. Variables front uniquement : `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` du **nouveau** projet
4. Ne jamais coller les clés Sainte-Barbe dans ce repo

---

## 3. Décisions proposées / verrouillées

| Sujet | Décision | Statut |
|--------|----------|--------|
| Nature | App privée de bilan perso (Getaround d’abord) | Proposé |
| Anti-tableur | UI mobile-first, listes + formulaires courts + graphs | Validé (besoin) |
| Utilisateur | Julien seul (allowlist) | Proposé |
| V1 data | Locations + Dépenses + Véhicule + params fiscaux | Proposé |
| Bilan | KPIs + 3 graphs | Proposé |
| Impôts | Estimation indicative paramétrable + disclaimer | Proposé |
| Multi-invest | Anticipé en modèle (`space`), **non livré** en V1 | Proposé |
| Saisie | Manuelle | Proposé |
| **Supabase** | **Nouveau projet dédié, isolé de Sainte-Barbe** | **Validé** |
| **Auth** | **Obligatoire — email + mot de passe** | **Validé** |
| Stack | Vite React TS + Tailwind + Supabase + React Query + Recharts | Proposé |
| SEO | `noindex` | Proposé |

---

## 4. Stack technique (alignée monorepo)

| Couche | Choix |
|--------|--------|
| Build | Vite (`server.host: true`) |
| UI | React + TypeScript strict + Tailwind |
| Charts | `recharts` |
| Routing | `react-router-dom` |
| Head | `react-helmet-async` (`noindex`) |
| Data | `@supabase/supabase-js` + `@tanstack/react-query` |
| Forms | `react-hook-form` + `zod` |
| Dates | `date-fns` (`fr`) |
| Deploy | Netlify + `_redirects` SPA |
| Env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### Structure

```text
src/
  config/           # siteConfig allégé + taxDefaults (paramètres indicatifs)
  pages/            # Login, Dashboard, Locations, Dépenses, Véhicule, Impôts
  layouts/          # App shell (bottom nav mobile)
  components/
    charts/         # Cashflow, NetCumulé, DépensesParCatégorie
    forms/
  hooks/            # useRentals, useExpenses, useBilan, useTaxEstimate
  lib/              # money, taxEstimate, amortization (simple)
  integrations/supabase/
```

### Rules monorepo

| Rule | Application |
|------|-------------|
| `core-structure-naming` | Oui |
| `vite-dev-server-network` | Oui |
| `data-fetching-react-query-supabase` | Oui |
| `accessibility-aa-minimum` / `accessibility-nav-a11y` | Oui |
| `site-config-single-source-of-truth` | Oui (allégé) |
| SEO / sitemap vitrine | **Adapté** : noindex, pas de SEO marketing |
| `performance-routes-images-thirdparty` | Oui (lazy routes + charts) |

---

## 5. Modèle de données V1

### `spaces` (prépare la suite PEA/crypto)

| Colonne | Type | Notes |
|---------|------|--------|
| id | uuid PK | |
| owner_id | uuid | |
| kind | text | `getaround` \| (futur `pea`, `crypto`…) |
| name | text | |
| created_at | timestamptz | |

V1 : un seul space `getaround` créé à l’onboarding.

### `vehicles`

| Colonne | Type | Notes |
|---------|------|--------|
| id | uuid PK | |
| space_id | uuid FK | |
| owner_id | uuid | |
| label | text | |
| plate | text? | |
| make_model | text? | |
| acquisition_cost | numeric? | prix d’achat / prix de revient véhicule |
| acquisition_on | date? | |
| amort_months | int? | optionnel, ex. 60 mois |
| active_from | date? | |
| created_at | timestamptz | |

### `rentals`

| Colonne | Type | Notes |
|---------|------|--------|
| id | uuid PK | |
| vehicle_id | uuid FK | |
| owner_id | uuid | |
| start_at | timestamptz | |
| end_at | timestamptz | |
| gross_amount | numeric | |
| platform_fees | numeric | default 0 |
| net_amount | numeric | perçu / calculé |
| notes | text? | |
| created_at | timestamptz | |

### `expenses`

| Colonne | Type | Notes |
|---------|------|--------|
| id | uuid PK | |
| vehicle_id | uuid FK | |
| owner_id | uuid | |
| spent_on | date | |
| category | text | voir §2.5 |
| amount | numeric | |
| notes | text? | |
| created_at | timestamptz | |

### `tax_settings` (1 ligne / user ou / space)

| Colonne | Type | Notes |
|---------|------|--------|
| owner_id | uuid | |
| space_id | uuid | |
| mode | text | `flat_rate` \| `simplified_real` \| `micro_bic_like` |
| flat_rate_percent | numeric? | ex. 30 |
| micro_allowance_percent | numeric? | ex. 50 |
| notes | text? | rappel perso |

### Formules V1 (indicatif)

```text
revenus_nets = Σ rentals.net_amount
depenses     = Σ expenses.amount
cash_net     = revenus_nets − depenses

si mode = simplified_real :
  base ≈ max(cash_net, 0)
  impot_estimé ≈ base × flat_rate_percent / 100

si mode = micro_bic_like :
  base ≈ Σ gross_amount × (1 − micro_allowance_percent/100)
  impot_estimé ≈ base × flat_rate_percent / 100   # ou taux séparé

si mode = flat_rate :
  impot_estimé ≈ max(cash_net, 0) × flat_rate_percent / 100

net_après_impôt_approx = cash_net − impot_estimé
```

Amortissement optionnel (bilan économique) :

```text
amort_mensuel = acquisition_cost / amort_months
```

### Sécurité

RLS sur toutes les tables : `auth.uid() = owner_id`. Pas d’accès `anon` métier.

---

## 6. Écrans V1

1. **Login**
2. **Bilan (home)** — KPIs + 3 graphs + période (mois / année / custom)
3. **Locations** — CRUD mobile-first
4. **Dépenses** — CRUD + catégories (assurance, boîtier, pneus/réparations…)
5. **Impôts** — paramètres + estimation + disclaimer
6. **Véhicule** — fiche + prix d’acquisition
7. Déconnexion

Nav mobile basse : **Bilan · Locations · Dépenses · Plus** (Impôts / Véhicule).

---

## 7. Critères de succès V1

- [ ] Saisie dépense ou location sur téléphone en &lt; 30 s
- [ ] Bilan année / mois : revenus, dépenses, cash net, estimation d’impôt, net après impôt approx
- [ ] 3 graphs lisibles sur mobile
- [ ] Catégories : assurance, boîtier, pneus/réparation (+ autres listées)
- [ ] Disclaimer fiscal visible
- [ ] Auth + RLS OK
- [ ] Aucune indexation publique

---

## 8. Hors scope V1

- Sync API Getaround
- PEA / crypto (modules)
- Upload factures
- Déclaration fiscale réelle / export CERFA
- Multi-utilisateurs
- Valorisations marché live
- PWA offline complète
- SEO marketing

---

## 9. Roadmap courte

| Phase | Contenu |
|-------|---------|
| **V1** | Getaround : CRUD + bilan + graphs + estimation impôt |
| **V1.1** | Export CSV, amortissement affiché, 2e scénario fiscal comparable |
| **V2** | Nouvel espace « Investissements » (PEA manuel : versements / valorisation) |
| **V3** | Crypto (wallets / lots) — modèle et fiscalité dédiés |

---

## 10. Questions à valider avant de coder

**Déjà tranché :** nouveau projet Supabase isolé ≠ Sainte-Barbe · Auth email + **mot de passe**.

1. **Impôts V1** : mode A (taux simple), B (micro-like), ou C (réel simplifié) — défaut recommandé **C + taux** ?
2. **Prix de revient** = prix d’achat véhicule sur la fiche, ou catégorie de dépense, ou les deux ?
3. Frais Getaround : plutôt dans chaque **location** (`platform_fees`) ?
4. Taux d’impôt indicatif de départ (ex. 30 %) ?
5. Nom de l’app / URL ?
6. Allowlist : un seul email autorisé dès le départ (lequel) ?

---

## 11. Plan d’action V1

Objectif : livrer une app utilisable sur téléphone (saisie + bilan + graphs + estimation d’impôt), avec Auth et BDD Supabase **isolée**.

**Defaults si §10 pas encore répondu** (pour ne pas bloquer) :

| Sujet | Default provisoire |
|--------|-------------------|
| Mode fiscal | `simplified_real` + taux éditable (défaut 30 %) |
| Prix de revient | `acquisition_cost` sur fiche véhicule (+ catégorie dépense dispo) |
| Frais Getaround | champ `platform_fees` sur chaque location |
| Nom app | `Julien Getaround` (renommable via `siteConfig`) |

---

### Phase 0 — Prérequis (toi + agent)

- [x] Créer le **projet Supabase neuf** `julien-getaround` (eu-west-3) — **pas** Sainte-Barbe
- [x] Auth : Email + **mot de passe** (signup dispo pour créer le 1er compte)
- [ ] Créer ton compte via l’écran Login → « Créer mon compte »
- [x] `Project URL` + `anon key` → `.env.local` (non versionné)
- [ ] Décider domaine / hébergeur (Netlify par défaut)

---

### Phase 1 — Scaffold front (aligné monorepo)

- [x] Vite React TS dans `julien-getaround`
- [x] Tailwind + alias `@/`
- [x] Router, Helmet, React Query, Supabase, date-fns, recharts, lucide
- [x] `vite.config` : `host: true`, port `5175`
- [x] `src/config/site.ts`
- [x] Structure dossiers monorepo
- [x] `.env.example` + `robots.txt` Disallow + `_redirects`

---

### Phase 2 — Auth + shell app

- [x] Client Supabase
- [x] AuthProvider + session
- [x] Page Login (email + mot de passe + création compte)
- [x] Route guard
- [x] Layout bottom nav (Bilan · Locations · Dépenses · Plus)
- [x] Déconnexion
- [x] Helmet `noindex, nofollow`
- [ ] Allowlist email stricte (optionnel V1.1)

---

### Phase 3 — Schéma Supabase + RLS

- [x] Migration appliquée sur le projet dédié
- [x] Tables `spaces`, `vehicles`, `rentals`, `expenses`, `tax_settings`
- [x] RLS `auth.uid() = owner_id`
- [x] Bootstrap à la 1ère connexion (space + véhicule + tax_settings)
- [x] `types.ts`
- [ ] Vérif manuelle « autre user = 0 ligne » après création compte

---

### Phase 4 — CRUD métier (mobile-first)

- [x] Hooks React Query + mutations
- [x] Locations CRUD
- [x] Dépenses CRUD + catégories
- [x] Véhicule + `acquisition_cost`
- [x] Formulaires mobile (cibles ~44px, labels)
- [ ] Toasts dédiés (messages inline pour l’instant)

---

### Phase 5 — Bilan + graphiques

- [x] `useBilan` + période mois / année / tout
- [x] KPIs
- [x] 3 graphs (cashflow, cumulé, catégories)
- [x] États vides

---

### Phase 6 — Estimation d’impôts

- [x] Page Impôts + `tax_settings`
- [x] Mode défaut réel simplifié + taux 30 %
- [x] Affichage base / impôt / net après impôt
- [x] Disclaimer
- [x] Carte estimation sur le Bilan

---

### Phase 7 — Qualité + déploiement

- [x] Build `tsc` + vite OK
- [ ] Passe a11y / usage réel téléphone
- [ ] Déployer Netlify + env du projet isolé
- [ ] Redirect URLs Auth Supabase (prod + localhost)
- [ ] Smoke test prod
- [x] Brief mis à jour (cette section)

---

### Phase 8 — Hors V1 (backlog immédiat après)

- [ ] Export CSV
- [ ] 2e scénario fiscal comparable (micro-like)
- [ ] Import CSV Getaround
- [ ] Espaces PEA / crypto (V2+)

---

### Ordre d’exécution recommandé

```text
0 Prérequis Supabase
  → 1 Scaffold
  → 2 Auth + shell
  → 3 Migrations + RLS
  → 4 CRUD
  → 5 Bilan / graphs
  → 6 Impôts
  → 7 Deploy
```

Phases 1 et 0 peuvent démarrer en parallèle (scaffold pendant que le projet Supabase est créé).  
Phases 4–6 sont séquentielles après Auth + schéma.

---

### Prochaine action concrète

1. Créer le projet Supabase `julien-getaround` + user Auth (mdp)
2. Lancer la **Phase 1** (scaffold) dans ce repo

---

## 12. Verdict

Le besoin est **solide** : suivi Getaround orienté **bilan visuel + estimation fiscale**, justifié face au tableur mobile.

Garde-fous :

1. **Impôts = estimation paramétrable**, jamais « le montant exact à payer ».
2. **V1 = voiture Getaround only** ; PEA/crypto = espaces futurs, pas du scope immédiat.
3. **Infra :** Supabase neuf + Auth mdp — isolé de Sainte-Barbe.

Le plan d’action §11 est la feuille de route d’exécution.
)
