import {
  getMaxProductsForPlan,
  getMaxCatalogEditsForPlan,
  PLAN_SUBSCRIPTION_PRICING,
  type PlanKey,
} from '@/lib/plan-rules'
import { LANDING_FAQS, type LandingFaq } from '@/lib/landing-sections'

export type LandingPlanCard = {
  key: PlanKey
  name: string
  monthly: number
  annual: number
  savingsYear: number
  badge: string
  featured: boolean
  features: string[]
}

/**
 * Cartes tarifaires landing : montants depuis plan-rules, limites catalogue depuis getMax* (non-régression avec l’admin).
 */
export function getLandingPlanCards(): LandingPlanCard[] {
  var maxS = getMaxProductsForPlan('starter')
  var maxP = getMaxProductsForPlan('pro')
  var edS = getMaxCatalogEditsForPlan('starter')
  var edP = getMaxCatalogEditsForPlan('pro')
  var ps = PLAN_SUBSCRIPTION_PRICING.starter
  var pp = PLAN_SUBSCRIPTION_PRICING.pro
  var pm = PLAN_SUBSCRIPTION_PRICING.premium

  return [
    {
      key: 'starter',
      name: 'Starter',
      monthly: ps.monthly,
      annual: ps.annualMonthlyEquivalent,
      savingsYear: ps.savingsYearVsMonthly,
      badge: '',
      featured: false,
      features: [
        'Boutique en ligne en 7 jours',
        "Jusqu'à " + maxS + ' produits',
        'Paiement Wave intégré',
        '3 options de livraison',
        'Notification WhatsApp 1 livreur',
        'Suivi commande client',
        edS + ' modifications catalogue/mois',
        "Nom de domaine + hébergement inclus",
        '1h de formation incluse',
        'Support WhatsApp 48h',
      ],
    },
    {
      key: 'pro',
      name: 'Pro',
      monthly: pp.monthly,
      annual: pp.annualMonthlyEquivalent,
      savingsYear: pp.savingsYearVsMonthly,
      badge: '⭐ Le plus choisi',
      featured: true,
      features: [
        'Tout le plan Starter +',
        "Jusqu'à " + maxP + ' produits',
        'Wave + Orange Money + MTN MoMo',
        '3 livreurs notifiés via WhatsApp',
        edP + ' modifications catalogue/mois',
        'Dashboard ventes + analytics',
        'Lien confirmation livreur',
        'Gestion des stocks automatisée',
        "Système d'avis clients",
        '2h de formation incluse',
        'Support WhatsApp prioritaire 24h',
      ],
    },
    {
      key: 'premium',
      name: 'Premium',
      monthly: pm.monthly,
      annual: pm.annualMonthlyEquivalent,
      savingsYear: pm.savingsYearVsMonthly,
      badge: '🏆 Business',
      featured: false,
      features: [
        'Tout le plan Pro +',
        'Produits illimités',
        'Tous paiements + CB internationale',
        'Livreurs illimités',
        'Modifications illimitées',
        'Rapport détaillé + recommandations IA',
        'Relance panier abandonné',
        "Système d'avis clients",
        '3h de formation incluse',
        'Support téléphonique dédié (même jour)',
      ],
    },
  ]
}

/** FAQ avec chiffres catalogue alignés sur getMaxCatalogEditsForPlan */
export function getLandingFaqs(): LandingFaq[] {
  var edS = getMaxCatalogEditsForPlan('starter')
  var edP = getMaxCatalogEditsForPlan('pro')
  return LANDING_FAQS.map(function(f) {
    if (f.q.indexOf('modifier mon catalogue') !== -1) {
      return {
        q: f.q,
        a:
          "Oui, depuis votre espace admin. Le nombre de modifications mensuelles dépend de votre plan (" +
          edS +
          ' pour Starter, ' +
          edP +
          ", illimité pour Premium).",
      }
    }
    return f
  })
}
