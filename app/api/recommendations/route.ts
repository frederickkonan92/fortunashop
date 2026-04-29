import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { logInfo, logError } from '@/lib/logger'

// NOTE: route handler must export named HTTP methods (POST/GET) for Next.js app router.
// IMPORTANT: ne pas initialiser les clients à l'évaluation du module (sinon le build peut planter
// si des variables d'environnement ne sont pas encore injectées).
function getSupabaseAdmin() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL manquant')
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant')
  return createClient(url, serviceRoleKey)
}

function getAnthropic() {
  var apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant')
  return new Anthropic({ apiKey })
}

export async function POST(req: NextRequest) {
  try {
    // Validation taille du body (max 10KB)
    var contentLength = parseInt(req.headers.get('content-length') || '0')
    if (contentLength > 10240) {
      return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 })
    }

    // --- ORIGIN CHECK : bloque les appels cross-origin ---
    // Verifie que la requete vient bien de notre domaine (fortunashop.fr ou localhost en dev)
    var origin = req.headers.get('origin') || ''
    var referer = req.headers.get('referer') || ''
    var isAllowedOrigin = origin.includes('fortunashop.fr')
      || origin.includes('localhost')
      || referer.includes('fortunashop.fr')
      || referer.includes('localhost')

    if (!isAllowedOrigin) {
      console.warn('[SECURITY]', {
        route: '/api/recommendations',
        reason: 'origin_rejected',
        origin: origin,
        referer: referer,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Origin non autorisee' }, { status: 403 })
    }
    // --- FIN ORIGIN CHECK ---

    var body = await req.json()
    var shopId = body.shop_id

    // --- VALIDATION UUID : bloque les IDs malformes et le brute-force ---
    var uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (!shopId || typeof shopId !== 'string' || !uuidRegex.test(shopId)) {
      console.warn('[SECURITY]', {
        route: '/api/recommendations',
        reason: 'invalid_uuid',
        shopId: shopId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'shop_id invalide' }, { status: 400 })
    }
    // --- FIN VALIDATION UUID ---

    var supabase = getSupabaseAdmin()
    var anthropic = getAnthropic()

    // --- AUTH : separation stricte client USER (auth) vs ADMIN (donnees) ---
    var authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[SECURITY]', {
        route: '/api/recommendations',
        reason: 'missing_bearer_token',
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    var token = authHeader.replace('Bearer ', '')

    // Client USER (anon key + token) -> verifie l'identite
    var supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: 'Bearer ' + token } } }
    )

    var { data: userData, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !userData.user) {
      console.warn('[SECURITY]', {
        route: '/api/recommendations',
        reason: 'invalid_token',
        authError: authError?.message,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    // Verifie ownership via le client ADMIN (bypass RLS pour confirmer owner_id)
    var { data: shopCheck, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('owner_id', userData.user.id)
      .single()

    if (shopError && shopError.code !== 'PGRST116') {
      // PGRST116 = no rows trouvees (cas legitime), tout autre code = erreur reelle
      console.error('[SECURITY] Erreur verification shop ownership:', shopError)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (!shopCheck) {
      console.warn('[SECURITY]', {
        route: '/api/recommendations',
        reason: 'not_shop_owner',
        userId: userData.user.id,
        shopId: shopId,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Acces refuse a cette boutique' }, { status: 403 })
    }
    // --- FIN AUTH ---

    // Vérifie si les recommandations ont moins de 24h
    var existing = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('shop_id', shopId)
      .single()

    if (existing.data) {
      var generatedAt = new Date(existing.data.generated_at)
      var diffHours = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60)
      // Si moins de 24h → retourne le cache existant sans appeler l'API
      if (diffHours < 24) {
        return NextResponse.json({
          recommendations: existing.data.recommendations,
          cached: true,
          next_refresh: Math.round(24 - diffHours) + 'h'
        })
      }
    }

    // --- RATE LIMIT GLOBAL : max 50 appels Anthropic/jour (toutes boutiques confondues) ---
    // Stocke en memoire du processus. Sur Vercel serverless, chaque instance cold-start a son propre compteur.
    // Ce n'est PAS une protection parfaite. Filet de second niveau. Protection primaire = cache 24h/shop + auth Bearer.
    var g = globalThis as any
    if (!g.recommendationsRateLimit) {
      g.recommendationsRateLimit = { count: 0, windowStart: Date.now() }
    }

    var rl = g.recommendationsRateLimit
    var dayMs = 24 * 60 * 60 * 1000

    if (Date.now() - rl.windowStart > dayMs) {
      rl.count = 0
      rl.windowStart = Date.now()
    }

    if (rl.count >= 50) {
      console.warn('[SECURITY]', {
        route: '/api/recommendations',
        reason: 'global_rate_limit_exceeded',
        count: rl.count,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Limite quotidienne atteinte. Reessayez demain.' },
        { status: 429 }
      )
    }

    // Incremente AVANT l'appel Anthropic (evite les depassements en parallele)
    rl.count++
    // --- FIN RATE LIMIT ---

    // Récupère les données de la boutique pour nourrir l'IA
    var [ordersRes, viewsRes, productsRes, physicalRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('shop_id', shopId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('page_views').select('*').eq('shop_id', shopId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('products').select('*').eq('shop_id', shopId).eq('is_active', true),
      supabase.from('physical_sales').select('*').eq('shop_id', shopId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    var orders = ordersRes.data || []
    var views = viewsRes.data || []
    var products = productsRes.data || []
    var physicalSales = physicalRes.data || []

    // Calcule les métriques clés à envoyer à l'IA
    var deliveredOrders = orders.filter(function(o) { return o.status === 'livree' })
    var caOnline = deliveredOrders.reduce(function(sum, o) { return sum + o.total }, 0)
    var caPhysical = physicalSales.reduce(function(sum, s) { return sum + s.total }, 0)
    var caTotal = caOnline + caPhysical
    var panierMoyen = deliveredOrders.length > 0 ? Math.round(caOnline / deliveredOrders.length) : 0
    var tauxConversion = views.length > 0 ? ((orders.length / views.length) * 100).toFixed(1) : '0'
    var tauxLivraison = orders.length > 0 ? Math.round((deliveredOrders.length / orders.length) * 100) : 0

    // Top produits
    var productSales: any = {}
    orders.forEach(function(order) {
      if (order.order_items) {
        order.order_items.forEach(function(item: any) {
          if (!productSales[item.product_name]) productSales[item.product_name] = 0
          productSales[item.product_name] += item.quantity
        })
      }
    })
    var topProducts = Object.entries(productSales)
      .sort(function(a: any, b: any) { return b[1] - a[1] })
      .slice(0, 3)
      .map(function(e) { return e[0] + ' (' + e[1] + ' ventes)' })

    // Produits en stock bas
    var lowStock = products
      .filter(function(p) { return p.stock_quantity != null && p.stock_quantity <= (p.stock_alert || 3) })
      .map(function(p) { return p.name + ' (' + p.stock_quantity + ' restants)' })

    // Sources de trafic
    var referrers: any = {}
    views.forEach(function(v) {
      var r = v.referrer || 'direct'
      referrers[r] = (referrers[r] || 0) + 1
    })
    var topReferrers = Object.entries(referrers)
      .sort(function(a: any, b: any) { return (b[1] as number) - (a[1] as number) })
      .slice(0, 3)
      .map(function(e) { return e[0] + ' (' + e[1] + ' visites)' })

    // Construit le prompt pour Claude Haiku
    var prompt = `Tu es un conseiller business expert en e-commerce africain, spécialisé pour les artisans et petits vendeurs en Côte d'Ivoire.

Voici les données de performance de la boutique sur les 30 derniers jours :

VENTES :
- CA total : ${caTotal.toLocaleString('fr-FR')} FCFA (en ligne : ${caOnline.toLocaleString('fr-FR')} + physique : ${caPhysical.toLocaleString('fr-FR')})
- Commandes : ${orders.length} (${deliveredOrders.length} livrées, taux livraison : ${tauxLivraison}%)
- Panier moyen : ${panierMoyen.toLocaleString('fr-FR')} FCFA
- Top produits : ${topProducts.length > 0 ? topProducts.join(', ') : 'Pas encore de ventes'}

TRAFIC :
- Visiteurs : ${views.length}
- Taux de conversion : ${tauxConversion}%
- Sources principales : ${topReferrers.length > 0 ? topReferrers.join(', ') : 'Pas de données'}

STOCK :
- Produits en stock bas ou rupture : ${lowStock.length > 0 ? lowStock.join(', ') : 'Aucun'}
- Nombre de produits actifs : ${products.length}

Génère exactement 4 recommandations concrètes et actionnables pour aider cet artisan à améliorer ses ventes.
Chaque recommandation doit être :
- Courte (max 2 phrases)
- Spécifique aux données fournies
- Adaptée au marché ivoirien (Mobile Money, WhatsApp, réseaux sociaux)
- Immédiatement actionnable

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown :
[
  {"icon": "emoji", "titre": "titre court", "conseil": "conseil actionnable"},
  {"icon": "emoji", "titre": "titre court", "conseil": "conseil actionnable"},
  {"icon": "emoji", "titre": "titre court", "conseil": "conseil actionnable"},
  {"icon": "emoji", "titre": "titre court", "conseil": "conseil actionnable"}
]`

    // Appelle Claude Haiku
    var response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    var text = response.content[0].type === 'text' ? response.content[0].text : '[]'

    // Nettoie les balises markdown si présentes
    var clean = text.replace(/```json|```/g, '').trim()
    var recommendations = JSON.parse(clean)

    logInfo('api/recommendations', 'Recommandations IA générées', { shop_id: shopId, count: recommendations.length })

    // Sauvegarde en base avec upsert (insert ou update si déjà existant)
    await supabase.from('ai_recommendations').upsert({
      shop_id: shopId,
      recommendations: recommendations,
      generated_at: new Date().toISOString()
    }, { onConflict: 'shop_id' })

    return NextResponse.json({
      recommendations,
      cached: false,
      next_refresh: '24h'
    })

  } catch (err: any) {
    logError('api/recommendations', 'Erreur IA recommendations', { error: err?.message })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}