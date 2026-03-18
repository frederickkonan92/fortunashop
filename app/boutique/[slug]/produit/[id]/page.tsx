'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/cart'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PageTracker from '@/components/tracker'

// GaleriePhotos : affiche la photo principale + miniatures cliquables
function GaleriePhotos({ photos, productName }: { photos: string[], productName: string }) {
  var [selected, setSelected] = useState(0)
  return (
    <div>
      {/* Photo principale */}
      <img src={photos[selected]} alt={productName} className="w-full h-72 object-cover" />
      {/* Miniatures — affichées seulement s'il y a plus d'une photo */}
      {photos.length > 1 && (
        <div className="flex gap-2 p-3 bg-white">
          {photos.map(function(url, i) {
            return (
              <button key={i} onClick={function() { setSelected(i) }}
                      className={'rounded-lg overflow-hidden border-2 transition ' +
                        (selected === i ? 'border-fs-orange' : 'border-transparent')}>
                {/* Miniature 60x60 */}
                <img src={url} alt={productName + ' ' + (i + 1)} className="w-16 h-16 object-cover" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProduitPage() {
  var params = useParams()
  var slug = params.slug as string
  var id = params.id as string
  var cart = useCart()

  var [product, setProduct] = useState<any>(null)
  var [shop, setShop] = useState<any>(null)
  var [loading, setLoading] = useState(true)
  var [added, setAdded] = useState(false)

  useEffect(function() {
    async function load() {
      var shopRes = await supabase.from('shops').select('*').eq('slug', slug).single()
      setShop(shopRes.data)
      var prodRes = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(prodRes.data)
      setLoading(false)
    }
    load()
  }, [slug, id])

  var addToCart = function() {
    if (!product) return
    // Stock disponible en ligne = stock total - tampon physique
    var stockOnline = product.stock_quantity != null
      ? Math.max(0, product.stock_quantity - (product.stock_buffer || 0))
      : 999
    var currentQty = cart.items.find(function(i) { return i.id === product.id })?.quantity || 0
    if (currentQty >= stockOnline) return
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity
    })
    setAdded(true)
    setTimeout(function() { setAdded(false) }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Produit introuvable</h1>
        <Link href={'/boutique/' + slug} className="text-fs-orange font-semibold mt-4">Retour a la boutique</Link>
      </div>
    )
  }

  var stockStatus = product.stock_quantity == null ? 'unlimited' : product.stock_quantity > 0 ? 'available' : 'out'

  // cart.count = somme de toutes les quantités (ex: 10 montres + 1 bracelet = 11)
  // cart.items.length = nombre de produits distincts (= 2) → c'était le bug
  var totalArticles = cart.count

  return (
    <div className="min-h-screen bg-fs-cream pb-32">
      {shop && <PageTracker shopId={shop.id} page="produit" productId={product.id} />}

      <header className="sticky top-0 z-50 bg-white border-b border-fs-border px-4 py-3 flex items-center gap-3">
        <Link href={'/boutique/' + slug} className="text-fs-gray text-lg">←</Link>
        <h1 className="font-nunito font-extrabold text-base truncate">{shop?.name}</h1>
      </header>

     {/* Galerie photos : affiche jusqu'à 3 photos avec miniatures cliquables */}
     <div className="bg-white">
        {(() => {
          // Collecte toutes les photos non nulles dans un tableau
          var photos = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean)
          if (photos.length === 0) {
            return <div className="w-full h-72 bg-fs-cream flex items-center justify-center text-6xl">📦</div>
          }
          return (
            <GaleriePhotos photos={photos} productName={product.name} />
          )
        })()}
      </div>

      <div className="px-4 py-5 max-w-md mx-auto">
        <h1 className="font-nunito font-extrabold text-xl mb-1">{product.name}</h1>
        <p className="font-nunito font-extrabold text-2xl text-fs-orange mb-4">{formatPrice(product.price)}</p>

        {product.description && (
          <div className="bg-white border border-fs-border rounded-xl p-4 mb-4">
            <p className="text-sm text-fs-gray leading-relaxed">{product.description}</p>
          </div>
        )}

        {stockStatus === 'available' && (
          <p className="text-xs font-semibold text-fs-green mb-4">{product.stock_quantity} en stock</p>
        )}
        {stockStatus === 'out' && (
          <p className="text-xs font-semibold text-red-500 mb-4">Rupture de stock</p>
        )}

        {/* Bouton Ajouter au panier */}
        <button
          onClick={addToCart}
          disabled={stockStatus === 'out'}
          className={'w-full font-bold py-4 rounded-xl transition text-center ' +
            (added ? 'bg-fs-green text-white' : stockStatus === 'out' ? 'bg-gray-200 text-gray-400' : 'bg-fs-orange text-white hover:bg-fs-orange-deep')}>
          {added ? '✓ Ajouté au panier !' : stockStatus === 'out' ? 'Indisponible' : 'Ajouter au panier — ' + formatPrice(product.price)}
        </button>

        {/* Bouton Valider le panier — remplace "Commander" */}
        {/* S'affiche seulement si le panier contient au moins 1 article */}
        {totalArticles > 0 && (
          <Link
            href={'/boutique/' + slug + '/commander'}
            className="block w-full bg-fs-ink text-white font-bold py-3.5 rounded-xl text-center mt-3">
            {/* totalArticles = cart.count = somme des quantités, pas le nombre de lignes */}
            🛒 Valider le panier · {totalArticles} article{totalArticles > 1 ? 's' : ''} · {formatPrice(cart.total)}
          </Link>
        )}
      </div>
    </div>
  )
}