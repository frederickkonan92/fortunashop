import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { isCheckoutPaymentModeAllowed } from '@/lib/plan-rules'

// Fonction utilitaire : lit récursivement les fichiers .tsx d'un dossier
function readTsxFiles(dir: string): Array<{ path: string; content: string }> {
  var fs = require('fs')
  var path = require('path')
  var results: Array<{ path: string; content: string }> = []

  function walk(currentDir: string) {
    var entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i]
      var fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        results.push({ path: fullPath, content: fs.readFileSync(fullPath, 'utf-8') })
      }
    }
  }

  walk(dir)
  return results
}

describe('Invariant : payment gating single source', function() {

  it('aucun composant boutique ne contient de gating cinetpay en dur', function() {
    // Scanne tous les fichiers .tsx/.ts dans app/boutique/
    var boutiqueDir = join(process.cwd(), 'app', 'boutique')
    var files = readTsxFiles(boutiqueDir)

    // Patterns interdits : gating paiement en dur au lieu de passer par plan-rules
    var forbiddenPatterns = [
      /addons\??\.\s*includes\s*\(\s*['"]cinetpay['"]\s*\)/,
      /hasAddon\s*\(\s*['"]cinetpay['"]\s*\)/,
      /needsAddon\s*:\s*['"]cinetpay['"]/,
    ]

    var violations: string[] = []

    for (var i = 0; i < files.length; i++) {
      var file = files[i]
      for (var j = 0; j < forbiddenPatterns.length; j++) {
        if (forbiddenPatterns[j].test(file.content)) {
          violations.push(file.path + ' contient ' + forbiddenPatterns[j].toString())
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('le checkout utilise isCheckoutPaymentModeAllowed', function() {
    // Vérifie qu'au moins un fichier dans app/boutique/ utilise la fonction centralisée
    var boutiqueDir = join(process.cwd(), 'app', 'boutique')
    var files = readTsxFiles(boutiqueDir)

    var usesFunction = files.some(function(file) {
      return file.content.includes('isCheckoutPaymentModeAllowed')
    })

    expect(usesFunction).toBe(true)
  })

  it('Pro a orange_money et mtn_momo natifs (sans addon)', function() {
    // Un artisan Pro doit avoir Orange Money et MTN MoMo inclus dans son plan
    expect(isCheckoutPaymentModeAllowed('orange_money', 'pro', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('mtn_momo', 'pro', [])).toBe(true)
  })

  it('Premium a orange_money, mtn_momo et cb natifs (sans addon)', function() {
    // Un artisan Premium a tous les modes de paiement inclus
    expect(isCheckoutPaymentModeAllowed('orange_money', 'premium', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('mtn_momo', 'premium', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('cb', 'premium', [])).toBe(true)
  })

  it('Starter n a PAS orange_money natif (nécessite addon cinetpay)', function() {
    // Un artisan Starter sans addon ne doit PAS avoir Orange Money
    expect(isCheckoutPaymentModeAllowed('orange_money', 'starter', [])).toBe(false)
    expect(isCheckoutPaymentModeAllowed('mtn_momo', 'starter', [])).toBe(false)
    // Mais avec l'addon cinetpay, il y a accès
    expect(isCheckoutPaymentModeAllowed('orange_money', 'starter', ['cinetpay'])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('mtn_momo', 'starter', ['cinetpay'])).toBe(true)
  })

  it('wave est toujours autorisé quel que soit le plan', function() {
    expect(isCheckoutPaymentModeAllowed('wave', 'starter', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('wave', 'pro', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('wave', 'premium', [])).toBe(true)
  })

  it('le fichier orphelin paiement.tsx n existe plus', function() {
    // Ce fichier contenait une logique de gating incorrecte
    // Il a été supprimé en S2.0 — cet invariant empêche sa réapparition
    var fs = require('fs')
    var filePath = join(process.cwd(), 'app', 'boutique', '[slug]', 'paiement.tsx')
    var exists = fs.existsSync(filePath)
    expect(exists).toBe(false)
  })
})
