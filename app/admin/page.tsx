'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import AdminNav from './nav'
import { formatPrice, statusStyle, statusLabel } from '@/lib/utils'
import { SHOP_SELECT, ORDER_SELECT } from '@/lib/admin-data'
import { HelpButton } from '@/components/help-panel'

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

export default function AdminPage() {
  var [orders, setOrders] = useState<any[]>([])
  var [filter, setFilter] = useState('all')
  var [shop, setShop] = useState<any>(null)
  var [livreurLinks, setLivreurLinks] = useState<any>({})

  var [loading, setLoading] = useState(true)
  var [lastCount, setLastCount] = useState(0)
  var [notifPermission, setNotifPermission] = useState('default')

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes: any = await supabase.from('shops').select(SHOP_SELECT).eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var ordersRes: any = await supabase.from('orders').select(ORDER_SELECT + ', order_items(*)')
        .eq('shop_id', shopRes.data.id).order('created_at', { ascending: false })
      setOrders(ordersRes.data || [])
    }
    setLoading(false)
  }

  var loadDataRef = useRef(loadData)
  loadDataRef.current = loadData

  useEffect(function() {
    loadData()
    if (typeof Notification !== 'undefined') {
      setNotifPermission(Notification.permission)
    }
    function onVisibilityChange() {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadDataRef.current()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return function() {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  // Temps réel Supabase sur les commandes (remplace le polling). Requis côté projet : Publication Realtime activée pour la table `orders` (Dashboard Supabase → Database → Publications).
  useEffect(function() {
    if (!shop?.id) return
    var lastRealtimeEvent = Date.now()
    var channel = supabase
      .channel('admin-orders-' + shop.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: 'shop_id=eq.' + shop.id,
        },
        function() {
          lastRealtimeEvent = Date.now()
          loadDataRef.current()
        }
      )
      .subscribe()

    // Fallback polling : si le canal Realtime ne reçoit rien pendant 60s, on recharge les données
    var fallbackInterval = setInterval(function() {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastRealtimeEvent > 60000) {
        loadDataRef.current()
      }
    }, 60000)

    return function() {
      clearInterval(fallbackInterval)
      supabase.removeChannel(channel)
    }
  }, [shop?.id])

  useEffect(function() {
    if (lastCount > 0 && orders.length > lastCount) {
      try {
        var audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==')
        audio.play().catch(function() {})
      } catch(e) {}
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Nouvelle commande !', { body: 'Vous avez une nouvelle commande sur ' + (shop?.name || 'votre boutique'), icon: '/favicon.ico' })
      }
    }
    setLastCount(orders.length)
  }, [orders.length])

  var requestNotifPermission = function() {
    if (typeof Notification !== 'undefined') {
      Notification.requestPermission().then(function(result) {
        setNotifPermission(result)
      })
    }
  }

  var updateStatus = async function(orderId: string, newStatus: string) {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    loadData()
  }

  var prepareLivreurLink = async function(order: any) {
    if (!shop?.delivery_phone) return
    var baseUrl = window.location.origin
    var confirmLink = ''
    if (shop?.addons?.includes('livreur_link')) {
      var token = crypto.randomUUID() + '-' + Date.now().toString(36)
      await supabase.from('delivery_tokens').insert({ order_id: order.id, token: token })
      confirmLink = '\n\nConfirmer livraison ici :\n' + baseUrl + '/livraison?token=' + token
    }
    var message = 'Livraison ' + order.order_number + '\nClient : ' + order.customer_name + '\nTel : ' + order.customer_phone + '\nAdresse : ' + (order.customer_address || 'Retrait en boutique') + '\nMontant : ' + order.total.toLocaleString() + ' FCFA' + confirmLink
    var waLink = 'https://wa.me/' + shop.delivery_phone + '?text=' + encodeURIComponent(message)
    setLivreurLinks(function(prev: any) { var updated = { ...prev }; updated[order.id] = waLink; return updated })
  }

  var getClientNotifLink = function(order: any, forStatus: string) {
    if (!order.customer_phone) return null
    var baseUrl = window.location.origin
    var suiviLink = baseUrl + '/suivi?cmd=' + order.order_number
    var isRetrait = order.delivery_mode === 'retrait'
    var messages: any = {
      confirmee: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' chez ' + (shop?.name || 'la boutique') + ' est confirmée ! On prépare votre commande.\n\nSuivre ma commande :\n' + suiviLink,
      // Notification retrait : prête à retirer
      prete: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' est prête ! Vous pouvez venir la récupérer en boutique.\n\nSuivre ma commande :\n' + suiviLink,
      // Notification domicile : en route
      en_livraison: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' est en route ! Le livreur arrive bientôt.\n\nSuivre ma commande :\n' + suiviLink,
      livree: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' a été livrée ! Merci pour votre achat chez ' + (shop?.name || 'la boutique') + '.'
    }
    var msg = messages[forStatus]
    if (!msg) return null
    return 'https://wa.me/' + order.customer_phone + '?text=' + encodeURIComponent(msg)
  }

  var handleLogout = async function() {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  // Workflow différent selon le mode de livraison
  // Retrait : nouvelle → confirmee → en_preparation → prete
  // Domicile : nouvelle → confirmee → en_livraison → livree
  var getNextStatus = function(order: any) {
    var isRetrait = order.delivery_mode === 'retrait'
    var map: any = isRetrait
      ? { nouvelle: 'confirmee', confirmee: 'en_preparation', en_preparation: 'prete' }
      : { nouvelle: 'confirmee', confirmee: 'en_livraison', en_livraison: 'livree' }
    return map[order.status] || null
  }
  var cancelOrder = async function(order: any) {
    var confirmed = window.confirm('Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.')
    if (!confirmed) return
    // Ouvrir WhatsApp AVANT les await (sinon le navigateur bloque le popup)
    if (order.customer_phone) {
      var phone = order.customer_phone.replace(/[^0-9]/g, '')
      if (phone.startsWith('0')) phone = '225' + phone
      if (!phone.startsWith('225') && phone.length <= 10) phone = '225' + phone

      var msg = 'Bonjour ' + (order.customer_name || 'cher client') + ',\n\n'
      msg += 'Votre commande ' + (order.order_number || '') + ' a ete annulee.\n\n'
      msg += 'Si vous avez des questions, n\'hesitez pas a nous contacter.\n\n'
      msg += 'L\'equipe ' + (shop?.name || 'de la boutique')

      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank')
    }
    await supabase.from('orders').update({ status: 'annulee' }).eq('id', order.id)
    // Remettre le stock des produits commandés (atomique : stock_quantity + N sans read préalable)
    var items = order.order_items || []
    var restockPromises: any[] = []
    for (var i = 0; i < items.length; i++) {
      var item = items[i]
      if (!item.product_id) continue
      // Restock produit global (atomique via RPC SQL)
      restockPromises.push(
        supabase.rpc('increment_stock', { p_product_id: item.product_id, p_qty: item.quantity })
      )
      // Restock variante si applicable
      if (item.variant_id) {
        restockPromises.push(
          supabase.rpc('increment_variant_stock', { p_variant_id: item.variant_id, p_qty: item.quantity })
        )
      } else if (item.variant_value) {
        var variantValue = item.variant_value
        var parts = variantValue.split(' / ')
        var varQuery = supabase.from('product_variants').select('id').eq('product_id', item.product_id)
        if (parts.length === 2) {
          varQuery = varQuery.eq('variant_value', parts[0]).eq('variant_value_2', parts[1])
        } else {
          varQuery = varQuery.eq('variant_value', parts[0])
        }
        restockPromises.push(
          varQuery.maybeSingle().then(function(res: any) {
            if (res.data?.id) {
              return supabase.rpc('increment_variant_stock', { p_variant_id: res.data.id, p_qty: item.quantity })
            }
          })
        )
      }
    }
    await Promise.all(restockPromises)
    loadData()
  }

  var tabs = [
    { key: 'all', label: 'Toutes' },
    { key: 'nouvelle', label: 'Nouvelles' },
    { key: 'confirmee', label: 'Confirmées' },
    { key: 'en_preparation', label: 'En préparation' },
    { key: 'prete', label: 'Prêtes' },
    { key: 'en_livraison', label: 'En livraison' },
    { key: 'livree', label: 'Livrées' },
    { key: 'annulee', label: 'Annulées' },
  ]
  var filtered = filter === 'all' ? orders : orders.filter(function(o) { return o.status === filter })
  var countByStatus = function(s: string) { return orders.filter(function(o) { return o.status === s }).length }
  var todayCount = orders.filter(function(o) { return new Date(o.created_at).toDateString() === new Date().toDateString() }).length
  var caLivre = orders.filter(function(o) { return o.status === 'livree' }).reduce(function(sum, o) { return sum + o.total }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  // Si l'onboarding n'est pas terminé, afficher le wizard
  if (shop && shop.onboarding_completed !== true) {
    return <OnboardingWizard shop={shop} />
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 24, fontWeight: 600, color: 'white' }}>{shop?.name || 'Mon espace'}</h1>
              <HelpButton section="commandes" />
            </div>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <div className="flex items-center gap-2">
            {notifPermission !== 'granted' && (
              <button
                onClick={requestNotifPermission}
                className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg"
              >
                Activer les alertes
              </button>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>
      <AdminNav shopSlug={shop?.slug} />
      <div className="bg-fs-ink px-4 pb-5">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: '#DC5014' }}>{countByStatus('nouvelle')}</p>
            <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, color: '#7C6C58', letterSpacing: 0.5, textTransform: 'uppercase' }}>En attente</p>
          </div>
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: 'white' }}>{todayCount}</p>
            <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, color: '#7C6C58', letterSpacing: 0.5, textTransform: 'uppercase' }}>Aujourd hui</p>
          </div>
          <div className="bg-[#2A2218] rounded-xl p-3 text-center">
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 600, color: 'white' }}>{caLivre.toLocaleString()}</p>
            <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, color: '#7C6C58', letterSpacing: 0.5, textTransform: 'uppercase' }}>CA livre (F)</p>
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
         var next = getNextStatus(order)
          var items = (order.order_items || []).map(function(i: any) { return i.product_name + ' (' + i.quantity + ')' }).join(', ')
          var waLink = livreurLinks[order.id]
          var clientLink = getClientNotifLink(order, order.status)
          return (
            <div key={order.id}
              style={{
                background: 'white', borderRadius: 14, border: '1px solid #E8DDD0', padding: 16,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
              onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 14 }}>{order.order_number}</span>
                <span style={{ padding: '3px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }} className={statusStyle(order.status)}>{statusLabel(order.status)}</span>
              </div>
              <p className="text-sm"><span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600 }}>{order.customer_name}</span> · {order.customer_phone}</p>
              <p className="text-xs text-fs-gray mt-1">{items}</p>              <p className="text-sm font-bold text-fs-orange mt-2">{formatPrice(order.total)}</p> {order.payment_mode && (
                <p className="text-xs text-fs-gray mt-1">
                  Paiement : <strong>{order.payment_mode}</strong>
                  {order.payment_status === 'en_attente' && <span className="ml-2 text-[#D97706]">· En attente</span>}
                  {order.payment_status === 'confirme' && <span className="ml-2 text-fs-green">· Confirme</span>}
                </p>
              )}
             
              <p className="text-xs text-fs-gray2 mt-1">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {/* Bouton statut suivant — label dynamique selon le workflow */}
                {getNextStatus(order) && (
                  <button onClick={function() {
                    var updates: any = { status: getNextStatus(order) }
                    // Si commande nouvelle → confirmée : on confirme aussi le paiement en même temps
                    if (order.status === 'nouvelle') {
                      updates.payment_status = 'confirme'
                    }
                    supabase.from('orders').update(updates).eq('id', order.id).then(function() { loadData() })
                  }}
                          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#DC5014', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', transition: 'transform 0.15s, box-shadow 0.15s', flex: 1 }}
                          onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,80,20,0.25)' }}
                          onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>
                    {/* Statut nouvelle : label explicite pour l'artisan */}
                    {order.status === 'nouvelle'
                      ? (order.payment_mode === 'especes' ? '✓ Confirmer la commande' : '✓ Paiement reçu · Confirmer')
                      : order.delivery_mode === 'retrait' && order.status === 'en_preparation'
                        ? '✓ Prête à retirer'
                        : '→ ' + statusLabel(getNextStatus(order))}
                  </button>
                )}
                
                {/* Lien livreur : uniquement si livraison domicile, jamais pour retrait */}
                {order.delivery_mode !== 'retrait' && (order.status === 'confirmee' || order.status === 'en_livraison') && shop?.delivery_phone && !waLink && (
                  <button onClick={function() { prepareLivreurLink(order) }}
                          className="flex-1 bg-[#25D366] text-white text-xs font-bold py-2.5 rounded-xl text-center">
                    Préparer lien livreur
                  </button>
                )}
                {order.delivery_mode !== 'retrait' && waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                     className="flex-1 bg-[#25D366] text-white text-xs font-bold py-2.5 rounded-xl text-center">
                    Envoyer au livreur
                  </a>
                )}
                {/* Bouton Annuler — visible sauf pour les commandes déjà annulées ou livrées */}
                {order.status !== 'annulee' && order.status !== 'livree' && (
                  <button onClick={function() { cancelOrder(order) }}
                          style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: '1.5px solid #E8DDD0', color: '#7C6C58', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', transition: 'border-color 0.2s, color 0.2s' }}
                          onMouseEnter={function(e: any) { e.currentTarget.style.borderColor = '#D32F2F'; e.currentTarget.style.color = '#D32F2F' }}
                          onMouseLeave={function(e: any) { e.currentTarget.style.borderColor = '#E8DDD0'; e.currentTarget.style.color = '#7C6C58' }}>
                    Annuler
                  </button>
                )}
              </div>
              {/* Bouton notification client — affiché pour tous les statuts sauf "nouvelle" */}
              {/* Pour retrait : confirmee, en_preparation, prete */}
              {/* Pour domicile : confirmee, en_livraison, livree */}
              {clientLink && order.status !== 'nouvelle' && order.status !== 'en_preparation' && (
                <a href={clientLink} target="_blank" rel="noopener noreferrer"
                   className="block w-full bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl text-center mt-2">
                  {order.status === 'prete'
                    ? '🏪 Notifier : commande prête à retirer'
                    : 'Notifier le client · ' + statusLabel(order.status)}
                </a>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 500, color: '#2C1A0E', marginBottom: 8 }}>
              Aucune commande pour le moment
            </div>
            <p style={{ fontSize: 13, color: '#7C6C58', lineHeight: 1.6, fontFamily: 'var(--font-outfit), sans-serif' }}>
              Les commandes apparaitront ici quand vos clients passeront commande
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
