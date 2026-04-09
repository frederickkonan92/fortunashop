'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { isProPlan, isPremiumPlan } from '@/lib/plan-rules'
import { SHOP_SELECT } from '@/lib/admin-data'
import { HelpButton } from '@/components/help-panel'
import AdminNav from '../nav'

function getPeriodDate(p: string) {
  var now = new Date()
  if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (p === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  if (p === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return new Date(0)
}

export default function AnalyticsPage() {
  var [shop, setShop] = useState<any>(null)
  var [period, setPeriod] = useState('7d')
  var [loading, setLoading] = useState(true)
  var [funnel, setFunnel] = useState<any[]>([])
  var [kpis, setKpis] = useState<any>({ conversion: 0, abandonRate: 0, avgBasket: 0, pagesPerVisit: 0, prevConversion: 0 })
  var [topProducts, setTopProducts] = useState<any[]>([])
  var [diagnostic, setDiagnostic] = useState<any[]>([])

  useEffect(function() {
    async function loadShop() {
      var userRes = await supabase.auth.getUser()
      var user = userRes.data.user
      if (!user) return
      var shopRes: any = await supabase.from('shops').select(SHOP_SELECT).eq('owner_id', user.id).single()
      setShop(shopRes.data)
    }
    loadShop()
  }, [])

  useEffect(function() {
    if (!shop?.id) return
    loadAnalytics()
  }, [shop?.id, period])

  var loadAnalytics = async function() {
    if (!shop?.id) return
    setLoading(true)
    var since = getPeriodDate(period).toISOString()

    // Fetch les événements
    var { data: events } = await supabase
      .from('analytics_events')
      .select('event_type, session_id, metadata, product_id')
      .eq('shop_id', shop.id)
      .gte('created_at', since)

    var allEvents = events || []

    // Compter les sessions uniques par étape
    var pageViews = new Set<string>()
    var viewProducts = new Set<string>()
    var addToCarts = new Set<string>()
    var checkouts = new Set<string>()
    var purchases = new Set<string>()
    var totalPageViewEvents = 0

    allEvents.forEach(function(e: any) {
      if (e.event_type === 'page_view') { pageViews.add(e.session_id); totalPageViewEvents++ }
      if (e.event_type === 'view_product') viewProducts.add(e.session_id)
      if (e.event_type === 'add_to_cart') addToCarts.add(e.session_id)
      if (e.event_type === 'begin_checkout') checkouts.add(e.session_id)
      if (e.event_type === 'purchase') purchases.add(e.session_id)
    })

    var pvSize = pageViews.size
    var newFunnel = [
      { label: 'Visiteurs', count: pvSize, pct: 100 },
      { label: 'Ont vu un produit', count: viewProducts.size, pct: pvSize > 0 ? Math.round(viewProducts.size / pvSize * 100) : 0 },
      { label: 'Ajout au panier', count: addToCarts.size, pct: pvSize > 0 ? Math.round(addToCarts.size / pvSize * 100) : 0 },
      { label: 'Commande', count: purchases.size, pct: pvSize > 0 ? Math.round(purchases.size / pvSize * 100) : 0 },
    ]
    setFunnel(newFunnel)

    // KPIs (Pro+)
    if (isProPlan(shop.plan)) {
      var conversionRate = pvSize > 0 ? Math.round(purchases.size / pvSize * 100) : 0
      var abandonRate = addToCarts.size > 0 ? Math.round((1 - purchases.size / addToCarts.size) * 100) : 0
      var pagesPerVisit = pageViews.size > 0 ? Math.round(totalPageViewEvents / pageViews.size * 10) / 10 : 0

      // Panier moyen depuis la table orders
      var { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('shop_id', shop.id)
        .gte('created_at', since)
        .eq('status', 'confirmed')

      var ordersList = orders || []
      var avgBasket = ordersList.length > 0
        ? Math.round(ordersList.reduce(function(sum: number, o: any) { return sum + (o.total || 0) }, 0) / ordersList.length)
        : 0

      // Conversion semaine précédente pour comparaison
      var prevSince = new Date(getPeriodDate(period).getTime() - (Date.now() - getPeriodDate(period).getTime())).toISOString()
      var { data: prevEvents } = await supabase
        .from('analytics_events')
        .select('event_type, session_id')
        .eq('shop_id', shop.id)
        .gte('created_at', prevSince)
        .lt('created_at', since)

      var prevPV = new Set<string>()
      var prevPurchases = new Set<string>()
      ;(prevEvents || []).forEach(function(e: any) {
        if (e.event_type === 'page_view') prevPV.add(e.session_id)
        if (e.event_type === 'purchase') prevPurchases.add(e.session_id)
      })
      var prevConversion = prevPV.size > 0 ? Math.round(prevPurchases.size / prevPV.size * 100) : 0

      setKpis({ conversion: conversionRate, abandonRate: abandonRate, avgBasket: avgBasket, pagesPerVisit: pagesPerVisit, prevConversion: prevConversion })

      // Top produits ajoutés au panier
      var productCounts: any = {}
      allEvents.forEach(function(e: any) {
        if (e.event_type !== 'add_to_cart' || !e.product_id) return
        if (!productCounts[e.product_id]) {
          productCounts[e.product_id] = { count: 0, name: e.metadata?.name || 'Produit' }
        }
        productCounts[e.product_id].count++
      })
      var topList = Object.entries(productCounts)
        .sort(function(a: any, b: any) { return b[1].count - a[1].count })
        .slice(0, 5)
        .map(function(entry: any) { return { id: entry[0], name: entry[1].name, count: entry[1].count } })
      setTopProducts(topList)
    }

    // Diagnostic conversion (Premium)
    if (isPremiumPlan(shop.plan)) {
      var vpSize = viewProducts.size
      var atcSize = addToCarts.size
      var coSize = checkouts.size
      var puSize = purchases.size
      setDiagnostic([
        { from: 'Visiteur', to: 'Voit un produit', rate: pvSize > 0 ? Math.round(vpSize / pvSize * 100) : 0 },
        { from: 'Voit un produit', to: 'Ajoute au panier', rate: vpSize > 0 ? Math.round(atcSize / vpSize * 100) : 0 },
        { from: 'Ajoute au panier', to: 'Va au checkout', rate: atcSize > 0 ? Math.round(coSize / atcSize * 100) : 0 },
        { from: 'Checkout', to: 'Commande', rate: coSize > 0 ? Math.round(puSize / coSize * 100) : 0 },
      ])
    }

    setLoading(false)
  }

  var periods = [
    { key: 'today', label: "Aujourd'hui" },
    { key: '7d', label: '7 jours' },
    { key: '30d', label: '30 jours' },
    { key: 'all', label: 'Tout' },
  ]

  function getDiagColor(rate: number) {
    if (rate >= 30) return '#2A7A50'
    if (rate >= 15) return '#D97706'
    return '#D32F2F'
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 24, fontWeight: 600, color: 'white' }}>Analytics</h1>
              <HelpButton section="analytics" />
            </div>
            <p className="text-xs text-gray-500">Suivi de conversion</p>
          </div>
        </div>
      </header>
      <AdminNav shopSlug={shop?.slug} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* Section 1 — Filtre par période */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {periods.map(function(p) {
            var isActive = period === p.key
            return (
              <button key={p.key} type="button"
                onClick={function() { setPeriod(p.key) }}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: isActive ? '#DC5014' : 'white',
                  color: isActive ? 'white' : '#7C6C58',
                  fontFamily: 'var(--font-outfit), sans-serif',
                  transition: 'all 0.2s',
                }}>
                {p.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {/* Section 2 — Entonnoir de conversion */}
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20,
            }}>
              <div style={{
                fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 600,
                color: '#2C1A0E', marginBottom: 16,
              }}>
                Entonnoir de conversion
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {funnel.map(function(step: any, idx: number) {
                  var barColors = ['#DC5014', '#E5693B', '#EE8362', '#F0997B']
                  return (
                    <div key={idx}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        marginBottom: 4,
                      }}>
                        <span style={{
                          fontSize: 12, fontWeight: 500, color: '#7C6C58',
                          fontFamily: 'var(--font-outfit), sans-serif',
                        }}>
                          {step.label}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-cormorant), serif',
                          fontSize: 18, fontWeight: 600, color: '#2C1A0E',
                        }}>
                          {step.count} <span style={{ fontSize: 12, color: '#7C6C58', fontWeight: 400 }}>({step.pct}%)</span>
                        </span>
                      </div>
                      <div style={{
                        height: 8, borderRadius: 4, background: '#F5EDE5',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          background: barColors[idx] || '#F0997B',
                          width: step.pct + '%',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Section 3 — KPIs (Pro+) */}
            {isProPlan(shop?.plan) ? (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
              }}>
                {/* Taux de conversion */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20 }}>
                  <div style={{
                    fontFamily: 'var(--font-outfit), sans-serif', fontSize: 11,
                    textTransform: 'uppercase' as any, letterSpacing: 0.5, color: '#7C6C58', marginBottom: 8,
                  }}>
                    Taux conversion
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E',
                  }}>
                    {kpis.conversion}%
                  </div>
                  <div style={{
                    fontSize: 11, marginTop: 4,
                    color: kpis.conversion >= kpis.prevConversion ? '#2A7A50' : '#D32F2F',
                    fontFamily: 'var(--font-outfit), sans-serif',
                  }}>
                    {kpis.conversion >= kpis.prevConversion ? '+' : ''}{kpis.conversion - kpis.prevConversion}% vs periode prec.
                  </div>
                </div>

                {/* Taux abandon panier */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20 }}>
                  <div style={{
                    fontFamily: 'var(--font-outfit), sans-serif', fontSize: 11,
                    textTransform: 'uppercase' as any, letterSpacing: 0.5, color: '#7C6C58', marginBottom: 8,
                  }}>
                    Abandon panier
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600,
                    color: kpis.abandonRate > 70 ? '#D32F2F' : '#2C1A0E',
                  }}>
                    {kpis.abandonRate}%
                  </div>
                </div>

                {/* Panier moyen */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20 }}>
                  <div style={{
                    fontFamily: 'var(--font-outfit), sans-serif', fontSize: 11,
                    textTransform: 'uppercase' as any, letterSpacing: 0.5, color: '#7C6C58', marginBottom: 8,
                  }}>
                    Panier moyen
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-cormorant), serif', fontSize: 24, fontWeight: 600, color: '#2C1A0E',
                  }}>
                    {formatPrice(kpis.avgBasket)}
                  </div>
                </div>

                {/* Pages par visite */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20 }}>
                  <div style={{
                    fontFamily: 'var(--font-outfit), sans-serif', fontSize: 11,
                    textTransform: 'uppercase' as any, letterSpacing: 0.5, color: '#7C6C58', marginBottom: 8,
                  }}>
                    Pages / visite
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#2C1A0E',
                  }}>
                    {kpis.pagesPerVisit}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#F5F0EB', borderRadius: 16, padding: 24, textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600, color: '#7C6C58', marginBottom: 4 }}>
                  KPIs detailles
                </div>
                <div style={{ fontSize: 12, color: '#A0988E', fontFamily: 'var(--font-outfit), sans-serif' }}>
                  Disponible avec le plan Pro
                </div>
              </div>
            )}

            {/* Section 4 — Top produits (Pro+) */}
            {isProPlan(shop?.plan) ? (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20 }}>
                <div style={{
                  fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 600,
                  color: '#2C1A0E', marginBottom: 16,
                }}>
                  Top produits ajoutes au panier
                </div>
                {topProducts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topProducts.map(function(p: any, idx: number) {
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 0', borderBottom: idx < topProducts.length - 1 ? '1px solid #F0EAE0' : 'none',
                        }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: '#DC5014', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#2C1A0E', fontFamily: 'var(--font-outfit), sans-serif' }}>
                            {p.name}
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: '#DC5014',
                            fontFamily: 'var(--font-cormorant), serif',
                          }}>
                            {p.count} ajout{p.count > 1 ? 's' : ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#A0988E', textAlign: 'center', padding: 16, fontFamily: 'var(--font-outfit), sans-serif' }}>
                    Pas encore de donnees
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: '#F5F0EB', borderRadius: 16, padding: 24, textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600, color: '#7C6C58', marginBottom: 4 }}>
                  Top produits
                </div>
                <div style={{ fontSize: 12, color: '#A0988E', fontFamily: 'var(--font-outfit), sans-serif' }}>
                  Disponible avec le plan Pro
                </div>
              </div>
            )}

            {/* Section 5 — Diagnostic conversion (Premium) */}
            {isPremiumPlan(shop?.plan) ? (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DDD0', padding: 20 }}>
                <div style={{
                  fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 600,
                  color: '#2C1A0E', marginBottom: 16,
                }}>
                  Diagnostic conversion
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {diagnostic.map(function(d: any, idx: number) {
                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: 10,
                        background: '#FAFAF8',
                      }}>
                        <div style={{ fontSize: 12, color: '#7C6C58', fontFamily: 'var(--font-outfit), sans-serif' }}>
                          {d.from} → {d.to}
                        </div>
                        <div style={{
                          fontSize: 14, fontWeight: 700,
                          color: getDiagColor(d.rate),
                          fontFamily: 'var(--font-outfit), sans-serif',
                        }}>
                          {d.rate}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#F5F0EB', borderRadius: 16, padding: 24, textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600, color: '#7C6C58', marginBottom: 4 }}>
                  Diagnostic conversion
                </div>
                <div style={{ fontSize: 12, color: '#A0988E', fontFamily: 'var(--font-outfit), sans-serif' }}>
                  Disponible avec le plan Premium
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
