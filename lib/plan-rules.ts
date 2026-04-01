/** Règles plan / add-ons (checkout, dashboard, admin produits, landing) */

/** Frais de setup unique affichés sur la landing et docs */
export var PRICING_SETUP_FCFA = 100000

export type PlanKey = 'starter' | 'pro' | 'premium'

/**
 * Abonnement : mensuel, équivalent mensuel si paiement annuel (10 mois payés),
 * économie annuelle vs 12 × mensuel (aligné CLAUDE.md / landing).
 */
export var PLAN_SUBSCRIPTION_PRICING: Record<
  PlanKey,
  { monthly: number; annualMonthlyEquivalent: number; savingsYearVsMonthly: number }
> = {
  starter: { monthly: 35000, annualMonthlyEquivalent: 29167, savingsYearVsMonthly: 70000 },
  pro: { monthly: 55000, annualMonthlyEquivalent: 45833, savingsYearVsMonthly: 110000 },
  premium: { monthly: 85000, annualMonthlyEquivalent: 70833, savingsYearVsMonthly: 170000 },
}

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
