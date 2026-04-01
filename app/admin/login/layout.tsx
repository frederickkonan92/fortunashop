import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion artisan — fortunashop',
  description: 'Accédez à votre espace admin fortunashop pour gérer produits et commandes.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Connexion — fortunashop',
    type: 'website',
    url: 'https://fortunashop.fr/admin/login',
    siteName: 'fortunashop',
  },
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
