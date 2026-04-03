'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/cart'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PageTracker from '@/components/tracker'
import { getThemeColors, getLightColor, getContrastText } from '@/lib/theme'

export default function ProduitContent() {
  var params = useParams()
  var slug = params.slug as string
  var id = params.id as string
  var cart = useCart()

  var [product, setProduct] = useState<any>(null)
  var [shop, setShop] = useState<any>(null)
  var [loading, setLoading] = useState(true)
  var [added, setAdded] = useState(false)
  var [variants, setVariants] = useState<any[]>([])
  var [selectedVariant, setSelectedVariant] = useState<any>(null)
  var [currentImage, setCurrentImage] = useState<string>('')
  var [otherProducts, setOtherProducts] = useState<any[]>([])

  useEffect(function() {
    async function load() {
      var shopRes = await supabase.from('shops').select('*').eq('slug', slug).single()
      setShop(shopRes.data)
      var prodRes = await supabase.from('products').select('*').eq('id', id).single()
      setProduct(prodRes.data)
      if (prodRes.data?.image_url) {
        setCurrentImage(prodRes.data.image_url)
      }
      // Charge les variantes si le produit en a
      if (prodRes.data?.has_variants) {
        var varRes = await supabase.from('product_variants')
          .select('*').eq('product_id', id).eq('is_active', true)
          .order('sort_order', { ascending: true })
        setVariants(varRes.data || [])
      }
      // Charge d'autres produits de la même boutique pour "Vous aimerez aussi"
      if (shopRes.data) {
        var otherRes = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .eq('shop_id', shopRes.data.id)
          .neq('id', id)
          .eq('is_active', true)
          .limit(4)
        setOtherProducts(otherRes.data || [])
      }
      setLoading(false)
    }
    load()
  }, [slug, id])

  var addToCart = function() {
    if (!product) return
    // Si le produit a des variantes, une doit être sélectionnée
    if (product.has_variants && variants.length > 0 && !selectedVariant) {
      alert('Veuillez choisir une variante avant d\'ajouter au panier.')
      return
    }
    // Stock : utilise le stock de la variante si elle en a un, sinon stock produit
    var stockSource = selectedVariant?.stock_quantity ?? product.stock_quantity
    var stockOnline = stockSource != null
      ? Math.max(0, stockSource - (product.stock_buffer || 0))
      : 999
    // Clé unique panier = id produit + variante (ex: "uuid-M" ou "uuid-Rouge")
    var cartId = selectedVariant ? product.id + '-' + selectedVariant.variant_value : product.id
    var currentQty = cart.items.find(function(i) { return i.id === cartId })?.quantity || 0
    if (currentQty >= stockOnline) return
    // Prix : utilise le prix override de la variante si défini
    var price = selectedVariant?.price_override ?? product.price
    cart.addItem({
      id: cartId,
      name: product.name + (selectedVariant ? ' — ' + selectedVariant.variant_value : ''),
      price: price,
      image_url: product.image_url,
      stock_quantity: stockSource
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
    var themeEmpty = getThemeColors(shop)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: themeEmpty.secondary }}>
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2" style={{ color: themeEmpty.text }}>Produit introuvable</h1>
        <Link href={'/boutique/' + slug} className="font-semibold mt-4" style={{ color: themeEmpty.primary }}>Retour a la boutique</Link>
      </div>
    )
  }

  var theme = getThemeColors(shop)

  // Collecte toutes les photos non nulles
  var images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[]

  var isOutOfStock = product.stock_quantity != null && product.stock_quantity <= 0 && !product.has_variants

  // cart.count = somme de toutes les quantités (ex: 10 montres + 1 bracelet = 11)
  // cart.items.length = nombre de produits distincts (= 2) → c'était le bug
  var totalArticles = cart.count

  return (
    <div className="min-h-screen" style={{ background: theme.secondary }}>
      {shop && <PageTracker shopId={shop.id} page="produit" productId={product.id} />}

      {/* ÉTAPE 1 — Header cohérent avec le catalogue */}
      <header style={{
        background: theme.primary,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {shop?.logo_url ? (
            <img src={shop.logo_url} alt={shop.name}
              style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: 'white', padding: 3 }} />
          ) : (
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: theme.accent, color: theme.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 600,
            }}>
              {shop?.name?.charAt(0)}
            </div>
          )}
          <div>
            <div style={{
              fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 600,
              color: getContrastText(theme.primary), letterSpacing: 0.5,
            }}>
              {shop?.name}
            </div>
            {shop?.description && (
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.6)',
                letterSpacing: 1, textTransform: 'uppercase', marginTop: 1,
                maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {shop.description}
              </div>
            )}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: 'rgba(255,255,255,0.7)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50' }} />
          En ligne
        </div>
      </header>

      {/* ÉTAPE 2 — Galerie photo produit améliorée */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1',
        background: '#F5EDE5',
        overflow: 'hidden',
      }}>
        {images.length > 0 ? (
          currentImage && currentImage.indexOf('images.unsplash.com') !== -1 ? (
            <img src={currentImage} alt={product.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'opacity 0.3s',
              }}
              loading="eager" />
          ) : currentImage ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              style={{ transition: 'opacity 0.3s' }}
            />
          ) : null
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', color: '#CCC', fontSize: 14,
          }}>
            Photo du produit
          </div>
        )}

        {/* Badge catégorie */}
        {product.category && (
          <span style={{
            position: 'absolute', top: 16, left: 16,
            padding: '4px 12px', borderRadius: 12,
            fontSize: 10, fontWeight: 600, letterSpacing: 1,
            textTransform: 'uppercase',
            background: theme.primary, color: getContrastText(theme.primary),
          }}>
            {product.category}
          </span>
        )}

        {/* Bouton retour */}
        <button type="button"
          onClick={function() { window.history.back() }}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Miniatures photos (si plusieurs images) */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, padding: '12px 20px',
          overflowX: 'auto', background: theme.secondary,
        }}>
          {images.map(function(img: string, idx: number) {
            var isActive = currentImage === img
            return (
              <button key={idx} type="button"
                onClick={function() { setCurrentImage(img) }}
                style={{
                  width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                  border: isActive ? '2px solid ' + theme.primary : '2px solid transparent',
                  cursor: 'pointer', flexShrink: 0, padding: 0,
                  transition: 'border-color 0.2s',
                  opacity: isActive ? 1 : 0.6,
                  background: 'transparent',
                }}
              >
                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            )
          })}
        </div>
      )}

      {/* ÉTAPE 3 — Informations produit redesignées */}
      <div style={{ padding: '24px 20px', background: theme.secondary }}>

        {/* Catégorie en uppercase */}
        {product.category && (
          <div style={{
            fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
            color: theme.accent, fontWeight: 600, marginBottom: 8,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            {product.category}
          </div>
        )}

        {/* Nom du produit en serif */}
        <h1 style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 26, fontWeight: 500, color: theme.text,
          lineHeight: 1.2, marginBottom: 12,
        }}>
          {product.name}
        </h1>

        {/* Prix */}
        <div style={{
          fontSize: 22, fontWeight: 600, color: theme.primary,
          marginBottom: 20,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}>
          {formatPrice(selectedVariant?.price_override ?? product.price)}
        </div>

        {/* Ligne séparatrice fine */}
        <div style={{
          width: 40, height: 1, background: theme.accent,
          marginBottom: 20, opacity: 0.4,
        }} />

        {/* Description */}
        {product.description && (
          <div style={{
            fontSize: 14, color: '#7C6C58', lineHeight: 1.8,
            marginBottom: 24,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            {product.description}
          </div>
        )}

        {/* Stock info */}
        {product.stock_quantity !== null && product.stock_quantity !== undefined && !product.has_variants && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, marginBottom: 20,
            color: product.stock_quantity > 5 ? '#2A7A50' : product.stock_quantity > 0 ? '#E65100' : '#D32F2F',
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: product.stock_quantity > 5 ? '#4CAF50' : product.stock_quantity > 0 ? '#FF9800' : '#F44336',
            }} />
            {product.stock_quantity > 5
              ? 'En stock'
              : product.stock_quantity > 0
              ? 'Plus que ' + product.stock_quantity + ' en stock'
              : 'Rupture de stock'
            }
          </div>
        )}
      </div>

      {/* ÉTAPE 4 — Sélection variantes redesignée */}
      {product.has_variants && variants.length > 0 && (
        <div style={{
          padding: '0 20px 20px', background: theme.secondary,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: theme.text,
            marginBottom: 10,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            {variants[0]?.variant_type === 'color' ? 'Choisir une couleur' :
             variants[0]?.variant_type === 'size_shoes' ? 'Choisir une pointure' :
             variants[0]?.variant_type === 'size_clothing' ? 'Choisir une taille' :
             'Choisir une option'}
            {selectedVariant && (
              <span style={{ marginLeft: 8, color: theme.primary }}>{selectedVariant.variant_value}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {variants.map(function(v: any) {
              var vStock = v.stock_quantity
              var isOut = vStock != null && vStock <= 0
              var isSelected = selectedVariant?.id === v.id
              return (
                <button key={v.id} type="button"
                  onClick={function() { if (!isOut) setSelectedVariant(isSelected ? null : v) }}
                  disabled={isOut}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: isSelected ? '2px solid ' + theme.primary : '1.5px solid #E8DDD0',
                    background: isSelected ? getLightColor(theme.primary, 0.08) : 'white',
                    color: isOut ? '#CCC' : isSelected ? theme.primary : theme.text,
                    fontSize: 13, fontWeight: isSelected ? 600 : 400,
                    cursor: isOut ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textDecoration: isOut ? 'line-through' : 'none',
                    fontFamily: 'var(--font-outfit), sans-serif',
                  }}
                >
                  {v.variant_value}
                  {vStock != null && vStock > 0 && vStock <= 3 && !isOut && (
                    <span style={{ display: 'block', fontSize: 11, color: theme.accent, marginTop: 2 }}>
                      Plus que {vStock}
                    </span>
                  )}
                  {v.price_override && v.price_override !== product.price && (
                    <span style={{ display: 'block', fontSize: 11, color: theme.accent, marginTop: 2 }}>
                      {formatPrice(v.price_override)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Stock de la variante sélectionnée */}
          {selectedVariant && selectedVariant.stock_quantity != null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, marginTop: 12,
              color: selectedVariant.stock_quantity > 5 ? '#2A7A50' : selectedVariant.stock_quantity > 0 ? '#E65100' : '#D32F2F',
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: selectedVariant.stock_quantity > 5 ? '#4CAF50' : selectedVariant.stock_quantity > 0 ? '#FF9800' : '#F44336',
              }} />
              {selectedVariant.stock_quantity > 5
                ? 'En stock pour cette option'
                : selectedVariant.stock_quantity > 0
                ? 'Plus que ' + selectedVariant.stock_quantity + ' en stock'
                : 'Rupture de stock'
              }
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 5 — Bouton "Ajouter au panier" redesigné — sticky en bas */}
      <div style={{
        padding: '16px 20px',
        background: 'white',
        borderTop: '1px solid #E8DDD0',
        position: 'sticky', bottom: 0,
        zIndex: 10,
      }}>
        <button type="button"
          onClick={addToCart}
          disabled={isOutOfStock}
          style={{
            width: '100%', padding: '16px 24px',
            borderRadius: 12, border: 'none',
            background: added ? '#2A7A50' : isOutOfStock ? '#E0D8D0' : theme.primary,
            color: added ? '#FFFFFF' : isOutOfStock ? '#A0988E' : getContrastText(theme.primary),
            fontSize: 15, fontWeight: 600, cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-outfit), sans-serif',
            letterSpacing: 0.5,
            transition: 'background 0.2s, transform 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseEnter={function(e: any) { if (!isOutOfStock) e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {added ? (
            <>✓ Ajouté au panier !</>
          ) : isOutOfStock ? (
            <>Rupture de stock</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              Ajouter au panier
            </>
          )}
        </button>

        {/* Bouton Valider le panier — s'affiche si le panier contient au moins 1 article */}
        {totalArticles > 0 && (
          <Link
            href={'/boutique/' + slug + '/commander'}
            style={{
              display: 'block', width: '100%', padding: '14px 24px',
              borderRadius: 12, textAlign: 'center', marginTop: 10,
              background: theme.text, color: getContrastText(theme.text),
              fontFamily: 'var(--font-outfit), sans-serif',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
              transition: 'transform 0.1s',
            }}
          >
            🛒 Valider le panier · {totalArticles} article{totalArticles > 1 ? 's' : ''} · {formatPrice(cart.total)}
          </Link>
        )}
      </div>

      {/* ÉTAPE 6 — Section "Vous aimerez aussi" */}
      {otherProducts && otherProducts.length > 0 && (
        <div style={{ padding: '24px 20px', background: theme.secondary }}>
          <div style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 18, fontWeight: 600, color: theme.text,
            marginBottom: 16,
          }}>
            Vous aimerez aussi
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            paddingBottom: 8,
          }}>
            {otherProducts.slice(0, 4).map(function(p: any) {
              return (
                <a key={p.id}
                  href={'/boutique/' + slug + '/produit/' + p.id}
                  style={{
                    flexShrink: 0, width: 140, textDecoration: 'none', color: theme.text,
                  }}
                >
                  <div style={{
                    width: 140, height: 140, borderRadius: 12, overflow: 'hidden',
                    background: '#F5EDE5', marginBottom: 8,
                  }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy" />
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: '#CCC', fontSize: 11,
                      }}>Photo</div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                    marginBottom: 4,
                  }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.primary }}>
                    {formatPrice(p.price)}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* ÉTAPE 7 — Footer identique au catalogue */}
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
            Propulse par <span style={{ color: '#DC5014', fontWeight: 600 }}>fortunashop</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
