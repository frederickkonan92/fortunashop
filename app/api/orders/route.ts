import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logInfo, logError } from '@/lib/logger'

var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getSupabaseAdmin() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Config Supabase admin manquante')
  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    // Validation taille du body (max 50KB)
    var contentLength = parseInt(request.headers.get('content-length') || '0')
    if (contentLength > 51200) {
      return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 })
    }

    var body = await request.json()

    // Validation champs requis
    if (!body.shop_id || !body.customer_name || !body.customer_phone || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Données commande incomplètes' }, { status: 400 })
    }

    // Validation types
    if (typeof body.shop_id !== 'string' || typeof body.customer_name !== 'string' || typeof body.customer_phone !== 'string') {
      return NextResponse.json({ error: 'Types de champs invalides' }, { status: 400 })
    }
    if (typeof body.total !== 'number' || body.total <= 0) {
      return NextResponse.json({ error: 'Total invalide' }, { status: 400 })
    }
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Items doit être un tableau' }, { status: 400 })
    }

    // Validation UUID shop_id
    if (!uuidRegex.test(body.shop_id)) {
      return NextResponse.json({ error: 'shop_id invalide' }, { status: 400 })
    }

    var supabase = getSupabaseAdmin()

    // Validation des prix côté serveur : recalculer le total depuis la BDD
    var serverTotal = 0
    for (var i = 0; i < body.items.length; i++) {
      var orderItem = body.items[i]
      if (!orderItem.product_id || !orderItem.quantity || orderItem.quantity <= 0) {
        return NextResponse.json({ error: 'Item invalide' }, { status: 400 })
      }
      var prodCheck = await supabase.from('products').select('price').eq('id', orderItem.product_id).single()
      if (!prodCheck.data) {
        return NextResponse.json({ error: 'Produit introuvable : ' + orderItem.product_id }, { status: 400 })
      }
      // Si variante avec prix override, chercher le prix de la variante
      var itemPrice = prodCheck.data.price
      if (orderItem.variant_value) {
        var parts = String(orderItem.variant_value).split(' / ')
        var varQuery = supabase.from('product_variants').select('price_override').eq('product_id', orderItem.product_id)
        if (parts.length === 2) {
          varQuery = varQuery.eq('variant_value', parts[0]).eq('variant_value_2', parts[1])
        } else {
          varQuery = varQuery.eq('variant_value', parts[0])
        }
        var varCheck = await varQuery.maybeSingle()
        if (varCheck.data && varCheck.data.price_override != null) {
          itemPrice = varCheck.data.price_override
        }
      }
      serverTotal += itemPrice * orderItem.quantity
    }

    // Tolérance de 1 FCFA pour les arrondis
    if (Math.abs(serverTotal - body.total) > 1) {
      logError('api/orders', 'Total client/serveur mismatch', { clientTotal: body.total, serverTotal: serverTotal, shop_id: body.shop_id })
      return NextResponse.json({ error: 'Le total ne correspond pas aux prix actuels. Rechargez la page.' }, { status: 400 })
    }

    var { data, error } = await supabase.rpc('create_order_with_stock', {
      p_shop_id: body.shop_id,
      p_customer_name: body.customer_name,
      p_customer_phone: body.customer_phone,
      p_customer_address: body.customer_address || null,
      p_delivery_mode: body.delivery_mode || 'retrait',
      p_total: serverTotal,
      p_payment_mode: body.payment_mode,
      p_items: body.items,
    })

    if (error) {
      logError('api/orders', 'Erreur RPC create_order', { error: error.message, shop_id: body.shop_id })
      return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
    }

    logInfo('api/orders', 'Nouvelle commande', { shop_id: body.shop_id, total: body.total, order_number: data.order_number })
    return NextResponse.json({ success: true, order_id: data.order_id, order_number: data.order_number })
  } catch (err: any) {
    logError('api/orders', 'Erreur serveur', { error: err?.message })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
