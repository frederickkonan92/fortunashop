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
  description: 'Votre boutique en ligne, livrée en 7 jours',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${nunito.variable} ${dmSans.variable}`}>
      <body className="font-dm bg-fs-cream text-fs-ink antialiased">
        {children}
      </body>
    </html>
  )
}