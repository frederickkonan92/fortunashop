'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import PageTracker from '@/components/tracker'
import { useCart, CartBar } from '@/components/cart'
import Link from 'next/link'

export default function CatalogueClient({ slug }: { slug: string }) {
  const [shop, setShop] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const cart = useCart()

  useEffect(function() {
    async function load() {
      var shopRes = await supabase
        .from('shops').select('*').eq('slug', slug).eq('is_active', true).single()
      setShop(shopRes.data)
      if (shopRes.data) {
        var prodRes = await supabase
          .from('products').select('*')
          .eq('shop_id', shopRes.data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
        setProducts(prodRes.data || [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fs-cream px-6">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Boutique introuvable</h1>
        <p className="text-fs-gray text-center">
          Cette boutique n existe pas ou est temporairement hors ligne.
        </p>
      </div>
    )
  }

  var handleAdd = function(product: any) {
    cart.addItem(product)
  }

  var getItemQty = function(productId: string) {
    var item = cart.items.find(function(i) { return i.id === productId })
    return item ? item.quantity : 0
  }

  return (
    // pb-32 : espace en bas pour que la CartBar ne cache pas les produits
    <div className="min-h-screen bg-fs-cream pb-32">
      <PageTracker shopId={shop.id} page="catalogue" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-fs-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fs-orange to-fs-orange-deep flex items-center justify-center text-white font-nunito font-black text-lg shrink-0">
          {shop.name[0]}
        </div>
        <div className="min-w-0">
          <h1 className="font-nunito font-extrabold text-base truncate">{shop.name}</h1>
          <p className="text-xs text-fs-gray truncate">{shop.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 bg-fs-green rounded-full animate-pulse" />
          <span className="text-xs font-bold text-fs-green">En ligne</span>
        </div>
      </header>

      {/* BANNIÈRE ACCUEIL */}
      <div className="bg-gradient-to-br from-fs-orange-pale to-fs-cream2 px-5 py-6 border-b border-fs-border">
        <h2 className="font-nunito font-extrabold text-lg mb-1">Bienvenue chez {shop.name} 👋</h2>
        <p className="text-sm text-fs-gray leading-relaxed">
          Parcourez nos créations et commandez directement en ligne.
        </p>
      </div>

      {/* GRILLE PRODUITS */}
      <main className="px-4 py-5">
        <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-fs-gray mb-4">
          Nos créations · {products.length} produit{products.length > 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {products.map(function(product) {
            var qty = getItemQty(product.id)
            return (
              <div key={product.id}
                className="bg-white border border-fs-border rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">

                {/* ZONE CLIQUABLE : image + infos uniquement */}
                <a href={'/boutique/' + shop.slug + '/produit/' + product.id} className="block">
                  <div className="aspect-square bg-fs-cream flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">🛍️</span>
                    )}
                  </div>
                  <div className="p-3 pb-0">
                    <p className="font-semibold text-[13px] leading-tight mb-1 line-clamp-2">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-fs-gray mb-1 line-clamp-2">{product.description}</p>
                    )}
                    <p className="font-nunito font-extrabold text-sm text-fs-orange">{formatPrice(product.price)}</p>
                    {/* Badge variantes — visible uniquement si le produit a des variantes */}
                    {product.has_variants && (
                      <p className="text-[10px] text-fs-gray mt-1">✦ Plusieurs modèles disponibles</p>
                    )}
                  </div>
                </a>

                {/* ZONE BOUTONS : hors du <a> → pas de redirection au clic */}
                <div className="p-3 pt-2">
                  {qty === 0 ? (
                    <button
                      onClick={function() { handleAdd(product) }}
                      className="w-full bg-fs-ink text-white text-center text-xs font-bold py-2.5 rounded-xl hover:bg-fs-orange transition">
                      Ajouter
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-fs-cream rounded-xl px-2 py-1.5">
                      {/* Bouton - : réduit la quantité, supprime si 0 */}
                      <button
                        onClick={function(e) {
                          e.stopPropagation()
                          e.preventDefault()
                          cart.updateQuantity(product.id, qty - 1)
                        }}
                        className="w-8 h-8 rounded-lg bg-white text-fs-ink font-bold text-sm flex items-center justify-center shadow-sm">
                        −
                      </button>
                      <span className="font-bold text-sm">{qty}</span>
                      {/* Bouton + : augmente, respecte le stock max */}
                      <button onClick={function() {
                        // Stock disponible en ligne = stock total - tampon physique
                        var stockOnline = product.stock_quantity != null
                          ? Math.max(0, product.stock_quantity - (product.stock_buffer || 0))
                          : 999
                        cart.updateQuantity(product.id, Math.min(qty + 1, stockOnline))
                      }}
                        className="w-8 h-8 rounded-lg bg-fs-ink text-white font-bold text-sm flex items-center justify-center">
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-fs-gray">Les créations arrivent bientôt...</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-fs-cream2 border-t border-fs-border py-5 text-center">
        <p className="text-sm text-fs-gray">
          Propulsé par <strong className="text-fs-orange">fortunashop</strong>
        </p>
      </footer>

      {/* BARRE PANIER FIXE EN BAS — z-50 pour passer au-dessus du contenu */}
      <CartBar count={cart.count} total={cart.total} slug={slug} />
    </div>
  )
}