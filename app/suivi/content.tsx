'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

export default function SuiviContent() {
  var searchParams = useSearchParams()
  var cmd = searchParams.get('cmd')

  var [order, setOrder] = useState<any>(null)
  var [shop, setShop] = useState<any>(null)
  var [loading, setLoading] = useState(true)

  useEffect(function() {
    if (!cmd) { setLoading(false); return }
    loadOrder()
    var interval = setInterval(loadOrder, 10000)
    return function() { clearInterval(interval) }
  }, [cmd])

  var loadOrder = async function() {
    var orderRes = await supabase
      .from('orders').select('*, order_items(*)')
      .eq('order_number', cmd).single()
    if (orderRes.data) {
      setOrder(orderRes.data)
      var shopRes = await supabase
        .from('shops').select('name, description')
        .eq('id', orderRes.data.shop_id).single()
      setShop(shopRes.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Commande introuvable</h1>
        <p className="text-fs-gray">Verifiez le numero de commande et reessayez.</p>
      </div>
    )
  }

  var steps = [
    { key: 'nouvelle', label: 'Commande recue', icon: '🛒', desc: 'Votre commande a ete enregistree' },
    { key: 'confirmee', label: 'Confirmee', icon: '✅', desc: 'L artisan prepare votre commande' },
    { key: 'en_livraison', label: 'En livraison', icon: '🛵', desc: 'Le livreur est en route' },
    { key: 'livree', label: 'Livree', icon: '🎉', desc: 'Votre commande a ete livree' },
  ]

  var statusOrder: any = { nouvelle: 0, confirmee: 1, en_livraison: 2, livree: 3 }
  var currentIndex = statusOrder[order.status] || 0

  var items = (order.order_items || []).map(function(i: any) {
    return i.product_name + ' x' + i.quantity
  }).join(', ')

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-white border-b border-fs-border px-4 py-4 text-center">
        <p className="text-xs text-fs-gray">Suivi de commande</p>
        <h1 className="font-nunito font-extrabold text-lg">{order.order_number}</h1>
        {shop && <p className="text-xs text-fs-orange font-semibold">{shop.name}</p>}
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">

        <div className="bg-white rounded-2xl border border-fs-border p-5 mb-6">
          <div className="space-y-6">
            {steps.map(function(step, index) {
              var isDone = index <= currentIndex
            var isCurrent = index === currentIndex
              var isLast = index === steps.length - 1

              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={'w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-all duration-500 ' +
                      (isDone ? 'bg-fs-orange text-white' : 'bg-fs-cream2 text-fs-gray2')}>
                      {step.icon}
                    </div>
                    {!isLast && (
                      <div className={'w-0.5 h-8 mt-1 transition-all duration-500 ' +
                        (index < currentIndex ? 'bg-fs-orange' : 'bg-fs-border')} />
                    )}
                  </div>
                  <div className="pt-1.5">
                    <p className={'text-sm font-bold ' + (isDone ? 'text-fs-ink' : 'text-fs-gray2')}>
                      {step.label}
                    </p>
                    <p className={'text-xs mt-0.5 ' + (isDone ? 'text-fs-gray' : 'text-fs-gray2')}>
                      {step.desc}
                    </p>
                    {isCurrent && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-2 h-2 bg-fs-orange rounded-full animate-pulse" />
                        <span className="text-xs font-semibold text-fs-orange">En cours</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-fs-border p-4 space-y-3">
          <p className="text-xs font-bold text-fs-gray uppercase tracking-wider">Details</p>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Client</span>
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Produits</span>
            <span className="font-semibold text-right">{items}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Livraison</span>
            <span className="font-semibold">{order.delivery_mode === 'domicile' ? 'Domicile' : 'Retrait'}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-fs-border">
            <span className="text-fs-gray">Total</span>
            <span className="font-nunito font-extrabold text-fs-orange">{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="text-center text-xs text-fs-gray2 mt-6">
          Cette page se met a jour automatiquement toutes les 10 secondes
        </p>
      </div>
    </div>
  )
}
