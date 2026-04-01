import { Suspense } from 'react'
import type { Metadata } from 'next'
import LivraisonContent from './content'

export const metadata: Metadata = {
  title: 'Confirmation livraison — fortunashop',
  description: 'Confirmez la remise d’une commande via le lien sécurisé fortunashop.',
  openGraph: {
    title: 'Confirmation livraison',
    type: 'website',
    url: 'https://fortunashop.fr/livraison',
    siteName: 'fortunashop',
  },
  twitter: { card: 'summary', title: 'Livraison — fortunashop' },
  robots: { index: false, follow: false },
}

export default function LivraisonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    }>
      <LivraisonContent />
    </Suspense>
  )
}
