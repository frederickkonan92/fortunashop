'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { hasAddon, isProPlan, isPremiumPlan } from '@/lib/plan-rules'
import { SHOP_SELECT, ORDER_SELECT } from '@/lib/admin-data'
import { HelpButton } from '@/components/help-panel'
import AdminNav from '../nav'

var OnboardingWizard = dynamic(function() {
  return import('@/components/onboarding')
}, {
  ssr: false,
  loading: function() {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }
})

var AIRecommendations = dynamic(function() {
  return import('@/components/ai-recommendations')
}, { ssr: false })

export default function DashboardPage() {
  var [shop, setShop] = useState<any>(null)
  var [orders, setOrders] = useState<any[]>([])
  var [pageViews, setPageViews] = useState<any[]>([])
  var [period, setPeriod] = useState('month')
  var [tab, setTab] = useState('ventes')
  var [loading, setLoading] = useState(true)
  var [physicalSales, setPhysicalSales] = useState<any[]>([])

  console.log('DASHBOARD RENDER - shop:', shop?.slug, 'onboarding:', shop?.onboarding_completed)

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes: any = await supabase.from('shops').select(SHOP_SELECT).eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var ordersRes: any = await supabase.from('orders').select(ORDER_SELECT + ', order_items(*)').eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setOrders(ordersRes.data || [])
      var viewsRes: any = await supabase.from('page_views').select('id, shop_id, referrer, created_at').eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setPageViews(viewsRes.data || [])
      var physicalRes: any = await supabase.from('physical_sales').select('id, shop_id, total, items, payment_mode, created_at').eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setPhysicalSales(physicalRes.data || [])
    }
    setLoading(false)
  }

  if (loading) {
    console.log('RETURN ANTICIPÉ ICI - raison: loading est true, données pas encore chargées')
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  console.log('AVANT CHECK ONBOARDING - shop existe:', !!shop, 'valeur:', shop?.onboarding_completed)
  // Si l'onboarding n'est pas terminé, afficher le wizard
  if (shop && shop.onboarding_completed !== true) {
    return <OnboardingWizard shop={shop} />
  }

  // ── PÉRIODE ──────────────────────────────────────────
  var now = new Date()
  var startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)
  // "30j" doit correspondre à une fenêtre glissante sur les 30 derniers jours (cohérent avec le graphique CA 30 jours)
  var thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  var filterDate = period === 'month' ? thirtyDaysAgo : startOfWeek

  // ── COMMANDES ────────────────────────────────────────
  var filteredOrders = orders.filter(function(o) { return new Date(o.created_at) >= filterDate })
  var deliveredOrders = filteredOrders.filter(function(o) { return o.status === 'livree' })
  var cancelledOrders = filteredOrders.filter(function(o) { return o.status === 'annulee' })
  var nbCommandes = filteredOrders.length

  // ── CA ───────────────────────────────────────────────
  var caOnline = deliveredOrders.reduce(function(sum, o) { return sum + o.total }, 0)
  var filteredPhysical = physicalSales.filter(function(s) { return new Date(s.created_at) >= filterDate })
  var caPhysical = filteredPhysical.reduce(function(sum, s) { return sum + s.total }, 0)
  var ca = caOnline + caPhysical
  var panierMoyen = deliveredOrders.length > 0 ? Math.round(caOnline / deliveredOrders.length) : 0
  var tauxLivraison = nbCommandes > 0 ? Math.round((deliveredOrders.length / nbCommandes) * 100) : 0

  // ── CA PAR MODE DE PAIEMENT ──────────────────────────
  var paymentModes = ['wave', 'orange_money', 'mtn_momo', 'especes', 'cb']
  var paymentLabels: any = { wave: 'Wave', orange_money: 'Orange Money', mtn_momo: 'MTN MoMo', especes: 'Espèces', cb: 'Carte' }
  var paymentIcons: any = { wave: '🌊', orange_money: '🟠', mtn_momo: '🟡', especes: '💵', cb: '💳' }
  var paymentColors: any = { wave: '#3B82F6', orange_money: '#F97316', mtn_momo: '#EAB308', especes: '#10B981', cb: '#8B5CF6' }
  var caByPayment: any = {}
  paymentModes.forEach(function(m) { caByPayment[m] = 0 })
  deliveredOrders.forEach(function(o) {
    if (o.payment_mode && caByPayment[o.payment_mode] !== undefined) {
      caByPayment[o.payment_mode] += o.total
    }
  })
  var maxPaymentCA = Math.max.apply(null, Object.values(caByPayment).map(Number).concat([1]))

  // ── ANALYTICS PRO ────────────────────────────────────
  var filteredViews = pageViews.filter(function(v) { return new Date(v.created_at) >= filterDate })
  var totalVisites = filteredViews.length
  var tauxConversion = totalVisites > 0 ? ((nbCommandes / totalVisites) * 100).toFixed(1) : '0'

  // Meilleure heure de commande
  var hourCounts: any = {}
  filteredOrders.forEach(function(o) {
    var h = new Date(o.created_at).getHours()
    hourCounts[h] = (hourCounts[h] || 0) + 1
  })
  var bestHour = Object.entries(hourCounts).sort(function(a: any, b: any) { return b[1] - a[1] })[0]
  var bestHourLabel = bestHour ? bestHour[0] + 'h-' + (parseInt(bestHour[0]) + 1) + 'h' : '--'

  // Meilleur jour de commande
  var dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  var dayCounts: any = {}
  filteredOrders.forEach(function(o) {
    var d = dayNames[new Date(o.created_at).getDay()]
    dayCounts[d] = (dayCounts[d] || 0) + 1
  })
  var bestDay = Object.entries(dayCounts).sort(function(a: any, b: any) { return b[1] - a[1] })[0]
  var bestDayLabel = bestDay ? bestDay[0] : '--'

  // Sources de trafic
  var referrerCounts: any = {}
  filteredViews.forEach(function(v) {
    var r = v.referrer || 'direct'
    referrerCounts[r] = (referrerCounts[r] || 0) + 1
  })
  var referrerList = Object.entries(referrerCounts).sort(function(a: any, b: any) { return b[1] - a[1] })
  var referrerIcons: any = { direct: '🔗', whatsapp: '💬', instagram: '📸', facebook: '👤', twitter: '🐦', autre: '🌐' }

  // ── TOP PRODUITS ─────────────────────────────────────
  var productSales: any = {}
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
  if ((shop?.plan === 'pro' || shop?.plan === 'premium' || hasAddon(shop?.addons, 'stock'))) {
    filteredPhysical.forEach(function(sale: any) {
      if (!productSales[sale.product_name]) {
        productSales[sale.product_name] = { name: sale.product_name, qtyOnline: 0, qtyPhysical: 0, revenue: 0 }
      }
      productSales[sale.product_name].qtyPhysical += sale.quantity
      productSales[sale.product_name].revenue += sale.total
    })
  }
  var topProducts = Object.values(productSales).sort(function(a: any, b: any) { return b.revenue - a.revenue }).slice(0, 5)

  // ── GRAPHIQUE CA 30 JOURS ────────────────────────────
  var last30 = Array.from({ length: 30 }, function(_, i) { var d = new Date(); d.setDate(d.getDate() - (29 - i)); return d })
  var dailyCA = last30.map(function(date) {
    var dayStr = date.toDateString()
    var dayOrders = orders.filter(function(o) { return new Date(o.created_at).toDateString() === dayStr && o.status === 'livree' })
    return { ca: dayOrders.reduce(function(sum, o) { return sum + o.total }, 0), label: date.getDate() + '/' + (date.getMonth() + 1) }
  })
  var maxCA = Math.max.apply(null, dailyCA.map(function(d) { return d.ca }).concat([1]))

  var dailyVisits = last30.map(function(date) {
    var dayStr = date.toDateString()
    var count = pageViews.filter(function(v) { return new Date(v.created_at).toDateString() === dayStr }).length
    return { count, label: date.getDate() + '/' + (date.getMonth() + 1) }
  })
  var maxVisits = Math.max.apply(null, dailyVisits.map(function(d) { return d.count }).concat([1]))

  // ── PRÉVISION CA (Premium — 3 mois min) ──────────────
  var caMonths: number[] = []
  for (var m = 2; m >= 0; m--) {
    var mStart = new Date(now.getFullYear(), now.getMonth() - m, 1)
    var mEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0)
    var mCA = orders
      .filter(function(o) { return o.status === 'livree' && new Date(o.created_at) >= mStart && new Date(o.created_at) <= mEnd })
      .reduce(function(sum, o) { return sum + o.total }, 0)
    caMonths.push(mCA)
  }
  var hasEnoughData = caMonths.filter(function(c) { return c > 0 }).length >= 3
  var previsionCA = hasEnoughData
    ? Math.round(caMonths[2] + ((caMonths[2] - caMonths[0]) / 2))
    : null

  // ── EXPORT CSV ───────────────────────────────────────
  var exportCSV = function() {
    var headers = 'Numéro,Date,Client,Téléphone,Produits,Total,Statut,Livraison,Paiement\n'
    var rows = filteredOrders.map(function(o) {
      var items = (o.order_items || []).map(function(i: any) { return i.product_name }).join(' + ')
      var date = new Date(o.created_at).toLocaleDateString('fr-FR')
      return [o.order_number, date, o.customer_name, o.customer_phone, items, o.total, o.status, o.delivery_mode, o.payment_mode].join(',')
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 24, fontWeight: 600, color: 'white' }}>Dashboard</h1>
              <HelpButton section="dashboard" />
            </div>
            <p className="text-xs text-gray-500">{shop?.name} · Plan {shop?.plan}</p>
          </div>
          <button onClick={exportCSV} className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">Export CSV</button>
        </div>
      </header>

      <AdminNav shopSlug={shop?.slug} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* ONGLETS + PÉRIODE */}
        <div className="flex gap-2">
          <button onClick={function() { setTab('ventes') }}
                  className={'px-4 py-2 rounded-full text-xs font-bold transition ' + (tab === 'ventes' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
            Ventes
          </button>
          {isProPlan(shop?.plan) && (
            <button onClick={function() { setTab('analytics') }}
                    className={'px-4 py-2 rounded-full text-xs font-bold transition ' + (tab === 'analytics' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
              Analytics
            </button>
          )}
          {isPremiumPlan(shop?.plan) && (
            <button onClick={function() { setTab('prevision') }}
                    className={'px-4 py-2 rounded-full text-xs font-bold transition ' + (tab === 'prevision' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
              Prévision
            </button>
          )}
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

        {/* ═══════════════════════════════════════════════
            ONGLET VENTES — STARTER + PRO + PREMIUM
        ═══════════════════════════════════════════════ */}
        {tab === 'ventes' && (
          <div className="space-y-4">

            {/* KPI GRILLE BASIQUE — tous les plans */}
            <div className="grid grid-cols-2 gap-3">
   {/* ENCART CA TOTAL */}
   <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #E8DDD0', transition: 'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)' }}
        onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
              <p style={{ fontSize: 12, color: '#7C6C58', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'var(--font-outfit), sans-serif', marginBottom: 6 }}>Chiffre d'affaires total</p>
              <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#DC5014', marginBottom: 12 }}>{formatPrice(ca)}</p>
              {/* Distinction en ligne / physique */}
              <div className="flex gap-4 border-t border-fs-border pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-fs-orange shrink-0" />
                  <div>
                    <p className="text-[10px] text-fs-gray">En ligne</p>
                    <p className="font-nunito font-extrabold text-sm text-fs-ink">{formatPrice(caOnline)}</p>
                  </div>
                </div>
                {(shop?.plan === 'pro' || shop?.plan === 'premium' || hasAddon(shop?.addons, 'stock')) && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-fs-ink shrink-0" />
                    <div>
                      <p className="text-[10px] text-fs-gray">Physique</p>
                      <p className="font-nunito font-extrabold text-sm text-fs-ink">{formatPrice(caPhysical)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>

            {/* KPI GRILLE 3 COLONNES */}
            <div className="grid grid-cols-3 gap-3">
              {/* COMMANDES */}
              <div style={{ background: 'white', borderRadius: 16, padding: '12px', border: '1px solid #E8DDD0', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
                   onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)' }}
                   onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <p style={{ fontSize: 10, color: '#7C6C58', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'var(--font-outfit), sans-serif', marginBottom: 4 }}>Commandes</p>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E' }}>{nbCommandes}</p>
                <p className="text-[10px] text-fs-gray mt-1">
                  ✅{deliveredOrders.length} · ❌{cancelledOrders.length}
                </p>
              </div>

              {/* TAUX LIVRAISON */}
              <div style={{ background: 'white', borderRadius: 16, padding: '12px', border: '1px solid #E8DDD0', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
                   onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)' }}
                   onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <p style={{ fontSize: 10, color: '#7C6C58', fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'var(--font-outfit), sans-serif', marginBottom: 4 }}>Livraison</p>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E' }}>{tauxLivraison}%</p>
                <p className="text-[10px] text-fs-gray mt-1">taux</p>
              </div>

      {/* TOP PRODUIT */}
      <div className="bg-white border border-fs-border rounded-2xl p-3 text-center">
                <p className="text-[10px] text-fs-gray mb-1">Top produit</p>
                <p className="font-nunito font-extrabold text-[11px] leading-tight line-clamp-2">
                  {topProducts.length > 0 ? (topProducts[0] as any).name : '--'}
                </p>
                {topProducts.length > 0 && (
                  <p className="text-[10px] text-fs-orange mt-1">{formatPrice((topProducts[0] as any).revenue)}</p>
                )}
              </div>

              {/* PANIER MOYEN — Pro+ */}
              {isProPlan(shop?.plan) && (
                <div className="bg-white border border-fs-border rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-fs-gray mb-1">Panier moyen</p>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E' }}>{formatPrice(panierMoyen)}</p>
                  <p className="text-[10px] text-fs-gray mt-1">par commande</p>
                </div>
              )}

              {/* VENTES PHYSIQUES — natif Pro/Premium, addon Starter */}
                      {(shop?.plan === 'pro' || shop?.plan === 'premium' || hasAddon(shop?.addons, 'stock')) && (
                <div className="bg-white border border-fs-border rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-fs-gray mb-1">Ventes physiques</p>
                  <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E' }}>{filteredPhysical.length}</p>
                  <p className="text-[10px] text-fs-gray mt-1">transactions</p>
                </div>
              )}

              {/* PIC COMMANDES — Pro+ */}
              {isProPlan(shop?.plan) && (
                <div className="bg-white border border-fs-border rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-fs-gray mb-1">Pic commandes</p>
                  <p className="font-nunito font-extrabold text-sm">⏰ {bestHourLabel}</p>
                  <p className="text-[10px] text-fs-gray mt-1">{bestDayLabel}</p>
                </div>
              )}

            </div>

            {/* CA PAR MODE DE PAIEMENT — tous les plans */}
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-4">CA par mode de paiement</p>
              <div className="space-y-3">
                {paymentModes.map(function(mode) {
                  var mCA = caByPayment[mode]
                  var pct = ca > 0 ? Math.round((mCA / ca) * 100) : 0
                  var barWidth = maxPaymentCA > 0 ? Math.max((mCA / maxPaymentCA) * 100, mCA > 0 ? 4 : 0) : 0
                  if (mCA === 0) return null
                  return (
                    <div key={mode}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-fs-ink">
                          {paymentIcons[mode]} {paymentLabels[mode]}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-fs-gray">{pct}%</span>
                          <span className="font-nunito font-extrabold text-xs text-fs-orange">{formatPrice(mCA)}</span>
                        </div>
                      </div>
                      {/* Barre graphique */}
                      <div className="h-2.5 bg-fs-cream rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                             style={{ width: barWidth + '%', background: paymentColors[mode] }} />
                      </div>
                    </div>
                  )
                })}
                {ca === 0 && (
                  <p className="text-sm text-fs-gray2 text-center py-2">Aucune vente sur cette période</p>
                )}
              </div>
            </div>

            {/* GRAPHIQUE CA 30 JOURS */}
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">CA sur 30 jours</p>
              <div className="flex items-end gap-[3px] h-32">
                {dailyCA.map(function(d, i) {
                  var height = maxCA > 0 ? Math.max((d.ca / maxCA) * 100, 2) : 2
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="hidden group-hover:block absolute -top-8 bg-fs-ink text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                        {d.label} : {formatPrice(d.ca)}
                      </div>
                      <div className="w-full rounded-t-sm bg-fs-orange transition-all duration-300"
                           style={{ height: height + '%', minHeight: '2px' }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-fs-gray2">{dailyCA[0]?.label}</span>
                <span className="text-[10px] text-fs-gray2">{dailyCA[29]?.label}</span>
              </div>
            </div>

            {/* TOP PRODUITS */}
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">Top produits</p>
              {topProducts.length === 0 && (
                <p className="text-sm text-fs-gray2 text-center py-4">Aucune vente sur cette période</p>
              )}
              {topProducts.map(function(p: any, i: number) {
                var totalQty = p.qtyOnline + p.qtyPhysical
                return (
                  <div key={i} className="py-2 border-b border-fs-cream last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-fs-orange-pale text-fs-orange text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <p className="text-sm font-semibold">{p.name}</p>
                      </div>
                      <p className="font-nunito font-extrabold text-sm text-fs-orange shrink-0">{formatPrice(p.revenue)}</p>
                    </div>
                    <div className="flex gap-3 ml-8">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-fs-orange" />
                        <span className="text-xs text-fs-gray">En ligne : {p.qtyOnline}</span>
                      </div>
                      {(shop?.plan === 'pro' || shop?.plan === 'premium' || hasAddon(shop?.addons, 'stock')) && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-fs-ink" />
                          <span className="text-xs text-fs-gray">Physique : {p.qtyPhysical}</span>
                        </div>
                      )}
                      <span className="text-xs text-fs-gray2">· {totalQty} total</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* UPSELL VERS PRO — Starter uniquement */}
            {!isProPlan(shop?.plan) && (
              <div className="bg-fs-orange-pale border border-fs-orange rounded-2xl p-4 text-center">
                <p className="text-sm font-bold text-fs-orange mb-1">📈 Passez en Pro</p>
                <p className="text-xs text-fs-gray">Débloquez : panier moyen, pic de commandes, analytics visiteurs et taux de conversion.</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            ONGLET ANALYTICS — PRO + PREMIUM uniquement
        ═══════════════════════════════════════════════ */}
        {tab === 'analytics' && isProPlan(shop?.plan) && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Visiteurs</p>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E' }}>{totalVisites}</p>
              </div>
              <div className="bg-white border border-fs-border rounded-2xl p-4">
                <p className="text-xs text-fs-gray mb-1">Taux de conversion</p>
                <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#DC5014' }}>{tauxConversion}%</p>
              </div>
            </div>

            {/* GRAPHIQUE VISITEURS */}
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">Visiteurs sur 30 jours</p>
              <div className="flex items-end gap-[3px] h-32">
                {dailyVisits.map(function(d, i) {
                  var height = maxVisits > 0 ? Math.max((d.count / maxVisits) * 100, 2) : 2
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="hidden group-hover:block absolute -top-8 bg-fs-ink text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                        {d.label} : {d.count} visite{d.count > 1 ? 's' : ''}
                      </div>
                      <div className="w-full rounded-t-sm bg-blue-400 transition-all duration-300"
                           style={{ height: height + '%', minHeight: '2px' }} />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-fs-gray2">{dailyVisits[0]?.label}</span>
                <span className="text-[10px] text-fs-gray2">{dailyVisits[29]?.label}</span>
              </div>
            </div>

            {/* SOURCES DE TRAFIC */}
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">Sources de trafic</p>
              {referrerList.length === 0 && (
                <p className="text-sm text-fs-gray2 text-center py-4">Pas encore de données</p>
              )}
              {referrerList.map(function(entry: any, i: number) {
                var name = entry[0]
                var count = entry[1]
                var pct = totalVisites > 0 ? Math.round((count / totalVisites) * 100) : 0
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-fs-cream last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{referrerIcons[name] || '🌐'}</span>
                      <span className="text-sm font-semibold capitalize">{name}</span>
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

        {/* ═══════════════════════════════════════════════
            ONGLET PRÉVISION — PREMIUM uniquement
        ═══════════════════════════════════════════════ */}
        {tab === 'prevision' && isPremiumPlan(shop?.plan) && (
          <div className="space-y-4">
            {/* PRÉVISION CA */}
            <div className="bg-white border border-fs-border rounded-2xl p-4">
              <p className="text-xs font-bold text-fs-gray mb-3">🔮 Prévision CA mois prochain</p>
              {hasEnoughData && previsionCA !== null ? (
                <div>
                  <p className="font-nunito font-extrabold text-2xl text-fs-orange mb-2">
                    {formatPrice(previsionCA)}
                  </p>
                  <p className="text-xs text-fs-gray">Basée sur votre tendance des 3 derniers mois</p>
                  <div className="mt-4 space-y-2">
                    {caMonths.map(function(mca, i) {
                      var monthNames = ['Il y a 2 mois', 'Le mois dernier', 'Ce mois']
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-fs-gray">{monthNames[i]}</span>
                          <span className="font-nunito font-extrabold text-fs-ink">{formatPrice(mca)}</span>
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-fs-border">
                      <span className="font-bold text-fs-orange">Prévision</span>
                      <span className="font-nunito font-extrabold text-fs-orange">{formatPrice(previsionCA)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-3xl mb-3">📊</p>
                  <p className="text-sm font-bold text-fs-ink mb-1">Données insuffisantes</p>
                  <p className="text-xs text-fs-gray">La prévision sera disponible après 3 mois d'activité.</p>
                  <div className="mt-3 bg-fs-cream rounded-xl p-3">
                    <div className="flex justify-between text-xs text-fs-gray">
                      <span>Mois avec données</span>
                      <span className="font-bold">{caMonths.filter(function(c) { return c > 0 }).length} / 3</span>
                    </div>
                    <div className="h-2 bg-fs-border rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-fs-orange rounded-full"
                           style={{ width: (caMonths.filter(function(c) { return c > 0 }).length / 3 * 100) + '%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

           {/* RECOMMANDATIONS IA — Claude Haiku */}
           <AIRecommendations shopId={shop?.id} />
          </div>
        )}

      </div>
    </div>
  )
}