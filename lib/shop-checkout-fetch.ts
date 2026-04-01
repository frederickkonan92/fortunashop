import type { SupabaseClient } from '@supabase/supabase-js'

/** Colonnes nécessaires à la page commander (évite select('*')) */
export var SHOP_CHECKOUT_SELECT =
  'id, name, slug, plan, addons, phone, wave_number, orange_number, mtn_number'

export async function fetchShopForCheckout(supabase: SupabaseClient, slug: string): Promise<any | null> {
  var res = await supabase
    .from('shops')
    .select(SHOP_CHECKOUT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (res.error || !res.data) return null
  return res.data
}
