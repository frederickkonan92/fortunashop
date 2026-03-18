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
  var [cart, setCart] = useState<any[]>([])
  var [paymentMode, setPaymentMode] = useState('especes')
  // State pour les alertes stock — déclenche le popup
  var [stockAlerts, setStockAlerts] = useState<{name: string, stock: number, status: 'low' | 'out'}[]>([])

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var prodRes = await supabase.from('products').select('*')
        .eq('shop_id', shopRes.data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      setProducts(prodRes.data || [])
      var salesRes = await supabase.from('physical_sales').select('*')
        .eq('shop_id', shopRes.data.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setSales(salesRes.data || [])
    }
  }

  var updateCart = function(product: any, qty: number) {
    if (qty <= 0) {
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

  var total = cart.reduce(function(sum, i) { return sum + (i.product.price * i.quantity) }, 0)

  var handleSubmit = async function() {
    if (!shop || cart.length === 0) return
    setLoading(true)

    // Sauvegarde le panier avant de le vider
    var cartSnapshot = [...cart]

    // Insère chaque ligne dans physical_sales + déduit le stock
    for (var i = 0; i < cartSnapshot.length; i++) {
      var item = cartSnapshot[i]
      await supabase.from('physical_sales').insert({
        shop_id: shop.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        payment_mode: paymentMode,
        total: item.product.price * item.quantity
      })
      if (item.product.stock_quantity != null) {
        var newStock = Math.max(0, item.product.stock_quantity - item.quantity)
        await supabase.from('products').update({
          stock_quantity: newStock,
          is_active: newStock > 0
        }).eq('id', item.product.id)
      }
    }

    // Vérifie les alertes stock après mise à jour
    var newAlerts: {name: string, stock: number, status: 'low' | 'out'}[] = []
    for (var j = 0; j < cartSnapshot.length; j++) {
      var soldItem = cartSnapshot[j]
      var prodRes = await supabase.from('products').select('*').eq('id', soldItem.product.id).single()
      if (prodRes.data) {
        var prod = prodRes.data
        // Stock disponible en ligne après la vente
        var stockOnline = prod.stock_quantity != null
          ? Math.max(0, prod.stock_quantity - (prod.stock_buffer || 0))
          : null
        if (stockOnline === 0) {
          newAlerts.push({ name: prod.name, stock: 0, status: 'out' })
        } else if (stockOnline != null && stockOnline <= (prod.stock_alert || 3)) {
          newAlerts.push({ name: prod.name, stock: stockOnline, status: 'low' })
        }
      }
    }

    // Réinitialise le formulaire
    setCart([])
    setPaymentMode('especes')
    setShowForm(false)
    setLoading(false)
    loadData()

    // Affiche le popup si alertes détectées
    if (newAlerts.length > 0) {
      setStockAlerts(newAlerts)
    } else {
      alert('✅ Vente enregistrée ! Stock mis à jour.')
    }
  }

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

      {/* POPUP ALERTE STOCK */}
      {stockAlerts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <p className="text-4xl mb-2">⚠️</p>
              <h3 className="font-nunito font-extrabold text-lg">Alerte stock</h3>
              <p className="text-xs text-fs-gray mt-1">Vente enregistrée avec succès</p>
            </div>
            <div className="space-y-2 mb-5">
              {stockAlerts.map(function(al, i) {
                return (
                  <div key={i} className={'rounded-xl p-3 ' + (al.status === 'out' ? 'bg-red-50' : 'bg-[#FEF3C7]')}>
                    <p className={'text-sm font-bold ' + (al.status === 'out' ? 'text-red-500' : 'text-[#D97706]')}>
                      {al.status === 'out' ? '🔴 Rupture de stock' : '🟠 Stock bas'}
                    </p>
                    <p className="text-sm font-semibold mt-0.5">{al.name}</p>
                    <p className="text-xs text-fs-gray mt-0.5">
                      {al.status === 'out'
                        ? 'Ce produit est épuisé en ligne'
                        : al.stock + ' unité(s) restante(s) en ligne'}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <a href="/admin/produits"
                 className="flex-1 bg-fs-orange text-white font-bold py-3 rounded-xl text-center text-sm">
                Réapprovisionner
              </a>
              <button
                onClick={function() { setStockAlerts([]) }}
                className="px-4 py-3 rounded-xl border border-fs-border text-fs-gray font-semibold text-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {showForm && (
          <div className="bg-white rounded-2xl border border-fs-border p-5">
            <h2 className="font-nunito font-extrabold text-base mb-4">Enregistrer une vente</h2>
            <p className="text-xs font-bold text-fs-gray uppercase tracking-wider mb-3">Produits vendus</p>
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={function() { updateCart(product, qty - 1) }}
                        className="w-7 h-7 rounded-lg bg-white text-fs-ink font-bold text-sm flex items-center justify-center shadow-sm">
                        −
                      </button>
                      <span className="font-bold text-sm w-4 text-center">{qty}</span>
                      <button
                        onClick={function() {
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
                    {qty > 0 && (
                      <p className="font-nunito font-extrabold text-xs text-fs-orange ml-3 w-20 text-right shrink-0">
                        {formatPrice(product.price * qty)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            {cart.length > 0 && (
              <div className="bg-fs-ink text-white rounded-xl p-3 flex items-center justify-between mb-4">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-nunito font-extrabold">{formatPrice(total)}</span>
              </div>
            )}
            <p className="text-xs font-bold text-fs-gray uppercase tracking-wider mb-3">Mode de paiement</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {paymentModes.map(function(mode) {
                return (
                  <button key={mode.id}
                          onClick={function() { setPaymentMode(mode.id) }}
                          className={'flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition ' +
                            (paymentMode === mode.id ? 'bg-fs-ink text-white border-fs-ink' : 'bg-white text-fs-ink border-fs-border')}>
                    <span>{mode.icon}</span>
                    <span>{mode.label}</span>
                    {paymentMode === mode.id && <span className="ml-auto">✓</span>}
                  </button>
                )
              })}
            </div>
            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || loading}
              className="w-full bg-fs-orange text-white font-bold py-4 rounded-xl hover:bg-fs-orange-deep transition disabled:opacity-50">
              {loading ? 'Enregistrement...' : '✅ Enregistrer la vente — ' + formatPrice(total)}
            </button>
          </div>
        )}

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