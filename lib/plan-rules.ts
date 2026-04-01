/** Règles plan / add-ons pour les modes de paiement checkout (aligné commander) */

export function hasAddon(addons: string[] | null | undefined, addon: string): boolean {
  return !!(addons && addons.indexOf(addon) !== -1)
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
