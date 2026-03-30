import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    var body = await request.json()

    var addonsText = body.addons && body.addons.length > 0
      ? body.addons.join(', ')
      : 'Aucun'

    var dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Abidjan'
    })

    // Appel direct à l'API Brevo via fetch (plus simple que le SDK)
    var response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY || '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'fortunashop',
          email: 'contact@fortunashop.fr',
        },
        to: [
          { email: 'contact@fortunashop.fr', name: 'Frédérick' },
        ],
        subject: 'Nouveau lead fortunashop — ' + body.nom + ' (' + (body.plan || 'Non précisé') + ')',
        htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">'
          + '<div style="background: #DC5014; color: white; padding: 20px; border-radius: 12px 12px 0 0;">'
          + '<h2 style="margin: 0; font-size: 18px;">Nouveau lead fortunashop</h2>'
          + '</div>'
          + '<div style="background: #FDF8F3; padding: 24px; border: 1px solid #DDD0B8; border-radius: 0 0 12px 12px;">'
          + '<table style="width: 100%; border-collapse: collapse;">'
          + '<tr><td style="padding: 10px 0; color: #7C6C58; width: 120px; vertical-align: top; font-size: 14px;">Nom</td>'
          + '<td style="padding: 10px 0; font-weight: bold; font-size: 14px;">' + (body.nom || '-') + '</td></tr>'
          + '<tr><td style="padding: 10px 0; color: #7C6C58; font-size: 14px;">WhatsApp</td>'
          + '<td style="padding: 10px 0; font-weight: bold; font-size: 14px;">' + (body.whatsapp || '-') + '</td></tr>'
          + '<tr><td style="padding: 10px 0; color: #7C6C58; font-size: 14px;">Activité</td>'
          + '<td style="padding: 10px 0; font-size: 14px;">' + (body.activite || '-') + '</td></tr>'
          + '<tr><td style="padding: 10px 0; color: #7C6C58; font-size: 14px;">Plan</td>'
          + '<td style="padding: 10px 0; font-weight: bold; color: #DC5014; font-size: 14px;">' + (body.plan || 'Non choisi') + '</td></tr>'
          + '<tr><td style="padding: 10px 0; color: #7C6C58; font-size: 14px;">Lien social</td>'
          + '<td style="padding: 10px 0; font-size: 14px;">' + (body.lien_social || '-') + '</td></tr>'
          + '<tr><td style="padding: 10px 0; color: #7C6C58; font-size: 14px;">Add-ons</td>'
          + '<td style="padding: 10px 0; font-size: 14px;">' + addonsText + '</td></tr>'
          + '</table>'
          + '<hr style="border: none; border-top: 1px solid #DDD0B8; margin: 16px 0;">'
          + '<p style="font-size: 12px; color: #7C6C58; margin: 0;">Reçu le ' + dateStr + '</p>'
          + '</div>'
          + '</div>',
      }),
    })

    if (!response.ok) {
      var errorData = await response.json()
      console.error('Erreur Brevo:', JSON.stringify(errorData))
      return NextResponse.json({ success: false, error: 'Erreur envoi email' })
    }

    var result = await response.json()
    return NextResponse.json({ success: true, messageId: result.messageId })

  } catch (error) {
    console.error('Erreur envoi email lead:', error)
    return NextResponse.json({ success: false, error: 'Erreur serveur email' })
  }
}
