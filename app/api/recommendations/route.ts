import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// NOTE: route handler must export named HTTP methods (POST/GET) for Next.js app router.

// Initialise Supabase avec la clé service (accès complet, côté serveur uniquement)
var supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialise le client Anthropic
var anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(req: NextRequest) {
  try {
    var body = await req.json()
    var shopId = body.shop_id
    if (!shopId) return NextResponse.json({ error: 'shop_id manquant' }, { status: 400 })

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
    console.error('AI recommendations error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}