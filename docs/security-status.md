# Etat de securite fortunashop

Derniere mise a jour : 2026-04-29
Auteur : Claude Code (Session 1 Guardian)

## Routes API — Statut des guards

| Route | Methode | Auth | Origin | Rate-limit | Validation | Logging | Statut |
|---|---|---|---|---|---|---|---|
| /api/recommendations | POST | Bearer + owner_id | fortunashop.fr / localhost | 50/jour global (memoire) | UUID strict | [SECURITY] console.warn | GARDEE |
| /api/leads | POST | Public | Aucun | Aucun | escapeHtml + longueurs max | logInfo / logError | PUBLIC (intentionnel) |
| /api/orders | POST | Public | Aucun | Aucun | UUID + prix recalcules serveur | logInfo / logError | PUBLIC (intentionnel) |
| /api/analytics | POST | Public | Aucun | 100/min/IP (memoire) | UUID + events whitelist | Aucun | PUBLIC (intentionnel) |
| /api/send-lead-email | — | — | — | — | — | — | SUPPRIMEE (S1.3) |

## Limites connues

1. **Rate-limit en memoire** : le rate-limit global sur /api/recommendations est stocke en memoire du processus.
   Sur Vercel serverless, chaque instance cold-start a son propre compteur.
   Protection reelle estimee : ~80% des cas (suffisant car le cache 24h/shop est la protection primaire).
   Solution future : Upstash Redis ou table Supabase api_rate_limits (a implementer quand > 20 boutiques).

2. **Rate-limit analytics** : meme probleme (memoire). Risque faible car la route analytics est low-cost.

3. **Pas de middleware auth global** : chaque page admin verifie l'auth individuellement.
   RLS Supabase est l'ultime barriere. A ajouter en Session 2.

## Branch protection

- enforce_admins: true
- Required status checks: check (job CI doit etre vert avant merge)
- Required PR reviews: 0 (PR obligatoire mais pas de review — solo founder)
- Force push: interdit
- Deletion: interdit

Active le 2026-04-29 via gh api PUT /repos/frederickkonan92/fortunashop/branches/main/protection.

## Multi-tenancy

- RLS : audit complet dans `docs/rls-audit-2026-04-29.md` (genere via `supabase db query --linked`).
  **14/14 tables** ont RLS active avec au moins 1 policy. **0 alerte P0/P1.**
- 3 points d'attention a verifier en Session 2 (clauses USING des policies "Anon peut lire").
- `docs/rls-audit-query.sql` : requete reutilisable pour re-auditer.
- Pattern admin actuel : auth Supabase -> shops.owner_id = user.id -> filtre shop_id sur toutes les requetes.
- Middleware global : ABSENT (a ajouter en Session 2).

## Schema Supabase

- Snapshot : EN ATTENTE.
  CLI liee au projet (org Fortuna Team), mais `supabase db dump` necessite Docker Desktop en cours d'execution.
  A faire : lancer Docker, puis `supabase db dump --schema public > supabase/schema-snapshot.sql`.
- Migrations versionnees : NON.

## Next.js

- Version : ^16.2.4 (mise a jour depuis 16.1.6 le 2026-04-29 — S1.4).
- Vulnerabilites : 3 moderate restantes (toutes dans postcss, dependance transitive).
  Le high (HTTP request smuggling, CSRF bypass, RSC DoS) est correctement patche.

## Guardian (systeme anti-hallucinations)

- Tests d'invariants : A FAIRE (Session 2)
- Scripts de coherence : A FAIRE (Session 3)
- Job CI guardian : A FAIRE (Session 3)
- Protocole IA : A FAIRE (Session 3)
