'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'

export default function LivraisonPage() {
  var searchParams = useSearchParams()
  var token = searchParams.get('token')

  var [status, setStatus] = useState('loading')
  var [order, setOrder] = useState<any>(null)
  var [confirming, setConfirming] = useState(false)

  useEffect(function() {
    if (!token) { setStatus('invalid'); return }
    loadToken()
  }, [token])

  var loadToken = async function() {
    var tokenRes = await supabase
      .from('delivery_tokens')
      .select('*, order_id')
      .eq('token', token)
      .single()

    if (!tokenRes.data) { setStatus('invalid'); return }
    if (tokenRes.data.used) { setStatus('already_used'); return }

    var orderRes = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', tokenRes.data.order_id)
      .single()

    if (orderRes.data) {
      setOrder(orderRes.data)
      setStatus('ready')
    } else {
      setStatus('invalid')
    }
  }

  var confirmDelivery = async function() {
    setConfirming(true)

    await supabase
      .from('delivery_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token)

    await supabase
      .from('orders')
      .update({ status: 'livree' })
      .eq('id', order.id)

    setStatus('confirmed')
    setConfirming(false)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">❌</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Lieinvalide</h1>
        <p className="text-fs-gray">Ce lien de livraison n existe pas ou a expire.</p>
      </div>
    )
  }

  if (status === 'already_used') {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Deja confirmee</h1>
        <p className="text-fs-gray">Cette livraison a deja ete confirmee.</p>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Livraison confirmee !</h1>
        <p className="text-fs-gray">Merci. La commande {order.order_number} est marquee comme livree.</p>
      </div>
    )
  }

  var items = (order.order_items || []).map(function(i: any) { return i.product_name }).join(', ')

  return (
    <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
        <div className="text-center mb-6">
          <p className="text-5xl mb-3">🛵</p>
          <h1 className="font-nunito font-extrabold text-xl">Confirmer la livraison</h1>
        </div>

        <div className="bg-fs-cream rounded-xl p-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Commande</span>
            <span className="font-bold">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Client</span>
            <span className="font-bold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Telephone</span>
            <span className="font-bold">{order.customephone}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Adresse</span>
            <span className="font-bold">{order.customer_address || 'Retrait en boutique'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Produits</span>
            <span className="font-bold text-right">{items}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-fs-border">
            <span className="text-fs-gray">Montant</span>
            <span className="font-nunito font-extrabold text-fs-orange">{order.total.toLocaleString()} FCFA</span>
          </div>
        </div>

        <button onClick={confirmDelivery} disabled={confirming}
                className="w-full bg-fs-green text-white font-bold py-4 rounded-xl hover:bg-[#1F5C3B] transition disabled:opacity-50">
          {confirming ? 'Confirmation...' : 'Confirmer la livraison'}
        </button>
        <p className="text-xs text-fs-gray2 text-center mt-3">
          En cliquant, vous confirmez que la commande a ete remise au client.
        </p>
      </div>
    </div>
  )
}
