'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { getContrastText } from '@/lib/theme'

export function useCart() {
  const [items, setItems] = useState<any[]>([])

  useEffect(function() {
    try {
      var saved = localStorage.getItem('fortunashop-cart')
      if (saved) {
        var parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.every(function(i: any) { return i.id && typeof i.price === 'number' && i.price > 0 && typeof i.quantity === 'number' })) {
          setItems(parsed)
        }
      }
    } catch (e) {
      // localStorage corrompu ou indisponible (mode privé)
    }
  }, [])

  var saveCart = function(newItems: any[]) {
    setItems(newItems)
    try {
      localStorage.setItem('fortunashop-cart', JSON.stringify(newItems))
    } catch (e) {
      // localStorage plein ou indisponible (mode privé)
    }
  }

  var addItem = function(product: any) {
    var existing = items.find(function(i) { return i.id === product.id })
    if (existing) {
      var updated = items.map(function(i) {
        if (i.id === product.id) return { ...i, quantity: i.quantity + 1 }
        return i
      })
      saveCart(updated)
    } else {
      saveCart([...items, { ...product, quantity: 1 }])
    }
  }

  var removeItem = function(productId: string) {
    var updated = items.filter(function(i) { return i.id !== productId })
    saveCart(updated)
  }

  var updateQuantity = function(productId: string, quantity: number) {
    if (quantity <= 0) { removeItem(productId); return }
    var updated = items.map(function(i) {
      if (i.id === productId) return { ...i, quantity: quantity }
      return i
    })
    saveCart(updated)
  }

  var clearCart = function() {
    setItems([])
    try { localStorage.removeItem('fortunashop-cart') } catch (e) {}
  }

  var total = items.reduce(function(sum, i) { return sum + (i.price * i.quantity) }, 0)
  var count = items.reduce(function(sum, i) { return sum + i.quantity }, 0)

  return { items, addItem, removeItem, updateQuantity, clearCart, total, count }
}

export function CartBar(props: {
  count: number
  total: number
  slug: string
  /** Si défini : barre avec fond couleur primaire du thème boutique */
  themePrimary?: string
  themeAccent?: string
}) {
  var count = props.count
  var total = props.total
  var slug = props.slug
  var themePrimary = props.themePrimary
  var themeAccent = props.themeAccent

  if (count === 0) return null

  if (themePrimary) {
    var accent = themeAccent || '#F07832'
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 shadow-lg" style={{ background: themePrimary }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div style={{ color: getContrastText(themePrimary) }}>
            <span className="font-bold">{count} article{count > 1 ? 's' : ''}</span>
            <span className="text-fs-gray2 mx-2">·</span>
            <span className="font-nunito font-extrabold" style={{ color: accent }}>{formatPrice(total)}</span>
          </div>
          <Link href={'/boutique/' + slug + '/commander'}
                className="font-bold text-sm px-5 py-2.5 rounded-xl transition"
                style={{ background: accent, color: getContrastText(accent) }}>
            Commander
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-fs-ink px-4 py-3 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="text-white">
          <span className="font-bold">{count} article{count > 1 ? 's' : ''}</span>
          <span className="text-fs-gray2 mx-2">·</span>
          <span className="font-nunito font-extrabold text-fs-orange">{formatPrice(total)}</span>
        </div>
        <Link href={'/boutique/' + slug + '/commander'}
              className="bg-fs-orange text-white font-bold text-sm px-5 py-2.5 rounded-xl
                         hover:bg-fs-orange-deep transition">
          Commander
        </Link>
      </div>
    </div>
  )
}
