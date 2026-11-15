# Architecture multi-espaces — Getaround · PEA · (crypto plus tard)

Document de structure produit / technique. Objectif : **une app patrimoniale**, avec **un module métier par espace**, et **un hub central** qui agrège tout.

---

## 1. Intention

Tu veux pouvoir :

1. Gérer **Getaround** (locations, dépenses, amortissement, impôts micro) comme aujourd’hui  
2. Gérer un **PEA** (lignes, quantités, cours, valorisation)  
3. Plus tard : **crypto** ou autre  
4. Et surtout voir **en un coup d’œil** : combien ça représente **au total**, et la **répartition** entre espaces

Donc : **pas un seul god-formulaire**, mais **plusieurs espaces spécialisés** + **une couche “Portefeuille”** au-dessus.

```
┌─────────────────────────────────────────────┐
│  PORTEFEUILLE (hub)                         │
│  Total · répartition · évolution globale    │
└───────────────┬─────────────────────────────┘
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
 Getaround     PEA       Crypto
 (actuel)    (V2)       (V3+)
```

---

## 2. Navigation proposée

### 2.1 Niveau app (toujours visible)

| Zone | Rôle |
|------|------|
| **Portefeuille** | Hub central (agrégat) |
| **Espaces** | Switcher : Getaround · PEA · … |
| **Plus** | Compte, thème, paramètres globaux |

Sur mobile, bottom nav évolue vers quelque chose du type :

`Portefeuille` · `Espace actif` · `Plus`

Ou plus clairement :

`Total` · `Getaround` · `PEA` · `Plus`

### 2.2 Dans chaque espace (nav locale)

**Espace Getaround** (déjà en place)  
- Bilan · Locations · Dépenses · Impôts · Véhicules  

**Espace PEA** (cible)  
- Vue · Positions · Mouvements · Paramètres  

**Espace Crypto** (plus tard)  
- Vue · Positions · Mouvements  

L’idée : chaque espace a **ses écrans et sa logique**, mais le même shell (auth, thème, toasts, allowlist).

### 2.3 Routes (cible)

```
/                     → Portefeuille (hub)
/getaround            → Bilan Getaround (actuel `/`)
/getaround/locations
/getaround/depenses
/getaround/impots
/getaround/vehicules
/pea                  → Vue PEA
/pea/positions
/pea/mouvements
/crypto               → (V3)
/plus
/login
```

Migration douce : l’actuel `/` peut rediriger un temps vers `/getaround`, puis devenir le hub.

---

## 3. Modèle de données

### 3.1 Principe

Tout appartient à un **`space`** (portefeuille métier) d’un **owner** (toi).

```
auth.users
   └── spaces              (type: getaround | pea | crypto)
         ├── vehicles      (Getaround)
         │     ├── rentals
         │     └── expenses
         ├── tax_settings  (Getaround / fiscalité liée)
         ├── pea_positions (PEA)
         └── pea_movements (achats / ventes / versements)
```

Aujourd’hui : bootstrap crée déjà un space + véhicule. On **généralise** plutôt que de tout casser.

### 3.2 Table `spaces` (cœur)

| Champ | Exemple |
|-------|---------|
| `id` | uuid |
| `owner_id` | auth.uid |
| `type` | `getaround` \| `pea` \| `crypto` |
| `label` | `Renault Captur` / `PEA Boursorama` |
| `currency` | `EUR` |
| `is_active` | bool (espace affiché dans le hub) |
| `sort_order` | int |

Un user peut avoir **plusieurs** spaces du même type plus tard (2 voitures Getaround déjà gérées via `vehicles` ; un 2e PEA éventuellement).

### 3.3 PEA — tables métier

**`pea_positions`** (ligne de portefeuille)

| Champ | Rôle |
|-------|------|
| `space_id` | PEA concerné |
| `ticker` | ex. `CW8.PA`, `PE500.PA` |
| `isin` | optionnel, plus fiable pour EU |
| `label` | nom affiché (ex. « Amundi S&P 500 ») |
| `quantity` | nombre de parts |
| `avg_cost` | PRU (€) |
| `currency` | EUR |
| `notes` | libre |

**`pea_movements`** (historique, optionnel V2.1)

| Champ | Rôle |
|-------|------|
| `space_id` | |
| `position_id` | nullable si versement cash |
| `kind` | `buy` \| `sell` \| `deposit` \| `withdraw` \| `dividend` |
| `quantity` | |
| `unit_price` | |
| `fees` | |
| `occurred_on` | date |

**Valorisation live / EOD** : **pas stockée en source de vérité** (ou seulement en cache).

| Cache | Rôle |
|-------|------|
| `market_quotes` | `symbol`, `price`, `as_of`, `source` |

Recalcul : `valeur = quantity × last_price`.

### 3.4 Hub — ce qu’on agrège (pas une table “magique”)

Le hub calcule à la volée :

| Source | Valeur hub |
|--------|------------|
| Getaround | cash net période **ou** valeur économique simplifiée (paramétrable) |
| PEA | Σ (qty × cours) |
| Crypto | Σ (qty × cours) |

Affichages hub :

1. **Total patrimonial** (€)  
2. **Camembert / barres** : part Getaround / PEA / Crypto  
3. **Cartes** cliquables → entrer dans l’espace  
4. Option : variation 1j / 1m (surtout PEA/crypto)

