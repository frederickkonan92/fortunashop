import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Parcourt récursivement app/api/ pour trouver tous les route.ts
function findRouteFiles(dir: string): string[] {
  var results: string[] = []

  function walk(currentDir: string) {
    var entries = readdirSync(currentDir, { withFileTypes: true })
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i]
      var fullPath = join(currentDir, entry.name)
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

describe('Invariant : admin routes guarded', function() {

  it('toute route avec service role a un guard ou est marquée PUBLIC ROUTE', function() {
    var apiDir = join(process.cwd(), 'app', 'api')
    var routes = findRouteFiles(apiDir)

    // On ne teste que les routes qui utilisent le service role
    var serviceRoleRoutes = routes.filter(function(routePath) {
      var content = readFileSync(routePath, 'utf-8')
      return content.includes('SUPABASE_SERVICE_ROLE_KEY')
        || content.includes('createAdminClient')
        || content.includes('service_role')
    })

    var violations: string[] = []

    for (var i = 0; i < serviceRoleRoutes.length; i++) {
      var routePath = serviceRoleRoutes[i]
      var content = readFileSync(routePath, 'utf-8')
      var relativePath = routePath.replace(process.cwd() + '/', '')

      // Les 15 premières lignes pour chercher le commentaire PUBLIC ROUTE
      var head = content.split('\n').slice(0, 15).join('\n')

      // Cherche au moins UN des marqueurs de guard
      var hasPublicComment = head.includes('// PUBLIC ROUTE')
      var hasAuthBearer = content.includes('authorization')
        || content.includes('Authorization')
        || content.includes('Bearer')
      var hasRateLimit = content.includes('rateMap')
        || content.includes('RateLimit')
        || content.includes('rateLimit')

      var isGuarded = hasPublicComment || hasAuthBearer || hasRateLimit

      if (!isGuarded) {
        violations.push(
          relativePath + ' utilise service role SANS guard. '
          + 'Ajoutez un auth Bearer, un rate-limit, ou un commentaire "// PUBLIC ROUTE" en tête.'
        )
      }
    }

    expect(violations).toEqual([])
  })

  it('il existe au moins 1 route API avec auth Bearer', function() {
    // Vérifie que /api/recommendations (ou une autre) a bien un guard Bearer
    // Empêche la régression "on retire l auth de toutes les routes"
    var apiDir = join(process.cwd(), 'app', 'api')
    var routes = findRouteFiles(apiDir)

    var routesWithBearer = routes.filter(function(routePath) {
      var content = readFileSync(routePath, 'utf-8')
      return content.includes('Authorization')
        && content.includes('Bearer')
        && content.includes('auth.getUser')
    })

    expect(routesWithBearer.length).toBeGreaterThanOrEqual(1)
  })

  it('/api/send-lead-email n existe plus', function() {
    // Route doublon supprimée en Session 1 — cet invariant empêche sa réapparition
    var fs = require('fs')
    var routePath = join(process.cwd(), 'app', 'api', 'send-lead-email')
    expect(fs.existsSync(routePath)).toBe(false)
  })
})
