'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import PageTracker from '@/components/tracker'
import { useCart } from '@/components/cart'
import Link from 'next/link'
import { getThemeColors, getLightColor, getContrastText } from '@/lib/theme'
import { trackPageView, trackAddToCart } from '@/lib/analytics'

type CatalogueProps = {
  slug: string
  initialShop: any | null
  initialProducts: any[]
}

export default function CatalogueClient({ slug, initialShop, initialProducts }: CatalogueProps) {
  var [shop, setShop] = useState<any | null>(initialShop)
  var [products, setProducts] = useState<any[]>(initialProducts)
  var cart = useCart()
  var [variantPopup, setVariantPopup] = useState<any>(null)
  var [popupAxis1, setPopupAxis1] = useState<string | null>(null)
  var [popupAxis2, setPopupAxis2] = useState<string | null>(null)

  // Helper : extraire les axes de variantes d'un produit
  var getPopupAxes = function(vars: any[]) {
    var axes: any[] = []
    var types1: string[] = []
    vars.forEach(function(v: any) {
      if (v.variant_type && types1.indexOf(v.variant_type) === -1) types1.push(v.variant_type)
    })
    if (types1.length > 0) {
      var values1: string[] = []
      vars.forEach(function(v: any) {
        if (v.variant_type === types1[0] && values1.indexOf(v.variant_value) === -1) values1.push(v.variant_value)
      })
      axes.push({ type: types1[0], values: values1 })
    }
    var types2: string[] = []
    vars.forEach(function(v: any) {
      if (v.variant_type_2 && types2.indexOf(v.variant_type_2) === -1) types2.push(v.variant_type_2)
    })
    if (types2.length > 0) {
      var values2: string[] = []
      vars.forEach(function(v: any) {
        if (v.variant_type_2 === types2[0] && v.variant_value_2 && values2.indexOf(v.variant_value_2) === -1) values2.push(v.variant_value_2)
      })
      axes.push({ type: types2[0], values: values2 })
    }
    return axes
  }
  var [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Sync si les props serveur changent (navigation App Router)
  useEffect(function() {
    setShop(initialShop)
    setProducts(initialProducts)
  }, [slug, initialShop, initialProducts])

  // Analytics : page_view
  useEffect(function() {
    if (initialShop?.id) trackPageView(initialShop.id)
  }, [initialShop?.id])

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fs-cream px-6">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Boutique introuvable</h1>
        <p className="text-fs-gray text-center">
          Cette boutique n&apos;existe pas ou est temporairement hors ligne.
        </p>
      </div>
    )
  }

  var handleAdd = function(product: any) {
    cart.addItem(product)
    if (shop?.id) trackAddToCart(shop.id, product.id, product.name, product.price)
  }

  var getItemQty = function(productId: string) {
    var item = cart.items.find(function(i) { return i.id === productId })
    return item ? item.quantity : 0
  }

  var theme = getThemeColors(shop)

  // Extraire les catégories pour les filtres
  var categories = Array.from(
    new Set(
      products
        .map(function(p: any) { return p.category })
        .filter(function(c: any) { return c && c.trim() !== '' })
    )
  ).sort() as string[]

  var filteredProducts = activeCategory
    ? products.filter(function(p: any) { return p.category === activeCategory })
    : products

  // Helper : image principale depuis product_images (fallback sur image_url)
  var getMainImage = function(product: any) {
    if (product.product_images && product.product_images.length > 0) {
      var sorted = product.product_images.slice().sort(function(a: any, b: any) { return a.position - b.position })
      return sorted[0].image_url
    }
    return product.image_url
  }

  var cartCount = cart.count
  var cartTotal = cart.total

  return (
    <div className="min-h-screen pb-32" style={{ background: theme.secondary }}>
      <PageTracker shopId={shop.id} page="catalogue" />

      {/* ÉTAPE 1 — Header boutique redesigné */}
      <header style={{
        background: theme.primary,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href={'/boutique/' + shop.slug} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
          {/* Logo ou initiale */}
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
        {/* Badge en ligne */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, color: 'rgba(255,255,255,0.7)',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50' }} />
          En ligne
        </div>
      </header>

      {/* ÉTAPE 2 — Section Hero */}
      <section style={{
        background: theme.primary,
        padding: '48px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cercle décoratif subtil */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          border: '1px solid ' + getLightColor(theme.accent, 0.15),
          pointerEvents: 'none',
        }} />
        <div style={{
          fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
          color: theme.accent, marginBottom: 16, fontWeight: 500,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}>
          {shop.hero_subtitle || 'Boutique en ligne'}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 28, fontWeight: 300, lineHeight: 1.2,
          color: getContrastText(theme.primary),
          marginBottom: 10, letterSpacing: 0.5,
        }}>
          {shop.hero_title || ('Bienvenue chez ' + shop.name)}
        </h1>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.55)',
          maxWidth: 340, margin: '0 auto', lineHeight: 1.6,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}>
          Parcourez nos créations et commandez directement en ligne
        </p>
        {/* Ligne décorative */}
        <div style={{
          width: 40, height: 1,
          background: theme.accent, margin: '20px auto 0', opacity: 0.4,
        }} />
      </section>

      {/* ÉTAPE 3 — Barre de filtres redesignée */}
      {categories.length >= 2 && (
        <div style={{
          padding: '20px 20px 0', background: theme.secondary,
        }}>
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16,
            borderBottom: '1px solid #E8DDD0',
          }}>
            {/* Bouton Tout */}
            <button type="button" onClick={function() { setActiveCategory(null) }}
              style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.3s',
                border: activeCategory === null ? 'none' : '1px solid #E8DDD0',
                background: activeCategory === null ? theme.primary : 'white',
                color: activeCategory === null ? getContrastText(theme.primary) : '#7C6C58',
                fontFamily: 'var(--font-outfit), sans-serif',
              }}>
              Tout ({products.length})
            </button>
            {categories.map(function(cat: string) {
              var count = products.filter(function(p: any) { return p.category === cat }).length
              var isActive = activeCategory === cat
              return (
                <button key={cat} type="button" onClick={function() { setActiveCategory(cat) }}
                  style={{
                    padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.3s',
                    border: isActive ? 'none' : '1px solid #E8DDD0',
                    background: isActive ? theme.primary : 'white',
                    color: isActive ? getContrastText(theme.primary) : '#7C6C58',
                    fontFamily: 'var(--font-outfit), sans-serif',
                    textTransform: 'capitalize',
                  }}>
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ÉTAPE 7 — Section titre catalogue */}
      <div style={{
        padding: '20px 20px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <div style={{
          fontFamily: 'var(--font-cormorant), serif',
          fontSize: 18, fontWeight: 600, color: theme.text,
        }}>
          Nos créations
        </div>
        <div style={{
          fontSize: 11, color: '#7C6C58',
          letterSpacing: 1, textTransform: 'uppercase',
        }}>
          {filteredProducts.length} {filteredProducts.length > 1 ? 'pièces' : 'pièce'}
        </div>
      </div>

      {/* ÉTAPE 4 — Cartes produit redesignées */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 14,
        padding: '0 20px 24px',
      }}>
        {filteredProducts.map(function(product: any) {
          var qty = getItemQty(product.id)
          return (
            <div key={product.id}
              style={{
                background: 'white', borderRadius: 14, overflow: 'hidden',
                border: '1px solid #E8DDD0', cursor: 'pointer',
                transition: 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.35s',
              }}
              onMouseEnter={function(e: any) {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 16px 40px ' + getLightColor(theme.primary, 0.1)
              }}
              onMouseLeave={function(e: any) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* ZONE CLIQUABLE : image + infos */}
              <a href={'/boutique/' + shop.slug + '/produit/' + product.id} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                {/* Image produit */}
                <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', overflow: 'hidden', borderRadius: '14px 14px 0 0', background: '#F5EDE5' }}>
                  {getMainImage(product) ? (
                    getMainImage(product).indexOf('images.unsplash.com') !== -1 ? (
                      <img
                        src={getMainImage(product)}
                        alt={product.name}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        loading="lazy" />
                    ) : (
                      <Image
                        src={getMainImage(product)}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        sizes="(max-width: 640px) 50vw, 200px"
                      />
                    )
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#CCC', fontSize: 13 }}>
                      Photo
                    </div>
                  )}
                  {/* Badge catégorie */}
                  {product.category && (
                    <span style={{
                      position: 'absolute', top: 10, left: 10,
                      padding: '3px 10px', borderRadius: 10,
                      fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      background: theme.primary, color: getContrastText(theme.primary),
                    }}>
                      {product.category}
                    </span>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: '12px 14px 8px' }}>
                  <div style={{
                    fontFamily: 'var(--font-cormorant), serif',
                    fontSize: 15, fontWeight: 600, color: theme.text,
                    lineHeight: 1.3, marginBottom: 6,
                  }}>
                    {product.name}
                  </div>
                  {product.description && (
                    <p style={{ fontSize: 11, color: '#7C6C58', marginBottom: 6, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {product.description}
                    </p>
                  )}

                  {/* BADGES VARIANTES (dédupliquées par axe 1) */}
                  {product.has_variants && product.product_variants && product.product_variants.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {(function() {
                        var activeVars = product.product_variants.filter(function(v: any) { return v.is_active })
                        var uniqueValues: string[] = []
                        var seen: any = {}
                        activeVars.sort(function(a: any, b: any) { return a.sort_order - b.sort_order }).forEach(function(v: any) {
                          if (!seen[v.variant_value]) {
                            seen[v.variant_value] = true
                            uniqueValues.push(v.variant_value)
                          }
                        })
                        return uniqueValues.map(function(val: string) {
                          var hasStock = activeVars.some(function(v: any) {
                            return v.variant_value === val && (v.stock_quantity === null || v.stock_quantity > 0)
                          })
                          return (
                            <span key={val}
                                  style={{
                                    fontSize: 10, padding: '2px 6px', borderRadius: 4,
                                    border: '1px solid ' + (!hasStock ? '#E8DDD0' : '#D0C8BC'),
                                    color: !hasStock ? '#E8DDD0' : '#7C6C58',
                                    textDecoration: !hasStock ? 'line-through' : 'none',
                                  }}>
                              {val}
                            </span>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
              </a>

              {/* Prix + bouton "+" alignés */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0 14px 14px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.primary }}>
                  {formatPrice(product.price)}
                </div>
                <button type="button"
                  onClick={function(e: any) {
                    e.stopPropagation()
                    if (product.has_variants && product.product_variants?.length > 0) {
                      setPopupAxis1(null)
                      setPopupAxis2(null)
                      setVariantPopup(product)
                    } else {
                      handleAdd(product)
                    }
                  }}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: theme.primary, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.08)' }}
                  onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ÉTAPE 8 — Message produits vides redesigné */}
      {filteredProducts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: '#7C6C58',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
            {activeCategory ? '( )' : '...'}
          </div>
          <p style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 18, fontWeight: 500, marginBottom: 8, color: theme.text,
          }}>
            {activeCategory ? 'Aucun produit dans cette catégorie' : 'Les créations arrivent bientôt'}
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>
            {activeCategory
              ? 'Essayez une autre catégorie ou revenez bientôt'
              : 'Nous préparons notre catalogue avec soin'
            }
          </p>
        </div>
      )}

      {/* POPUP SÉLECTION VARIANTE (multi-axes) */}
{variantPopup && (function() {
        var popupVars = (variantPopup.product_variants || []).filter(function(v: any) { return v.is_active }).sort(function(a: any, b: any) { return a.sort_order - b.sort_order })
        var popupAxes = getPopupAxes(popupVars)
        // Trouver la variante sélectionnée
        var popupSelectedVariant = (function() {
          if (!popupAxis1) return null
          if (popupAxes.length === 1) return popupVars.find(function(v: any) { return v.variant_value === popupAxis1 }) || null
          if (popupAxes.length === 2 && popupAxis2) return popupVars.find(function(v: any) { return v.variant_value === popupAxis1 && v.variant_value_2 === popupAxis2 }) || null
          return null
        })()
        var popupCanConfirm = (function() {
          if (popupAxes.length === 1 && popupAxis1 && popupSelectedVariant) return !(popupSelectedVariant.stock_quantity != null && popupSelectedVariant.stock_quantity <= 0)
          if (popupAxes.length === 2 && popupAxis1 && popupAxis2 && popupSelectedVariant) return !(popupSelectedVariant.stock_quantity != null && popupSelectedVariant.stock_quantity <= 0)
          return false
        })()
        var popupPrice = popupSelectedVariant?.price_override ?? variantPopup.price

        return (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={function() { setVariantPopup(null); setPopupAxis1(null); setPopupAxis2(null) }}>
         <div
            className="bg-white w-full max-w-lg rounded-t-2xl p-5 pb-24"
            onClick={function(e) { e.stopPropagation() }}>

            {/* Header popup */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-nunito font-extrabold text-base">{variantPopup.name}</p>
                <p className="text-xs text-fs-gray">
                  {popupAxes.length >= 1 ? popupAxes[0].type : 'Choisir un modèle'}
                  {popupAxes.length >= 2 ? ' + ' + popupAxes[1].type : ''}
                </p>
              </div>
              <button
                onClick={function() { setVariantPopup(null); setPopupAxis1(null); setPopupAxis2(null) }}
                className="w-8 h-8 rounded-full bg-fs-cream flex items-center justify-center text-fs-gray font-bold">
                ✕
              </button>
            </div>

            {/* Axe 1 */}
            {popupAxes.length >= 1 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-fs-gray mb-2">{popupAxes[0].type}</p>
                <div className="flex flex-wrap gap-2">
                  {popupAxes[0].values.map(function(value: string) {
                    var isSelected = popupAxis1 === value
                    var hasStock = popupVars.some(function(v: any) {
                      return v.variant_value === value && (v.stock_quantity === null || v.stock_quantity > 0)
                    })
                    return (
                      <button key={value} type="button"
                        onClick={function() { setPopupAxis1(isSelected ? null : value); setPopupAxis2(null) }}
                        style={
                          !hasStock ? undefined
                          : isSelected ? { background: theme.primary, borderColor: theme.primary, color: getContrastText(theme.primary) }
                          : undefined
                        }
                        className={'px-4 py-2 rounded-xl border-2 text-sm font-bold transition ' +
                          (!hasStock ? 'border-fs-border text-fs-border line-through cursor-not-allowed'
                          : isSelected ? '' : 'border-fs-border text-fs-ink hover:border-fs-orange')}>
                        {value}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Axe 2 (si sélection axe 1 + axe 2 existe) */}
            {popupAxes.length >= 2 && popupAxis1 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-fs-gray mb-2">{popupAxes[1].type}</p>
                <div className="flex flex-wrap gap-2">
                  {popupAxes[1].values.map(function(value: string) {
                    var isSelected = popupAxis2 === value
                    var combo = popupVars.find(function(v: any) {
                      return v.variant_value === popupAxis1 && v.variant_value_2 === value
                    })
                    var hasStock = combo && (combo.stock_quantity === null || combo.stock_quantity > 0)
                    return (
                      <button key={value} type="button"
                        disabled={!hasStock}
                        onClick={function() { if (hasStock) setPopupAxis2(isSelected ? null : value) }}
                        style={
                          !hasStock ? undefined
                          : isSelected ? { background: theme.primary, borderColor: theme.primary, color: getContrastText(theme.primary) }
                          : undefined
                        }
                        className={'px-4 py-2 rounded-xl border-2 text-sm font-bold transition ' +
                          (!hasStock ? 'border-fs-border text-fs-border line-through cursor-not-allowed opacity-50'
                          : isSelected ? '' : 'border-fs-border text-fs-ink hover:border-fs-orange')}>
                        {value}
                        {combo && combo.stock_quantity != null && combo.stock_quantity > 0 && combo.stock_quantity <= 3 && (
                          <span className="ml-1 text-[10px] text-amber-500">({combo.stock_quantity})</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stock de la combinaison sélectionnée */}
            {popupSelectedVariant && popupSelectedVariant.stock_quantity !== null && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                fontSize: 12, fontFamily: 'var(--font-outfit), sans-serif',
                color: popupSelectedVariant.stock_quantity > 5 ? '#2A7A50' : popupSelectedVariant.stock_quantity > 0 ? '#E65100' : '#D32F2F',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: popupSelectedVariant.stock_quantity > 5 ? '#4CAF50' : popupSelectedVariant.stock_quantity > 0 ? '#FF9800' : '#F44336',
                }} />
                {popupSelectedVariant.stock_quantity > 5
                  ? 'En stock'
                  : popupSelectedVariant.stock_quantity > 0
                  ? 'Plus que ' + popupSelectedVariant.stock_quantity + ' en stock'
                  : 'Rupture de stock'
                }
              </div>
            )}

            {/* Bouton confirmer */}
            <button
              disabled={!popupCanConfirm}
              onClick={function() {
                if (!popupSelectedVariant) return
                var price = popupSelectedVariant.price_override ?? variantPopup.price
                var variantLabel = popupAxis1 || ''
                if (popupAxis2) variantLabel += ' / ' + popupAxis2
                var cartId = variantPopup.id + '-' + variantLabel
                cart.addItem({
                  id: cartId,
                  name: variantPopup.name + ' — ' + variantLabel,
                  price: price,
                  image_url: variantPopup.image_url,
                  stock_quantity: popupSelectedVariant.stock_quantity
                })
                if (shop?.id) trackAddToCart(shop.id, variantPopup.id, variantPopup.name, price, variantLabel)
                setVariantPopup(null)
                setPopupAxis1(null)
                setPopupAxis2(null)
              }}
              className="w-full font-bold py-3.5 rounded-xl transition disabled:opacity-40"
              style={{ background: theme.primary, color: getContrastText(theme.primary) }}>
              {popupCanConfirm
                ? 'Ajouter au panier — ' + new Intl.NumberFormat('fr-FR').format(popupPrice) + ' FCFA'
                : 'Choisir un modèle'}
            </button>
          </div>
        </div>
        )
      })()}

      {/* ÉTAPE 6 — Footer enrichi */}
      <footer style={{
        background: getLightColor(theme.primary, 0.04),
        padding: '24px 20px',
        borderTop: '1px solid #E8DDD0',
      }}>
        {/* Réseaux sociaux de l'artisan (si renseignés) */}
        {(shop.social_instagram || shop.social_facebook || shop.social_whatsapp) && (
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
        {/* Propulsé par fortunashop */}
        <div style={{ textAlign: 'center' }}>
          <a href="https://fortunashop.fr" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: '#7C6C58', textDecoration: 'none' }}>
            Propulsé par <span style={{ color: '#DC5014', fontWeight: 600 }}>fortunashop</span>
          </a>
        </div>
      </footer>

      {/* ÉTAPE 5 — Barre panier redesignée */}
      {cartCount > 0 && (
        <Link href={'/boutique/' + slug + '/commander'}
          style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)', maxWidth: 440,
            background: theme.primary, borderRadius: 14,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 24px ' + getLightColor(theme.primary, 0.25),
            cursor: 'pointer', zIndex: 50,
            textDecoration: 'none',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: theme.accent, color: theme.primary,
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {cartCount}
            </div>
            <div style={{
              fontSize: 13, color: getContrastText(theme.primary), fontWeight: 500,
              fontFamily: 'var(--font-outfit), sans-serif',
            }}>
              Voir le panier
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 18, fontWeight: 600,
            color: theme.accent,
          }}>
            {formatPrice(cartTotal)}
          </div>
        </Link>
      )}
    </div>
  )
}
