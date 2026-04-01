import { describe, it, expect } from 'vitest'
import {
  PRICING_SETUP_FCFA,
  PLAN_SUBSCRIPTION_PRICING,
  getMaxProductsForPlan,
  getMaxCatalogEditsForPlan,
} from '@/lib/plan-rules'
import { getLandingPlanCards, getLandingFaqs } from '@/lib/landing-plans'
import { LANDING_FAQS } from '@/lib/landing-sections'

describe('PRICING_SETUP_FCFA & PLAN_SUBSCRIPTION_PRICING', function() {
  it('setup unique aligné doc métier', function() {
    expect(PRICING_SETUP_FCFA).toBe(100000)
  })

  it('abonnements Starter / Pro / Premium', function() {
    expect(PLAN_SUBSCRIPTION_PRICING.starter.monthly).toBe(35000)
    expect(PLAN_SUBSCRIPTION_PRICING.pro.monthly).toBe(55000)
    expect(PLAN_SUBSCRIPTION_PRICING.premium.monthly).toBe(85000)
  })
})

describe('getLandingPlanCards', function() {
  it('synchronise montants avec plan-rules', function() {
    var cards = getLandingPlanCards()
    expect(cards.length).toBe(3)
    expect(cards[0].key).toBe('starter')
    expect(cards[0].monthly).toBe(PLAN_SUBSCRIPTION_PRICING.starter.monthly)
    expect(cards[0].annual).toBe(PLAN_SUBSCRIPTION_PRICING.starter.annualMonthlyEquivalent)
    expect(cards[1].key).toBe('pro')
    expect(cards[2].key).toBe('premium')
  })

  it('injecte les limites produits / édits depuis getMax*', function() {
    var starter = getLandingPlanCards()[0]
    expect(starter.features.some(function(f) { return f.indexOf(String(getMaxProductsForPlan('starter'))) !== -1 })).toBe(true)
    expect(starter.features.some(function(f) { return f.indexOf(String(getMaxCatalogEditsForPlan('starter'))) !== -1 })).toBe(true)
  })
})

describe('getLandingFaqs', function() {
  it('même nombre d’entrées que la base FAQ', function() {
    expect(getLandingFaqs().length).toBe(LANDING_FAQS.length)
  })
})
