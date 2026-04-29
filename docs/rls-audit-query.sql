-- Audit RLS fortunashop
-- Genere par Session 1 Guardian (S1.6) le 2026-04-29
--
-- Pourquoi ce fichier existe :
--   La CLI Supabase n'a pas pu se lier au projet hmtxovrqvslhcsscjjdy
--   ("Your account does not have the necessary privileges to access this endpoint").
--   Donc impossible d'executer cet audit en CLI. A executer manuellement.
--
-- Comment l'utiliser :
--   1. Ouvre le dashboard Supabase : https://supabase.com/dashboard/project/hmtxovrqvslhcsscjjdy
--   2. Va dans SQL Editor > New Query
--   3. Colle la requete ci-dessous, lance-la
--   4. Copie le resultat (CSV ou Markdown) dans docs/rls-audit-2026-04-29.md
--   5. Identifie les lignes avec rls_enabled = false ou policies = 'AUCUNE POLICY'

SELECT
  t.tablename AS table_name,
  c.relrowsecurity AS rls_enabled,
  COALESCE(
    (SELECT string_agg(
      polname || ' (' || polcmd::text || '): ' || pg_get_expr(polqual, polrelid),
      E'\n    '
      ORDER BY polname
    )
    FROM pg_policy p
    WHERE p.polrelid = c.oid),
    'AUCUNE POLICY'
  ) AS policies
FROM pg_tables t
JOIN pg_class c
  ON c.relname = t.tablename
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- ALERTES :
--   - rls_enabled = false  -> P0 : table accessible a tous via anon key
--   - rls_enabled = true ET policies = 'AUCUNE POLICY' -> P1 : RLS actif sans regle (selon defaut, tout bloque ou tout ouvert)
--   - policies non vides -> documenter les noms des policies dans rls-audit-YYYY-MM-DD.md
