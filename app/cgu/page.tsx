import Link from 'next/link'

export default function CGUPage() {
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
        <h1 className="font-nunito font-extrabold text-2xl mb-6">Conditions Générales d'Utilisation</h1>
        <p className="text-fs-gray text-sm leading-relaxed mb-6">
          Date d'effet : 1er avril 2026
        </p>

        <h2 className="font-nunito font-extrabold text-xl mb-4 text-fs-ink">Service fortunashop — Artisans</h2>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Objet</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            fortunashop, édité par Fortuna Digital (SAS au capital de 500 €), fournit un service de création et d'hébergement de boutiques en ligne destiné aux artisans et commerçants. Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de ce service.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Inscription</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            L'artisan s'inscrit via le formulaire de contact sur le site ou par WhatsApp. La création de la boutique est confirmée après paiement des frais de setup. L'artisan s'engage à fournir des informations exactes et à jour.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Abonnement</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            L'abonnement est disponible en formule mensuelle ou annuelle. Les tarifs en vigueur sont indiqués sur le site fortunashop.fr et peuvent évoluer avec un préavis de 30 jours. L'abonnement annuel bénéficie de 2 mois offerts.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Paiement</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            Les frais de setup sont payables à la commande. L'abonnement est payable mensuellement ou annuellement selon la formule choisie. Moyens de paiement acceptés : Wave, Orange Money, MTN MoMo, virement bancaire.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Résiliation</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            L'artisan peut résilier son abonnement à tout moment en contactant fortunashop par email ou WhatsApp. La boutique reste active jusqu'à la fin de la période déjà payée. Aucun remboursement au prorata n'est effectué.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Contenu</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            L'artisan est seul responsable des contenus publiés sur sa boutique (photos, descriptions, prix). fortunashop se réserve le droit de supprimer tout contenu manifestement illicite, trompeur ou contraire aux bonnes mœurs, sans préavis.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Disponibilité</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            fortunashop s'engage à maintenir le service disponible 99% du temps, hors périodes de maintenance planifiée. fortunashop ne garantit aucun résultat commercial lié à l'utilisation du service.
          </p>
        </section>

        <h2 className="font-nunito font-extrabold text-xl mb-4 mt-10 text-fs-ink">Clients finaux — Acheteurs</h2>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Commandes</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            Les commandes sont passées sur les boutiques des artisans hébergées par fortunashop. fortunashop agit en tant qu'intermédiaire technique et n'est pas le vendeur des produits. La relation commerciale est établie directement entre l'acheteur et l'artisan.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Paiement</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            Les paiements sont traités par CinetPay (mobile money) ou directement par l'artisan (espèces au retrait). fortunashop ne collecte ni ne stocke les informations de paiement des clients finaux.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Livraison</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            Les conditions de livraison (délais, zones, frais) sont définies par chaque artisan. fortunashop facilite la coordination logistique mais n'est pas responsable des délais ou des conditions de livraison.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Réclamations</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            Toute réclamation relative à un produit, une livraison ou un paiement doit être adressée directement à l'artisan vendeur via les coordonnées disponibles sur sa boutique.
          </p>
        </section>

        <h2 className="font-nunito font-extrabold text-xl mb-4 mt-10 text-fs-ink">Clauses communes</h2>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Responsabilité</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            fortunashop agit en qualité de prestataire technique. Sa responsabilité est limitée au montant total des services effectivement payés par l'artisan au cours des 12 derniers mois précédant le fait générateur.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Droit applicable</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux compétents sont ceux de Paris, sauf disposition légale contraire.
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-nunito font-bold text-lg mb-3 text-fs-ink">Modification des CGU</h3>
          <p className="text-fs-gray text-sm leading-relaxed">
            fortunashop se réserve le droit de modifier les présentes CGU. Les utilisateurs seront notifiés 30 jours avant l'entrée en vigueur des modifications. L'utilisation continue du service après cette date vaut acceptation des nouvelles CGU.
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
