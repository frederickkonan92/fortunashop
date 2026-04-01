/** Règles plan / add-ons (checkout, dashboard, admin produits) */

export function hasAddon(addons: string[] | null | undefined, addon: string): boolean {
  return !!(addons && addons.indexOf(addon) !== -1)
}

export function isProPlan(plan: string | undefined): boolean {
  var p = plan || 'starter'
  return p === 'pro' || p === 'premium'
}

export function isPremiumPlan(plan: string | undefined): boolean {
  return (plan || 'starter') === 'premium'
}

var PRODUCT_LIMITS: any = { starter: 20, pro: 50, premium: 999999 }
var CATALOG_EDIT_LIMITS: any = { starter: 10, pro: 25, premium: 999999 }

export function getMaxProductsForPlan(plan: string | undefined): number {
  return PRODUCT_LIMITS[plan || 'starter'] || 20
}

export function getMaxCatalogEditsForPlan(plan: string | undefined): number {
  return CATALOG_EDIT_LIMITS[plan || 'starter'] || 10
}

/**
 * Indique si un mode de paiement (hors espèces retrait) est autorisé.
 * wave, orange_money, mtn_momo, cb — especes géré séparément côté UI (retrait).
 */
export function isCheckoutPaymentModeAllowed(
  modeId: string,
  plan: string | undefined,
  addons: string[] | null | undefined
): boolean {
  var p = plan || 'starter'
  if (modeId === 'wave') return true
  if (modeId === 'orange_money' || modeId === 'mtn_momo') {
    return p === 'pro' || p === 'premium' || hasAddon(addons, 'cinetpay')
  }
  if (modeId === 'cb') {
    return p === 'premium' || hasAddon(addons, 'stripe')
  }
  return false
}
