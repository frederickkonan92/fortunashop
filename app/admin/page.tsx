'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from './nav'
import { formatPrice, statusStyle, statusLabel } from '@/lib/utils'

export default function AdminPage() {
  var [orders, setOrders] = useState<any[]>([])
  var [filter, setFilter] = useState('all')
  var [shop, setShop] = useState<any>(null)

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var ordersRes = await supabase.from('orders').select('*, order_items(*)')
        .eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setOrders(ordersRes.data || [])
    }
  }

  var updateStatus = async function(orderId: string, newStatus: string) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    loadData()
  }

  var sendToLivreur = function(order: any) {
    if (!shop?.delivery_phone) return
    var baseUrl = window.location.origin
    var token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    var confirmLink = ''
    if (shop?.addons?.includes('livreur_link')) {
      confirmLink = '\n\nConfirmer livraison ici :\n' + baseUrl + '/livraison?token=' + token
      supabase.from('delivery_tokens').insert({ order_id: order.id, token: token })
    }
    var message = 'Livraison ' + order.order_number + '\nClient : ' + order.customer_name + '\nTel : ' + order.customer_phone + '\nAdresse : ' + (order.customer_address || 'Retrait en boutique') + '\nMontant : ' + order.total.toLocaleString() + ' FCFA' + confirmLink
    console.log("MESSAGE:", message)
    console.log("CONFIRM LINK:", confirmLink)
    window.location.href = 'https://wa.me/' + shop.delivery_phone + '?text=' + encodeURIComponent(message)
  }

  var handleLogout = async function() {
    await supabase.auth.signOut()
    console.log("MESSAGE:", message)
    console.log("CONFIRM LINK:", confirmLink)
    window.location.href = '/admin/login'
  }

  var nextStatus: any = { nouvelle: 'confirmee', confirmee: 'en_livraison', en_livraison: 'livree' }
  var tabs = [
    { key: 'all', label: 'Toutes' },
    { key: 'nouvelle', label: 'Nouvelles' },
    { key: 'confirmee', label: 'Confirmees' },
    { key: 'en_livraison', label: 'En livraison' },
    { key: 'livree', label: 'Livrees' },
  ]
  var filtered = filter === 'all' ? orders : orders.filter(function(o) { return o.status === filter })
  var countByStatus = function(s: string) { return orders.filter(function(o) { return o.status === s }).length }
  var todayCount = orders.filter(function(o) { return new Date(o.created_at).toDateString() === new Date().toDateString() }).length
  var caLivre = orders.filter(function(o) { return o.status === 'livree' }).reduce(function(sum, o) { return sum + o.total }, 0)

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">{shop?.name || 'Mon espace'}</h1>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-white transition">Deconnexion</button>
        </div>
      </header>
      <AdminNav shopSlug={shop?.slug} />
      <div className="bg-fs-ink px-4 pb-5">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-fs-orange">{countByStatus('nouvelle')}</p>
            <p className="text-xs text-gray-500">En attente</p>
          </div>
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{todayCount}</p>
            <p className="text-xs text-gray-500">Aujourd hui</p>
          </div>
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{caLivre.toLocaleString()}</p>
            <p className="text-xs text-gray-500">CA livre (F)</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 flex gap-2 overflow-x-auto max-w-lg mx-auto">
        {tabs.map(function(tab) {
          return (
            <button key={tab.key} onClick={function() { setFilter(tab.key) }}
                    className={'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ' + (filter === tab.key ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
              {tab.label} <span className="ml-1.5 opacity-60">{tab.key === 'all' ? orders.length : countByStatus(tab.key)}</span>
            </button>
          )
        })}
      </div>
      <div className="px-4 pb-24 max-w-lg mx-auto space-y-3">
        {filtered.map(function(order) {
          var next = nextStatus[order.status]
          var items = (order.order_items || []).map(function(i: any) { return i.product_name + ' (' + i.quantity + ')' }).join(', ')
          return (
            <div key={order.id} className="bg-white rounded-2xl border border-fs-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-nunito font-extrabold text-sm">{order.order_number}</span>
                <span className={'px-3 py-1 rounded-full text-xs font-bold ' + statusStyle(order.status)}>{statusLabel(order.status)}</span>
              </div>
              <p className="text-sm"><strong>{order.customer_name}</strong> · {order.customer_phone}</p>
              <p className="text-xs text-fs-gray mt-1">{items}</p>
              <p className="text-sm font-bold text-fs-orange mt-2">{formatPrice(order.total)}</p>
              <p className="text-xs text-fs-gray2 mt-1">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {next && (
                  <button onClick={function() { updateStatus(order.id, next) }}
                          className="flex-1 bg-fs-ink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-fs-orange transition">
                    {'-> ' + statusLabel(next)}
                  </button>
                )}
                {(order.status === 'confirmee' || order.status === 'en_livraison') && shop?.delivery_phone && (
                  <button onClick={function() { sendToLivreur(order) }}
                          className="flex-1 bg-[#25D366] text-white text-xs font-bold py-2.5 rounded-xl text-center">
                    Envoyer au livreur
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-center text-fs-gray2 py-12">Aucune commande</p>
        )}
      </div>
    </div>
  )
}
