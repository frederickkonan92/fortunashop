'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function OnboardingWizard({ shop }: { shop: any }) {
  var [steps, setSteps] = useState({
    products: false,
    test: false,
    share: false,
    firstOrder: false,
  })
  var [copied, setCopied] = useState(false)

  var storageKey = 'onboarding-' + shop?.id

  var persistSteps = function(next: any) {
    try {
      if (typeof window === 'undefined' || !storageKey) return
      localStorage.setItem(storageKey, JSON.stringify(next))
    } catch (e) {}
  }

  var markStep = function(stepKey: string, value: boolean) {
    setSteps(function(prev) {
      var next = { ...prev, [stepKey]: value }
      persistSteps(next)
      return next
    })
  }

  // Vérifie si l'artisan a déjà reçu une commande
  useEffect(function() {
    // Recharge les cases déjà validées (quand l'utilisateur revient après une redirection)
    try {
      if (typeof window !== 'undefined' && storageKey) {
        var raw = localStorage.getItem(storageKey)
        if (raw) {
          var parsed = JSON.parse(raw)
          setSteps(function(prev) {
            return {
              ...prev,
              products: !!parsed.products,
              test: !!parsed.test,
              share: !!parsed.share,
            }
          })
        }
      }
    } catch (e) {}

    async function checkFirstOrder() {
      var { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shop.id)

      if (!error && count != null && count > 0) {
        markStep('firstOrder', true)
      }
    }
    checkFirstOrder()
  }, [shop.id])

  var completedCount = Object.values(steps).filter(Boolean).length
  var allDone = completedCount === 4
  var shopUrl = 'https://fortunashop.fr/boutique/' + shop.slug

  var handleCopyLink = function() {
    navigator.clipboard.writeText(shopUrl)
    setCopied(true)
    setTimeout(function() { setCopied(false) }, 2000)
  }

  var handleComplete = async function() {
    await supabase
      .from('shops')
      .update({ onboarding_completed: true })
      .eq('id', shop.id)

    // Recharge la page pour afficher le dashboard
    window.location.reload()
  }

  var whatsappMessage = encodeURIComponent(
    '🎉 Ma boutique en ligne est ouverte !\n\n'
    + '🛍️ Découvrez mes produits et commandez directement ici :\n'
    + '👉 ' + shopUrl + '\n\n'
    + '📱 Paiement Wave, Orange Money ou MTN MoMo\n'
    + '🚚 Livraison à domicile ou retrait en boutique'
  )

  return (
    <div className="min-h-screen bg-fs-cream px-4 py-6">
      <div className="max-w-md mx-auto">

        {/* En-tête */}
        <div className="mb-6">
          <h1 className="font-nunito font-extrabold text-xl text-fs-ink mb-1">
            Bienvenue {shop.owner_name || ''} !
          </h1>
          <p className="text-sm text-fs-gray">
            Votre boutique <strong className="text-fs-orange">{shop.name}</strong> est prête. 4 étapes pour démarrer.
          </p>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-1.5 mb-6">
          {[0, 1, 2, 3].map(function(i) {
            return (
              <div key={i} className={'flex-1 h-1 rounded-full ' + (i < completedCount ? 'bg-green-500' : 'bg-fs-border')} />
            )
          })}
          <span className="text-xs text-fs-gray ml-2">{completedCount}/4</span>
        </div>

        {/* Étape 1 — Vérifier les produits */}
        <div
          onClick={function() { markStep('products', true) }}
          className={'rounded-xl p-4 mb-2 border cursor-pointer transition ' +
            (steps.products
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-fs-border hover:border-fs-orange')}
        >
          <div className="flex items-start gap-3">
            <div className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ' +
              (steps.products ? 'bg-green-500 text-white' : 'border-2 border-fs-orange text-fs-orange')}>
              {steps.products ? '✓' : '1'}
            </div>
            <div>
              <p className="font-semibold text-sm text-fs-ink">Vérifier vos produits</p>
              <p className="text-xs text-fs-gray mt-1">Vérifiez que vos photos, prix et descriptions sont corrects.</p>
              <Link
                href="/admin/produits"
                onClick={function() { markStep('products', true) }}
                className="inline-block mt-2 text-xs font-semibold text-fs-orange hover:underline"
              >
                Voir mes produits →
              </Link>
            </div>
          </div>
        </div>

        {/* Étape 2 — Tester la boutique */}
        <div
          onClick={function() { markStep('test', true) }}
          className={'rounded-xl p-4 mb-2 border cursor-pointer transition ' +
            (steps.test
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-fs-border hover:border-fs-orange')}
        >
          <div className="flex items-start gap-3">
            <div className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ' +
              (steps.test ? 'bg-green-500 text-white' : 'border-2 border-fs-orange text-fs-orange')}>
              {steps.test ? '✓' : '2'}
            </div>
            <div>
              <p className="font-semibold text-sm text-fs-ink">Tester votre boutique</p>
              <p className="text-xs text-fs-gray mt-1">Ouvrez votre boutique comme un client le ferait.</p>
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={function() { markStep('test', true) }}
                className="inline-block mt-2 text-xs font-semibold text-fs-orange hover:underline"
              >
                Voir ma boutique →
              </a>
            </div>
          </div>
        </div>

        {/* Étape 3 — Partager le lien */}
        <div
          className={'rounded-xl p-4 mb-2 border transition ' +
            (steps.share
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-fs-border')}
        >
          <div className="flex items-start gap-3">
            <div className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ' +
              (steps.share ? 'bg-green-500 text-white' : 'border-2 border-fs-orange text-fs-orange')}>
              {steps.share ? '✓' : '3'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-fs-ink">Partager votre lien</p>
              <p className="text-xs text-fs-gray mt-1">Envoyez votre lien boutique sur WhatsApp et Instagram.</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={function() {
                    handleCopyLink()
                    markStep('share', true)
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-fs-ink text-white hover:bg-fs-orange transition"
                >
                  {copied ? 'Copié ✓' : 'Copier le lien'}
                </button>
                <a
                  href={'https://wa.me/?text=' + whatsappMessage}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={function() { markStep('share', true) }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#1DA851] transition"
                >
                  Partager sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Étape 4 — Première commande */}
        <div
          className={'rounded-xl p-4 mb-6 border transition ' +
            (steps.firstOrder
              ? 'bg-green-50 border-green-200'
              : 'bg-white border-fs-border opacity-60')}
        >
          <div className="flex items-start gap-3">
            <div className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ' +
              (steps.firstOrder ? 'bg-green-500 text-white' : 'border-2 border-fs-border text-fs-gray')}>
              {steps.firstOrder ? '✓' : '4'}
            </div>
            <div>
              <p className="font-semibold text-sm text-fs-ink">Recevoir votre première commande</p>
              <p className="text-xs text-fs-gray mt-1">
                {steps.firstOrder
                  ? 'Félicitations ! Vous avez reçu votre première commande !'
                  : 'Vous serez notifié par WhatsApp dès qu\'un client commande.'}
              </p>
            </div>
          </div>
        </div>

        {/* Bouton accéder au dashboard */}
        {allDone ? (
          <button
            onClick={handleComplete}
            className="w-full bg-fs-orange text-white font-bold py-4 rounded-xl hover:bg-fs-orange-deep transition"
          >
            Accéder à mon tableau de bord
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="w-full bg-white text-fs-gray font-semibold py-3 rounded-xl border border-fs-border text-sm hover:text-fs-orange hover:border-fs-orange transition"
          >
            Passer et accéder au tableau de bord
          </button>
        )}

        {/* Aide */}
        <div className="mt-4 rounded-xl bg-white border border-fs-border p-4">
          <p className="text-xs text-fs-gray">Besoin d'aide ? Envoyez-nous un message sur WhatsApp</p>
          <a
            href="https://wa.me/+2250700000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-green-600 mt-1 block"
          >
            Contacter le support
          </a>
        </div>
      </div>
    </div>
  )
}
