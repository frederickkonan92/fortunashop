'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import AdminNav from '../nav'

export default function VentesPage() {
  var [shop, setShop] = useState<any>(null)
  var [products, setProducts] = useState<any[]>([])
  var [sales, setSales] = useState<any[]>([])
  var [loading, setLoading] = useState(false)
  var [showForm, setShowForm] = useState(false)

  // Panier de la vente physique : liste de { product, quantity }
  var [cart, setCart] = useState<any[]>([])
  var [paymentMode, setPaymentMode] = useState('especes')

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      // Charge les produits actifs pour la saisie vente
      var prodRes = await supabase.from('products').select('*')
        .eq('shop_id', shopRes.data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      setProducts(prodRes.data || [])

      // Charge l'historique des ventes physiques
      var salesRes = await supabase.from('physical_sales').select('*')
        .eq('shop_id', shopRes.data.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setSales(salesRes.data || [])
    }
  }

  // Ajoute ou retire un produit du panier vente physique
  var updateCart = function(product: any, qty: number) {
    if (qty <= 0) {
      // Supprime le produit du panier si qty = 0
      setCart(cart.filter(function(i) { return i.product.id !== product.id }))
      return
    }
    var existing = cart.find(function(i) { return i.product.id === product.id })
    if (existing) {
      setCart(cart.map(function(i) {
        if (i.product.id === product.id) return { ...i, quantity: qty }
        return i
      }))
    } else {
      setCart([...cart, { product, quantity: qty }])
    }
  }

  var getQty = function(productId: string) {
    var item = cart.find(function(i) { return i.product.id === productId })
    return item ? item.quantity : 0
  }

  // Total du panier vente physique
  var total = cart.reduce(function(sum, i) { return sum + (i.product.price * i.quantity) }, 0)

  var handleSubmit = async function() {
    if (!shop || cart.length === 0) return
    setLoading(true)

    // Insère chaque ligne du panier dans physical_sales
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i]
      await supabase.from('physical_sales').insert({
        shop_id: shop.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        payment_mode: paymentMode,
        total: item.product.price * item.quantity
      })

      // Déduit le stock si le produit en a un
      if (item.product.stock_quantity != null) {
        var newStock = Math.max(0, item.product.stock_quantity - item.quantity)
        await supabase.from('products').update({
          stock_quantity: newStock,
          // Désactive le produit si stock = 0
          is_active: newStock > 0
        }).eq('id', item.product.id)
      }
    }

    // Réinitialise le formulaire
  // Vérifie les alertes stock après vente physique
// Vérifie les alertes stock après vente physique
var alertMessages: string[] = []
for (var j = 0; j < cart.length; j++) {
  var soldItem = cart[j]
  var prodRes = await supabase.from('products').select('*').eq('id', soldItem.product.id).single()
  if (prodRes.data) {
    var prod = prodRes.data
    var stockOnline = prod.stock_quantity != null
      ? Math.max(0, prod.stock_quantity - (prod.stock_buffer || 0))
      : null
    if (stockOnline != null && stockOnline === 0) {
      alertMessages.push('🔴 ' + prod.name + ' : RUPTURE DE STOCK en ligne')
    } else if (stockOnline != null && stockOnline <= (prod.stock_alert || 3)) {
      alertMessages.push('🟠 ' + prod.name + ' : ' + stockOnline + ' unité(s) restante(s) en ligne')
    }
  }
}

setCart([])
setPaymentMode('especes')
setShowForm(false)
loadData()
setLoading(false)

// Construit le lien WhatsApp AVANT alert() pour éviter le blocage Safari
var waAlertUrl = ''
if (alertMessages.length > 0 && shop?.phone) {
  var alertText = '⚠️ Alerte stock fortunashop\n\n' + alertMessages.join('\n') + '\n\nPensez à réapprovisionner votre stock sur fortunashop.fr/admin/produits'
  waAlertUrl = 'https://wa.me/' + shop.phone + '?text=' + encodeURIComponent(alertText)
}

alert('✅ Vente enregistrée ! Stock mis à jour.')

