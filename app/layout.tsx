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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${nunito.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23E8621A'/><text x='50' y='68' font-size='55' font-weight='900' font-family='Arial' text-anchor='middle' fill='white'>f</text></svg>" />
      </head>
      <body className="font-dm bg-fs-cream text-fs-ink antialiased">
        {children}
      </body>
    </html>
  )
}