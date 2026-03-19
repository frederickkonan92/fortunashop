'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  var [faqOpen, setFaqOpen] = useState<number | null>(null)
  var whatsappNumber = '+33664765696'
  var whatsappLink = 'https://wa.me/33664765696'

  var plans = [
    {
      name: 'Starter',
      price: '35 000',
      color: 'border-fs-border',
      badge: '',
      features: [
        '20 produits max',
        '10 modifications/mois',
        '1 livreur',
        'Paiement Wave inclus',
        'Suivi commande client',
        'Support WhatsApp 48h',
      ]
    },
    {
      name: 'Pro',
      price: '55 000',
      color: 'border-fs-orange',
      badge: '⭐ Populaire',
      features: [
        '50 produits max',
        '25 modifications/mois',
        '3 livreurs',
        'Wave + Orange Money + MTN MoMo',
        'Dashboard ventes + analytics',
        'Support WhatsApp prioritaire 24h',
        '2h de formation incluse',
      ]
    },
    {
      name: 'Premium',
      price: '85 000',
      color: 'border-fs-ink',
      badge: '👑 Tout inclus',
      features: [
        'Produits illimités',
        'Modifications illimitées',
        'Livreurs illimités',
        'CB Stripe international',
        'Dashboard + recommandations IA',
        'Rapport mensuel WhatsApp',
        'Coaching mensuel 1h',
        'Support prioritaire',
      ]
    }
  ]

  var addons = [
    { name: 'Pack Pilotage', price: '15 000', desc: 'Dashboard CA + analytics visiteurs' },
    { name: 'Gestion Stock', price: '10 000', desc: 'Stock temps réel + alertes automatiques' },
    { name: 'Bundle Stock + Pilotage', price: '20 000', desc: 'Les deux packs réunis' },
    { name: 'Lien Livreur', price: '10 000', desc: 'Confirmation livraison 1 clic' },
    { name: 'CinetPay', price: '75 000', desc: 'Setup paiement Orange Money + MTN MoMo' },
    { name: 'Stripe CB', price: '90 000', desc: 'Setup paiement carte bancaire internationale' },
  ]

  var steps = [
    { num: '01', title: 'Envoyez votre catalogue', desc: 'Partagez vos photos, prix et logo via WhatsApp. Aucune compétence technique requise.' },
    { num: '02', title: 'On construit votre boutique', desc: 'Notre équipe configure votre boutique professionnelle en moins de 7 jours.' },
    { num: '03', title: 'Vous vendez en ligne', desc: 'Recevez des commandes, gérez vos stocks et encaissez directement sur votre téléphone.' },
  ]

  var faqs = [
    { q: 'Combien de temps pour avoir ma boutique ?', a: 'Votre boutique est livrée en 7 jours maximum après réception de votre catalogue et logo.' },
    { q: 'Est-ce que je dois savoir coder ?', a: 'Non. Vous nous envoyez vos photos et prix via WhatsApp. On s\'occupe de tout.' },
    { q: 'Quels modes de paiement sont acceptés ?', a: 'Wave est inclus dans tous les plans. Orange Money et MTN MoMo sont disponibles en add-on CinetPay. La carte bancaire est disponible avec Stripe (plan Premium).' },
    { q: 'Puis-je modifier mon catalogue moi-même ?', a: 'Oui, depuis votre espace admin. Le nombre de modifications mensuelles dépend de votre plan (10 pour Starter, 25 pour Pro, illimité pour Premium).' },
    { q: 'La livraison est-elle incluse ?', a: 'Non. Nous intégrons votre livreur existant. Nous pouvons également vous mettre en relation avec nos partenaires livreurs à Abidjan.' },
    { q: 'Puis-je changer de plan ?', a: 'Oui, à tout moment. Contactez-nous sur WhatsApp et nous gérons la migration sans interruption de service.' },
  ]

  return (
    <div className="min-h-screen bg-fs-cream font-dm">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white border-b border-fs-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-nunito font-black text-xl text-fs-orange">fortunashop</span>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-sm font-semibold text-fs-gray hidden sm:block">Tarifs</a>
            <a href="#contact" className="text-sm font-semibold text-fs-gray hidden sm:block">Contact</a>
            <Link href="/admin/login"
                  className="bg-fs-orange text-white text-sm font-bold px-4 py-2 rounded-xl">
              Se connecter
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-4 py-16 max-w-5xl mx-auto text-center">
        <div className="inline-block bg-fs-orange-pale text-fs-orange text-xs font-bold px-4 py-2 rounded-full mb-6">
          🚀 Boutique livrée en 7 jours
        </div>
        <h1 className="font-nunito font-black text-3xl sm:text-5xl text-fs-ink mb-6 leading-tight">
          Votre boutique professionnelle<br />
          <span className="text-fs-orange">prête en 7 jours</span>
        </h1>
        <p className="text-fs-gray text-lg max-w-xl mx-auto mb-4 leading-relaxed">
          Acceptez les commandes, gérez vos stocks et encaissez via Wave, Orange Money et MTN MoMo.
        </p>
        <p className="text-fs-ink font-semibold text-lg mb-8">
          Communiquez-nous votre catalogue. On construit votre boutique.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={whatsappLink + '?text=' + encodeURIComponent('Bonjour, je souhaite créer ma boutique fortunashop 🛍️')}
             target="_blank"
             className="bg-fs-orange text-white font-bold px-8 py-4 rounded-xl text-center hover:bg-fs-orange-deep transition">
            Démarrer maintenant →
          </a>
          <a href="#pricing"
             className="bg-white text-fs-ink font-bold px-8 py-4 rounded-xl border border-fs-border text-center hover:bg-fs-cream transition">
            Voir les tarifs
          </a>
        </div>
        <p className="text-xs text-fs-gray mt-4">Setup unique à partir de 100 000 FCFA · Sans engagement</p>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="bg-fs-ink px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-nunito font-black text-2xl sm:text-3xl text-white text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(function(step) {
              return (
                <div key={step.num} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-fs-orange flex items-center justify-center font-nunito font-black text-xl text-white mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-nunito font-extrabold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-nunito font-black text-2xl sm:text-3xl text-fs-ink mb-3">
            Choisissez votre plan
          </h2>
          <p className="text-fs-gray">Setup unique : <strong className="text-fs-ink">100 000 FCFA</strong> · Puis abonnement mensuel</p>
        </div>

        {/* PLANS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {plans.map(function(plan) {
            return (
              <div key={plan.name}
                   className={'bg-white rounded-2xl border-2 p-6 flex flex-col ' + plan.color}>
                {plan.badge && (
                  <span className="text-xs font-bold text-fs-orange bg-fs-orange-pale px-3 py-1 rounded-full self-start mb-3">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-nunito font-black text-xl text-fs-ink mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="font-nunito font-black text-3xl text-fs-orange">{plan.price}</span>
                  <span className="text-fs-gray text-sm"> FCFA/mois</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(function(f, i) {
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-fs-gray">
                        <span className="text-fs-orange mt-0.5 shrink-0">✓</span>
                        {f}
                      </li>
                    )
                  })}
                </ul>
                <a href={whatsappLink + '?text=' + encodeURIComponent('Bonjour, je suis intéressé par le plan ' + plan.name + ' de fortunashop 🛍️')}
                   target="_blank"
                   className={'block w-full font-bold py-3 rounded-xl text-center transition ' +
                     (plan.name === 'Pro'
                       ? 'bg-fs-orange text-white hover:bg-fs-orange-deep'
                       : 'bg-fs-cream text-fs-ink hover:bg-fs-border')}>
                  Choisir {plan.name} →
                </a>
              </div>
            )
          })}
        </div>

        {/* ADD-ONS */}
        <div className="bg-white rounded-2xl border border-fs-border p-6">
          <h3 className="font-nunito font-extrabold text-lg text-fs-ink mb-1">Add-ons disponibles</h3>
          <p className="text-xs text-fs-gray mb-5">Ajoutez des fonctionnalités à la carte sur n'importe quel plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addons.map(function(addon) {
              return (
                <div key={addon.name} className="flex items-center justify-between bg-fs-cream rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm text-fs-ink">{addon.name}</p>
                    <p className="text-xs text-fs-gray">{addon.desc}</p>
                  </div>
                  <span className="font-nunito font-extrabold text-sm text-fs-orange shrink-0 ml-3">
                    {addon.price} F
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-nunito font-black text-2xl sm:text-3xl text-fs-ink text-center mb-10">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {faqs.map(function(faq, i) {
              return (
                <div key={i} className="border border-fs-border rounded-xl overflow-hidden">
                  <button
                    onClick={function() { setFaqOpen(faqOpen === i ? null : i) }}
                    className="w-full flex items-center justify-between px-5 py-4 text-left">
                    <span className="font-semibold text-sm text-fs-ink">{faq.q}</span>
                    <span className="text-fs-orange font-bold text-lg ml-3 shrink-0">
                      {faqOpen === i ? '−' : '+'}
                    </span>
                  </button>
                  {faqOpen === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-fs-gray leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="px-4 py-16 max-w-5xl mx-auto">
        <div className="bg-fs-ink rounded-2xl p-8 text-center">
          <h2 className="font-nunito font-black text-2xl sm:text-3xl text-white mb-3">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Contactez-nous sur WhatsApp ou par email. Nous vous répondons sous 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={whatsappLink + '?text=' + encodeURIComponent('Bonjour, je souhaite créer ma boutique fortunashop 🛍️')}
               target="_blank"
               className="bg-[#25D366] text-white font-bold px-8 py-4 rounded-xl text-center hover:bg-[#1DA851] transition">
              💬 WhatsApp : {whatsappNumber}
            </a>
            <a href="mailto:contact@fortunashop.fr"
               className="bg-fs-orange text-white font-bold px-8 py-4 rounded-xl text-center hover:bg-fs-orange-deep transition">
              ✉️ contact@fortunashop.fr
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-fs-border px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-nunito font-black text-lg text-fs-orange">fortunashop</span>
          <div className="flex gap-6 text-xs text-fs-gray">
            <a href="/mentions-legales" className="hover:text-fs-ink transition">Mentions légales</a>
            <a href="/cgu" className="hover:text-fs-ink transition">CGU</a>
            <a href="/confidentialite" className="hover:text-fs-ink transition">Confidentialité</a>
          </div>
          <p className="text-xs text-fs-gray">© 2026 fortunashop. Tous droits réservés.</p>
        </div>
      </footer>

    </div>
  )
}