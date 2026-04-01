import type { Metadata } from 'next'
import LandingClient from './landing-client'
import { getLandingPlanCards, getLandingFaqs } from '@/lib/landing-plans'
import {
  LANDING_ADDONS,
  LANDING_PROBLEMS,
  LANDING_STEPS,
  LANDING_CHECKLIST,
} from '@/lib/landing-sections'

export const metadata: Metadata = {
  title: 'fortunashop — Boutique en ligne pro en 7 jours',
  description:
    'Infrastructure e-commerce pour artisans en Côte d\'Ivoire. Tarifs Starter, Pro, Premium. Paiement Wave, Mobile Money, suivi commande.',
  alternates: { canonical: 'https://fortunashop.fr/' },
  openGraph: {
    title: 'fortunashop — Votre boutique en ligne en 7 jours',
    description: 'Livraison en 7 jours. Paiement Wave, Orange Money, MTN MoMo.',
    type: 'website',
    url: 'https://fortunashop.fr/',
    siteName: 'fortunashop',
    locale: 'fr_FR',
    images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'fortunashop' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'fortunashop',
    description: 'Boutique en ligne pro pour artisans — fortunashop.fr',
  },
}

// Coquille serveur : données tarifs / FAQ depuis plan-rules + landing-plans ; interactivité dans landing-client
export default function HomePage() {
  return (
    <LandingClient
      plans={getLandingPlanCards()}
      addons={LANDING_ADDONS}
      faqs={getLandingFaqs()}
      problems={LANDING_PROBLEMS}
      steps={LANDING_STEPS}
      checklist={LANDING_CHECKLIST}
    />
  )
}
