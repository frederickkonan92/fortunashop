import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — fortunashop',
  description: 'Chiffre d’affaires, commandes et analytics de votre boutique fortunashop.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Dashboard fortunashop',
    description: 'Espace artisan fortunashop',
    type: 'website',
    url: 'https://fortunashop.fr/admin/dashboard',
    siteName: 'fortunashop',
  },
  twitter: { card: 'summary', title: 'Dashboard — fortunashop' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
