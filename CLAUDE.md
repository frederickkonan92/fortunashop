# CLAUDE.md — fortunashop

> Ce fichier est lu automatiquement par Claude Code au démarrage.
> Dernière mise à jour : 29 mars 2026

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
│   ├── paiement.tsx                      # Composant paiement
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
| boutique-test | Starter | Boutique démo landing |
| boutique-pro | Pro | Login artisan-pro@test.com |
| kente-fashion-test | Premium | Addon cinetpay ajouté manuellement |

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
1. ~~Fix bug modes paiement Pro/Premium~~ → à appliquer
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
