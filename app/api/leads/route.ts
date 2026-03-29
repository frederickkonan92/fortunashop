import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase côté serveur avec la service role key
// Permet d'insérer dans leads sans restriction RLS
var supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Numéro WhatsApp de Frédérick pour recevoir les notifications
var NOTIFY_PHONE = '33664765696'

export async function POST(request: Request) {
  try {
    var body = await request.json()

    // Validation basique des champs requis
    if (!body.nom || !body.whatsapp) {
      return NextResponse.json({ error: 'Nom et WhatsApp requis' }, { status: 400 })
    }

    // Insère le lead dans Supabase
    var { data, error } = await supabase.from('leads').insert({
      nom: body.nom,
      whatsapp: body.whatsapp,
      activite: body.activite || null,
      plan: body.plan || null,
      lien_social: body.lien_social || null,
      addons: body.addons || [],
    }).select().single()

    if (error) {
      console.error('Erreur insert lead:', error)
      return NextResponse.json({ error: 'Erreur insertion' }, { status: 500 })
    }

    // Construit le message de notification WhatsApp pour Frédérick
    var addonsText = body.addons && body.addons.length > 0
      ? body.addons.join(', ')
      : 'Aucun'

    var notifMessage = '🔔 NOUVEAU LEAD fortunashop !\n\n'
      + '👤 ' + body.nom + '\n'
      + '📱 ' + body.whatsapp + '\n'
      + '🏪 ' + (body.activite || 'Non précisé') + '\n'
      + '📋 Plan : ' + (body.plan || 'Non choisi') + '\n'
      + '🔗 ' + (body.lien_social || 'Pas de lien') + '\n'
      + '➕ Add-ons : ' + addonsText + '\n\n'
      + '⏰ ' + new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })

    // Génère le lien WhatsApp de notification
    var notifLink = 'https://wa.me/' + NOTIFY_PHONE + '?text=' + encodeURIComponent(notifMessage)

    // Log dans la console Vercel (backup)
    console.log('📧 NOUVEAU LEAD:', body.nom, body.whatsapp, body.plan, addonsText)

    return NextResponse.json({
      success: true,
      leadId: data.id,
      notifLink: notifLink,
    })

  } catch (err) {
    console.error('Erreur API leads:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
