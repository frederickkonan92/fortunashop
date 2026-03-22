// index.js
// Version récupération : on utilise les données déjà scrapées
// au lieu de relancer un nouveau scraping coûteux

import 'dotenv/config';
import fs from 'fs';
import { ApifyClient } from 'apify-client';
import { scorePost } from './scorer.js';
import { sendEmailAlert } from './mailer.js';

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// ID du dataset du Run 2 — celui qui a collecté 408 posts
// Tu le trouves sur Apify : clique sur le Run 2 → onglet Storage → Dataset → copie l'ID
const DATASET_ID = '93pfC6hjinWUnBuMQ';

async function main() {
  console.log('📦 Récupération des données déjà scrapées...');

  // On récupère les posts depuis le dataset existant
  // Pas de nouveau scraping = pas de crédit dépensé
  const { items } = await apify.dataset('kDKE8f9cNAvdW7Fh9').listItems({
    limit: 50  // on prend les 50 premiers pour commencer
  });

  console.log(`✅ ${items.length} posts récupérés depuis Apify`);

  const leads = [];

  for (const post of items) {
    // Skip les posts trop courts (images seules, liens sans texte)
    if (!post.text || post.text.length < 20) continue;

    console.log(`⏳ Analyse : ${post.user?.name || 'Inconnu'}...`);
    const analyse = await scorePost(post);

    if (analyse && analyse.score >= 3) {
      leads.push(analyse);
      console.log(`  ✅ Score ${analyse.score}/10 — ${analyse.nom}`);
    } else {
      console.log(`  ❌ Ignoré (score bas)`);
    }
  }

  console.log(`\n🎯 ${leads.length} leads qualifiés`);

  // Génère le CSV
  const csv = [
    'Nom,Score,Marché,Profil Facebook,Lien Post,Message WhatsApp,Raison,Date',
    ...leads.map(l =>
      `"${l.nom}","${l.score}","${l.marche_cible}","${l.profil_facebook}","${l.lien_post}","${l.message_whatsapp}","${l.raison}","${l.date}"`
    )
  ].join('\n');

  fs.writeFileSync('leads.csv', csv, 'utf8');
  console.log('📁 leads.csv créé !');

  if (leads.length > 0) {
    await sendEmailAlert(leads);
  }

  console.log('✅ Terminé !');
}

main().catch(console.error);