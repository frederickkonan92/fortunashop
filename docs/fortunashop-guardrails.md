# Protocole Guardian — fortunashop

Dernière mise à jour : 2026-04-29

## Principes fondamentaux

### 1. Zero Inference
Ne jamais deviner. Si un fait est incertain (nom de fonction, type de colonne,
contenu de fichier), faire un diagnostic lecture seule avant de coder.
Si l'incertitude persiste, poser une question — jamais inventer.

### 2. Diagnostic avant tout code
Avant toute modification, évolution ou mise à jour :
1. Lire CLAUDE.md
2. Exécuter un diagnostic ciblé sur les fichiers concernés (lecture seule)
3. Produire un rapport factuel
4. Seulement après : écrire le code

### 3. Preuve de réalité
Pour chaque fichier lu pendant un chantier, citer :
- Le chemin exact
- 1 extrait précis (1-2 lignes avec numéro de ligne)
- 1 phrase expliquant son rôle

### 4. Fail-Fast sur les hard-stops
Conditions qui provoquent un arrêt immédiat (Exit 1) :
- Fichier référencé qui n'existe pas
- Build ou test qui échoue
- Route API avec service role sans guard
- Incertitude sur un fait vérifiable

## Règles spécifiques fortunashop

### Règle 1 — Gating paiement centralisé
Tout le gating de modes de paiement DOIT passer par `isCheckoutPaymentModeAllowed`
dans `lib/plan-rules.ts`. Il est INTERDIT de gater des paiements directement dans
les composants UI avec `hasAddon('cinetpay')` ou `needsAddon: 'cinetpay'`.

Origine : bug Orange Money / MoMo gated derrière addon cinetpay pour tous les plans,
y compris Pro et Premium qui l'ont nativement.

### Règle 2 — Routes API avec service role
Toute route dans `app/api/` qui utilise `SUPABASE_SERVICE_ROLE_KEY` DOIT avoir :
- `// PUBLIC ROUTE` en ligne 1 (si publique intentionnellement) + raison documentée
- OU un auth Bearer + check ownership
- OU un rate-limit

Origine : diagnostic v1 — 5/5 routes non gardées, dont /api/recommendations
exposait l'API Anthropic à tout le monde.

### Règle 3 — Restock variantes
À l'annulation d'une commande, le restock DOIT cibler :
- Le produit parent (increment_stock)
- ET la variante (increment_variant_stock) si applicable
- Gérer les 2 cas : variant_id direct ET variant_value lookup (1 ou 2 axes)

Origine : 4 commits fix variantes/stock en avril 2026.

### Règle 4 — Séparation client Supabase
Dans les routes API, utiliser 2 clients distincts :
- Client USER (anon key + Bearer token) : vérification d'identité
- Client ADMIN (service role) : opérations base de données

Ne JAMAIS utiliser le client service role pour `auth.getUser()`.

### Règle 5 — Pas de secret dans le code
Aucune clé API, token, ou mot de passe dans le code source.
Tout passe par les variables d'environnement (.env.local / Vercel).
Le `.gitignore` DOIT contenir `.env*`.

## Checklist de fin de session

À remplir honnêtement par l'IA à la fin de chaque session :

- [ ] J'ai lu CLAUDE.md au début de cette session
- [ ] J'ai fait un diagnostic lecture seule avant chaque modification
- [ ] J'ai vérifié le build après chaque action
- [ ] J'ai vérifié les tests après chaque action
- [ ] Les scripts Guardian retournent exit 0
- [ ] Aucun secret n'a été commité
- [ ] Le CLAUDE.md a été mis à jour avec l'historique de cette session
- [ ] Je peux dire honnêtement que cette session n'a pas introduit de régressions

## Protections en place

| Couche | Protection | Statut |
|---|---|---|
| Branch protection | enforce_admins: true, required checks | ✅ Active |
| CI - job check | build + unit tests + e2e | ✅ Active |
| CI - job guardian | scripts cohérence + invariants | ✅ Active |
| Tests invariants | 15 tests (3 fichiers) | ✅ 44 total |
| Scripts cohérence | check-admin-guards + check-routes + check-rls-coverage | ✅ |
| Protocole IA | Ce document | ✅ |
