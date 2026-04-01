/**
 * Contenus marketing statiques de la landing (hors tarifs plans — voir landing-plans + plan-rules).
 */

export type LandingAddon = {
  icon: string
  name: string
  desc: string
  price: string
  type: string
  plans: string
}

export var LANDING_ADDONS: LandingAddon[] = [
  { icon: '🚀', name: 'Kit Migration Communauté', desc: 'Message WhatsApp personnalisé, 3 visuels Instagram, bios optimisées, script lancement et 1h coaching.', price: '25 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
  { icon: '💳', name: 'Mobile Money complet', desc: 'Orange Money, MTN MoMo & Moov via CinetPay. Accès immédiat à tous les paiements mobile CI.', price: '75 000 FCFA', type: 'setup unique', plans: 'Starter' },
  { icon: '🌍', name: 'CB internationale Stripe', desc: 'Visa & Mastercard pour la diaspora et clients internationaux. Inclut accompagnement KYC.', price: '90 000 FCFA', type: 'setup unique', plans: 'Starter · Pro' },
  { icon: '📊', name: 'Pack Analytics', desc: 'Dashboard CA en temps réel, top produits, panier moyen, export CSV + recommandations IA mensuelles.', price: '20 000 FCFA', type: '/mois', plans: 'Starter · Pro' },
  { icon: '📈', name: 'Gestion des stocks', desc: 'Alertes stock bas, désactivation auto des produits épuisés, historique et stock tampon physique.', price: '10 000 FCFA', type: '/mois', plans: 'Starter · Pro' },
  { icon: '🏷️', name: 'Codes promo & réductions', desc: 'Créez des codes promo pour fidéliser et relancer vos clients.', price: '20 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
  { icon: '🔗', name: 'Lien livraison livreur', desc: 'Le livreur confirme la remise en 1 clic. Le client est notifié automatiquement en temps réel.', price: '10 000 FCFA', type: '/mois', plans: 'Starter' },
  { icon: '🎯', name: 'Bannière promo dynamique', desc: 'Bandeau personnalisable en haut de boutique avec offre spéciale ou compte à rebours.', price: '15 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
  { icon: '🚗', name: 'Intégration Yango', desc: 'Dispatch automatique du livreur via Yango. Suivi temps réel pour vous et votre client. Bientôt disponible.', price: '75 000 + 10 000 FCFA', type: 'setup + /mois', plans: 'Tous plans' },
  { icon: '🌐', name: 'Domaine personnalisé', desc: 'Votre boutique sur votre propre nom de domaine (maboutique.ci ou .com). Inclut configuration DNS.', price: '50 000 + 5 000 FCFA', type: 'setup + /mois', plans: 'Pro · Premium' },
]

export type LandingFaq = { q: string; a: string }

export var LANDING_FAQS: LandingFaq[] = [
  { q: 'Combien de temps pour avoir ma boutique ?', a: 'Votre boutique est livrée en 7 jours maximum après réception de votre catalogue et logo.' },
  { q: 'Est-ce que je dois savoir coder ?', a: "Non. Vous nous envoyez vos photos et prix via WhatsApp. On s'occupe de tout." },
  { q: 'Quels modes de paiement sont acceptés ?', a: 'Wave est inclus dans tous les plans. Orange Money et MTN MoMo sont disponibles en add-on CinetPay. La carte bancaire est disponible avec Stripe (plan Premium).' },
  { q: 'Puis-je modifier mon catalogue moi-même ?', a: "Oui, depuis votre espace admin. Le nombre de modifications mensuelles dépend de votre plan (10 pour Starter, 25 pour Pro, illimité pour Premium)." },
  { q: 'La livraison est-elle incluse ?', a: 'Nous intégrons votre livreur existant. Nous pouvons également vous mettre en relation avec nos partenaires livreurs à Abidjan.' },
  { q: 'Puis-je changer de plan ?', a: 'Oui, à tout moment. Contactez-nous sur WhatsApp et nous gérons la migration sans interruption de service.' },
  { q: 'La boutique fonctionne-t-elle sur mobile ?', a: 'Oui, votre boutique est 100% optimisée pour mobile. Vos clients commandent depuis leur téléphone en quelques clics.' },
  { q: 'Est-ce que mes clients de la diaspora peuvent commander ?', a: 'Oui. Avec le plan Premium et Stripe, vos clients en France, Belgique, Canada peuvent payer par carte bancaire internationale.' },
]

export type LandingProblem = { icon: string; title: string; desc: string }

export var LANDING_PROBLEMS: LandingProblem[] = [
  { icon: '💬', title: '100 DMs par jour', desc: 'Vous passez vos journées à répondre aux mêmes questions sur WhatsApp et Instagram. Prix ? Dispo ? Livraison ?' },
  { icon: '🌙', title: 'Ventes perdues la nuit', desc: "Quand vous dormez, vos clients ne peuvent pas commander. Résultat : ils achètent ailleurs." },
  { icon: '🚚', title: 'Livraisons chaotiques', desc: 'Coordonner client + livreur sur WhatsApp = erreurs, retards et clients mécontents.' },
]

export type LandingStep = { num: string; title: string; desc: string; tag: string }

export var LANDING_STEPS: LandingStep[] = [
  { num: '1', title: 'Envoyez vos infos', desc: 'Photos produits, prix, logo — envoyez tout directement depuis votre téléphone.', tag: '📱 Via WhatsApp' },
  { num: '2', title: 'On crée votre boutique', desc: 'En 7 jours max, votre boutique est en ligne avec un lien unique à partager partout.', tag: '🔗 Votre lien personnalisé' },
  { num: '3', title: 'Vous vendez, on gère le reste', desc: 'Commandes, notifications livreur, paiement Wave intégré. Concentrez-vous sur vos créations.', tag: '💰 Paiement Wave inclus' },
]

export type LandingChecklistItem = { icon: string; text: string }

export var LANDING_CHECKLIST: LandingChecklistItem[] = [
  { icon: '🏪', text: 'Nom de boutique + slogan' },
  { icon: '📸', text: 'Photos de vos produits' },
  { icon: '💰', text: 'Prix en FCFA' },
  { icon: '🎨', text: 'Votre logo (si vous en avez un)' },
  { icon: '📍', text: 'Adresse + zones de livraison' },
  { icon: '📱', text: 'Numéro WhatsApp du livreur' },
]
