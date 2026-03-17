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
  title: 'fortunashop — Boutique artisan',
  description: 'Votre boutique en ligne, livrée en 7 jours.',
  openGraph: {
    title: 'fortunashop — Boutique artisan',
    description: 'Boutique en ligne pour artisans. Commandez en quelques secondes.',
    type: 'website',
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