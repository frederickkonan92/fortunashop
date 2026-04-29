import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const DOCS_DIR = join(process.cwd(), 'docs')
const MAX_AUDIT_AGE_DAYS = 90

// --- Trouver le fichier d'audit RLS le plus récent ---
function findLatestAudit(): string | null {
  let entries: string[]
  try {
    entries = readdirSync(DOCS_DIR)
  } catch {
    return null
  }

  const auditFiles = entries
    .filter(function(f) { return f.startsWith('rls-audit-') && f.endsWith('.md') })
    .sort()
    .reverse()

  return auditFiles.length > 0 ? join(DOCS_DIR, auditFiles[0]) : null
}

// --- Parser le markdown pour extraire les tables et leur statut RLS ---
function parseAuditMarkdown(content: string): Array<{ table: string; rls: boolean; policies: string }> {
  const results: Array<{ table: string; rls: boolean; policies: string }> = []
  const lines = content.split('\n')

  for (const line of lines) {
    // Cherche les lignes de tableau markdown : | table_name | true/false | policies |
    const match = line.match(/\|\s*(\w+)\s*\|\s*(true|false|✅|❌)\s*\|\s*(.+?)\s*\|/)
    if (match) {
      const tableName = match[1]
      // Ignore les en-têtes de tableau
      if (tableName === 'table_name' || tableName === 'Table' || tableName === '---') continue

      const rlsEnabled = match[2] === 'true' || match[2] === '✅'
      const policies = match[3].trim()

      results.push({ table: tableName, rls: rlsEnabled, policies })
    }
  }

  return results
}

// --- MAIN ---
console.log('🛡️  Guardian — check-rls-coverage')

// Étape 1 : trouver le fichier audit
const auditPath = findLatestAudit()

if (!auditPath) {
  console.error('❌ ÉCHEC — aucun fichier docs/rls-audit-*.md trouvé.')
  console.error('   Exécutez l\'audit RLS via le SQL Editor Supabase et sauvegardez le résultat.')
  process.exit(1)
}

const auditFile = auditPath.replace(process.cwd() + '/', '')
console.log('Fichier audit :', auditFile)

// Étape 2 : vérifier l'âge du fichier
const fileStat = statSync(auditPath)
const ageMs = Date.now() - fileStat.mtimeMs
const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24))

if (ageDays > MAX_AUDIT_AGE_DAYS) {
  console.warn('⚠️  WARNING — fichier audit vieux de', ageDays, 'jours (max recommandé :', MAX_AUDIT_AGE_DAYS, ')')
  console.warn('   Relancez l\'audit RLS pour vérifier l\'état actuel des policies.')
}

// Étape 3 : parser le contenu
const content = readFileSync(auditPath, 'utf-8')
const tables = parseAuditMarkdown(content)

if (tables.length === 0) {
  console.error('❌ ÉCHEC — aucune table détectée dans', auditFile)
  console.error('   Le format attendu est un tableau Markdown avec colonnes : table | rls | policies')
  process.exit(1)
}

console.log('Tables détectées :', tables.length, '\n')

// Étape 4 : vérifier chaque table
const violations: string[] = []

for (const t of tables) {
  if (!t.rls) {
    console.log('  ❌', t.table, '— RLS DÉSACTIVÉ')
    violations.push(t.table + ' : RLS désactivé')
  } else if (t.policies === 'AUCUNE POLICY' || t.policies === '' || t.policies === '-') {
    console.log('  ⚠️ ', t.table, '— RLS actif mais AUCUNE POLICY')
    violations.push(t.table + ' : RLS actif mais aucune policy définie')
  } else {
    console.log('  ✅', t.table, '— RLS actif,', t.policies.split(',').length, 'policy(ies)')
  }
}

console.log('\n---')
console.log('Tables :', tables.length)
console.log('Protégées :', tables.length - violations.length)
console.log('Violations :', violations.length)
if (ageDays > MAX_AUDIT_AGE_DAYS) {
  console.log('⚠️  Audit périmé :', ageDays, 'jours (rafraîchir recommandé)')
}

if (violations.length > 0) {
  console.error('\n❌ ÉCHEC — tables non protégées :')
  for (const v of violations) {
    console.error('  →', v)
  }
  process.exit(1)
} else {
  console.log('\n✅ Toutes les tables ont RLS actif avec au moins 1 policy.')
  process.exit(0)
}
