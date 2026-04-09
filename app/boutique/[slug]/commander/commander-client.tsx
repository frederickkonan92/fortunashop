'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { isCheckoutPaymentModeAllowed } from '@/lib/plan-rules'
import { useCart } from '@/components/cart'
import Link from 'next/link'
import { getThemeColors, getLightColor, getContrastText } from '@/lib/theme'
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics'

type CommanderClientProps = {
  slug: string
  initialShop: any | null
}

// Composant champ de formulaire réutilisable
function FormField({ label, value, onChange, placeholder, type, required, name, theme, multiline, rows }: any) {
  if (multiline) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          color: theme.text, marginBottom: 6, letterSpacing: 0.5,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}>
          {label} {required && <span style={{ color: theme.primary }}>*</span>}
        </label>
        <textarea name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required} rows={rows || 3}
          style={{
            width: '100%', padding: '12px 16px',
            borderRadius: 10, border: '1.5px solid #E8DDD0',
            fontSize: 14, color: theme.text,
            background: 'white',
            fontFamily: 'var(--font-outfit), sans-serif',
            transition: 'border-color 0.2s',
            outline: 'none', resize: 'none',
          }}
          onFocus={function(e: any) { e.target.style.borderColor = theme.primary }}
          onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
        />
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: theme.text, marginBottom: 6, letterSpacing: 0.5,
        fontFamily: 'var(--font-outfit), sans-serif',
      }}>
        {label} {required && <span style={{ color: theme.primary }}>*</span>}
      </label>
      <input type={type || 'text'} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        style={{
          width: '100%', padding: '12px 16px',
          borderRadius: 10, border: '1.5px solid #E8DDD0',
          fontSize: 14, color: theme.text,
          background: 'white',
          fontFamily: 'var(--font-outfit), sans-serif',
          transition: 'border-color 0.2s',
          outline: 'none',
        }}
        onFocus={function(e: any) { e.target.style.borderColor = theme.primary }}
        onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
      />
    </div>
  )
}

// Header boutique réutilisable (cohérent catalogue / fiche / commande)
function ShopHeader({ shop, theme }: any) {
  return (
    <header style={{
      background: theme.primary,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <a href={'/boutique/' + shop.slug} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.name}
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: 'white', padding: 3 }} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: theme.accent, color: theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 600,
          }}>
            {shop.name?.charAt(0)}
          </div>
        )}
        <div>
          <div style={{
            fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 600,
            color: getContrastText(theme.primary), letterSpacing: 0.5,
          }}>
            {shop.name}
          </div>
          {shop.description && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.6)',
              letterSpacing: 1, textTransform: 'uppercase', marginTop: 1,
              maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {shop.description}
            </div>
          )}
        </div>
      </a>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, color: 'rgba(255,255,255,0.7)',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50' }} />
        En ligne
      </div>
    </header>
  )
}