---

## 4. PEA + cours de marché

### 4.1 UX saisie

1. L’utilisateur ajoute une position : ticker / ISIN + quantité (+ PRU)  
2. L’app résout le symbole (recherche)  
3. Un job / fetch récupère le **cours EOD ou delayed**  
4. L’écran affiche valeur, +/- latent, poids dans le PEA  

Exemple : « S&P 500 » → en pratique un **ETF éligible PEA** (`CW8.PA`, etc.), pas l’indice nu.

### 4.2 Couche API (front → Edge Function)

Ne pas appeler les providers directement depuis le navigateur avec une clé exposée si possible.

```
App → Supabase Edge Function `market-quote`
         → Finnhub / Alpha Vantage / Twelve Data / …
         → cache `market_quotes`
```

**Recommandation V2 perso :**

- Prix **EOD / delayed** (suffisant pour un bilan)  
- Cache **≥ 15 min** (voire 1× / jour boursier)  
- Fallback : saisie manuelle du cours  

### 4.3 Ce qu’on n’essaie pas en V2

- Trading  
- Ordres broker  
- Sync Boursorama / Fortuneo automatique  
- Fiscalité PEA détaillée (abattement durée, etc.) — disclaimer + hors scope au début  

---

## 5. Structure dossiers front (cible)

```
src/
  config/site.ts
  spaces/
    types.ts                 # SpaceType, SpaceSummary
    registry.ts              # métadonnées : label, icon, routes, couleur
  pages/
    portfolio/
      PortfolioHomePage.tsx  # HUB
    getaround/
      BilanPage.tsx
      RentalsPage.tsx
      ExpensesPage.tsx
      TaxesPage.tsx
      VehiclesPage.tsx
    pea/
      PeaHomePage.tsx
      PeaPositionsPage.tsx
      PeaMovementsPage.tsx
  hooks/
    usePortfolio.ts          # agrégat multi-espaces
    usePeaPositions.ts
    useMarketQuote.ts
  layouts/
    AppLayout.tsx            # shell + switcher d’espace
    SpaceLayout.tsx          # nav locale selon space.type
```

`registry.ts` permet d’ajouter un espace sans réécrire la nav :

```ts
{
  type: "pea",
  label: "PEA",
  path: "/pea",
  color: "...",
  nav: [
    { to: "/pea", label: "Vue" },
    { to: "/pea/positions", label: "Positions" },
  ],
}
```

---

## 6. UX du hub (écran Portefeuille)

Composition proposée (une section = un job) :

1. **Titre marque / “Portefeuille”**  
2. **Montant total** + courte phrase (“tous espaces”)  
3. **Répartition** (barres ou donut) Getaround / PEA / …  
4. **Liste des espaces** : carte cliquable avec valeur + % du total  
5. Pas de détail métier ici (pas de liste de locations ni d’ordres)

Entrer dans une carte = bascule vers la nav de l’espace.

---

## 7. Règles produit transverses

| Sujet | Règle |
|-------|--------|
| Auth | Allowlist email (déjà en place) |
| Données | 1 projet Supabase dédié, RLS `owner_id` |
| Fiscalité | Par espace (Getaround micro ≠ PEA) ; hub = patrimoine, pas fiscalité globale |
| Disclaimer | Visible sur chaque module sensible |
| Mobile-first | Saisie rapide ; hub lisible en 1 écran |
| Thème | Global (clair / sombre) |

---

## 8. Phasage

### Phase actuelle (fait)
- Espace Getaround complet (locations, dépenses, bilan, impôts, multi-véhicules, thème, allowlist, toasts)

### Phase A — Socle multi-espaces (sans PEA métier)
- Expliciter `spaces.type`
- Introduire route hub `/` + déplacer Getaround sous `/getaround`
- Switcher d’espace dans le layout
- Hub affiche au moins la “valeur” Getaround (ex. cash net YTD ou total économique)

### Phase B — PEA V2
- Tables positions (+ cache quotes)
- Écrans Vue / Positions
- Edge Function cours
- Hub : total Getaround + PEA + % 

### Phase C — Mouvements PEA + historique
- Achats / ventes / versements
- PRU recalculé
- Graph valorisation dans le temps

### Phase D — Crypto (même pattern que PEA)
- Nouveau `space.type = crypto`
- Provider de prix différent (ex. CoinGecko)
- Branche hub automatique via registry

---

## 9. Décisions ouvertes (à trancher au moment du build PEA)

1. **Valeur Getaround dans le hub** : cash net année ? valeur véhicule − dette ? hors Getaround (seulement cash activité) ?  
2. **Broker PEA** : un seul space “PEA” au début, ou multi-comptes ?  
3. **Provider de cours** : Finnhub vs autre (quota free, couverture `.PA`)  
4. **Nom produit** : rester “Julien Getaround” ou renommer en marque portefeuille (ex. “Julien Portfolio”) quand le hub arrive ?

---

## 10. Résumé en une phrase

**Un hub “Portefeuille” qui centralise les totaux, et des modules métier séparés (Getaround, PEA, …) qui gardent chacun leur logique, leurs écrans et leur fiscalité — branchés sur le même auth, le même shell, et la même notion de `space`.**
