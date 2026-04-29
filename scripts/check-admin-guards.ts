import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// --- CONFIG ---
// Racine du dossier API dans le projet Next.js (App Router)
const API_ROOT = join(process.cwd(), 'app', 'api')

// Patterns qui indiquent l'utilisation du service role Supabase (bypass RLS)
const SERVICE_ROLE_PATTERNS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'createAdminClient',
  'service_role',
]

// Patterns qui indiquent qu'un guard est en place
// Au moins UN doit être présent si le service role est utilisé
const GUARD_PATTERNS = {
  publicRoute: '// PUBLIC ROUTE',       // commentaire en tête = route publique intentionnelle
  authBearer: ['Authorization', 'Bearer'], // auth par token JWT
  rateLimit: ['rateMap', 'RateLimit', 'rateLimit'], // rate-limiting
}
// --- FIN CONFIG ---

// Parcourt récursivement un dossier pour trouver les fichiers route.ts
function findRouteFiles(dir: string): string[] {
  const results: string[] = []

  function walk(currentDir: string) {
    let entries: ReturnType<typeof readdirSync>
    try {
      entries = readdirSync(currentDir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        results.push(fullPath)
      }
    }
  }

  walk(dir)
  return results
}

// Vérifie si un fichier utilise le service role
function usesServiceRole(content: string): boolean {
  return SERVICE_ROLE_PATTERNS.some(function(pattern) {
    return content.includes(pattern)
  })
}

// Vérifie si un fichier a au moins un guard
function hasGuard(content: string): { guarded: boolean; type: string } {
  // Check 1 : commentaire // PUBLIC ROUTE dans les 15 premières lignes
  const head = content.split('\n').slice(0, 15).join('\n')
  if (head.includes(GUARD_PATTERNS.publicRoute)) {
    return { guarded: true, type: '// PUBLIC ROUTE' }
  }

  // Check 2 : auth Bearer (les 2 mots doivent être présents)
  const hasAuth = GUARD_PATTERNS.authBearer.every(function(word) {
    return content.includes(word)
  })
  if (hasAuth) {
    return { guarded: true, type: 'Auth Bearer' }
  }

  // Check 3 : rate-limit (au moins un des patterns)
  const hasRateLimit = GUARD_PATTERNS.rateLimit.some(function(word) {
    return content.includes(word)
  })
  if (hasRateLimit) {
    return { guarded: true, type: 'Rate-limit' }
  }

  return { guarded: false, type: 'AUCUN' }
}

// --- MAIN ---
console.log('🛡️  Guardian — check-admin-guards')
console.log('Scanning', API_ROOT, '...\n')

const routes = findRouteFiles(API_ROOT)
const violations: string[] = []
let serviceRoleCount = 0

for (const routePath of routes) {
  const content = readFileSync(routePath, 'utf-8')
  const relativePath = routePath.replace(process.cwd() + '/', '')

  if (!usesServiceRole(content)) {
    // Pas de service role → pas besoin de guard
    console.log('  ⬜', relativePath, '— pas de service role')
    continue
  }

  serviceRoleCount++
  const guard = hasGuard(content)

  if (guard.guarded) {
    console.log('  ✅', relativePath, '—', guard.type)
  } else {
    console.log('  ❌', relativePath, '— AUCUN GUARD')
    violations.push(relativePath)
  }
}

console.log('\n---')
console.log('Routes scannées :', routes.length)
console.log('Routes avec service role :', serviceRoleCount)
console.log('Routes gardées :', serviceRoleCount - violations.length)
console.log('Violations :', violations.length)

if (violations.length > 0) {
  console.error('\n❌ ÉCHEC — routes non gardées :')
  for (const v of violations) {
    console.error('  →', v)
  }
  console.error('\nChaque route avec service role DOIT avoir :')
  console.error('  - "// PUBLIC ROUTE" en tête de fichier (si publique intentionnellement)')
  console.error('  - OU un check Authorization/Bearer (auth utilisateur)')
  console.error('  - OU un rate-limit (rateMap/RateLimit)')
  process.exit(1)
} else {
  console.log('\n✅ Toutes les routes admin sont gardées.')
  process.exit(0)
}
