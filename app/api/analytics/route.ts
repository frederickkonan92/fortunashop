import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec service role key (bypass RLS pour écriture visiteurs anonymes)
function getSupabaseAdmin() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  return createClient(url, serviceRoleKey)
}

// Types d'événements autorisés
var ALLOWED_EVENTS = ['page_view', 'view_product', 'add_to_cart', 'begin_checkout', 'purchase']

// Rate limiting basique en mémoire (par IP, max 100 req/min)
var rateMap: Record<string, { count: number; reset: number }> = {}

function isRateLimited(ip: string): boolean {
  var now = Date.now()
  var entry = rateMap[ip]
  if (!entry || now > entry.reset) {
    rateMap[ip] = { count: 1, reset: now + 60000 }
    return false
  }
  entry.count++
  return entry.count > 100
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    var ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
    }

    var body = await request.json()

    // Validation
    if (!body.shop_id || !body.event_type) {
      return NextResponse.json({ error: 'shop_id et event_type requis' }, { status: 400 })
    }

    if (ALLOWED_EVENTS.indexOf(body.event_type) === -1) {
      return NextResponse.json({ error: 'event_type non autorisé' }, { status: 400 })
    }

    // Valider que shop_id est un UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.shop_id)) {
      return NextResponse.json({ error: 'shop_id invalide' }, { status: 400 })
    }

    // Limiter la taille du metadata
    var metadata = body.metadata || {}
    if (JSON.stringify(metadata).length > 1000) {
      return NextResponse.json({ error: 'metadata trop volumineux' }, { status: 400 })
    }

    var supabase = getSupabaseAdmin()

    // Insérer l'événement
    var { error } = await supabase.from('analytics_events').insert({
      shop_id: body.shop_id,
      event_type: body.event_type,
      product_id: body.product_id || null,
      session_id: body.session_id || null,
      metadata: metadata,
    })

    if (error) {
      console.error('Analytics insert error:', error.message)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
