'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/cart'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function CommanderPage() {
  const params = useParams()
  const slug = params.slug as string
  const cart = useCart()

  const [shop, setShop] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    delivery: 'retrait'
  })

  useEffect(function() {
    async function load() {
      var res = await supabase
        .from('shops').select('*').eq('slug', slug).single()
      setShop(res.data)
    }
    load()
  }, [slug])

  var handleChange = function(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  var handleSubmit = async function(e: any) {
    e.preventDefault()
    if (!shop || cart.items.length === 0) return
    setLoading(true)

    var orderRes = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.delivery === 'domicile' ? form.address : null,
        delivery_mode: form.delivery,
        total: cart.total
      })
      .select().single()

    if (!orderRes.error && orderRes.data) {
      var orderItems = cart.items.map(function(item) {
        return {
          order_id: orderRes.data.id,
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity
        }
      })
      await supabase.from('order_items').insert(orderItems)

      // Decrementer le stock pour chaque produit commande
      for (var i = 0; i < cart.items.length; i++) {
        var item = cart.items[i]
        if (item.stock_quantity != null) {
          var newStock = Math.max(0, item.stock_quantity - item.quantity)
          await supabase.from("products").update({ stock_quantity: newStock, is_active: newStock > 0 }).eq("id", item.id)
        }
      }

      var itemsList = cart.items.map(function(item) {
        return item.name + ' x' + item.quantity
      }).join(', ')

      setConfirmation({
        orderNumber: orderRes.data.order_number,
        shopPhone: shop.phone,
        shopName: shop.name,
        items: itemsList,
        total: cart.total,
        customerName: form.name
      })

      cart.clearCart()
    }
    setLoading(false)
  }

  if (confirmation) {
    var waText = encodeURIComponent(
      '🛒 Nouvelle commande ' + confirmation.orderNumber + '\n' +
      'Client : ' + confirmation.customerName + '\n' +
      'Tel : ' + form.phone + '\n' +
      'Produits : ' + confirmation.items + '\n' +
      'Montant : ' + confirmation.total.toLocaleString() + ' FCFA\n' +
      'Livraison : ' + (form.delivery === 'retrait' ? 'Retrait en boutique' : form.address)
    )
    var waLink = 'https://wa.me/' + confirmation.shopPhone + '?text=' + waText

    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
          <div className="text-5xl mb-4">✅</div>
      <h2 className="font-nunito font-extrabold text-xl mb-2">Commande confirmée !</h2>
          <p className="text-fs-gray mb-1">
            Numéro : <strong className="text-fs-ink">{confirmation.orderNumber}</strong>
          </p>
          <p className="text-fs-gray mb-1 text-sm">{confirmation.items}</p>
          <p className="font-nunito font-extrabold text-fs-orange mb-6">
            {formatPrice(confirmation.total)}
          </p>
          <a href={waLink} target="_blank"
             className="block w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-center hover:bg-[#1DA851] transition">
            📲 Confirmer sur WhatsApp avec {confirmation.shopName}
          </a>
          <a href={'/suivi?cmd=' + confirmation.orderNumber} target="_blank" className="block w-full bg-fs-ink text-white font-bold py-3 rounded-xl text-center mt-3">Suivre ma commande</a>
          <Link href={'/boutique/' + slug} className="block mt-4 text-sm text-fs-orange font-semibold">
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-centify-center px-4">
        <p className="text-4xl mb-3">🛒</p>
        <p className="text-fs-gray mb-4">Votre panier est vide</p>
        <Link href={'/boutique/' + slug}
              className="bg-fs-orange text-white font-bold px-6 py-3 rounded-xl">
          Voir le catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-white border-b border-fs-border px-4 py-4 flex items-center gap-3">
        <Link href={'/boutique/' + slug} className="text-fs-gray text-lg">←</Link>
        <h1 className="font-nunito font-extrabold text-lg">Finaliser la commande</h1>
      </header>

      <div className="px-4 pt-4 space-y-2">
        {cart.items.map(function(item) {
          return (
            <div key={item.id} className="bg-white border border-fs-border rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-fs-cream rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🛍️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.name}</p>
                <p className="text-xs text-fs-gray">{formatPrice(item.price)} x {item.quantity}</p>
              </div>
              <p className="font-nunito font-extrabold text-sm text-fs-orange shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          )
        })}
        <div className="bg-fs-ink text-white rounded-xl p-3 flex items-center justify-between">
          <span className="font-semibold text-sm">Total</span>
          <span className="font-nunito font-extrabold">{formatPrice(cart.total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-semibold mb-1">Votre nom</label>
          <input name="name" value={form.name} onChange={handleChange} required
                 className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                            focus:outline-none focus:ring-2 focus:ring-fs-orange"
                 placeholder="Ex : Koné Aminata" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Téléphone</label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                 className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                            focus:outline-none focus:ring-2 focus:ring-fs-orange"
                 placeholder="07 XX XX XX XX" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Livraison</label>
          <div className="flex gap-3">
            <button type="button" onClick={function() { setForm({ ...form, delivery: 'retrait' }) }}
                    className={'flex-1 py-3 rounded-xl border text-sm font-semibold transition ' +
                      (form.delivery === 'retrait' ? 'bg-fs-ink text-white border-fs-ink' : 'bg-white text-fs-gray border-fs-border')}>
              🏪 Retrait
            </button>
            <button type="button" onClick={function() { setForm({ ...form, delivery: 'domicile' }) }}
                    className={'flex-1 py-3 rounded-xl border text-sm font-semibold transition ' +
                      (form.delivery === 'domicile' ? 'bg-fs-ink text-white border-fs-ink' : 'bg-white text-fs-gray border-fs-border')}>
              🏠 Domicile
            </button>
          </div>
        </div>
        {form.delivery === 'domicile' && (
          <div>
            <label className="block text-sm font-semibold mb-1">Adresse (commune, quartier, repère)</label>
            <textarea name="address" value={form.address} onChange={handleChange} required rows={3}
                 className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                                 focus:outline-none focus:ring-2 focus:ring-fs-orange resize-none"
                      placeholder="Ex : Cocody Angré, Star 8, près de la pharmacie" />
          </div>
        )}
        <button type="submit" disabled={loading}
                className="w-full bg-fs-orange text-white font-bold py-4 rounded-xl
                           hover:bg-fs-orange-deep transition disabled:opacity-50">
          {loading ? 'Envoi en cours...' : 'Valider ma commande — ' + formatPrice(cart.total)}
        </button>
      </form>
    </div>
  )
}
