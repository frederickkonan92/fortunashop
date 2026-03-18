'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import AdminNav from '../nav'

export default function DashboardPage() {
  var [shop, setShop] = useState<any>(null)
  var [orders, setOrders] = useState<any[]>([])
  var [pageViews, setPageViews] = useState<any[]>([])
  var [period, setPeriod] = useState('month')
  var [tab, setTab] = useState('ventes')
  var [loading, setLoading] = useState(true)
  var [physicalSales, setPhysicalSales] = useState<any[]>([])
  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var ordersRes = await supabase.from('orders').select('*, order_items(*)').eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setOrders(ordersRes.data || [])
      var viewsRes = await supabase.from('page_views').select('*').eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setPageViews(viewsRes.data || [])
      // Charge les ventes physiques pour les inclure dans le dashboard
      var physicalRes = await supabase.from('physical_sales').select('*').eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setPhysicalSales(physicalRes.data || [])
    }
    setLoading(false)
  }

  var hasAddon = function(addon: string) { return shop?.addons?.includes(addon) }

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
          <div className="max-w-lg mx-auto"><h1 className="font-nunito font-black text-base">Dashboard</h1></div>
        </header>
        <AdminNav shopSlug={shop?.slug} />
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-5xl mb-4">📊</p>
          <h2 className="font-nunito fonextrabold text-lg mb-2">Pack Pilotage</h2>
          <p className="text-fs-gray mb-6 text-sm">CA en temps reel, top produits, analytics. Disponible en add-on.</p>
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

  var filteredOrders = orders.filter(function(o) { return new Date(o.created_at) >= filterDate })
  var deliveredOrders = filteredOrders.filter(function(o) { return o.status === 'livree' })
 // CA ventes en ligne (commandes livrées)
 var caOnline = deliveredOrders.reduce(function(sum, o) { return sum + o.total }, 0)
 // CA ventes physiques sur la période
 var filteredPhysical = physicalSales.filter(function(s) { return new Date(s.created_at) >= filterDate })
 var caPhysical = filteredPhysical.reduce(function(sum, s) { return sum + s.total }, 0)
 // CA total = en ligne + physique
 var ca = caOnline + caPhysical
  var nbCommandes = filteredOrders.length
  var panierMoyen = deliveredOrders.length > 0 ? Math.round(ca / deliveredOrders.length) : 0

  var filteredViews = pageViews.filter(function(v) { return new Date(v.created_at) >= filterDate })
  var totalVisites = filteredViews.length
  var tauxConversion = totalVisites > 0 ? ((nbCommandes / totalVisites) * 100).toFixed(1) : '0'

  var referrerCounts: any = {}
  filteredViews.forEach(function(v) {
    var r = v.referrer || 'direct'
    referrerCounts[r] = (referrerCounts[r] || 0) + 1
  })
  var referrerList = Object.entries(referrerCounts).sort(function(a: any, b: any) { return b[1] - a[1] })

  var referrerIcons: any = { direct: '🔗', whatsapp: '💬', instagram: '📸', facebook: '👤', twitter: '🐦', autre: '🌐' }

  var productSales: any = {}
  // Ventes en ligne
  filteredOrders.forEach(function(order) {
    if (order.order_items) {
      order.order_items.forEach(function(item: any) {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { name: item.product_name, qtyOnline: 0, qtyPhysical: 0, revenue: 0 }
        }
        productSales[item.product_name].qtyOnline += item.quantity
        productSales[item.product_name].revenue += item.product_price * item.quantity
      })
    }
  })
  // Ventes physiques — ajoutées si addon stock activé
  if (hasAddon('stock')) {
    filteredPhysical.forEach(function(sale: any) {
      if (!productSales[sale.product_name]) {
        productSales[sale.product_name] = { name: sale.product_name, qtyOnline: 0, qtyPhysical: 0, revenue: 0 }
      }
      productSales[sale.product_name].qtyPhysical += sale.quantity
      productSales[sale.product_name].revenue += sale.total
    })
  }
  var topProducts = Object.values(productSales).sort(function(a: any, b: any) { return b.revenue - a.revenue }).slice(0, 5)

  var last30 = Array.from({ length: 30 }, function(_, i) { var d = new Date(); d.setDate(d.getDate() - (29 - i)); return d })
  var dailyCA = last30.map(function(date) {
    var dayStr = date.toDateString()
    var dayOrders = orders.filter(function(o) { return new Date(o.created_at).toDateString() === dayStr && o.status === 'livree' })
    return { date: date, ca: dayOrders.reduce(function(sum, o) { return sum + o.total }, 0), label: date.getDate() + '/' + (date.getMonth() + 1) }
  })
  var maxCA = Math.max.apply(null, dailyCA.map(function(d) { return d.ca }).concat([1]))

  var dailyVisits = last30.map(function(date) {
    var dayStr = date.toDateString()
    var count = pageViews.filter(function(v) { return new Date(v.created_at).toDateString() === dayStr }).length
    return { date: date, count: count, label: date.getDate() + '/' + (date.getMonth() + 1) }
  })
  var maxVisits = Math.max.apply(null, dailyVisits.map(function(d) { return d.count }).concat([1]))

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
          <button onClick={exportCSV} className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">Export CSV</button>
        </div>
      </header>
      <AdminNav shopSlug={shop?.slug} />


