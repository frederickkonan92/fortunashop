import type { SupabaseClient } from '@supabase/supabase-js'

// Colonnes catalogue + variantes (popup) — évite select('*') et payloads inutiles
var PRODUCT_CATALOG_SELECT =
  'id, name, description, price, image_url, stock_quantity, stock_buffer, sort_order, has_variants, category,' +
  'product_variants (' +
  'id, variant_value, is_active, sort_order, stock_quantity, price_override, variant_type' +
  '),' +
  'product_images (id, image_url, position)'

export async function fetchBoutiqueCatalog(supabase: SupabaseClient, slug: string) {
  var shopRes = await supabase
    .from('shops')
    .select(
      'id, name, description, slug, is_active, logo_url, ' +
        'primary_color, secondary_color, accent_color, text_color, theme, ' +
        'hero_image, hero_title, hero_subtitle, about_title, about_text, about_image, ' +
        'social_instagram, social_facebook, social_whatsapp'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  var shopRow: any = shopRes.data
  if (!shopRow) {
    return { shop: null, products: [] as any[] }
  }

  var prodRes = await supabase
    .from('products')
    .select(PRODUCT_CATALOG_SELECT)
    .eq('shop_id', shopRow.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return { shop: shopRow, products: prodRes.data || [] }
}
