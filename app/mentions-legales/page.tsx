import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales — fortunashop',
  description: 'Éditeur fortunashop, hébergement, propriété intellectuelle et contact Fortuna Digital.',
  openGraph: {
    title: 'Mentions légales — fortunashop',
    description: 'Informations légales fortunashop.fr',
    type: 'website',
    url: 'https://fortunashop.fr/mentions-legales',
    siteName: 'fortunashop',
  },
  twitter: { card: 'summary', title: 'Mentions légales — fortunashop' },
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-white border-b border-fs-border px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-nunito font-black text-xl">
            <span className="text-fs-ink">fortuna</span>
            <span className="text-fs-orange">shop</span>
          </Link>
          <Link href="/" className="text-sm text-fs-gray hover:text-fs-orange">
            ← Retour
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-nunito font-extrabold text-2xl mb-6">Mentions légales</h1>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Éditeur du site</h2>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            Le site <strong>fortunashop.fr</strong> est édité par :
          </p>
          <ul className="text-fs-gray text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Dénomination sociale : <strong>Fortuna Digital</strong></li>
            <li>Forme juridique : SAS (Société par Actions Simplifiée)</li>
            <li>Capital social : 500 €</li>
            <li>Siège social : [En cours de définition]</li>
            <li>SIRET : [En cours d'immatriculation]</li>
            <li>RCS : [En cours d'immatriculation]</li>
            <li>Directeur Général : Frédérick Konan</li>
            <li>Présidente : [Prénom Nom — à compléter]</li>
            <li>Email : <a href="mailto:contact@fortunashop.fr" className="text-fs-orange hover:underline">contact@fortunashop.fr</a></li>
            <li>Site web : <a href="https://fortunashop.fr" className="text-fs-orange hover:underline">https://fortunashop.fr</a></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Hébergeur</h2>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            Le site est hébergé par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
          </p>
          <p className="text-fs-gray text-sm leading-relaxed">
            La base de données est hébergée par <strong>Supabase</strong> (infrastructure AWS, région eu-west).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Propriété intellectuelle</h2>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            <strong>fortunashop</strong> est une marque commerciale de Fortuna Digital.
          </p>
          <p className="text-fs-gray text-sm leading-relaxed">
            L'ensemble des contenus présents sur le site (textes, images, logos, éléments graphiques, code source) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable écrite de Fortuna Digital est interdite.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Données personnelles</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Les informations relatives à la collecte et au traitement des données personnelles sont détaillées dans notre{' '}
            <Link href="/confidentialite" className="text-fs-orange hover:underline">politique de confidentialité</Link>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Cookies</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Le site utilise uniquement des cookies techniques nécessaires à son bon fonctionnement (session, préférences). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Crédits</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Site conçu et développé par <strong>Fortuna Digital</strong>.
          </p>
        </section>
      </main>

      <footer className="bg-[#2C1A0E] text-white/60 py-10">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <div className="font-nunito font-black text-xl">
            <span className="text-white">fortuna</span>
            <span className="text-fs-orange">shop</span>
          </div>
          <div className="flex gap-6 justify-center flex-wrap text-sm">
            <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
            <Link href="/cgu" className="hover:text-white">CGU</Link>
            <Link href="/confidentialite" className="hover:text-white">Confidentialité</Link>
            <a href="mailto:contact@fortunashop.fr" className="hover:text-white">Contact</a>
          </div>
          <p className="text-sm">© 2026 fortunashop — Une marque Fortuna Digital</p>
        </div>
      </footer>
    </div>
  )
}
