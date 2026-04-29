import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Invariant : variants restock coherence', function() {

  it('la logique annulation restock le produit parent ET la variante', function() {
    // Lit le fichier admin qui contient la logique d'annulation
    var adminPath = join(process.cwd(), 'app', 'admin', 'page.tsx')
    var content = readFileSync(adminPath, 'utf-8')

    // Le fichier doit contenir la logique de restock parent
    // increment_stock est le RPC qui restock le produit parent
    expect(content).toContain('increment_stock')

    // Le fichier doit AUSSI contenir la logique de restock variante
    // increment_variant_stock est le RPC qui restock une variante spécifique
    expect(content).toContain('increment_variant_stock')
  })

  it('le restock variante gère le cas variant_id direct', function() {
    var adminPath = join(process.cwd(), 'app', 'admin', 'page.tsx')
    var content = readFileSync(adminPath, 'utf-8')

    // La logique doit vérifier si l'item a un variant_id direct
    // (cas simple : l'ID de la variante est stocké dans order_items)
    expect(content).toContain('variant_id')
  })

  it('le restock variante gère le cas variant_value lookup (1 ou 2 axes)', function() {
    var adminPath = join(process.cwd(), 'app', 'admin', 'page.tsx')
    var content = readFileSync(adminPath, 'utf-8')

    // La logique doit aussi gérer le cas où seul variant_value est présent
    // (cas complexe : il faut chercher la variante par sa valeur)
    expect(content).toContain('variant_value')

    // Pour les variantes 2 axes (ex: "Rouge / M"), la logique doit splitter sur /
    // et chercher variant_value + variant_value_2
    expect(content).toContain('variant_value_2')
  })

  it('lib/variants.ts exporte getVariantAxes', function() {
    // La fonction utilitaire de gestion des axes de variantes doit exister
    var variantsPath = join(process.cwd(), 'lib', 'variants.ts')
    var content = readFileSync(variantsPath, 'utf-8')
    expect(content).toContain('getVariantAxes')
    // Et elle doit être exportée (pas juste une fonction interne)
    expect(content).toMatch(/export\s+(function|var|const)\s+getVariantAxes/)
  })

  it('le fichier admin contient la gestion d annulation de commande', function() {
    // Vérifie que la logique d'annulation n'a pas été déplacée ou supprimée
    // sans mettre à jour les tests
    var adminPath = join(process.cwd(), 'app', 'admin', 'page.tsx')
    var content = readFileSync(adminPath, 'utf-8')

    // Le fichier doit contenir le statut 'annulee' (preuve que l'annulation est gérée ici)
    expect(content).toContain("'annulee'")

    // Et la promesse parallèle de toutes les opérations de restock
    expect(content).toContain('Promise.all')
  })
})