// Ouvre WhatsApp APRÈS alert() — évite le blocage popup Safari
if (waAlertUrl) {
  window.open(waAlertUrl, '_blank')
}   }

  var paymentModes = [
    { id: 'especes', label: 'Espèces', icon: '💵' },
    { id: 'wave', label: 'Wave', icon: '🌊' },
    { id: 'orange_money', label: 'Orange Money', icon: '🟠' },
    { id: 'mtn_momo', label: 'MTN MoMo', icon: '🟡' },
  ]

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">Ventes physiques</h1>
            <p className="text-xs text-gray-500">Boutique {shop?.name}</p>
          </div>
          <button
            onClick={function() { setShowForm(!showForm) }}
            className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">
            {showForm ? 'Annuler' : '+ Nouvelle vente'}
          </button>
        </div>
      </header>

      <AdminNav shopSlug={shop?.slug} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* FORMULAIRE NOUVELLE VENTE */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-fs-border p-5">
            <h2 className="font-nunito font-extrabold text-base mb-4">Enregistrer une vente</h2>

            {/* SÉLECTION PRODUITS */}
            <p className="text-xs font-bold text-fs-gray uppercase tracking-wider mb-3">
              Produits vendus
            </p>
            <div className="space-y-2 mb-4">
              {products.map(function(product) {
                var qty = getQty(product.id)
                return (
                  <div key={product.id}
                       className="flex items-center justify-between bg-fs-cream rounded-xl px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      <p className="text-xs text-fs-gray">{formatPrice(product.price)}</p>
                    </div>
                    {/* Contrôles quantité */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={function() { updateCart(product, qty - 1) }}
                        className="w-7 h-7 rounded-lg bg-white text-fs-ink font-bold text-sm flex items-center justify-center shadow-sm">
                        −
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{qty}</span>
                      <button
                        onClick={function() {
                          // Limite = stock total (physique + en ligne)
                          var maxStock = product.stock_quantity != null ? product.stock_quantity : 999
                          if (qty < maxStock) updateCart(product, qty + 1)
                        }}
                        className={'w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition ' +
                          (product.stock_quantity != null && qty >= product.stock_quantity
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-fs-ink text-white')}>
                        +
                      </button>
                    </div>
                    {/* Sous-total ligne */}
                    {qty > 0 && (
                      <p className="font-nunito font-extrabold text-xs text-fs-orange ml-3 w-20 text-right shrink-0">
                        {formatPrice(product.price * qty)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* TOTAL */}
            {cart.length > 0 && (
              <div className="bg-fs-ink text-white rounded-xl p-3 flex items-center justify-between mb-4">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-nunito font-extrabold">{formatPrice(total)}</span>
              </div>
            )}

            {/* MODE PAIEMENT */}
            <p className="text-xs font-bold text-fs-gray uppercase tracking-wider mb-3">
              Mode de paiement
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {paymentModes.map(function(mode) {
                return (
                  <button key={mode.id}
                          onClick={function() { setPaymentMode(mode.id) }}
                          className={'flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition ' +
                            (paymentMode === mode.id ? 'bg-fs-ink text-white border-fs-ink' : 'bg-white text-fs-ink border-fs-border')}>
                    <span>{mode.icon}</span>
                    <span>{mode.label}</span>
                    {/* Coche si sélectionné */}
                    {paymentMode === mode.id && <span className="ml-auto">✓</span>}
                  </button>
                )
              })}
            </div>

            {/* BOUTON VALIDER */}
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || loading}
              className="w-full bg-fs-orange text-white font-bold py-4 rounded-xl hover:bg-fs-orange-deep transition disabled:opacity-50">
              {loading ? 'Enregistrement...' : '✅ Enregistrer la vente — ' + formatPrice(total)}
            </button>
          </div>
        )}

        {/* HISTORIQUE VENTES PHYSIQUES */}
        <div>
          <p className="text-xs font-bold text-fs-gray uppercase tracking-wider mb-3">
            Historique des ventes physiques
          </p>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🏪</p>
              <p className="text-fs-gray text-sm">Aucune vente physique enregistrée</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sales.map(function(sale) {
                return (
                  <div key={sale.id}
                       className="bg-white rounded-xl border border-fs-border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{sale.product_name}</p>
                      <p className="text-xs text-fs-gray">
                        {/* Icône selon mode paiement */}
                        {sale.payment_mode === 'especes' ? '💵' :
                         sale.payment_mode === 'wave' ? '🌊' :
                         sale.payment_mode === 'orange_money' ? '🟠' : '🟡'}
                        {' '}{sale.payment_mode} · x{sale.quantity}
                      </p>
                      <p className="text-xs text-fs-gray2 mt-0.5">
                        {new Date(sale.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <p className="font-nunito font-extrabold text-sm text-fs-orange">
                      {formatPrice(sale.total)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}