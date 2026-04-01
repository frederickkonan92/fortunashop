import './globals.css'
import { Nunito, DM_Sans } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-nunito',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm',
})

export const metadata = {
  metadataBase: new URL('https://fortunashop.fr'),
  title: 'fortunashop — Votre boutique en ligne en 7 jours',
  description: 'Créez votre boutique en ligne professionnelle en 7 jours. Paiement Wave, Orange Money, MTN MoMo. Pour artisans et commerçants en Côte d\'Ivoire.',
  openGraph: {
    title: 'fortunashop — Votre boutique en ligne en 7 jours',
    description: 'Créez votre boutique en ligne professionnelle en 7 jours. Paiement Wave, Orange Money, MTN MoMo.',
    type: 'website',
    url: '/',
    siteName: 'fortunashop',
    locale: 'fr_FR',
    images: [{ url: '/favicon.svg', width: 512, height: 512, alt: 'fortunashop' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'fortunashop — Votre boutique en ligne en 7 jours',
    description: 'Boutique pro en 7 jours — Wave, Orange Money, MTN MoMo.',
  },
  icons: {
    // Favicon local dans /public/ — toujours disponible même serveur fermé
    icon: '/favicon.svg',
    // Fallback Apple (iPhone, iPad)
    apple: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${nunito.variable} ${dmSans.variable}`}>
      <head />
      {/* Le <head> est vide : Next.js injecte automatiquement les favicon depuis metadata.icons */}
      <body className="font-dm bg-fs-cream text-fs-ink antialiased">
        {children}
      </body>
    </html>
  )
}