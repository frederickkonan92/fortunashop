'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice, statusStyle, statusLabel, whatsappLink } from '@/lib/utils'

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [shop, setShop] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: shopData } = await supabase
      .from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopData)

    if (shopData) {
      const { data: ordersData } = await supabase
        .from('orders').select('*, order_items(*)')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false })
      setOrders(ordersData || [])
    }
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    loadData()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const nextStatus: any = {
    nouvelle: 'confirmee',
    confirmee: 'en_livraison',
    en_livraison: 'livree'
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div className="min-h-screen bg-fs-cream">
      {/* TOP BAR */}
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">{shop?.name || 'Mon espace'}</h1>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <button onClick={handleLogout}
                  className="text-xs text-gray-400 hover:text-white transition">
            Déconnexion
          </button>
       </div>
      </header>

      {/* KPIs */}
      <div className="bg-fs-ink px-4 pb-5">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-fs-orange">
              {orders.filter(o => o.status === 'nouvelle').length}
            </p>
            <p className="text-xs text-gray-500">En attente</p>
          </div>
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
            </p>
            <p className="text-xs text-gray-500">Aujourd hui</p>
          </div>
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">
              {orders.filter(o => o.status === 'livree').reduce((s: number, o: any) => s + o.total, 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">CA livre (F)</p>
          </div>
        </div>
      </div>

      {/* FILTRES */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto max-w-lg mx-auto">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'nouvelle', label: 'Nouvelles' },
          { key: 'confirmee', label: 'Confirmees' },
          { key: 'en_livraison', label: 'En livraison' },
          { key: 'livree', label: 'Livrees' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition
                    ${filter === tab.key ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border'}`}>
            {tab.label}
            <span className="ml-1.5 opacity-60">
              {tab.key === 'all' ? orders.length : orders.filter(o => o.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* LISTE COMMANDES */}
      <div className="px-4 pb-24 max-w-lg mx-auto space-y-3">
        {filtered.map((order: any) => {
          const next = nextStatus[order.status]
          return (
            <div key={order.id} className="bg-white rounded-2xl border border-fs-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-nunito font-extrabold text-sm">{order.order_number}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              <p className="text-sm">
                <strong>{order.customer_name}</strong> · {order.customer_phone}
              </p>
              <p className="text-xs text-fs-gray mt-1">
                {order.order_items?.map((i: any) => `${i.product_name} (${i.quantity})`).join(', ')}
              </p>
              <p className="text-sm font-bold text-fs-orange mt-2">{formatPrice(order.total)}</p>
              <p className="text-xs text-fs-gray2 mt-1">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
              <div className="flex gap-2 mt-3">
                {next && (
                  <button onClick={() => updateStatus(order.id, next)}
                          className="flex-1 bg-fs-ink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-fs-orange transition">
                    → {statusLabel(next)}
                  </button>
                )}
                {order.status === 'confirmee' && shop?.delivery_phone && (
                  <a href={whatsappLink(shop.delivery_phone,
                      `📦 Livraison ${order.order_number}\nClient : ${order.customer_name}\nTel : ${order.customer_phone}\nAdresse : ${order.customer_address || 'Retrait'}\nMontant : ${order.total.toLocaleString()} FCFA`)}
                     target="_blank"
                     className="flex-1 bg-[#25D366] text-white text-xs font-bold py-2.5 rounded-xl text-center">
                    📦 Livreur
                  </a>
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
