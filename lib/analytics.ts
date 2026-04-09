// Helper pour envoyer les événements analytics depuis les pages boutique côté client
// Chaque visiteur a un session_id unique (stocké dans sessionStorage)

function getSessionId() {
  if (typeof window === 'undefined') return null
  var id = sessionStorage.getItem('fs_session')
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
    sessionStorage.setItem('fs_session', id)
  }
  return id
}

function trackEvent(shopId: string, eventType: string, productId?: string | null, metadata?: any) {
  if (typeof window === 'undefined') return
  if (!shopId) return

  // Fire-and-forget — ne bloque pas l'UI
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shop_id: shopId,
      event_type: eventType,
      product_id: productId || null,
      session_id: getSessionId(),
      metadata: metadata || {},
    }),
  }).catch(function() {
    // Silencieux — le tracking ne doit jamais casser l'expérience client
  })
}

export function trackPageView(shopId: string) {
  trackEvent(shopId, 'page_view', null, { path: window.location.pathname })
}

export function trackViewProduct(shopId: string, productId: string, productName: string) {
  trackEvent(shopId, 'view_product', productId, { name: productName })
}

export function trackAddToCart(shopId: string, productId: string, productName: string, price: number, variant?: string | null) {
  trackEvent(shopId, 'add_to_cart', productId, { name: productName, price: price, variant: variant || null })
}

export function trackBeginCheckout(shopId: string, total: number, itemCount: number) {
  trackEvent(shopId, 'begin_checkout', null, { total: total, items: itemCount })
}

export function trackPurchase(shopId: string, orderId: string, total: number, itemCount: number) {
  trackEvent(shopId, 'purchase', null, { order_id: orderId, total: total, items: itemCount })
}
