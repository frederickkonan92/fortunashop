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
import { trackViewProduct, trackAddToCart } from '@/lib/analytics'
import { getVariantAxes } from '@/lib/variants'
import { ShopHeader, ShopFooter } from '@/components/shop-layout'

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
  var [selectedAxis1, setSelectedAxis1] = useState<string | null>(null)
  var [selectedAxis2, setSelectedAxis2] = useState<string | null>(null)
  var [activeIndex, setActiveIndex] = useState(0)
  var [otherProducts, setOtherProducts] = useState<any[]>([])

  useEffect(function() {
    async function load() {
      var shopRes = await supabase.from('shops').select('*').eq('slug', slug).single()
      setShop(shopRes.data)
      var prodRes = await supabase.from('products').select('*, product_images (id, image_url, position)').eq('id', id).single()
      setProduct(prodRes.data)
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
      // Analytics : view_product
      if (shopRes.data?.id && prodRes.data?.id) {
        trackViewProduct(shopRes.data.id, prodRes.data.id, prodRes.data.name || '')
      }
      setLoading(false)
    }
    load()
  }, [slug, id])

  var axes = getVariantAxes(variants)

  // Trouver la variante correspondant à la combinaison sélectionnée
  var getSelectedVariant = function() {
    if (!selectedAxis1) return null
    if (axes.length === 1) {
      return variants.find(function(v: any) { return v.variant_value === selectedAxis1 }) || null
    }
    if (axes.length === 2 && selectedAxis2) {
      return variants.find(function(v: any) {
        return v.variant_value === selectedAxis1 && v.variant_value_2 === selectedAxis2
      }) || null
    }
    return null
  }

  var selectedVariant = getSelectedVariant()
  var currentPrice = selectedVariant && selectedVariant.price_override ? selectedVariant.price_override : product?.price
  var currentStock = selectedVariant ? selectedVariant.stock_quantity : product?.stock_quantity

  var canAddToCart = (function() {
    if (!product?.has_variants) return true
    if (axes.length === 0) return true
    if (axes.length === 1 && selectedAxis1) return !(currentStock != null && currentStock <= 0)
    if (axes.length === 2 && selectedAxis1 && selectedAxis2) return !(currentStock != null && currentStock <= 0)
    return false
  })()

  var addToCart = function() {
    if (!product) return
    if (product.has_variants && variants.length > 0 && !canAddToCart) {
      alert('Veuillez choisir une variante avant d\'ajouter au panier.')
      return
    }
    var stockSource = selectedVariant?.stock_quantity ?? product.stock_quantity
    var stockOnline = stockSource != null
      ? Math.max(0, stockSource - (product.stock_buffer || 0))
      : 999
    // Clé unique panier avec les 2 axes
    var variantLabel = ''
    if (selectedAxis1) variantLabel += selectedAxis1
    if (selectedAxis2) variantLabel += ' / ' + selectedAxis2
    var cartId = variantLabel ? product.id + '-' + variantLabel : product.id
    var currentQty = cart.items.find(function(i) { return i.id === cartId })?.quantity || 0
    if (currentQty >= stockOnline) return
    var price = selectedVariant?.price_override ?? product.price
    cart.addItem({
      id: cartId,
      name: product.name + (variantLabel ? ' — ' + variantLabel : ''),
      price: price,
      image_url: product.image_url,
      stock_quantity: stockSource
    })
    if (shop?.id) trackAddToCart(shop.id, product.id, product.name, price, variantLabel || null)
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
        <Link href={'/boutique/' + slug} className="font-semibold mt-4" style={{ color: themeEmpty.primary }}>Retour à la boutique</Link>
      </div>
    )
  }

  var theme = getThemeColors(shop)

  // Collecte les images depuis product_images (triées par position) avec fallback
  var images: string[] = (function() {
    if (product.product_images && product.product_images.length > 0) {
      return product.product_images.slice().sort(function(a: any, b: any) { return a.position - b.position }).map(function(img: any) { return img.image_url })
    }
    return [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean)
  })()

  var isOutOfStock = (function() {
    if (product.has_variants && selectedVariant) return currentStock != null && currentStock <= 0
    if (product.has_variants) return false // pas encore sélectionné
    return product.stock_quantity != null && product.stock_quantity <= 0
  })()

  // cart.count = somme de toutes les quantités (ex: 10 montres + 1 bracelet = 11)
  // cart.items.length = nombre de produits distincts (= 2) → c'était le bug
  var totalArticles = cart.count

  return (
    <div className="min-h-screen" style={{ background: theme.secondary }}>
      {shop && <PageTracker shopId={shop.id} page="produit" productId={product.id} />}

      <ShopHeader shop={shop} theme={theme} />

      {/* ÉTAPE 2 — Carousel photo produit swipeable */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 600,
        margin: '0 auto',
        overflow: 'hidden',
        touchAction: 'pan-y',
      }}
        onTouchStart={function(e: any) {
          var touch = e.touches[0]
          e.currentTarget.dataset.startX = String(touch.clientX)
        }}
        onTouchEnd={function(e: any) {
          var startX = parseFloat(e.currentTarget.dataset.startX || '0')
          var endX = e.changedTouches[0].clientX
          var diff = startX - endX
          if (Math.abs(diff) > 50) {
            if (diff > 0 && activeIndex < images.length - 1) {
              setActiveIndex(activeIndex + 1)
            } else if (diff < 0 && activeIndex > 0) {
              setActiveIndex(activeIndex - 1)
            }
          }
        }}
      >
        {/* Image active */}
        <div style={{
          width: '100%',
          aspectRatio: '1',
          background: '#F5EDE5',
          position: 'relative',
        }}>
          {images[activeIndex] ? (
            <img src={images[activeIndex]} alt={product.name}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain', objectPosition: 'center',
                transition: 'opacity 0.3s',
              }}
            />
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
          <button type="button" onClick={function() { window.history.back() }}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Flèches navigation desktop (si plus d'1 image) */}
          {images.length > 1 && activeIndex > 0 && (
            <button type="button" onClick={function() { setActiveIndex(activeIndex - 1) }}
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.85)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          {images.length > 1 && activeIndex < images.length - 1 && (
            <button type="button" onClick={function() { setActiveIndex(activeIndex + 1) }}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.85)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2C1A0E" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          )}
        </div>

        {/* Indicateurs de position (points) */}
        {images.length > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 6,
            padding: '12px 0',
          }}>
            {images.map(function(_: any, idx: number) {
              return (
                <button key={idx} type="button"
                  onClick={function() { setActiveIndex(idx) }}
                  style={{
                    width: activeIndex === idx ? 24 : 8,
                    height: 8, borderRadius: 4,
                    background: activeIndex === idx ? theme.primary : '#D0C8BC',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.3s',
                    padding: 0,
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Miniatures (si plus de 1 image) */}
      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, padding: '0 20px 12px',
          overflowX: 'auto', background: theme.secondary,
        }}>
          {images.map(function(img: string, idx: number) {
            var isActive = activeIndex === idx
            return (
              <button key={idx} type="button"
                onClick={function() { setActiveIndex(idx) }}
                style={{
                  width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                  border: isActive ? '2px solid ' + theme.primary : '2px solid transparent',
                  cursor: 'pointer', flexShrink: 0, padding: 0,
                  transition: 'border-color 0.2s',
                  opacity: isActive ? 1 : 0.6,
                }}>
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
          {formatPrice(currentPrice)}
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

      {/* ÉTAPE 4 — Sélection variantes multi-axes */}
      {/* Axe 1 */}
      {product.has_variants && axes.length >= 1 && (
        <div style={{ padding: '0 20px 16px', background: theme.secondary }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: theme.text,
            marginBottom: 10,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            {axes[0].type}
            {selectedAxis1 && (
              <span style={{ marginLeft: 8, color: theme.primary }}>{selectedAxis1}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {axes[0].values.map(function(value: string) {
              var isSelected = selectedAxis1 === value
              var hasStock = variants.some(function(v: any) {
                return v.variant_value === value && (v.stock_quantity === null || v.stock_quantity > 0)
              })
              return (
                <button key={value} type="button"
                  onClick={function() {
                    setSelectedAxis1(isSelected ? null : value)
                    setSelectedAxis2(null)
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: isSelected ? '2px solid ' + theme.primary : '1.5px solid #E8DDD0',
                    background: isSelected ? getLightColor(theme.primary, 0.08) : 'white',
                    color: !hasStock ? '#CCC' : isSelected ? theme.primary : theme.text,
                    fontSize: 13, fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.2s',
                    textDecoration: !hasStock ? 'line-through' : 'none',
                    fontFamily: 'var(--font-outfit), sans-serif',
                  }}>
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Axe 2 (s'affiche si axe 1 sélectionné et qu'il y a un axe 2) */}
      {product.has_variants && axes.length >= 2 && selectedAxis1 && (
        <div style={{ padding: '0 20px 16px', background: theme.secondary }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: theme.text,
            marginBottom: 10,
            fontFamily: 'var(--font-outfit), sans-serif',
          }}>
            {axes[1].type}
            {selectedAxis2 && (
              <span style={{ marginLeft: 8, color: theme.primary }}>{selectedAxis2}</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {axes[1].values.map(function(value: string) {
              var isSelected = selectedAxis2 === value
              var combo = variants.find(function(v: any) {
                return v.variant_value === selectedAxis1 && v.variant_value_2 === value
              })
              var hasStock = combo && (combo.stock_quantity === null || combo.stock_quantity > 0)
              return (
                <button key={value} type="button"
                  onClick={function() { if (hasStock) setSelectedAxis2(isSelected ? null : value) }}
                  disabled={!hasStock}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: isSelected ? '2px solid ' + theme.primary : '1.5px solid #E8DDD0',
                    background: isSelected ? getLightColor(theme.primary, 0.08) : 'white',
                    color: !hasStock ? '#CCC' : isSelected ? theme.primary : theme.text,
                    fontSize: 13, fontWeight: isSelected ? 600 : 400,
                    cursor: !hasStock ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textDecoration: !hasStock ? 'line-through' : 'none',
                    fontFamily: 'var(--font-outfit), sans-serif',
                    opacity: !hasStock ? 0.5 : 1,
                  }}>
                  {value}
                  {combo && combo.stock_quantity !== null && combo.stock_quantity <= 3 && combo.stock_quantity > 0 && (
                    <span style={{ display: 'block', fontSize: 10, color: '#E65100', marginTop: 2 }}>
                      Plus que {combo.stock_quantity}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Indicateur de stock pour la combinaison sélectionnée */}
      {selectedVariant && selectedVariant.stock_quantity !== null && (
        <div style={{
          padding: '0 20px 16px', background: theme.secondary,
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontFamily: 'var(--font-outfit), sans-serif',
          color: selectedVariant.stock_quantity > 5 ? '#2A7A50' : selectedVariant.stock_quantity > 0 ? '#E65100' : '#D32F2F',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: selectedVariant.stock_quantity > 5 ? '#4CAF50' : selectedVariant.stock_quantity > 0 ? '#FF9800' : '#F44336',
          }} />
          {selectedVariant.stock_quantity > 5
            ? 'En stock'
            : selectedVariant.stock_quantity > 0
            ? 'Plus que ' + selectedVariant.stock_quantity + ' en stock'
            : 'Rupture de stock'
          }
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
          disabled={isOutOfStock || !canAddToCart}
          style={{
            width: '100%', padding: '16px 24px',
            borderRadius: 12, border: 'none',
            background: added ? '#2A7A50' : (isOutOfStock || !canAddToCart) ? '#E0D8D0' : theme.primary,
            color: added ? '#FFFFFF' : (isOutOfStock || !canAddToCart) ? '#A0988E' : getContrastText(theme.primary),
            fontSize: 15, fontWeight: 600, cursor: (isOutOfStock || !canAddToCart) ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-outfit), sans-serif',
            letterSpacing: 0.5,
            transition: 'background 0.2s, transform 0.1s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
          onMouseEnter={function(e: any) { if (!isOutOfStock && canAddToCart) e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {added ? (
            <>✓ Ajouté au panier !</>
          ) : isOutOfStock ? (
            <>Rupture de stock</>
          ) : !canAddToCart ? (
            <>Choisir une variante</>
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

      <ShopFooter shop={shop} theme={theme} />
    </div>
  )
}
