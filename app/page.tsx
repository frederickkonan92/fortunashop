import LandingClient from './landing-client'
import { getLandingPlanCards, getLandingFaqs } from '@/lib/landing-plans'
import {
  LANDING_ADDONS,
  LANDING_PROBLEMS,
  LANDING_STEPS,
  LANDING_CHECKLIST,
} from '@/lib/landing-sections'

// Coquille serveur : données tarifs / FAQ depuis plan-rules + landing-plans ; interactivité dans landing-client
export default function HomePage() {
  return (
    <LandingClient
      plans={getLandingPlanCards()}
      addons={LANDING_ADDONS}
      faqs={getLandingFaqs()}
      problems={LANDING_PROBLEMS}
      steps={LANDING_STEPS}
      checklist={LANDING_CHECKLIST}
    />
  )
}
