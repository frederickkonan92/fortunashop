// scorer.js
// Envoie le contenu d'un post Facebook à Claude pour analyser
// si l'auteur est un artisan CI potentiellement intéressé par fortunashop

import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

export async function scorePost(post) {

  // On extrait les champs utiles du JSON Apify
  const nom = post.user?.name || 'Inconnu';
  const profil = post.user?.profile_url || '';
  const texte = post.text || '';
  const lienPost = post.link || '';

  const prompt = `
Tu es expert en prospection pour fortunashop, une startup qui crée des boutiques e-commerce pour artisans en Côte d'Ivoire et en France.

Analyse ce post Facebook et réponds UNIQUEMENT en JSON valide, sans markdown, sans explication.

Auteur : ${nom}
Profil : ${profil}
Contenu du post : "${texte.substring(0, 500)}"

Réponds avec exactement ce JSON :
{
  "score": (0 à 10),
  "est_artisan": (true ou false),
  "marche_cible": ("CI" ou "France" ou "Diaspora" ou "Inconnu"),
  "raison": "(1 phrase courte)",
  "message_whatsapp": "(message de prospection chaleureux, 2-3 phrases, français, personnalisé selon le post)"
}

Critères :
- 8-10 : vend des produits artisanaux, pas de site e-commerce visible, actif
- 5-7 : probable artisan, manque d'infos
- 0-4 : pas artisan, ou déjà équipé d'un site pro
`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    // Haiku = 10x moins cher que Sonnet, suffisant pour du scoring
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });

  try {
    const result = JSON.parse(response.content[0].text);
    // On ajoute les infos du post au résultat pour l'export
    return {
      ...result,
      nom,
      profil_facebook: profil,
      lien_post: lienPost,
      extrait_post: texte.substring(0, 150),
      date: new Date().toLocaleDateString('fr-FR')
    };
  } catch {
    // Si Claude ne répond pas en JSON propre, on ignore ce post
    return null;
  }
}