<div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <div className="flex gap-2">
          <button onClick={function() { setTab('ventes') }}
                  className={'px-4 py-2 rounded-full text-xs font-bold transition ' + (tab === 'ventes' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
            Ventes
          </button>
          <button onClick={function() { setTab('analytics') }}
                  className={'px-4 py-2 rounded-full text-xs font-bold transition ' + (tab === 'analytics' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
            Analytics
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={function() { setPeriod('week') }}
                    className={'px-3 py-2 rounded-full text-[11px] font-bold transition ' + (period === 'week' ? 'bg-fs-orange text-white' : 'bg-white text-fs-gray2 border border-fs-border')}>
              7j
            </button>
            <button onClick={function() { setPeriod('month') }}
                    className={'px-3 py-2 rounded-full text-[11px] font-bold transition ' + (period === 'month' ? 'bg-fs-orange text-white' : 'bg-white text-fs-gray2 border border-fs-border')}>
              30j
            </button>
          </div>
        </div>

        {tab === 'ventes' && (
          <div className="space-y-4">
           <div className="grid grid-cols-2 gap-3">
              {/* CA total avec distinction en ligne / physique */}
              <div className="bg-white border border-fs-border rounded-2xl p-4 col-span-2">
                <p className="text-xs text-fs-gray mb-1">Chiffre d'affaires total</p>
                <p className="font-nunito font-extrabold text-xl text-fs-orange">{formatPrice(ca)}</p>
                <div className="flex gap-3 mt-2">
                  {/* CA en ligne */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-fs-orange" />
                    <span className="text-xs text-fs-gray">En ligne : {formatPrice(caOnline)}</span>
                  </div>
                  {/* CA physique — affiché uniquement si l'artisan a l'addon stock */}
                  {hasAddon('stock') && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-fs-ink" />
                      <span className="text-xs text-fs-gray">Physique : {formatPrice(caPhysical)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Commandes en ligne</p>
                <p className="font-nunito font-extrabold text-xl">{nbCommandes}</p>
              </div>
              {/* Ventes physiques — uniquement si addon stock */}
              {hasAddon('stock') && (
                <div className="bg-white border border-fs-border rounded-2xl p-4">
                  <p className="text-xs text-fs-gray mb-1">Ventes physiques</p>
                  <p className="font-nunito font-extrabold text-xl">{filteredPhysical.length}</p>
                </div>
              )}
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Panier moyen</p>
                <p className="font-nunito font-extrabold text-xl">{formatPrice(panierMoyen)}</p>
              </div>
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Taux livraison</p>
                <p className="font-nunito font-extrabold text-xl">{nbCommandes > 0 ? Math.round((deliveredOrders.length / nbCommandes) * 100) : 0}%</p>
              </div>
            </div>
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">CA sur 30 jours</p>
              <div className="flex items-end gap-[3px] h-32">
                {dailyCA.map(function(d, i) {
                  var height = maxCA > 0 ? Math.max((d.ca / maxCA) * 100, 2) : 2
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="hidden group-hover:block absolute -top-8 bg-fs-ink text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">{d.label} : {formatPrice(d.ca)}</div>
                      <div className="w-full rounded-t-sm bg-fs-orange transition-all duration-300" style={{ height: height + '%', minHeight: '2px' }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-fs-gray2">{dailyCA[0]?.label}</span>
                <span className="text-[10px] text-fs-gray2">{dailyCA[29]?.label}</span>
              </div>
            </div>
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">Top produits</p>
              {topProducts.length === 0 && <p className="text-sm text-fs-gray2 text-center py-4">Aucune vente sur cette periode</p>}
              {topProducts.map(function(p: any, i: number) {
                var totalQty = p.qtyOnline + p.qtyPhysical
                return (
                  <div key={i} className="py-2 border-b border-fs-cream last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-fs-orange-pale text-fs-orange text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-xs text-fs-gray2">{totalQty} au total</p>
                        </div>
                        <span className="text-xs text-fs-gray2">· {totalQty} au total</span>
                      </div>
                      <p className="font-nunito font-extrabold text-sm text-fs-orange">{formatPrice(p.revenue)}</p>
                    </div>
                    {/* Distinction vente en ligne vs physique */}
                    <div className="flex gap-3 ml-9">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-fs-orange" />
                        <span className="text-xs text-fs-gray">En ligne : {p.qtyOnline}</span>
                      </div>
                      {hasAddon('stock') && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-fs-ink" />
                          <span className="text-xs text-fs-gray">Physique : {p.qtyPhysical}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Visiteurs</p>
                <p className="font-nunito font-extrabold text-xl">{totalVisites}</p>
              </div>
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Taux de conversion</p>
                <p className="font-nunito font-extrabold text-xl text-fs-orange">{tauxConversion}%</p>
              </div>
            </div>
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">Visiteurs sur 30 jours</p>
              <div className="flex items-end gap-[3px] h-32">
                {dailyVisits.map(function(d, i) {
                  var height = maxVisits > 0 ? Math.max((d.count / maxVisits) * 100, 2) : 2
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="hidden group-hover:block absolute -top-8 bg-fs-ink text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap">{d.label} : {d.count} visite{d.count > 1 ? 's' : ''}</div>
                      <div className="w-full rounded-t-sm bg-blue-500 transition-all duration-300" style={{ height: height + '%', minHeight: '2px' }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-fs-gray2">{dailyVisits[0]?.label}</span>
                <span className="text-[10px] text-fs-gray2">{dailyVisits[29]?.label}</span>
              </div>
            </div>
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">Sources de trafic</p>
              {referrerList.length === 0 && <p className="text-sm text-fs-gray2 text-center py-4">Pas encore de donnees</p>}
              {referrerList.map(function(entry: any, i: number) {
                var name = entry[0]
                var count = entry[1]
                var pct = totalVisites > 0 ? Math.round((count / totalVisites) * 100) : 0
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-fs-cream last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{referrerIcons[name] || '🌐'}</span>
                      <span className="text-sfont-semibold capitalize">{name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{count}</span>
                      <span className="text-xs text-fs-gray2 ml-1">({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
