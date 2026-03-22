// mailer.js
// Envoie un email récap avec les meilleurs leads du jour

import nodemailer from 'nodemailer';

export async function sendEmailAlert(leads) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      // Pas ton vrai mot de passe Gmail !
      // Va sur myaccount.google.com > Sécurité > Mots de passe des applications
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });

  // Top 5 leads pour l'email
  const top5 = leads.slice(0, 5);
  const corps = top5.map(l =>
    `• ${l.nom} (${l.score}/10 — ${l.marche_cible})\n  ${l.profil_facebook}\n  💬 ${l.message_whatsapp}\n`
  ).join('\n');

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `🎯 fortunashop — ${leads.length} leads qualifiés aujourd'hui`,
    text: `Bonjour Frédérick,\n\n${leads.length} leads qualifiés trouvés.\n\nTop 5 :\n\n${corps}\n\nFichier complet : leads.csv dans ton projet.`
  });

  console.log('📧 Email récap envoyé');
}