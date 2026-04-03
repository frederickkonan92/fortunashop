'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { isCheckoutPaymentModeAllowed } from '@/lib/plan-rules'
import { useCart } from '@/components/cart'
import Link from 'next/link'
import { getThemeColors, getContrastText } from '@/lib/theme'

type CommanderClientProps = {
  slug: string
  initialShop: any | null
}

export default function CommanderClient({ slug, initialShop }: CommanderClientProps) {
  var cart = useCart()

  var [shop, setShop] = useState<any | null>(initialShop)
  var [loading, setLoading] = useState(false)
  var [step, setStep] = useState('form')
  var [confirmation, setConfirmation] = useState<any>(null)
  var [paymentMode, setPaymentMode] = useState('')
  var [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    delivery: 'retrait'
  })

  useEffect(function() {
    setShop(initialShop)
  }, [slug, initialShop])

  if (!shop) {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-4">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-fs-gray mb-4 text-center">Boutique introuvable ou indisponible.</p>
        <Link href="/" className="bg-fs-orange text-white font-bold px-6 py-3 rounded-xl">Accueil fortunashop</Link>
      </div>
    )
  }

  var theme = getThemeColors(shop)

  var handleChange = function(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  var goToPayment = function(e: any) {
    e.preventDefault()
    if (!shop || cart.items.length === 0) return
    setStep('payment')
  }

  var handleSubmit = async function() {
    if (!shop || !paymentMode) return
    setLoading(true)

    // Appel API serveur atomique (RPC PostgreSQL)
    var orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: shop.id,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.delivery === 'domicile' ? form.address : null,
        delivery_mode: form.delivery,
        total: cart.total,
        payment_mode: paymentMode,
        items: cart.items.map(function(item) {
          var parts = item.id.split('-')
          var isVariant = parts.length > 5
          return {
            product_id: isVariant ? parts.slice(0, 5).join('-') : item.id,
            product_name: item.name,
            product_price: item.price,
            quantity: item.quantity,
            variant_value: isVariant ? parts.slice(5).join('-') : null,
          }
        }),
      })
    })

    var orderData = await orderRes.json()

    if (!orderRes.ok || !orderData.success) {
      console.error('Erreur commande:', orderData)
      setLoading(false)
      return
    }

    // Alerte WhatsApp stock bas (vérification après commande)
    for (var i = 0; i < cart.items.length; i++) {
      var item = cart.items[i]
      if (item.stock_quantity != null) {
        var parts2 = item.id.split('-')
        var isVariant2 = parts2.length > 5
        var realId = isVariant2 ? parts2.slice(0, 5).join('-') : item.id

        var prodCheck = await supabase.from('products').select('name, stock_quantity, stock_buffer, stock_alert').eq('id', realId).single()
        if (prodCheck.data && shop?.phone) {
          var p = prodCheck.data
          var onlineStock = Math.max(0, p.stock_quantity - (p.stock_buffer || 0))
          if (onlineStock <= (p.stock_alert || 3)) {
            var msg = onlineStock === 0
              ? '⚠️ RUPTURE DE STOCK fortunashop\n\n' + p.name + ' est épuisé en ligne.\n\nReapprovisionnez votre stock.'
              : '⚠️ Stock bas fortunashop\n\n' + p.name + ' : ' + onlineStock + ' unités restantes.\n\nPensez à réapprovisionner.'
            var waAlert = 'https://wa.me/' + shop.phone + '?text=' + encodeURIComponent(msg)
            window.open(waAlert, '_blank')
          }
        }
      }
    }

    var itemsList = cart.items.map(function(item) {
      return item.name + ' x' + item.quantity
    }).join(', ')

    setConfirmation({
      orderNumber: orderData.order_number,
      shopPhone: shop.phone,
      shopName: shop.name,
      items: itemsList,
      total: cart.total,
      customerName: form.name
    })

    cart.clearCart()
    setStep('confirmation')
    setLoading(false)
  }

  var paymentModes = [
    { id: 'wave', label: 'Wave', icon: '🌊', desc: 'Paiement mobile Wave' },
    { id: 'orange_money', label: 'Orange Money', icon: '🟠', desc: 'Paiement Orange Money' },
    { id: 'mtn_momo', label: 'MTN MoMo', icon: '🟡', desc: 'Paiement MTN Mobile Money' },
    { id: 'cb', label: 'Carte bancaire', icon: '💳', desc: 'Visa / Mastercard' },
  ]

  var availableModes = paymentModes.filter(function(m) {
    return isCheckoutPaymentModeAllowed(m.id, shop?.plan, shop?.addons)
  })

  if (form.delivery === 'retrait') {
    availableModes.push({ id: 'especes', label: 'Especes a la boutique', icon: '💵', desc: 'Payez en especes au retrait' })
  }

  var getPaymentInstructions = function() {
    if (paymentMode === 'wave') {
      return { title: 'Paiement Wave', instructions: 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numero Wave :', number: shop?.wave_number || shop?.phone, steps: ['Ouvrez Wave', 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numero ci-dessus', 'Ajoutez en commentaire : ' + (confirmation?.orderNumber || '')] }
    }
    if (paymentMode === 'orange_money') {
      return { title: 'Paiement Orange Money', instructions: 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numero Orange Money :', number: shop?.orange_number || shop?.phone, steps: ['Tapez #144#', 'Choisissez Transfert', 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numero ci-dessus'] }
    }
    if (paymentMode === 'mtn_momo') {
      return { title: 'Paiement MTN MoMo', instructions: 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numero MTN MoMo :', number: shop?.mtn_number || shop?.phone, steps: ['Tapez *133#', 'Choisissez Transfert', 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numero ci-dessus'] }
    }
    if (paymentMode === 'especes') {
      return { title: 'Paiement en especes', instructions: 'Payez ' + formatPrice(confirmation?.total || 0) + ' au retrait de votre commande.', number: null, steps: ['Rendez-vous a la boutique', 'Presentez le numero de commande', 'Payez en especes'] }
    }
    if (paymentMode === 'cb') {
      return { title: 'Paiement par carte', instructions: 'Le paiement par carte sera disponible prochainement.', number: null, steps: [] }
    }
    return null
  }

  // ECRAN CONFIRMATION
  if (step === 'confirmation' && confirmation) {
    var waText = encodeURIComponent(
      'Nouvelle commande ' + confirmation.orderNumber + '\n'
      + 'Client : ' + confirmation.customerName + '\n'
      + 'Tel : ' + form.phone + '\n'
      + 'Produits : ' + confirmation.items + '\n'
      + 'Montant : ' + confirmation.total.toLocaleString() + ' FCFA\n'
      + 'Paiement : ' + paymentMode + '\n'
      + 'Livraison : ' + (form.delivery === 'retrait' ? 'Retrait en boutique' : form.address)
    )
    var waLink = 'https://wa.me/' + confirmation.shopPhone + '?text=' + waText
    var payInfo = getPaymentInstructions()

    return (
      <div className="min-h-screen px-4 py-8" style={{ background: theme.secondary }}>
        <div className="bg-white rounded-2xl p-6 max-w-md mx-auto shadow-lg">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-nunito font-extrabold text-xl mb-2" style={{ color: theme.text }}>Commande confirmee !</h2>
            <p className="text-fs-gray">Numero : <strong style={{ color: theme.text }}>{confirmation.orderNumber}</strong></p>
            <p className="text-fs-gray text-sm">{confirmation.items}</p>
            <p className="font-nunito font-extrabold text-lg mt-2" style={{ color: theme.primary }}>{formatPrice(confirmation.total)}</p>
          </div>

          {payInfo && paymentMode !== 'especes' && paymentMode !== 'cb' && (
            <div className="rounded-xl p-4 mb-4" style={{ background: theme.secondary }}>
              <p className="font-bold text-sm mb-2">{payInfo.title}</p>
              <p className="text-xs text-fs-gray mb-3">{payInfo.instructions}</p>
              {payInfo.number && (
                <div className="bg-white rounded-lg p-3 text-center mb-3">
                  <p className="font-nunito font-extrabold text-lg">{payInfo.number}</p>
                </div>
              )}
              <div className="space-y-2">
                {payInfo.steps.map(function(s, i) {
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs text-fs-gray">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: theme.primary, color: getContrastText(theme.primary) }}>{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {paymentMode === 'especes' && (
            <div className="bg-fs-green-bg rounded-xl p-4 mb-4 text-center">
              <p className="font-bold text-sm text-fs-green">Payez {formatPrice(confirmation.total)} au retrait</p>
              <p className="text-xs text-fs-gray mt-1">Presentez le numero {confirmation.orderNumber} a la boutique</p>
            </div>
          )}

          <a href={waLink} target="_blank" rel="noopener noreferrer"
             className="block w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-center hover:bg-[#1DA851] transition">
            Confirmer sur WhatsApp avec {confirmation.shopName}
          </a>
          <a href={'/suivi?cmd=' + confirmation.orderNumber} target="_blank"
             className="block w-full font-bold py-3 rounded-xl text-center mt-3"
             style={{ background: theme.text, color: getContrastText(theme.text) }}>
            Suivre ma commande
          </a>
          <Link href={'/boutique/' + slug} className="block mt-4 text-sm font-semibold text-center" style={{ color: theme.primary }}>
            Retour a la boutique
          </Link>
        </div>
      </div>
    )
  }

  // ECRAN PAIEMENT
  if (step === 'payment') {
    return (
      <div className="min-h-screen" style={{ background: theme.secondary }}>
        <header className="bg-white border-b border-fs-border px-4 py-4 flex items-center gap-3">
          <button onClick={function() { setStep('form') }} className="text-fs-gray text-lg">←</button>
          <h1 className="font-nunito font-extrabold text-lg" style={{ color: theme.text }}>Choisir le paiement</h1>
        </header>

        <div className="px-4 pt-4">
          <div className="rounded-xl p-3 flex items-center justify-between mb-4" style={{ background: theme.text, color: getContrastText(theme.text) }}>
            <span className="font-semibold text-sm">Total a payer</span>
            <span className="font-nunito font-extrabold">{formatPrice(cart.total)}</span>
          </div>

          <div className="space-y-2">
            {availableModes.map(function(mode) {
              var isSelected = paymentMode === mode.id
              return (
                <button key={mode.id} type="button" onClick={function() { setPaymentMode(mode.id) }}
                        className={'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition ' +
                          (isSelected ? '' : 'bg-white text-fs-ink border-fs-border')}
                        style={isSelected ? { background: theme.text, color: getContrastText(theme.text), borderColor: theme.text } : undefined}>
                  <span className="text-2xl">{mode.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{mode.label}</p>
                    <p className={'text-xs ' + (isSelected ? 'text-gray-300' : 'text-fs-gray')}>{mode.desc}</p>
                  </div>
                  {isSelected && <span className="ml-auto text-lg">✓</span>}
                </button>
              )
            })}
          </div>

          <button onClick={handleSubmit} disabled={!paymentMode || loading}
                  className="w-full font-bold py-4 rounded-xl mt-6 transition disabled:opacity-50 hover:brightness-110"
                  style={{ background: theme.primary, color: getContrastText(theme.primary) }}>
            {loading ? 'Envoin cours...' : 'Valider ma commande — ' + formatPrice(cart.total)}
          </button>
        </div>
      </div>
    )
  }

  // PANIER VIDE
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: theme.secondary }}>
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-fs-gray mb-4">Votre panier est vide</p>
        <Link href={'/boutique/' + slug} className="font-bold px-6 py-3 rounded-xl" style={{ background: theme.primary, color: getContrastText(theme.primary) }}>Voir le catalogue</Link>
      </div>
    )
  }

  // ECRAN FORMULAIRE
  var formRootStyle: CSSProperties = {
    background: theme.secondary,
    ['--shop-primary' as string]: theme.primary,
  }

  return (
    <div className="min-h-screen" style={formRootStyle}>
      <header className="bg-white border-b border-fs-border px-4 py-4 flex items-center gap-3">
        <Link href={'/boutique/' + slug} className="text-fs-gray text-lg">←</Link>
        <h1 className="font-nunito font-extrabold text-lg" style={{ color: theme.text }}>Finaliser la commande</h1>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {cart.items.map(function(item) {
          return (
            <div key={item.id} className="bg-white border border-fs-border rounded-xl p-3 flex items-center gap-3">
              {/* Image du produit */}
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-fs-border relative">
                {item.image_url ? (
                  item.image_url.indexOf('images.unsplash.com') !== -1 ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                  ) : (
                    <Image src={item.image_url} alt={item.name} fill className="object-contain" sizes="48px" />
                  )
                ) : (
                  <span className="text-xl">🛍️</span>
                )}
              </div>

              {/* Nom + variantes + prix unitaire */}
              <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-2 leading-tight">{item.name}</p>
              <p className="text-xs text-fs-gray mt-0.5">{formatPrice(item.price)} / unité</p>
              </div>

              {/* Contrôles quantité + suppression */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Bouton - : réduit la quantité. Si quantité = 1 → supprime l'article */}
                <button
                  onClick={function() { cart.updateQuantity(item.id, item.quantity - 1) }}
                  className="w-7 h-7 rounded-lg bg-fs-cream text-fs-ink font-bold text-sm flex items-center justify-center">
                  −
                </button>
                {/* Quantité actuelle */}
                <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                {/* Bouton + : augmente la quantité, respecte le stock max */}
                <button
                  onClick={function() {
                    cart.updateQuantity(
                      item.id,
                      item.stock_quantity != null ? Math.min(item.quantity + 1, item.stock_quantity) : item.quantity + 1
                    )
                  }}
                  className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center"
                  style={{ background: theme.text, color: getContrastText(theme.text) }}>
                  +
                </button>
                {/* Bouton poubelle : supprime complètement l'article du panier */}
                <button
                  onClick={function() { cart.removeItem(item.id) }}
                  className="w-7 h-7 rounded-lg bg-red-50 text-red-400 font-bold text-sm flex items-center justify-center ml-1">
                  🗑
                </button>
              </div>

              {/* Sous-total de la ligne */}
              <p className="font-nunito font-extrabold text-sm shrink-0 w-16 text-right" style={{ color: theme.primary }}>
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          )
        })}

        {/* Total général */}
        <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: theme.text, color: getContrastText(theme.text) }}>
          <span className="font-semibold text-sm">Total · {cart.count} article{cart.count > 1 ? 's' : ''}</span>
          <span className="font-nunito font-extrabold">{formatPrice(cart.total)}</span>
        </div>
      </div>

      <form onSubmit={goToPayment} className="px-4 py-5 space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-semibold mb-1">Votre nom</label>
          <input name="name" value={form.name} onChange={handleChange} required
                 className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--shop-primary)]"
                 placeholder="Ex : Kone Aminata" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Telephone</label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                 className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--shop-primary)]"
                 placeholder="07 XX XX XX XX" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Livraison</label>
          <div className="flex gap-3">
            <button type="button" onClick={function() { setForm({ ...form, delivery: 'retrait' }) }}
                    className={'flex-1 py-3 rounded-xl border text-sm font-semibold transition ' +
                      (form.delivery === 'retrait' ? '' : 'bg-white text-fs-gray border-fs-border')}
                    style={form.delivery === 'retrait' ? { background: theme.text, color: getContrastText(theme.text), borderColor: theme.text } : undefined}>
              Retrait
            </button>
            <button type="button" onClick={function() { setForm({ ...form, delivery: 'domicile' }) }}
                    className={'flex-1 py-3 rounded-xl border text-sm font-semibold transition ' +
                      (form.delivery === 'domicile' ? '' : 'bg-white text-fs-gray border-fs-border')}
                    style={form.delivery === 'domicile' ? { background: theme.text, color: getContrastText(theme.text), borderColor: theme.text } : undefined}>
              Domicile
            </button>
          </div>
        </div>
        {form.delivery === 'domicile' && (
          <div>
            <label className="block text-sm font-semibold mb-1">Adresse (commune, quartier, repere)</label>
            <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                      className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--shop-primary)] resize-none"
                      placeholder="Ex : Cocody Angre, Star 8, pres de la pharmacie" />
          </div>
        )}
        <button type="submit"
                className="w-full font-bold py-4 rounded-xl transition hover:brightness-110"
                style={{ background: theme.primary, color: getContrastText(theme.primary) }}>
          Choisir le mode de paiement
        </button>
      </form>
    </div>
  )
}
