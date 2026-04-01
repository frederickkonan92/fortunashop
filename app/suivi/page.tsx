import { Suspense } from 'react'
import type { Metadata } from 'next'
import SuiviContent from './content'

export const metadata: Metadata = {
  title: 'Suivi de commande — fortunashop',
  description: 'Suivez l’état de votre commande boutique fortunashop avec votre numéro de commande.',
  openGraph: {
    title: 'Suivi de commande',
    description: 'État de commande fortunashop',
    type: 'website',
    url: 'https://fortunashop.fr/suivi',
    siteName: 'fortunashop',
  },
  twitter: { card: 'summary', title: 'Suivi commande — fortunashop' },
  robots: { index: false, follow: false },
}

export default function SuiviPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    }>
      <SuiviContent />
    </Suspense>
  )
}
