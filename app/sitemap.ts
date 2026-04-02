import { createClient } from '@supabase/supabase-js'
import { MetadataRoute } from 'next'

// Client Supabase côté serveur pour le sitemap
var supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  var baseUrl = 'https://fortunashop.fr'

  // Pages statiques du site
  var staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: baseUrl + '/mentions-legales', lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: baseUrl + '/cgu', lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: baseUrl + '/confidentialite', lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: baseUrl + '/suivi', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
    { url: baseUrl + '/livraison', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.2 },
    { url: baseUrl + '/collecte', lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.3 },
  ]

  // Récupère toutes les boutiques actives
  var { data: shops } = await supabase
    .from('shops')
    .select('slug, updated_at')
    .eq('is_active', true)

  var shopPages = (shops || []).map(function(shop) {
    return {
      url: baseUrl + '/boutique/' + shop.slug,
      lastModified: shop.updated_at ? new Date(shop.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }
  })

  // Récupère tous les produits actifs de toutes les boutiques actives
  var { data: products } = await supabase
    .from('products')
    .select('id, shop_id, updated_at, shops!inner(slug, is_active)')
    .eq('is_active', true)

  var productPages = (products || []).map(function(product: any) {
    return {
      url: baseUrl + '/boutique/' + product.shops.slug + '/produit/' + product.id,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  return [...staticPages, ...shopPages, ...productPages]
}
