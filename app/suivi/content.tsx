'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import { isStatusFinal } from '@/lib/order-status'

function isSuiviTerminal(status: string, deliveryMode: string) {
  if (isStatusFinal(status)) return true
  if (deliveryMode === 'retrait' && status === 'prete') return true
  if (deliveryMode !== 'retrait' && status === 'livree') return true
  return false
}

export default function SuiviContent() {
  var searchParams = useSearchParams()
  var cmd = searchParams.get('cmd')
  var [order, setOrder] = useState<any>(null)
  var [shop, setShop] = useState<any>(null)
  var [loading, setLoading] = useState(true)
  var intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(function() {
    if (!cmd) { setLoading(false); return }

    function clearPoll() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    var loadOrder = async function() {
      var orderRes = await supabase
        .from('orders')
        .select('*, order_items(*), shops(name, description)')
        .eq('order_number', cmd)
        .maybeSingle()

      if (orderRes.error) {
        orderRes = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('order_number', cmd)
          .maybeSingle()
      }

      if (orderRes.data) {
        var row: any = orderRes.data
        setOrder(row)
        var emb = row.shops
        if (emb && typeof emb === 'object' && !Array.isArray(emb)) {
          setShop(emb)
        } else if (Array.isArray(emb) && emb[0]) {
          setShop(emb[0])
        } else {
          var shopRes = await supabase
            .from('shops').select('name, description')
            .eq('id', row.shop_id).single()
          setShop(shopRes.data)
        }
        if (isSuiviTerminal(row.status, row.delivery_mode)) {
          clearPoll()
        }
      } else {
        setOrder(null)
        setShop(null)
      }
      setLoading(false)
    }

    loadOrder()

    intervalRef.current = setInterval(function() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      loadOrder()
    }, 30000)

    function onVisibilityChange() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadOrder()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return function() {
      clearPoll()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [cmd])

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

  var isRetrait = order.delivery_mode === 'retrait'

  // Workflow retrait : nouvelle → confirmee → en_preparation → prete
  // Workflow domicile : nouvelle → confirmee → en_livraison → livree
  var stepsRetrait = [
    { key: 'nouvelle',       label: 'Commande reçue',     icon: '🛒', desc: 'Votre commande a été enregistrée' },
    { key: 'confirmee',      label: 'Confirmée',           icon: '✅', desc: 'L\'artisan prépare votre commande' },
    { key: 'en_preparation', label: 'En préparation',      icon: '📦', desc: 'Votre commande est en cours de préparation' },
    { key: 'prete',          label: 'Prête à retirer',     icon: '🏪', desc: 'Votre commande vous attend en boutique !' },
  ]

  var stepsDomicile = [
    { key: 'nouvelle',     label: 'Commande reçue', icon: '🛒', desc: 'Votre commande a été enregistrée' },
    { key: 'confirmee',    label: 'Confirmée',       icon: '✅', desc: 'L\'artisan prépare votre commande' },
    { key: 'en_livraison', label: 'En livraison',    icon: '🛵', desc: 'Le livreur est en route' },
    { key: 'livree',       label: 'Livrée',          icon: '🎉', desc: 'Votre commande a été livrée' },
  ]

  var steps = isRetrait ? stepsRetrait : stepsDomicile

  // statusOrder : index de chaque statut dans le workflow
  var statusOrderRetrait: any  = { nouvelle: 0, confirmee: 1, en_preparation: 2, prete: 3 }
  var statusOrderDomicile: any = { nouvelle: 0, confirmee: 1, en_livraison: 2, livree: 3 }
  var statusOrder = isRetrait ? statusOrderRetrait : statusOrderDomicile
  var currentIndex = statusOrder[order.status] ?? 0

  var items = (order.order_items || []).map(function(i: any) {
    return i.product_name + ' x' + i.quantity
  }).join(', ')

  var pollHint = isSuiviTerminal(order.status, order.delivery_mode)
    ? 'Statut final — plus de mise à jour automatique'
    : 'Cette page se met à jour automatiquement toutes les 30 secondes (uniquement si l’onglet est visible)'

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

        {/* Détails commande */}
        <div className="bg-white rounded-2xl border border-fs-border p-4 space-y-3">
          <p className="text-xs font-bold text-fs-gray uppercase tracking-wider">Détails</p>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Client</span>
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Produits</span>
            <span className="font-semibold text-right max-w-[60%]">{items}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Livraison</span>
            {/* Affiche le mode de livraison lisiblement */}
            <span className="font-semibold">{isRetrait ? '🏪 Retrait en boutique' : '🛵 Livraison domicile'}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-fs-border">
            <span className="text-fs-gray">Total</span>
            <span className="font-nunito font-extrabold text-fs-orange">{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="text-center text-xs text-fs-gray2 mt-6">
          {pollHint}
        </p>
      </div>
    </div>
  )
}
