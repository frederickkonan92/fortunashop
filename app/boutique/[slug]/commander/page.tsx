import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import CommanderClient from './commander-client'
import { fetchShopForCheckout } from '@/lib/shop-checkout-fetch'

var supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  var { slug } = await params
  var shop = await fetchShopForCheckout(supabaseServer, slug)
  if (!shop) {
    return {
      title: 'Commander — fortunashop',
      description: 'Finalisez votre commande sur fortunashop.',
    }
  }
  var title = 'Commander — ' + shop.name
  var description =
    'Finalisez votre commande chez ' + shop.name + ' — paiement Wave, Mobile Money ou espèces. Suivi inclus.'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://fortunashop.fr/boutique/' + slug + '/commander',
      siteName: 'fortunashop',
    },
    twitter: {
      card: 'summary',
      title,
      description: 'Commande en ligne — fortunashop',
    },
  }
}

export default async function CommanderPage({ params }: { params: Promise<{ slug: string }> }) {
  var { slug } = await params
  var shop = await fetchShopForCheckout(supabaseServer, slug)
  return <CommanderClient slug={slug} initialShop={shop} />
}
