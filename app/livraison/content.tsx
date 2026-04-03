'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { getThemeColors } from '@/lib/theme'

export default function LivraisonContent() {
  var searchParams = useSearchParams()
  var token = searchParams.get('token')

  var [status, setStatus] = useState('loading')
  var [order, setOrder] = useState<any>(null)
  var [shop, setShop] = useState<any>(null)
  var [confirming, setConfirming] = useState(false)

  useEffect(function() {
    if (!token) { setStatus('invalid'); return }
    loadToken()
  }, [token])

  var loadToken = async function() {
    var tokenRes = await supabase
      .from('delivery_tokens').select('*').eq('token', token).single()
    if (!tokenRes.data) { setStatus('invalid'); return }
    if (tokenRes.data.used) { setStatus('already_used'); return }
    var orderRes = await supabase
      .from('orders').select('*, order_items(*)').eq('id', tokenRes.data.order_id).single()
    if (!orderRes.data) { setStatus('invalid'); return }
    setOrder(orderRes.data)
    var shopRes = await supabase
      .from('shops').select('*').eq('id', orderRes.data.shop_id).single()
    setShop(shopRes.data)
    setStatus('ready')
  }

  var confirmDelivery = async function() {
    setConfirming(true)
    await supabase.from('delivery_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('token', token)
    await supabase.from('orders').update({ status: 'livree' }).eq('id', order.id)
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
        <h1 className="font-nunito font-extrabold text-xl mb-2">Lien invalide</h1>
        <p className="text-fs-gray">Ce lien de livraison n&apos;existe pas ou a expiré.</p>
      </div>
    )
  }

  if (status === 'already_used') {
    return (
      <div className="min-h-screen bg-fs-cream flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Déjà confirmée</h1>
        <p className="text-fs-gray">Cette livraison a déjà été confirmée.</p>
      </div>
    )
  }

  if (status === 'confirmed') {
    var themeConfirmed = getThemeColors(shop)
    var clientMsg = 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' de ' + (shop?.name || 'la boutique') + ' a été livrée avec succès ! Merci pour votre achat.'
    var clientWaLink = 'https://wa.me/' + order.customer_phone + '?text=' + encodeURIComponent(clientMsg)

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: themeConfirmed.secondary }}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg text-center">
          <p className="text-5xl mb-4">🎉</p>
          <h1 className="font-nunito font-extrabold text-xl mb-2" style={{ color: themeConfirmed.text }}>Livraison confirmée !</h1>
          <p className="text-fs-gray mb-6">La commande {order.order_number} est marquée comme livrée.</p>
          <a href={clientWaLink} target="_blank" rel="noopener noreferrer"
             className="block w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl text-center hover:bg-[#1DA851] transition">
            Notifier le client sur WhatsApp
          </a>
        <p className="text-xs text-fs-gray2 mt-3">Cliquez pour informer le client que sa commande est livrée</p>
        </div>
      </div>
    )
  }

  var items = (order.order_items || []).map(function(i: any) { return i.product_name }).join(', ')

  var theme = getThemeColors(shop)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: theme.secondary }}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg">
        <div className="text-center mb-6">
          <p className="text-5xl mb-3">🛵</p>
          <h1 className="font-nunito font-extrabold text-xl" style={{ color: theme.text }}>Confirmer la livraison</h1>
        </div>
        <div className="rounded-xl p-4 space-y-2 mb-6" style={{ background: theme.secondary }}>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Commande</span>
            <span className="font-bold">{order.order_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Client</span>
            <span className="font-bold">{order.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-fs-gray">Téléphone</span>
            <span className="font-bold">{order.customer_phone}</span>
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
            <span className="font-nunito font-extrabold" style={{ color: theme.primary }}>{order.total.toLocaleString()} FCFA</span>
          </div>
        </div>
        <button onClick={confirmDelivery} disabled={confirming}
                className="w-full bg-fs-green text-white font-bold py-4 rounded-xl hover:bg-[#1F5C3B] transition disabled:opacity-50">
          {confirming ? 'Confirmation...' : 'Confirmer la livraison'}
        </button>
      </div>
    </div>
  )
}
