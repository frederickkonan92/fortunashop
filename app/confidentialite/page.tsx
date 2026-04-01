import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — fortunashop',
  description: 'Données personnelles, cookies et vos droits sur fortunashop.fr.',
  openGraph: {
    title: 'Confidentialité — fortunashop',
    description: 'Politique de confidentialité fortunashop',
    type: 'website',
    url: 'https://fortunashop.fr/confidentialite',
    siteName: 'fortunashop',
  },
  twitter: { card: 'summary', title: 'Confidentialité — fortunashop' },
}

export default function ConfidentialitePage() {
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
        <h1 className="font-nunito font-extrabold text-2xl mb-6">Politique de confidentialité</h1>
        <p className="text-fs-gray text-sm leading-relaxed mb-6">
          Dernière mise à jour : mars 2026
        </p>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Responsable du traitement</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Le responsable du traitement des données personnelles est <strong>Fortuna Digital</strong>, SAS au capital de 500 €, joignable à l'adresse{' '}
            <a href="mailto:contact@fortunashop.fr" className="text-fs-orange hover:underline">contact@fortunashop.fr</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Données collectées</h2>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            <strong>Artisans :</strong> nom, email, téléphone, informations de paiement, contenu de la boutique (photos, descriptions de produits, prix).
          </p>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            <strong>Clients finaux :</strong> nom, téléphone, adresse de livraison (uniquement en cas de livraison à domicile).
          </p>
          <p className="text-fs-gray text-sm leading-relaxed">
            <strong>Navigation :</strong> pages visitées, durée de visite (collectées via la table page_views, sans identification personnelle).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Finalités du traitement</h2>
          <ul className="text-fs-gray text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Fourniture du service de boutique en ligne aux artisans</li>
            <li>Communication avec les artisans (support WhatsApp, notifications)</li>
            <li>Notification et suivi des commandes clients</li>
            <li>Amélioration du service (analytics anonymisées)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Base légale</h2>
          <ul className="text-fs-gray text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li><strong>Exécution du contrat :</strong> traitement des données des artisans dans le cadre de la fourniture du service</li>
            <li><strong>Intérêt légitime :</strong> analytics et amélioration du service</li>
            <li><strong>Consentement :</strong> newsletter (si applicable)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Destinataires des données</h2>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            Les données personnelles peuvent être partagées avec les prestataires suivants, strictement dans le cadre de la fourniture du service :
          </p>
          <ul className="text-fs-gray text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — hébergement de la base de données</li>
            <li><strong>Vercel</strong> — hébergement du site web</li>
            <li><strong>CinetPay</strong> — traitement des paiements mobile money</li>
            <li><strong>WhatsApp / Meta</strong> — notifications aux artisans</li>
          </ul>
          <p className="text-fs-gray text-sm leading-relaxed mt-2">
            Aucune donnée personnelle n'est vendue à des tiers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Durée de conservation</h2>
          <ul className="text-fs-gray text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li><strong>Données artisans :</strong> durée du contrat + 3 ans</li>
            <li><strong>Données commandes :</strong> 5 ans (obligation légale comptable)</li>
            <li><strong>Données de navigation :</strong> 13 mois</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Vos droits</h2>
          <p className="text-fs-gray text-sm leading-relaxed mb-2">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="text-fs-gray text-sm leading-relaxed list-disc pl-5 space-y-1">
            <li>Droit d'accès à vos données personnelles</li>
            <li>Droit de rectification des données inexactes</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la portabilité de vos données</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit d'opposition au traitement</li>
          </ul>
          <p className="text-fs-gray text-sm leading-relaxed mt-2">
            Pour exercer vos droits, envoyez un email à{' '}
            <a href="mailto:contact@fortunashop.fr" className="text-fs-orange hover:underline">contact@fortunashop.fr</a>.
            Nous nous engageons à vous répondre dans un délai de 30 jours.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Transferts hors Union européenne</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Supabase et Vercel peuvent transférer des données aux États-Unis dans le cadre de l'hébergement du service. Ces transferts sont encadrés par les clauses contractuelles types adoptées par la Commission européenne, garantissant un niveau de protection adéquat.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Cookies</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Le site utilise uniquement des cookies techniques nécessaires à son bon fonctionnement (session, préférences utilisateur). Aucun cookie publicitaire ni de tracking tiers n'est déposé.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Sécurité</h2>
          <p className="text-fs-gray text-sm leading-relaxed">
            Nous mettons en œuvre des mesures techniques appropriées pour protéger vos données : chiffrement HTTPS pour toutes les communications, Row Level Security (RLS) sur la base de données Supabase, et accès restreint aux données personnelles.
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
