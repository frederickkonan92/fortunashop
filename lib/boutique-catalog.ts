import type { SupabaseClient } from '@supabase/supabase-js'

// Colonnes catalogue + variantes (popup) — évite select('*') et payloads inutiles
var PRODUCT_CATALOG_SELECT =
  'id, name, description, price, image_url, stock_quantity, stock_buffer, sort_order, has_variants, category,' +
  'product_variants (' +
  'id, variant_value, is_active, sort_order, stock_quantity, price_override, variant_type' +
  ')'

export async function fetchBoutiqueCatalog(supabase: SupabaseClient, slug: string) {
  var shopRes = await supabase
    .from('shops')
    .select('id, name, description, slug, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!shopRes.data) {
    return { shop: null, products: [] as any[] }
  }

  var prodRes = await supabase
    .from('products')
    .select(PRODUCT_CATALOG_SELECT)
    .eq('shop_id', shopRes.data.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return { shop: shopRes.data, products: prodRes.data || [] }
}
