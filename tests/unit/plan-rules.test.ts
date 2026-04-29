import { describe, it, expect } from 'vitest'
import {
  hasAddon,
  isProPlan,
  isPremiumPlan,
  getMaxProductsForPlan,
  getMaxCatalogEditsForPlan,
  getMaxLivreursForPlan,
  isCheckoutPaymentModeAllowed,
} from '@/lib/plan-rules'

describe('hasAddon', function() {
  it('retourne false si addons absent ou vide', function() {
    expect(hasAddon(undefined, 'cinetpay')).toBe(false)
    expect(hasAddon(null, 'cinetpay')).toBe(false)
    expect(hasAddon([], 'cinetpay')).toBe(false)
  })

  it('retourne true si l’addon est présent', function() {
    expect(hasAddon(['cinetpay', 'analytics'], 'cinetpay')).toBe(true)
    expect(hasAddon(['stripe'], 'stripe')).toBe(true)
  })

  it('retourne false si l’addon n’est pas dans la liste', function() {
    expect(hasAddon(['analytics'], 'cinetpay')).toBe(false)
  })
})

describe('isProPlan', function() {
  it('starter seul n’est pas Pro', function() {
    expect(isProPlan('starter')).toBe(false)
    expect(isProPlan(undefined)).toBe(false)
  })

  it('pro et premium sont Pro', function() {
    expect(isProPlan('pro')).toBe(true)
    expect(isProPlan('premium')).toBe(true)
  })
})

describe('isPremiumPlan', function() {
  it('uniquement premium', function() {
    expect(isPremiumPlan('premium')).toBe(true)
    expect(isPremiumPlan('pro')).toBe(false)
    expect(isPremiumPlan('starter')).toBe(false)
    expect(isPremiumPlan(undefined)).toBe(false)
  })
})

describe('getMaxProductsForPlan', function() {
  it('applique les plafonds connus', function() {
    expect(getMaxProductsForPlan('starter')).toBe(20)
    expect(getMaxProductsForPlan('pro')).toBe(50)
    expect(getMaxProductsForPlan('premium')).toBe(999999)
    expect(getMaxProductsForPlan(undefined)).toBe(20)
  })
})

describe('getMaxCatalogEditsForPlan', function() {
  it('applique les plafonds connus', function() {
    expect(getMaxCatalogEditsForPlan('starter')).toBe(10)
    expect(getMaxCatalogEditsForPlan('pro')).toBe(25)
    expect(getMaxCatalogEditsForPlan('premium')).toBe(999999)
    expect(getMaxCatalogEditsForPlan(undefined)).toBe(10)
  })
})

describe('getMaxLivreursForPlan', function() {
  it('retourne les bonnes limites par plan', function() {
    expect(getMaxLivreursForPlan('starter')).toBe(1)
    expect(getMaxLivreursForPlan('pro')).toBe(3)
    expect(getMaxLivreursForPlan('premium')).toBe(999999)
  })

  it('plan vide ou inconnu fallback sur starter (1 livreur)', function() {
    expect(getMaxLivreursForPlan(undefined)).toBe(1)
    expect(getMaxLivreursForPlan('')).toBe(1)
    expect(getMaxLivreursForPlan('xxx')).toBe(1)
  })
})

describe('isCheckoutPaymentModeAllowed', function() {
  it('Wave toujours autorisé', function() {
    expect(isCheckoutPaymentModeAllowed('wave', 'starter', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('wave', undefined, undefined)).toBe(true)
  })

  it('Orange / MTN : Pro, Premium ou addon cinetpay', function() {
    expect(isCheckoutPaymentModeAllowed('orange_money', 'starter', [])).toBe(false)
    expect(isCheckoutPaymentModeAllowed('orange_money', 'starter', ['cinetpay'])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('mtn_momo', 'pro', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('mtn_momo', 'premium', [])).toBe(true)
  })

  it('CB : Premium ou addon stripe', function() {
    expect(isCheckoutPaymentModeAllowed('cb', 'starter', [])).toBe(false)
    expect(isCheckoutPaymentModeAllowed('cb', 'pro', [])).toBe(false)
    expect(isCheckoutPaymentModeAllowed('cb', 'premium', [])).toBe(true)
    expect(isCheckoutPaymentModeAllowed('cb', 'starter', ['stripe'])).toBe(true)
  })

  it('mode inconnu : refusé', function() {
    expect(isCheckoutPaymentModeAllowed('especes', 'premium', [])).toBe(false)
    expect(isCheckoutPaymentModeAllowed('paypal', 'premium', [])).toBe(false)
  })
})
