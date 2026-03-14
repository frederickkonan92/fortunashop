"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useSearchParams } from 'next/navigation'
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export default function CommanderPage() {
  // useParams : récupère le slug depuis l'URL (/boutique/bijoux-awa/commander)
  const params = useParams()
  const slug = params.slug as string

  // useSearchParams : récupère les paramètres après le ? (?product=xxx)
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')

  // États du composant
  const [shop, setShop] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [confirmation, setConfirmation] = useState<any>(null)

  // Formulaire client
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    delivery: 'retrait'
  })

  // Charger la boutique et le produit au montage de la page
  useEffect(() => {
    async function loadData() {
      // Récupérer la boutique
      const { data: shopData } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .single()
      setShop(shopData)

      // Récupérer le produit sélectionné
      if (productId) {
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()
        setProduct(productData)
      }
    }
    loadData()
  }, [slug, productId])

  // Mettre à jour un champ du formulaire
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Soumettre la commande
  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!shop || !product) return
    setLoading(true)

    // Insérer la commande dans Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        shop_id: shop.id,
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.delivery === 'domicile' ? form.address : null,
        delivery_mode: form.delivery,
        total: product.price
      })
      .select()
      .single()

    if (!error && order) {
      // Insérer le détail de la commande
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity: 1
      })

      // Afficher l'écran de confirmation
      setConfirmation({
        orderNumber: order.order_number,
        shopPhone: shop.phone,
        shopName: shop.name,
        productName: product.name,
        total: product.price,
        customerName: form.name
      })
    }

    setLoading(false)
  }

  // ── ÉCRAN DE CONFIRMATION ──
  if (confirmation) {
    const waText = encodeURIComponent(
      `🛒 Nouvelle commande ${confirmation.orderNumber}\n` +
      `Client : ${confirmation.customerName}\n` +
      `Tél : ${form.phone}\n` +
      `Produit : ${confirmation.productName}\n` +
      `Montant : ${confirmation.total.toLocaleString()} FCFA\n` +
      `Livraison : ${form.delivery === 'retrait' ? 'Retrait en boutique' : form.address}`
    )
    const waLink = `https://wa.me/${confirmation.shopPhone}?text=${waText}`

    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-nunito font-extrabold text-xl mb-2">
            Commande confirmée !
          </h2>
          <p className="text-fs-gray mb-1">
            Numéro : <strong className="text-fs-ink">{confirmation.orderNumber}</strong>
          </p>
          <p className="text-fs-gray mb-6">
            {confirmation.productName} — {formatPrice(confirmation.total)}
          </p>

          
          <a href={waLink}
            target="_blank"
            className="block w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl
                       text-center hover:bg-[#1DA851] transition"
          >
            📲 Confirmer sur WhatsApp avec {confirmation.shopName}
          </a>
          <p className="text-xs text-fs-gray2 mt-3">
            Cliquez pour envoyer votre commande à l'artisan
          </p>

          <Link href={`/boutique/${slug}`}
                className="block mt-4 text-sm text-fs-orange font-semibold">
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    )
  }

  // ── CHARGEMENT ──
  if (!product) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  // ── FORMULAIRE DE COMMANDE ──
  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-white border-b border-fs-border px-4 py-4 flex items-center gap-3">
        <Link href={`/boutique/${slug}`} className="text-fs-gray text-lg">←</Link>
        <h1 className="font-nunito font-extrabold text-lg">Finaliser la commande</h1>
      </header>

      {/* Récap produit */}
      <div className="px-4 pt-4">
        <div className="bg-white border border-fs-border rounded-2xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-fs-cream rounded-xl flex items-center justify-center shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name}
                   className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span className="text-2xl">🛍️</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{product.name}</p>
            <p className="font-nunito font-extrabold text-fs-orange">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm font-semibold mb-1">Votre nom</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                       focus:outline-none focus:ring-2 focus:ring-fs-orange"
            placeholder="Ex : Koné Aminata"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Téléphone</label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                       focus:outline-none focus:ring-2 focus:ring-fs-orange"
            placeholder="07 XX XX XX XX"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Livraison</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, delivery: 'retrait' })}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition
                ${form.delivery === 'retrait'
                  ? 'bg-fs-ink text-white border-fs-ink'
                  : 'bg-white text-fs-gray border-fs-border'
                }`}
            >
              🏪 Retrait
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, delivery: 'domicile' })}
              className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition
                ${form.delivery === 'domicile'
                  ? 'bg-fs-ink text-white border-fs-ink'
                  : 'bg-white text-fs-gray border-fs-border'
                }`}
            >
              🏠 Domicile
            </button>
          </div>
        </div>

        {form.delivery === 'domicile' && (
          <div>
            <label className="block text-sm font-semibold mb-1">
              Adresse (commune, quartier, repère)
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                         focus:outline-none focus:ring-2 focus:ring-fs-orange resize-none"
              placeholder="Ex : Cocody Angré, Star 8, près de la pharmacie"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-fs-orange text-white font-bold py-4 rounded-xl
                     hover:bg-fs-orange-deep transition disabled:opacity-50"
        >
          {loading ? 'Envoi en cours...' : 'Valider ma commande'}
        </button>
      </form>
    </div>
  )
}