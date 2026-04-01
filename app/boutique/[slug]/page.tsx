import CatalogueClient from './catalogue'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { fetchBoutiqueCatalog } from '@/lib/boutique-catalog'

// Client Supabase côté serveur pour generateMetadata
// On ne peut pas utiliser le client côté client ici car generateMetadata s'exécute sur le serveur
var supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  var { slug } = await params

  var { data: shop } = await supabaseServer
    .from('shops')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .single()

  if (!shop) {
    return {
      title: 'Boutique introuvable — fortunashop',
      description: 'Cette boutique n\'existe pas ou a été supprimée.',
    }
  }

  var title = shop.name + ' — Boutique en ligne'
  var description = shop.description || shop.name + ' — Découvrez nos produits et commandez en ligne. Paiement Wave, Orange Money, MTN MoMo.'

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'website',
      url: 'https://fortunashop.fr/boutique/' + slug,
      images: shop.logo_url ? [{ url: shop.logo_url, width: 600, height: 600, alt: shop.name }] : [],
      siteName: 'fortunashop',
    },
    twitter: {
      card: 'summary',
      title: title,
      description: description,
      images: shop.logo_url ? [shop.logo_url] : [],
    },
  }
}

export default async function BoutiquePage({ params }: any) {
  const { slug } = await params
  var { shop, products } = await fetchBoutiqueCatalog(supabaseServer, slug)
  return <CatalogueClient slug={slug} initialShop={shop} initialProducts={products} />
}
