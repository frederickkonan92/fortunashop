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
      confirmee: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' chez ' + (shop?.name || 'la boutique') + ' est confirmee ! On prepare votre commande.\n\nSuivre ma commande :\n' + suiviLink,
      // Notification retrait : prête à retirer
      prete: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' est prete ! Vous pouvez venir la recuperer en boutique.\n\nSuivre ma commande :\n' + suiviLink,
      // Notification domicile : en route
      en_livraison: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' est en route ! Le livreur arrive bientot.\n\nSuivre ma commande :\n' + suiviLink,
      livree: 'Bonjour ' + order.customer_name + ', votre commande ' + order.order_number + ' a ete livree ! Merci pour votre achat chez ' + (shop?.name || 'la boutique') + '.'
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
  var tabs = [
    { key: 'all', label: 'Toutes' },
    { key: 'nouvelle', label: 'Nouvelles' },
    { key: 'confirmee', label: 'Confirmees' },
    { key: 'en_preparation', label: 'En préparation' },
    { key: 'prete', label: 'Prêtes' },
    { key: 'en_livraison', label: 'En livraison' },
    { key: 'livree', label: 'Livrées' },
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
              <h1 className="font-nunito font-black text-base">{shop?.name || 'Mon espace'}</h1>
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
         var next = getNextStatus(order)
          var items = (order.order_items || []).map(function(i: any) { return i.product_name + ' (' + i.quantity + ')' }).join(', ')
          var waLink = livreurLinks[order.id]
          var clientLink = getClientNotifLink(order, order.status)
          return (
            <div key={order.id} className="bg-white rounded-2xl border border-fs-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-nunito font-extrabold text-sm">{order.order_number}</span>
                <span className={'px-3 py-1 rounded-full text-xs font-bold ' + statusStyle(order.status)}>{statusLabel(order.status)}</span>
              </div>
              <p className="text-sm"><strong>{order.customer_name}</strong> · {order.customer_phone}</p>
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
                          className="flex-1 bg-fs-ink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-fs-orange transition">
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
          <p className="text-center text-fs-gray2 py-12">Aucune commande</p>
        )}
      </div>
    </div>
  )
}
