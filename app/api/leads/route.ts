import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logInfo, logError } from '@/lib/logger'

// Client Supabase côté serveur avec la service role key
// Permet d'insérer dans leads sans restriction RLS
// IMPORTANT: initialisation lazy (évite crash build Vercel si env absent au collect)
function getSupabaseAdmin() {
  var url = process.env.NEXT_PUBLIC_SUPABASE_URL
  var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  return createClient(url, serviceRoleKey)
}

// Évite injection HTML dans l'email Brevo
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Numéro WhatsApp de Frédérick pour recevoir les notifications
var NOTIFY_PHONE = '33664765696'

var MAX_LEN = {
  nom: 200,
  whatsapp: 80,
  activite: 120,
  plan: 80,
  lien_social: 500,
}

export async function POST(request: Request) {
  try {
    // Validation taille du body (max 10KB)
    var contentLength = parseInt(request.headers.get('content-length') || '0')
    if (contentLength > 10240) {
      return NextResponse.json({ error: 'Payload trop volumineux' }, { status: 413 })
    }

    var body = await request.json()

    // Validation basique des champs requis
    if (!body.nom || !body.whatsapp) {
      return NextResponse.json({ error: 'Nom et WhatsApp requis' }, { status: 400 })
    }

    var nom = String(body.nom).trim().slice(0, MAX_LEN.nom)
    var whatsapp = String(body.whatsapp).trim().slice(0, MAX_LEN.whatsapp)
    var activite = body.activite != null ? String(body.activite).trim().slice(0, MAX_LEN.activite) : null
    var plan = body.plan != null ? String(body.plan).trim().slice(0, MAX_LEN.plan) : null
    var lien_social = body.lien_social != null ? String(body.lien_social).trim().slice(0, MAX_LEN.lien_social) : null
    var addons = Array.isArray(body.addons) ? body.addons.slice(0, 30).map(function(a: any) { return String(a).slice(0, 120) }) : []

    if (!nom || !whatsapp) {
      return NextResponse.json({ error: 'Nom et WhatsApp requis' }, { status: 400 })
    }

    var supabase = getSupabaseAdmin()

    // Insère le lead dans Supabase
    var { data, error } = await supabase.from('leads').insert({
      nom: nom,
      whatsapp: whatsapp,
      activite: activite || null,
      plan_souhaite: plan || null,
      lien_social: lien_social || null,
      addons: addons,
    }).select().single()

    if (error) {
      logError('api/leads', 'Erreur insert lead', { error: error.message })
      return NextResponse.json({ error: 'Erreur insertion', details: error.message }, { status: 500 })
    }

    // Construit le message de notification WhatsApp pour Frédérick
    var addonsText = addons.length > 0 ? addons.join(', ') : 'Aucun'

    var notifMessage = 'NOUVEAU LEAD fortunashop !\n\n'
      + 'Nom : ' + nom + '\n'
      + 'Tel : ' + whatsapp + '\n'
      + 'Activite : ' + (activite || 'Non precis') + '\n'
      + 'Plan : ' + (plan || 'Non choisi') + '\n'
      + 'Lien : ' + (lien_social || 'Pas de lien') + '\n'
      + 'Add-ons : ' + addonsText + '\n\n'
      + new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })

    // Génère le lien WhatsApp de notification
    var notifLink = 'https://wa.me/' + NOTIFY_PHONE + '?text=' + encodeURIComponent(notifMessage)

    // Log structuré
    logInfo('api/leads', 'Nouveau lead', { nom: nom, whatsapp: whatsapp, plan: plan, addons: addonsText })

    // Envoi email Brevo directement (avec await pour que Vercel ne tue pas le processus)
    try {
      var addonsTextEmail = addons.length > 0 ? addons.join(', ') : 'Aucun'
      var dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Abidjan' })

      var hNom = escapeHtml(nom)
      var hWa = escapeHtml(whatsapp)
      var hAct = escapeHtml(activite || '-')
      var hPlan = escapeHtml(plan || 'Non choisi')
      var hLien = escapeHtml(lien_social || '-')
      var hAddons = escapeHtml(addonsTextEmail)

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
          subject: 'Nouveau lead fortunashop — ' + nom.replace(/[\r\n]+/g, ' ').slice(0, 80) + ' (' + (plan || 'Non précisé') + ')',
          htmlContent: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#DC5014;color:white;padding:20px;border-radius:12px 12px 0 0;"><h2 style="margin:0;font-size:18px;">Nouveau lead fortunashop</h2></div><div style="background:#FDF8F3;padding:24px;border:1px solid #DDD0B8;border-radius:0 0 12px 12px;"><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:10px 0;color:#7C6C58;width:120px;font-size:14px;">Nom</td><td style="padding:10px 0;font-weight:bold;font-size:14px;">' + hNom + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">WhatsApp</td><td style="padding:10px 0;font-weight:bold;font-size:14px;">' + hWa + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Activité</td><td style="padding:10px 0;font-size:14px;">' + hAct + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Plan</td><td style="padding:10px 0;font-weight:bold;color:#DC5014;font-size:14px;">' + hPlan + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Lien social</td><td style="padding:10px 0;font-size:14px;">' + hLien + '</td></tr><tr><td style="padding:10px 0;color:#7C6C58;font-size:14px;">Add-ons</td><td style="padding:10px 0;font-size:14px;">' + hAddons + '</td></tr></table><hr style="border:none;border-top:1px solid #DDD0B8;margin:16px 0;"><p style="font-size:12px;color:#7C6C58;margin:0;">Reçu le ' + escapeHtml(dateStr) + '</p></div></div>',
        }),
      })
    } catch (emailErr: any) {
      logError('api/leads', 'Erreur envoi email Brevo', { error: emailErr?.message })
    }

    return NextResponse.json({
      success: true,
      leadId: data.id,
      notifLink: notifLink,
    })

  } catch (err: any) {
    logError('api/leads', 'Erreur serveur', { error: err?.message })
    if (err && err.message && String(err.message).indexOf('manquant') !== -1) {
      return NextResponse.json({ error: 'Configuration serveur' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