// Footer boutique réutilisable
function ShopFooter({ shop, theme }: any) {
  return (
    <footer style={{
      background: getLightColor(theme.primary, 0.04),
      padding: '24px 20px',
      borderTop: '1px solid #E8DDD0',
    }}>
      {(shop?.social_instagram || shop?.social_facebook || shop?.social_whatsapp) && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16,
        }}>
          {shop.social_instagram && (
            <a href={shop.social_instagram.startsWith('http') ? shop.social_instagram : 'https://instagram.com/' + shop.social_instagram}
              target="_blank" rel="noopener noreferrer"
              style={{ color: theme.primary, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              Instagram
            </a>
          )}
          {shop.social_whatsapp && (
            <a href={'https://wa.me/' + shop.social_whatsapp.replace(/[^0-9+]/g, '')}
              target="_blank" rel="noopener noreferrer"
              style={{ color: theme.primary, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              WhatsApp
            </a>
          )}
          {shop.social_facebook && (
            <a href={shop.social_facebook.startsWith('http') ? shop.social_facebook : 'https://facebook.com/' + shop.social_facebook}
              target="_blank" rel="noopener noreferrer"
              style={{ color: theme.primary, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              Facebook
            </a>
          )}
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <a href="https://fortunashop.fr" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: '#7C6C58', textDecoration: 'none' }}>
          Propulsé par <span style={{ color: '#DC5014', fontWeight: 600 }}>fortunashop</span>
        </a>
      </div>
    </footer>
  )
}

// Stepper de progression
function Stepper({ currentStep, theme }: any) {
  var steps = [
    { num: 1, label: 'Panier' },
    { num: 2, label: 'Livraison' },
    { num: 3, label: 'Paiement' },
  ]
  return (
    <div style={{
      padding: '20px 20px 0', background: theme.secondary,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
    }}>
      {steps.map(function(step, idx) {
        var isActive = currentStep >= step.num
        var isCurrent = currentStep === step.num
        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: isActive ? theme.primary : '#E8DDD0',
                color: isActive ? getContrastText(theme.primary) : '#7C6C58',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, margin: '0 auto 4px',
                transition: 'all 0.3s',
                fontFamily: 'var(--font-outfit), sans-serif',
              }}>
                {isActive && step.num < currentStep ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : step.num}
              </div>
              <div style={{
                fontSize: 10, color: isCurrent ? theme.primary : '#7C6C58',
                fontWeight: isCurrent ? 600 : 400, letterSpacing: 0.5,
                fontFamily: 'var(--font-outfit), sans-serif',
              }}>
                {step.label}
              </div>
            </div>
            {idx < 2 && (
              <div style={{
                width: 40, height: 2, margin: '0 8px',
                background: isActive && step.num < currentStep ? theme.primary : '#E8DDD0',
                borderRadius: 1, marginBottom: 16,
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function CommanderClient({ slug, initialShop }: CommanderClientProps) {
  var cart = useCart()

  var [shop, setShop] = useState<any | null>(initialShop)
  var [loading, setLoading] = useState(false)
  var [step, setStep] = useState('form')
  var [confirmation, setConfirmation] = useState<any>(null)
  var [paymentMode, setPaymentMode] = useState('')
  var [orderError, setOrderError] = useState('')
  var [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    delivery: 'retrait'
  })

  useEffect(function() {
    setShop(initialShop)
  }, [slug, initialShop])

  // Analytics : begin_checkout
  useEffect(function() {
    if (initialShop?.id && cart.items.length > 0) {
      trackBeginCheckout(initialShop.id, cart.total, cart.items.length)
    }
  }, [initialShop?.id])

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
      setOrderError(orderData.error || 'Une erreur est survenue lors de la commande. Veuillez réessayer.')
      setLoading(false)
      return
    }
    setOrderError('')

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
              ? '⚠️ RUPTURE DE STOCK fortunashop\n\n' + p.name + ' est épuisé en ligne.\n\nRéapprovisionnez votre stock.'
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

    // Analytics : purchase
    if (shop?.id) trackPurchase(shop.id, orderData.order_number, cart.total, cart.items.length)

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
    availableModes.push({ id: 'especes', label: 'Espèces à la boutique', icon: '💵', desc: 'Payez en espèces au retrait' })
  }

  var getPaymentInstructions = function() {
    if (paymentMode === 'wave') {
      return { title: 'Paiement Wave', instructions: 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numéro Wave :', number: shop?.wave_number || shop?.phone, steps: ['Ouvrez Wave', 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numéro ci-dessus', 'Ajoutez en commentaire : ' + (confirmation?.orderNumber || '')] }
    }
    if (paymentMode === 'orange_money') {
      return { title: 'Paiement Orange Money', instructions: 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numéro Orange Money :', number: shop?.orange_number || shop?.phone, steps: ['Tapez #144#', 'Choisissez Transfert', 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numéro ci-dessus'] }
    }
    if (paymentMode === 'mtn_momo') {
      return { title: 'Paiement MTN MoMo', instructions: 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numéro MTN MoMo :', number: shop?.mtn_number || shop?.phone, steps: ['Tapez *133#', 'Choisissez Transfert', 'Envoyez ' + formatPrice(confirmation?.total || 0) + ' au numéro ci-dessus'] }
    }
    if (paymentMode === 'especes') {
      return { title: 'Paiement en espèces', instructions: 'Payez ' + formatPrice(confirmation?.total || 0) + ' au retrait de votre commande.', number: null, steps: ['Rendez-vous à la boutique', 'Présentez le numéro de commande', 'Payez en espèces'] }
    }
    if (paymentMode === 'cb') {
      return { title: 'Paiement par carte', instructions: 'Le paiement par carte sera disponible prochainement.', number: null, steps: [] }
    }
    return null
  }

  // ─────────────────────────────────────────────
  // ECRAN CONFIRMATION
  // ─────────────────────────────────────────────
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
      <div className="min-h-screen" style={{ background: theme.secondary }}>
        <ShopHeader shop={shop} theme={theme} />

        {/* Cercle de succès + infos */}
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: getLightColor(theme.primary, 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 24, fontWeight: 500, color: theme.text,
            marginBottom: 8,
          }}>
            Commande confirmée
          </h2>

          <p style={{
            fontSize: 14, color: '#7C6C58', marginBottom: 8,
            fontFamily: 'var(--font-outfit), sans-serif',
            maxWidth: 300, lineHeight: 1.6,
          }}>
            Merci pour votre commande. Vous recevrez une confirmation par WhatsApp.
          </p>

          <p style={{
            fontSize: 12, color: '#7C6C58', marginBottom: 24,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            {confirmation.items}
          </p>

          {/* Numéro de commande */}
          <div style={{
            background: getLightColor(theme.primary, 0.08),
            borderRadius: 12, padding: '16px 24px',
            marginBottom: 12, display: 'inline-block',
          }}>
            <div style={{
              fontSize: 11, color: '#7C6C58', letterSpacing: 1,
              textTransform: 'uppercase', marginBottom: 4,
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
              Numéro de commande
            </div>
            <div style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 22, fontWeight: 600, color: theme.primary,
            }}>
              {confirmation.orderNumber}
            </div>
          </div>

          {/* Total */}
          <div style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 20, fontWeight: 600, color: theme.primary,
            marginBottom: 24,
          }}>
            {formatPrice(confirmation.total)}
          </div>
        </div>

        {/* Instructions de paiement */}
        {payInfo && paymentMode !== 'especes' && paymentMode !== 'cb' && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{
              background: 'white', borderRadius: 14, padding: '20px',
              border: '1px solid #E8DDD0',
            }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 8,
                fontFamily: 'var(--font-outfit), sans-serif',
              }}>
                {payInfo.title}
              </div>
              <p style={{ fontSize: 12, color: '#7C6C58', marginBottom: 12 }}>{payInfo.instructions}</p>
              {payInfo.number && (
                <div style={{
                  background: getLightColor(theme.primary, 0.06),
                  borderRadius: 10, padding: '12px', textAlign: 'center', marginBottom: 12,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: 20, fontWeight: 600, color: theme.text,
                  }}>
                    {payInfo.number}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {payInfo.steps.map(function(s: string, i: number) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#7C6C58' }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700,
                        background: theme.primary, color: getContrastText(theme.primary),
                      }}>{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {paymentMode === 'especes' && (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{
              background: getLightColor('#2A7A50', 0.08), borderRadius: 14,
              padding: '16px 20px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#2A7A50' }}>
                Payez {formatPrice(confirmation.total)} au retrait
              </p>
              <p style={{ fontSize: 12, color: '#7C6C58', marginTop: 4 }}>
                Présentez le numéro {confirmation.orderNumber} à la boutique
              </p>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{ padding: '0 20px 24px' }}>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '14px 24px',
              borderRadius: 12, textAlign: 'center', marginBottom: 10,
              background: '#25D366', color: 'white',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
            Confirmer sur WhatsApp avec {confirmation.shopName}
          </a>
          <a href={'/suivi?cmd=' + confirmation.orderNumber} target="_blank"
            style={{
              display: 'block', width: '100%', padding: '14px 24px',
              borderRadius: 12, textAlign: 'center', marginBottom: 10,
              background: theme.text, color: getContrastText(theme.text),
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
            Suivre ma commande
          </a>
          <a href={'/boutique/' + slug}
            style={{
              display: 'inline-block', width: '100%', padding: '12px 32px',
              borderRadius: 10, border: '1.5px solid ' + theme.primary,
              color: theme.primary, fontSize: 14, fontWeight: 500,
              textDecoration: 'none', textAlign: 'center',
              fontFamily: 'var(--font-outfit), sans-serif',
              transition: 'all 0.2s',
            }}>
            Retour à la boutique
          </a>
        </div>

        <ShopFooter shop={shop} theme={theme} />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // ECRAN PAIEMENT
  // ─────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="min-h-screen" style={{ background: theme.secondary }}>
        <ShopHeader shop={shop} theme={theme} />
        <Stepper currentStep={3} theme={theme} />

        {/* Total à payer */}
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: theme.text, color: getContrastText(theme.text),
          }}>
            <span style={{
              fontSize: 14, fontWeight: 500,
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>Total à payer</span>
            <span style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 20, fontWeight: 600,
            }}>{formatPrice(cart.total)}</span>
          </div>
        </div>

        {/* Modes de paiement */}
        <div style={{ padding: '0 20px 20px', background: theme.secondary }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: theme.text,
            marginBottom: 12,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            Mode de paiement
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableModes.map(function(mode) {
              var isSelected = paymentMode === mode.id
              return (
                <button key={mode.id} type="button"
                  onClick={function() { setPaymentMode(mode.id) }}
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: isSelected ? '2px solid ' + theme.primary : '1.5px solid #E8DDD0',
                    background: isSelected ? getLightColor(theme.primary, 0.06) : 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid #D0C8BC',
                    background: isSelected ? theme.primary : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    {isSelected && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                    )}
                  </div>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{mode.icon}</span>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: theme.text,
                      fontFamily: 'var(--font-outfit), sans-serif',
                    }}>
                      {mode.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#7C6C58', marginTop: 2 }}>
                      {mode.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bouton valider */}
        <div style={{
          padding: '16px 20px 24px', background: theme.secondary,
        }}>
          <button type="button"
            onClick={handleSubmit}
            disabled={!paymentMode || loading}
            style={{
              width: '100%', padding: '16px 24px',
              borderRadius: 12, border: 'none',
              background: (!paymentMode || loading) ? '#E0D8D0' : theme.primary,
              color: (!paymentMode || loading) ? '#A0988E' : getContrastText(theme.primary),
              fontSize: 15, fontWeight: 600,
              cursor: (!paymentMode || loading) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-outfit), sans-serif',
              letterSpacing: 0.5, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {loading ? 'Traitement en cours...' : 'Valider ma commande — ' + formatPrice(cart.total)}
          </button>

          {/* Message d'erreur commande */}
          {orderError && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 10,
              background: '#FEF2F2', border: '1px solid #FECACA',
              color: '#DC2626', fontSize: 13, lineHeight: 1.5,
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
              {orderError}
            </div>
          )}

          {/* Bouton retour */}
          <button type="button" onClick={function() { setStep('form') }}
            style={{
              width: '100%', padding: '12px 24px', marginTop: 10,
              borderRadius: 10, border: '1.5px solid #E8DDD0',
              background: 'transparent', color: '#7C6C58',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'var(--font-outfit), sans-serif',
              textAlign: 'center',
            }}>
            Retour
          </button>
        </div>

        <ShopFooter shop={shop} theme={theme} />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // PANIER VIDE
  // ─────────────────────────────────────────────
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: theme.secondary }}>
        <ShopHeader shop={shop} theme={theme} />
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          minHeight: '50vh',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>( )</div>
          <p style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 18, fontWeight: 500, marginBottom: 8, color: theme.text,
          }}>
            Votre panier est vide
          </p>
          <p style={{ fontSize: 13, color: '#7C6C58', marginBottom: 24, lineHeight: 1.6 }}>
            Parcourez nos créations et ajoutez vos coups de cœur
          </p>
          <a href={'/boutique/' + slug}
            style={{
              display: 'inline-block', padding: '12px 32px',
              borderRadius: 10, background: theme.primary,
              color: getContrastText(theme.primary),
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
            Voir le catalogue
          </a>
        </div>
        <ShopFooter shop={shop} theme={theme} />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // ECRAN FORMULAIRE (panier + infos + livraison)
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: theme.secondary }}>
      <ShopHeader shop={shop} theme={theme} />
      <Stepper currentStep={1} theme={theme} />

      {/* Titre section panier */}
      <div style={{
        padding: '20px 20px 12px', background: theme.secondary,
      }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18, fontWeight: 600, color: theme.text,
        }}>
          Votre panier
        </div>
      </div>

      {/* Articles du panier */}
      <div style={{ padding: '0 20px', background: theme.secondary }}>
        {cart.items.map(function(item: any) {
          return (
            <div key={item.id} style={{
              display: 'flex', gap: 14, padding: '14px 0',
              borderBottom: '1px solid #E8DDD0',
              alignItems: 'center',
            }}>
              {/* Image miniature */}
              <div style={{
                width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
                background: '#F5EDE5', flexShrink: 0,
              }}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: '#CCC', fontSize: 10,
                  }}>Photo</div>
                )}
              </div>
              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-cormorant), serif',
                  fontSize: 14, fontWeight: 600, color: theme.text,
                  marginBottom: 2,
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: theme.primary, marginTop: 4,
                  fontFamily: 'var(--font-outfit), sans-serif',
                }}>
                  {formatPrice(item.price)}
                </div>
              </div>
              {/* Quantité */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <button type="button" onClick={function() { cart.updateQuantity(item.id, item.quantity - 1) }}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1.5px solid #E8DDD0', background: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#7C6C58', transition: 'border-color 0.2s',
                  }}>
                  −
                </button>
                <span style={{
                  fontSize: 14, fontWeight: 600, color: theme.text, minWidth: 20, textAlign: 'center',
                  fontFamily: 'var(--font-outfit), sans-serif',
                }}>
                  {item.quantity}
                </span>
                <button type="button" onClick={function() {
                  cart.updateQuantity(
                    item.id,
                    item.stock_quantity != null ? Math.min(item.quantity + 1, item.stock_quantity) : item.quantity + 1
                  )
                }}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: '1.5px solid #E8DDD0', background: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#7C6C58', transition: 'border-color 0.2s',
                  }}>
                  +
                </button>
              </div>
            </div>
          )
        })}

        {/* Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 0',
        }}>
          <span style={{
            fontSize: 14, color: '#7C6C58',
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            Total · {cart.count} article{cart.count > 1 ? 's' : ''}
          </span>
          <span style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 22, fontWeight: 600, color: theme.primary,
          }}>
            {formatPrice(cart.total)}
          </span>
        </div>
      </div>

      {/* Ligne séparatrice */}
      <div style={{ height: 8, background: getLightColor(theme.primary, 0.04) }} />

      {/* Stepper avance visuellement à 2 pour la section infos */}
      {/* Formulaire infos client */}
      <div style={{ padding: '20px 20px 0', background: theme.secondary }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18, fontWeight: 600, color: theme.text,
          marginBottom: 16,
        }}>
          Vos informations
        </div>
      </div>

      <form onSubmit={goToPayment} style={{ padding: '0 20px', background: theme.secondary }}>
        <FormField
          label="Votre nom" name="name" value={form.name}
          onChange={handleChange} placeholder="Ex : Koné Aminata"
          required theme={theme}
        />
        <FormField
          label="Téléphone" name="phone" type="tel" value={form.phone}
          onChange={handleChange} placeholder="07 XX XX XX XX"
          required theme={theme}
        />

        {/* Mode de livraison */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: theme.text,
            marginBottom: 8, letterSpacing: 0.5,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            Mode de livraison <span style={{ color: theme.primary }}>*</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'retrait', label: 'Retrait en boutique', desc: 'Venez chercher votre commande' },
              { id: 'domicile', label: 'Livraison à domicile', desc: 'Recevez chez vous' },
            ].map(function(option) {
              var isSelected = form.delivery === option.id
              return (
                <button key={option.id} type="button"
                  onClick={function() { setForm({ ...form, delivery: option.id }) }}
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: isSelected ? '2px solid ' + theme.primary : '1.5px solid #E8DDD0',
                    background: isSelected ? getLightColor(theme.primary, 0.06) : 'white',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid #D0C8BC',
                    background: isSelected ? theme.primary : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                    {isSelected && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                    )}
                  </div>
                  <div>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: theme.text,
                      fontFamily: 'var(--font-outfit), sans-serif',
                    }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#7C6C58', marginTop: 2 }}>
                      {option.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {form.delivery === 'domicile' && (
          <FormField
            label="Adresse (commune, quartier, repère)" name="address"
            value={form.address} onChange={handleChange}
            placeholder="Ex : Cocody Angre, Star 8, près de la pharmacie"
            required multiline rows={3} theme={theme}
          />
        )}

        {/* Bouton suivant */}
        <div style={{ padding: '8px 0 24px' }}>
          <button type="submit"
            style={{
              width: '100%', padding: '16px 24px',
              borderRadius: 12, border: 'none',
              background: theme.primary,
              color: getContrastText(theme.primary),
              fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-outfit), sans-serif',
              letterSpacing: 0.5, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
            onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
          >
            Choisir le mode de paiement
          </button>
        </div>
      </form>

      <ShopFooter shop={shop} theme={theme} />
    </div>
  )
}
