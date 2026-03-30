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
      plan_souhaite: body.plan || null,
      lien_social: body.lien_social || null,
      addons: body.addons || [],
    }).select().single()

    if (error) {
      console.error('Erreur insert lead:', JSON.stringify(error))
      return NextResponse.json({ error: 'Erreur insertion', details: error.message }, { status: 500 })
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

    // Envoi email Brevo directement (avec await pour que Vercel ne tue pas le processus)
    try {
      var addonsText = body.addons && body.addons.length > 0 ? body.addons.join(', ') : 'Aucun'
      var dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Abidjan' })

      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY || '',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'fortunashop', email: 'contact@fortunashop.fr' },
          to: [{ email: 'contact@fortunashop.fr', name: 'Frédérick' }],
          subject: 'Nouveau lead fortunashop — ' + body.nom + ' (' + (body.plan || 'Non précisé') + ')',
          htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#DC5014;color:white;padding:20px;border-radius:12px 12px 0 0;"><h2 style="margin:0;font-size:18px;">Nouveau lead fortunashop</h2></div><div style="background:#FDF8F3;padding:24px;border:1px solid #DDD0B8;border-radius:0 0 12px 12px;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px 0;color:#7C6C58;width:120px;font-size:14px;">Nom</td><td style="padding:10px 0;font-weight:bold;font-size:14px;">' + (body.nom || '-') + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">WhatsApp</td><td style="padding:10px 0;font-weight:bold;font-size:14px;">' + (body.whatsapp || '-') + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Activité</td><td style="padding:10px 0;font-size:14px;">' + (body.activite || '-') + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Plan</td><td style="padding:10px 0;font-weight:bold;color:#DC5014;font-size:14px;">' + (body.plan || 'Non choisi') + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Lien social</td><td style="padding:10px 0;font-size:14px;">' + (body.lien_social || '-') + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Add-ons</td><td style="padding:10px 0;font-size:14px;">' + addonsText + '</td></tr></table><hr style="border:none;border-top:1px solid #DDD0B8;margin:16px 0;"><p style="font-size:12px;color:#7C6C58;margin:0;">Reçu le ' + dateStr + '</p></div></div>',
        }),
      })
    } catch (emailErr) {
      console.error('Erreur envoi email Brevo:', emailErr)
    }

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
