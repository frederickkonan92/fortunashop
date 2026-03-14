'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import AdminNav from '../nav'
import Link from 'next/link'

export default function DashboardPage() {
  const [shop, setShop] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return

    var shopRes = await supabase
      .from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)

    if (shopRes.data) {
      var ordersRes = await supabase
        .from('orders').select('*, order_items(*)')
        .eq('shop_id', shopRes.data.id)
        .order('created_at', { ascending: false })
      setOrders(ordersRes.data || [])

      var prodRes = await supabase
        .from('products').select('*')
        .eq('shop_id', shopRes.data.id)
      setProducts(prodRes.data || [])
    }
    setLoading(false)
  }

  var hasAddon = function(addon: string) {
    return shop?.addons?.includes(addon)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!hasAddon('dashboard')) {
    return (
      <div className="min-h-screen bg-fs-cream">
        <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
          <div className="max-w-lg mx-auto">
            <h1 className="font-nunito font-black text-base">Dashboard</h1>
          </div>
        </header>
        <AdminNav shopSlug={shop?.slug} />
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-5xl mb-4">📊</p>
          <h2 className="font-nunito font-extrabold text-lg mb-2">Pack Pilotage</h2>
          <p className="text-fs-gray mb-6 text-sm">
            CA en temps reel, top produits, panier moyen, export CSV. Disponible en add-on.
          </p>
          <p className="font-nunito font-extrabold text-fs-orange text-lg">15 000 FCFA /mois</p>
        </div>
      </div>
    )
  }

  var now = new Date()
  var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  var startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  var filterDate = period === 'month' ? startOfMonth : startOfWeek

  var filteredOrders = orders.filter(function(o) {
    return new Date(o.created_at) >= filterDate
  })

  var deliveredOrders = filteredOrders.filter(function(o) { return o.status === 'livree' })
  var ca = deliveredOrders.reduce(function(sum, o) { return sum + o.total }, 0)
  var nbCommandes = filteredOrders.length
  var panierMoyen = nbCommandes > 0 ? Math.round(ca / deliveredOrders.length) || 0 : 0

  var productSales: any = {}
  filteredOrders.forEach(function(order) {
    if (order.order_items) {
      order.order_items.forEach(function(item: any) {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
        }
        productSales[item.product_name].qty += item.quantity
        productSales[item.product_name].revenue += item.product_price * item.quantity
      })
    }
  })
  var topProducts = Object.values(productSales)
    .sort(function(a: any, b: any) { return b.revenue - a.revenue })
    .slice(0, 5)

  var last30 = Array.from({ length: 30 }, function(_, i) {
    var d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d
  })

  var dailyData = last30.map(function(date) {
    var dayStr = date.toDateString()
    var dayOrders = orders.filter(function(o) {
      return new Date(o.created_at).toDateString() === dayStr && o.status === 'livree'
    })
    var dayCA = dayOrders.reduce(function(sum, o) { return sum + o.total }, 0)
    return { date: date, ca: dayCA, label: date.getDate() + '/' + (date.getMonth() + 1) }
  })
  var maxCA = Math.max(...dailyData.map(function(d) { return d.ca }), 1)

  var exportCSV = function() {
    var headers = 'Numero,Date,Client,Telephone,Produits,Total,Statut,Livraison\n'
    var rows = filteredOrders.map(function(o) {
      var items = (o.order_items || []).map(function(i: any) { return i.product_name }).join(' + ')
      var date = new Date(o.created_at).toLocaleDateString('fr-FR')
      return [o.order_number, date, o.customer_name, o.customer_phone, items, o.total, o.status, o.delivery_mode].join(',')
    }).join('\n')
    var blob = new Blob([headers + rows], { type: 'text/csv' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'commandes-' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">Dashboard</h1>
            <p className="text-xs text-gray-500">{shop?.name}</p>
          </div>
          <button onClick={exportCSV}
                  className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">
            Export CSV
          </button>
        </div>
      </header>
      <AdminNav shopSlug={shop?.slug} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Filtre période */}
        <div className="flex gap-2">
          <button onClick={function() { setPeriod('week') }}
                  className={'px-4 py-2 rounded-full text-xs font-bold transition ' +
                    (period === 'week' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
           7 derniers jours
          </button>
          <button onClick={function() { setPeriod('month') }}
                  className={'px-4 py-2 rounded-full text-xs font-bold transition ' +
                    (period === 'month' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
            Ce mois
          </button>
        </div>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-fs-border rounded-2xl p-4">
            <p className="text-xs text-fs-gray mb-1">Chiffre d affaires</p>
            <p className="font-nunito font-extrabold text-xl text-fs-orange">{formatPrice(ca)}</p>
            <p className="text-xs text-fs-gray2 mt-1">{deliveredOrders.length} commande{deliveredOrders.length > 1 ? 's' : ''} livree{deliveredOrders.length > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white border border-fs-border rounded-2xl p-4">
            <p className="text-xs text-fs-gray mb-1">Commandes totales</p>
            <p className="font-nunito font-extrabold text-xl">{nbCommandes}</p>
            <p className="text-xs text-fs-gray2 mt-1">{filteredOrders.filter(function(o) { return o.status === 'nouvelle' }).length} en attente</p>
          </div>
          <div className="bg-white border border-fs-border rounded-2xl p-4">
            <p className="text-xs text-fs-gray mb-1">Panier moyen</p>
            <p className="font-nunito font-extrabold text-xl">{formatPrice(panierMoyen)}</p>
          </div>
          <div className="bg-white border border-fs-border rounded-2xl p-4">
            <p className="text-xs text-fs-gray mb-1">Taux livraison</p>
            <p className="font-nunito font-extrabold text-xl">
              {nbCommandes > 0 ? Math.round((deliveredOrders.length / nbCommandes) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Graphique 30 jours */}
        <div className="bg-white border border-fs-border rounded-2xl p-4">
          <p className="text-xs font-bold text-fs-gray mb-3">CA sur 30 jours</p>
          <div className="flex items-end gap-[3px] h-32">
            {dailyData.map(function(d, i) {
              var height = maxCA > 0 ? Math.max((d.ca / maxCA) * 100, 2) : 2
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="hidden group-hover:block absolute -top-8 bg-fs-ink text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">
                    {d.label} : {formatPrice(d.ca)}
                  </div>
                  <div className="w-full rounded-t-sm bg-fs-orange transition-all duration-300"
                       style={{ height: height + '%', minHeight: '2px' }} />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-fs-gray2">{dailyData[0]?.label}</span>
            <span className="text-[10px] text-fs-gray2">{dailyData[29]?.label}</span>
          </div>
        </div>

        {/* Top produits */}
        <div className="bg-white border border-fs-border rounded-2xl p-4">
          <p className="text-xs font-bold text-fs-gray mb-3">Top produits</p>
          {topProducts.length === 0 && (
            <p className="text-sm text-fs-gray2 text-center py-4">Aucune vente sur cette periode</p>
          )}
          {topProducts.map(function(p: any, i: number) {
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-fs-cream last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-fs-orange-pale text-fs-orange text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-fs-gray2">{p.qty} vendu{p.qty > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="font-nunito font-extrabold text-sm text-fs-orange">{formatPrice(p.revenue)}</p>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
