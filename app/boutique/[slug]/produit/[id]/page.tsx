import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ProduitContent from './content'

// Client Supabase côté serveur pour generateMetadata
var supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string; id: string }> }): Promise<Metadata> {
  var { slug, id } = await params

  var { data: product } = await supabaseServer
    .from('products')
    .select('name, description, price, image_url')
    .eq('id', id)
    .single()

  var { data: shop } = await supabaseServer
    .from('shops')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!product || !shop) {
    return {
      title: 'Produit introuvable — fortunashop',
    }
  }

  var title = product.name + ' — ' + shop.name
  var description = product.description || product.name + ' à ' + new Intl.NumberFormat('fr-FR').format(product.price) + ' FCFA sur ' + shop.name

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'website',
      url: 'https://fortunashop.fr/boutique/' + slug + '/produit/' + id,
      images: product.image_url ? [{ url: product.image_url, width: 600, height: 600, alt: product.name }] : [],
      siteName: 'fortunashop',
    },
  }
}

export default function ProduitPage() {
  return <ProduitContent />
}
