# CLAUDE.md — fortunashop

> Ce fichier est lu automatiquement par Claude Code au démarrage.
> Dernière mise à jour : 29 avril 2026

---

## Identité du projet

**Produit** : fortunashop — infrastructure e-commerce clé en main pour artisans
**Marque mère** : Fortuna Digital (SAS en cours d'immatriculation)
**Promesse** : Boutique en ligne pro livrée en 7 jours. Le client envoie ses photos sur WhatsApp. fortunashop fait tout le reste.
**Marché** : Côte d'Ivoire (prioritaire), diaspora CI en France (secondaire)
**Domaine** : fortunashop.fr

---

## Stack technique

| Élément | Valeur |
|---------|--------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Backend / BDD | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Déploiement | Vercel (prod) |
| Domaine | fortunashop.fr (DNS OVH) |
| IA | Claude Haiku (claude-haiku-4-5) pour recommandations |
| Paiement | CinetPay Business API (KYC en cours) |
| GitHub | github.com/frederickkonan92/fortunashop |

---

## Variables d'environnement

Requises dans `.env.local` ET dans Vercel :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `BREVO_API_KEY` — clé API Brevo pour l'envoi d'emails de notification leads

---

## Arborescence du projet

```
app/
├── page.tsx                              # Landing page (pricing, add-ons, formulaire)
├── layout.tsx                            # Layout racine
├── api/recommendations/route.ts          # API IA Claude Haiku
├── admin/
│   ├── page.tsx                          # Redirection admin
│   ├── layout.tsx                        # Layout admin
│   ├── nav.tsx                           # Navigation admin
│   ├── login/page.tsx                    # Login artisan
│   ├── dashboard/page.tsx                # Dashboard KPIs (Starter/Pro/Premium)
│   ├── produits/page.tsx                 # Gestion produits + variantes
│   ├── ventes/page.tsx                   # Ventes physiques
│   ├── livreurs/page.tsx                 # Gestion livreurs
│   └── support-button.tsx               # Bouton support WhatsApp
├── boutique/[slug]/
│   ├── page.tsx                          # Page boutique (charge catalogue)
│   ├── catalogue.tsx                     # Catalogue client + popup variantes
│   ├── commander/page.tsx                # Commande + paiement
│   └── produit/[id]/page.tsx             # Fiche produit + sélecteur variantes
├── livraison/
│   ├── page.tsx                          # Suspense wrapper
│   └── content.tsx                       # Confirmation livraison (token)
└── suivi/
    ├── page.tsx                          # Suspense wrapper
    └── content.tsx                       # Suivi commande client

components/
├── cart.tsx                              # Panier (useCart hook)
└── tracker.tsx                           # Analytics tracker (page_views)

lib/
├── supabase.ts                           # Client Supabase
├── utils.ts                              # formatPrice + utilitaires
└── cinetpay.ts                           # Intégration CinetPay
```

---

## Base de données Supabase

URL : https://hmtxovrqvslhcsscjjdy.supabase.co

### Tables

| Table | Rôle | RLS |
|-------|------|-----|
| shops | Boutiques artisans (slug, plan, addons, phone, etc.) | Oui |
| products | Catalogue (has_variants, stock_buffer, image_url_2/3) | Oui |
| product_variants | Variantes (tailles, couleurs, pointures) | Oui |
| orders | Commandes clients | Oui |
| order_items | Lignes de commande | Oui |
| page_views | Tracking visiteurs | Oui |
| physical_sales | Ventes physiques | Oui |
| catalog_edits | Compteur modifications/mois | Oui |
| livreurs | Livreurs par boutique | Oui |
| delivery_tokens | Liens confirmation livraison | Oui |
| leads | Formulaire landing page | Non (public) |
| ai_recommendations | Recommandations IA cache 24h | Oui |

### Champ important : shops.plan

Valeurs possibles : `'starter'`, `'pro'`, `'premium'`

Détermine les features disponibles (modes de paiement, dashboard, analytics, IA).

### Champ important : shops.addons

Type : `text[]` (tableau PostgreSQL)

Add-ons activés pour une boutique (ex: `['cinetpay', 'analytics']`).

---

## Règles métier — paiement

| Plan | Wave | Orange Money | MTN MoMo | CB Stripe | Espèces |
|------|------|-------------|----------|-----------|---------|
| Starter | natif | addon cinetpay | addon cinetpay | addon stripe | si retrait |
| Pro | natif | natif | natif | addon stripe | si retrait |
| Premium | natif | natif | natif | natif | si retrait |

La logique de filtrage est dans `app/boutique/[slug]/commander/page.tsx`.

---

## Règles métier — dashboard

| Feature | Starter | Pro | Premium |
|---------|---------|-----|---------|
| CA + commandes + top produit | ✅ | ✅ | ✅ |
| Graphique CA 30j | ✅ | ✅ | ✅ |
| CA par mode paiement | ✅ | ✅ | ✅ |
| Analytics (visiteurs, conversion) | ❌ | ✅ | ✅ |
| Prévision IA Claude Haiku | ❌ | ❌ | ✅ |

---

## Règles métier — pricing

| Plan | Mensuel | Annuel | Setup |
|------|---------|--------|-------|
| Starter | 35 000 FCFA | 29 167 FCFA/mois | 100 000 FCFA |
| Pro | 55 000 FCFA | 45 833 FCFA/mois | 100 000 FCFA |
| Premium | 85 000 FCFA | 70 833 FCFA/mois | 100 000 FCFA |

Toggle annuel = 2 mois offerts (10 mois payés).

---

## Add-ons (fonctionnalités à la carte)

Source de vérité : `lib/landing-sections.ts` (`LANDING_ADDONS`)

| Add-on | Prix | Plans | État |
|---|---|---|---|
| Lien livraison livreur | 10 000 FCFA/mois | Starter | ✅ Implémenté |
| Pack Pilotage Dashboard | 15 000 FCFA/mois | Starter | ✅ Implémenté |
| Gestion des stocks | 10 000 FCFA/mois | Starter (natif Pro/Premium) | ✅ Implémenté |
| Bundle Stocks + Dashboard | 20 000 FCFA/mois | Starter | ✅ Implémenté |
| Mobile Money CinetPay | 75 000 FCFA setup | Starter | ⚠️ CinetPay KYC en cours |
| CB internationale Stripe | 90 000 FCFA setup | Starter · Pro | ⚠️ Stripe non intégré |
| Rapport + recommandations IA | 10 000 FCFA/mois | Starter · Pro | ✅ Implémenté (Claude Haiku) |
| Intégration Yango/Uber | 75 000 + 10 000 FCFA | Tous plans | ❌ Non implémenté |
| Produit supplémentaire | 10 000 FCFA/produit | Starter · Pro | ✅ Implémenté |
| Multilingue | 20 000 FCFA setup | Tous plans | ❌ Non implémenté |
| Formation extra | 10 000 FCFA/heure | Tous plans | Service humain |
| Système d'avis clients | 20 000 FCFA setup | Starter | ❌ Non implémenté |
| Codes promo & réductions | 20 000 FCFA setup | Tous plans | ❌ Non implémenté |
| Relance panier abandonné | 35 000 FCFA setup | Starter · Pro | ❌ Non implémenté (KPI seul) |
| Bannière promo dynamique | 15 000 FCFA setup | Tous plans | ❌ Non implémenté |
| Kit Migration communauté | 25 000 FCFA setup | Tous plans | Service humain |

---

## Routes API

| Route | Méthode | Auth | Statut |
|---|---|---|---|
| /api/recommendations | POST | Bearer + Origin + UUID + rate-limit 50/jour | GARDÉE |
| /api/leads | POST | Aucune (public) | PUBLIC — escapeHtml + validation |
| /api/orders | POST | Aucune (public) | PUBLIC — prix serveur + RPC atomique |
| /api/analytics | POST | Aucune (public) | PUBLIC — rate-limit IP 100/min |

Routes publiques intentionnelles : marquées par un commentaire `// PUBLIC ROUTE` en tête de fichier (vérifié par l'invariant `admin-routes-guarded`).

---

## Design system

### Couleurs

| Token | Hex | Usage |
|-------|-----|-------|
| Primary Orange | #DC5014 | CTA, accents, prix |
| Bg Cream | #FDF8F3 | Fond principal |
| Text Dark | #2C1A0E | Texte principal |
| Gray | #7C6C58 | Texte secondaire |
| Green | #2A7A50 | Succès, WhatsApp |
| Border | #DDD0B8 | Bordures |

### Typographie

- Headings : Nunito (font-weight: 800-900)
- Body : Lato (font-weight: 400-600)

### Classes Tailwind custom (tailwind.config.ts)

- `text-fs-orange`, `bg-fs-orange`, `hover:bg-fs-orange-deep`
- `bg-fs-cream`, `bg-fs-cream2`
- `text-fs-ink`, `text-fs-gray`
- `border-fs-border`
- `font-nunito`

---

## Boutiques de test

| Slug | Plan | Notes |
|------|------|-------|
| boutique-test | Starter | Boutique test Starter (pour tests internes) |
| boutique-pro | Pro | Login artisan-pro@test.com |
| kente-fashion-test | Premium | Boutique démo landing (affichée via "Voir la démo") · Addon cinetpay ajouté manuellement |

---

## Conventions de code

### Style général

- `var` au lieu de `const`/`let` (choix du fondateur, respecter)
- `function()` au lieu de `() =>` pour les callbacks
- Pas de TypeScript strict — `any` accepté pour le MVP
- Fichiers en kebab-case, composants en PascalCase

### Next.js App Router

- `useSearchParams()` requiert Suspense : séparer en `page.tsx` (wrapper) + `content.tsx` (composant)
- Utiliser `generateMetadata` pour le SEO dynamique
- Les routes API sont dans `app/api/`

### Supabase

- Client côté client : `lib/supabase.ts` (anon key)
- Service role : uniquement dans les routes API (`SUPABASE_SERVICE_ROLE_KEY`)
- RLS activé sur toutes les tables sensibles

### Formatage prix

Toujours utiliser `formatPrice()` de `lib/utils.ts` pour afficher les prix en FCFA.

---

## Commandes utiles

```bash
# Dev local
npm run dev

# Build production (vérification avant push)
npm run build

# Push en prod (branche main → Vercel auto-deploy)
git add .
git commit -m "description"
git push

# Tester sur preview (branche dev → URL preview Vercel)
git checkout dev
git push
# → Vercel génère une URL preview automatiquement
```

---

## Bugs connus

### Corrections landing — 2026-04-29

- Fix FAQ Q3 : Pro/Premium ont Orange Money + MoMo natifs (pas en addon)
- Fix FAQ Q8 : CB Premium "en cours de déploiement" (pas "disponible")
- Fix stock Pro : gestion des stocks native pour Pro/Premium, addon pour Starter uniquement
- Ajout mention "bientôt" sur features non implémentées (avis clients, relance panier, codes promo, bannière, CB)
- Sitemap : exclusion des boutiques test (`boutique-test`, `boutique-pro`, `kente-fashion-test`) de l'indexation Google
- CLAUDE.md : ajout section Add-ons avec état d'implémentation
- CLAUDE.md : démo landing clarifiée → `kente-fashion-test`

### BUG — Modes de paiement Pro/Premium (RÉSOLU)
- Fichier : `app/boutique/[slug]/commander/page.tsx`
- Problème : Orange Money et MTN MoMo conditionnés à l'addon `cinetpay` au lieu du plan
- Fix : filtrer par `shop.plan` au lieu de `needsAddon`

### BUG — Typo MTN MoMo (RÉSOLU)
- Fichier : `app/boutique/[slug]/commander/page.tsx`
- Problème : `insuctions` au lieu de `instructions` dans `getPaymentInstructions()`

---

## Tâches en cours (backlog priorisé)

### 🔴 Tier 1 — bloquant pour signer un client
1. Fix bug modes paiement Pro/Premium — RÉSOLU (`isCheckoutPaymentModeAllowed` dans `lib/plan-rules.ts`)
2. Test boutique démo en prod
3. Footer lien fortunashop.fr (boucle acquisition)
4. Mentions légales / CGU / Confidentialité

### 🟡 Tier 2 — utile, pas bloquant
5. OG tags + generateMetadata (SEO + aperçu WhatsApp)
6. next/image sur catalogue + fiche produit (perf mobile)
7. Sitemap automatique
8. Page onboarding artisan (4 étapes cochables au premier login)

### ⚪ Tier 3 — reporté
9. CI/CD staging (utiliser Preview Deployments Vercel à la place)
10. Page paiement CinetPay (attendre KYC)
11. VPS OVH IP fixe (attendre 5+ clients)

---

## Règles pour Claude Code

1. **Toujours lire le fichier avant de le modifier.** Ne jamais éditer à l'aveugle.
2. **Lancer `npm run build` après chaque modification** pour vérifier qu'il n'y a pas d'erreur.
3. **Ne modifier QUE ce qui est demandé.** Ne pas refactorer, renommer ou "améliorer" du code qui fonctionne.
4. **Respecter le style existant** : `var`, `function()`, pas de TypeScript strict.
5. **Ne jamais supprimer de commentaires existants** dans le code.
6. **Tester avec les 3 plans** (Starter, Pro, Premium) quand un changement touche la logique par plan.
7. **Expliquer chaque changement** en français, ligne par ligne.
8. **Si un fichier dépasse 500 lignes**, demander confirmation avant de le réécrire entièrement.
9. **Commit messages** : format `type: description` (ex: `fix: modes paiement Pro/Premium`).
10. **Ne jamais toucher aux variables d'environnement** ou aux clés API.

---

## 🛡️ Règles Guardian (obligatoires)

### Règle 1 — Diagnostic avant tout code
Avant toute modification de code, toute évolution ou toute mise à jour, un diagnostic lecture seule de l'existant DOIT être réalisé. Aucun code ne doit être écrit à l'aveugle.

Workflow obligatoire :
1. Lire le CLAUDE.md en entier
2. Exécuter un diagnostic ciblé sur les fichiers concernés (lecture seule, aucune modification)
3. Produire un rapport factuel de l'état actuel
4. Seulement APRÈS le diagnostic : écrire le code

Ce principe s'applique à Claude Opus (stratège), Claude Code (backend) et Cursor (frontend). Aucune exception, même pour les "petits fix".

### Règle 2 — Mise à jour du CLAUDE.md après chaque session
Le CLAUDE.md est la source de vérité vivante du projet. Il DOIT être mis à jour à la fin de chaque session de travail avec :
- Les fichiers créés, modifiés ou supprimés
- Les décisions techniques prises
- Les bugs corrigés
- L'état de la sécurité (routes gardées, tests ajoutés, etc.)

Format de mise à jour : ajouter une entrée dans la section "Historique des sessions" avec la date, les actions effectuées et les fichiers impactés.

### Règle 3 — Mode strict build + tests
Après chaque modification de code :

```bash
npm run build 2>&1 | tee /tmp/build.log
npm run test 2>&1 | tee /tmp/test.log
```

Si l'un des deux échoue → rollback immédiat (`git restore .`). Interdiction absolue de committer du code qui ne build pas ou dont les tests échouent.

### Règle 4 — Workflow 3 IA
- **Claude Opus** : stratégie, specs, prompts, review. Ne touche PAS au code.
- **Claude Code** : backend, logique métier, tests, CI. Exécute les prompts d'Opus.
- **Cursor** : frontend, UI, design. Ne modifie PAS le backend.

Chaque IA fait ce qu'elle fait de mieux, et rien d'autre.

---

## Historique des sessions

### Session 1 Guardian — 2026-04-29 (sécurisation P0)

Actions réalisées :
- ✅ Auth Bearer + Origin check + UUID validation + logging sur `/api/recommendations`
- ✅ Rate-limit global 50 calls/jour sur `/api/recommendations`
- ✅ Suppression `/api/send-lead-email` (doublon non sécurisé avec injection HTML)
- ✅ Mise à jour Next.js 16.1.6 → 16.2.4 (fix CVE high)
- ✅ Branch protection GitHub activée (`enforce_admins: true`, required check : `check`)
- ✅ CI workflow poussé sur GitHub (`.github/` retiré du `.gitignore`)
- ✅ PR #1 mergée (schéma Supabase + audit RLS + doc sécurité)
- ✅ Audit RLS : 14/14 tables avec RLS activé et policies en place
- ⚠️ Dump schéma Supabase : `supabase init` + `config.toml` créés, mais `db dump` nécessite Docker (skippé volontairement)

Fichiers impactés :
- `app/api/recommendations/route.ts` (M) — +98 lignes sécurité
- `app/api/send-lead-email/route.ts` (D) — supprimé
- `components/ai-recommendations.tsx` (M) — header `Authorization` ajouté
- `tests/api/recommendations-smoke.test.ts` (M) — header `origin` ajouté
- `package.json` (M) — `next ^16.2.4`
- `.gitignore` (M) — `.github/` retiré
- `.github/workflows/ci.yml` (A) — poussé sur GitHub
- `docs/security-status.md` (A) — état de sécurité documenté
- `docs/rls-audit-2026-04-29.md` (A) — résultat audit RLS
- `docs/rls-audit-query.sql` (A) — requête SQL pour audit manuel
- `supabase/config.toml` (A) — config CLI Supabase

Décisions techniques :
- Séparation client USER (anon + Bearer) vs ADMIN (service role) dans les routes API
- Rate-limit en mémoire (`globalThis`) documenté comme limitation Vercel serverless
- Routes publiques intentionnelles marquées avec commentaire `// PUBLIC ROUTE`
- `required_approving_review_count: 0` (solo founder, pas de review obligatoire)

### Session 2 Guardian — 2026-04-29 (tests d'invariants)

Actions réalisées :
- ✅ Suppression `app/boutique/[slug]/paiement.tsx` orphelin (logique gating incorrecte, 0 import)
- ✅ Création dossier `tests/unit/invariants/` (couvert par le pattern Vitest existant)
- ✅ Invariant `payment-gating-single-source.test.ts` (7 tests) — empêche la régression du bug Orange Money/MoMo
- ✅ Invariant `admin-routes-guarded.test.ts` (3 tests) — empêche une route service role sans guard
- ✅ Invariant `variants-restock-coherence.test.ts` (5 tests) — vérifie restock parent + variante à l'annulation
- ✅ Marqueurs `// PUBLIC ROUTE` ajoutés en tête de `leads`, `orders`, `analytics`
- ✅ PR #2 mergée (44 tests passent : 29 existants + 15 nouveaux)

Fichiers impactés :
- `app/boutique/[slug]/paiement.tsx` (D) — supprimé (-36 lignes)
- `app/api/leads/route.ts` (M) — commentaire `// PUBLIC ROUTE`
- `app/api/orders/route.ts` (M) — commentaire `// PUBLIC ROUTE`
- `app/api/analytics/route.ts` (M) — commentaire `// PUBLIC ROUTE`
- `tests/unit/invariants/payment-gating-single-source.test.ts` (A) — 7 tests
- `tests/unit/invariants/admin-routes-guarded.test.ts` (A) — 3 tests
- `tests/unit/invariants/variants-restock-coherence.test.ts` (A) — 5 tests

Décisions techniques :
- Invariants par analyse statique (lecture du source code) plutôt que par mock — pas de dépendance Supabase
- Le pattern `tests/**/*.test.ts` de `vitest.config.ts` couvre automatiquement le nouveau dossier `invariants/`
- L'invariant `admin-routes-guarded` accepte 3 marqueurs : `// PUBLIC ROUTE`, `Authorization`/`Bearer`, ou `rateMap`/`RateLimit`

État sécurité actuel :
- `/api/recommendations` : GARDÉE (Bearer + Origin + UUID + rate-limit + logging)
- `/api/leads` : PUBLIC (intentionnel, `escapeHtml` + validation)
- `/api/orders` : PUBLIC (intentionnel, prix serveur + RPC atomique)
- `/api/analytics` : PUBLIC (intentionnel, rate-limit IP + UUID + events whitelist)
- `/api/send-lead-email` : SUPPRIMÉE

### Session 3 Guardian — 2026-04-29 (scripts de cohérence + CI + protocole IA)

Actions réalisées :
- ✅ Nettoyage PAT GitHub exposé dans remote origin (`git remote set-url`)
- ✅ Suppression branches remote orphelines (déjà supprimées côté remote, refs locales prunées)
- ✅ `tsx` ajouté aux devDependencies (^4.21.0)
- ✅ Script `scripts/check-admin-guards.ts` (scan routes API service role)
- ✅ Script `scripts/check-routes.ts` (détection liens orphelins)
- ✅ Script `scripts/check-rls-coverage.ts` (vérification RLS depuis audit markdown)
- ✅ Job `guardian` ajouté à la CI (parallèle au job `check`)
- ✅ Protocole IA `docs/fortunashop-guardrails.md`
- ✅ Script npm `guardian` pour lancer les 3 checks en local
- ⏳ Required status checks `["check", "Guardian"]` à activer après merge (le check Guardian doit avoir tourné une fois pour être référençable)

Fichiers impactés :
- `scripts/check-admin-guards.ts` (A) — 131 lignes
- `scripts/check-routes.ts` (A) — 164 lignes
- `scripts/check-rls-coverage.ts` (A) — 116 lignes
- `.github/workflows/ci.yml` (M) — job `guardian` ajouté
- `docs/fortunashop-guardrails.md` (A) — 93 lignes
- `package.json` (M) — `tsx` devDependency + script `guardian`
- `CLAUDE.md` (M) — historique Session 3

Décisions techniques :
- Scripts en TypeScript exécutés via `tsx` (cohérent avec stack Next.js TS)
- `let entries` sans annotation `ReturnType<typeof readdirSync>` (overloads ambigus en TS strict)
- Job `guardian` parallèle au job `check` (gain de feedback ~1 min, échec isolé)
- `npm run guardian` utilise `tsx` direct (devDep) au lieu de `npx tsx`
- Required check Guardian à ajouter par `gh api PUT` après le 1er run réussi

État Guardian complet :
- Couche 1 (branch protection) : ✅ enforce_admins + required check `check` (Guardian à ajouter post-merge)
- Couche 2 (tests invariants) : ✅ 15 tests (3 fichiers)
- Couche 3 (scripts cohérence) : ✅ 3 scripts (admin-guards, routes, rls-coverage)
- Couche 4 (protocole IA) : ✅ `docs/fortunashop-guardrails.md`
- Couche 5 (workflow 3 IA) : ✅ documenté dans CLAUDE.md + guardrails
