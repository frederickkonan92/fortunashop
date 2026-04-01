import { describe, it, expect } from 'vitest'
import { formatPrice, whatsappLink, statusStyle, statusLabel } from '@/lib/utils'

describe('formatPrice', function() {
  it('suffixe FCFA', function() {
    expect(formatPrice(0)).toMatch(/FCFA$/)
    expect(formatPrice(100)).toMatch(/FCFA$/)
  })

  it('formate des montants entiers (locale fr-FR)', function() {
    // Espace classique ou espace insécable étroit selon l’environnement Node
    const s = formatPrice(35000)
    expect(s).toContain('35')
    expect(s).toContain('000')
    expect(s).toMatch(/FCFA$/)
  })

  it('zéro explicite', function() {
    expect(formatPrice(0)).toBe('0 FCFA')
  })
})

describe('whatsappLink', function() {
  it('encode le message et normalise le numéro', function() {
    const url = whatsappLink('2250700000000', 'Bonjour\nTest')
    expect(url).toMatch(/^https:\/\/wa\.me\/2250700000000\?text=/)
    expect(decodeURIComponent(url.split('text=')[1])).toBe('Bonjour\nTest')
  })
})

describe('statusLabel', function() {
  it('libellés métier connus', function() {
    expect(statusLabel('nouvelle')).toBe('Nouvelle')
    expect(statusLabel('confirmee')).toBe('Confirmée')
    expect(statusLabel('en_livraison')).toBe('En livraison')
    expect(statusLabel('livree')).toBe('Livrée')
  })

  it('statut inconnu : renvoie la clé', function() {
    expect(statusLabel('annulee')).toBe('annulee')
    expect(statusLabel('prete')).toBe('prete')
  })
})

describe('statusStyle', function() {
  it('classes Tailwind pour les statuts principaux', function() {
    expect(statusStyle('nouvelle')).toContain('bg-')
    expect(statusStyle('nouvelle')).toContain('text-')
    expect(statusStyle('livree')).toContain('2A7A50')
  })

  it('statut inconnu : style neutre', function() {
    expect(statusStyle('annulee')).toContain('gray')
  })
})
