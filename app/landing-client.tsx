'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PRICING_SETUP_FCFA } from '@/lib/plan-rules'
import type { LandingPlanCard } from '@/lib/landing-plans'
import type {
  LandingAddon,
  LandingFaq,
  LandingProblem,
  LandingStep,
  LandingChecklistItem,
} from '@/lib/landing-sections'

type LandingClientProps = {
  plans: LandingPlanCard[]
  addons: LandingAddon[]
  faqs: LandingFaq[]
  problems: LandingProblem[]
  steps: LandingStep[]
  checklist: LandingChecklistItem[]
}

function useScrollAnimation() {
  var [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(function() {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          setVisibleSections(function(prev) {
            var next = new Set(prev)
            next.add(entry.target.id)
            return next
          })
        }
      })
    }, { threshold: 0.1 })

    var sections = document.querySelectorAll('[data-animate]')
    sections.forEach(function(s) { observer.observe(s) })

    return function() { observer.disconnect() }
  }, [])

  return visibleSections
}

export default function LandingClient({
  plans,
  addons,
  faqs,
  problems,
  steps,
  checklist,
}: LandingClientProps) {
  var [faqOpen, setFaqOpen] = useState<number | null>(null)
  var [isAnnual, setIsAnnual] = useState(false)
  var [formData, setFormData] = useState({ nom: '', whatsapp: '', activite: '', plan: '', lien_social: '' })
  var [selectedAddons, setSelectedAddons] = useState<string[]>([])
  var visibleSections = useScrollAnimation()

  var toggleAddon = function(addonName: string) {
    setSelectedAddons(function(prev) {
      if (prev.includes(addonName)) return prev.filter(function(a) { return a !== addonName })
      return [...prev, addonName]
    })
  }

  var scrollToContact = function(planKeyOrName: string) {
    setFormData(function(prev) { return { ...prev, plan: planKeyOrName.toLowerCase() } })
    var el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
  var [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')
  var [notifLink, setNotifLink] = useState<string | null>(null)
  var [formLoading, setFormLoading] = useState(false)
  var demoUrl = '/boutique/kente-fashion-test'

  var handleChange = function(e: any) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  var handleSubmit = async function(e: any) {
    e.preventDefault()
    if (!formData.nom || !formData.whatsapp || !formData.activite) return
    setFormLoading(true)
    var waMsg = encodeURIComponent(
      'Nouveau lead fortunashop !\n' +
      'Nom : ' + formData.nom + '\n' +
      'WhatsApp : ' + formData.whatsapp + '\n' +
      'Activité : ' + formData.activite + '\n' +
      'Plan : ' + (formData.plan || 'Non précisé') + '\n' +
      'Add-ons : ' + (selectedAddons.length > 0 ? selectedAddons.join(', ') : 'Aucun') + '\n' +
      'Lien social : ' + (formData.lien_social || 'Non renseigné')
    )
    var res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: formData.nom,
        whatsapp: formData.whatsapp,
        activite: formData.activite,
        plan: formData.plan,
        lien_social: formData.lien_social,
        addons: selectedAddons,
      })
    })
    var result = await res.json()
    if (result.success && result.notifLink) {
      setNotifLink(result.notifLink)
    }
    setFormStatus('success')
    setFormLoading(false)
    setTimeout(function() {
      window.open('https://wa.me/33664765696?text=' + waMsg, '_blank')
    }, 500)
  }

  var formatPrice = function(price: number) {
    return price.toLocaleString('fr-FR')
  }

  var animStyle = function(sectionId: string) {
    return {
      opacity: visibleSections.has(sectionId) ? 1 : 0,
      transform: visibleSections.has(sectionId) ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
    }
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-outfit), sans-serif', backgroundColor: '#FDF8F3', color: '#2C1A0E' }}>

      {/* GOOGLE FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nunito { font-family: 'Nunito', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pulse { animation: pulse 2s infinite; }
        .fade-in { animation: fadeIn 0.3s ease; }
        .btn-wa:hover { background: #1DA851 !important; }
        .plan-featured { background: linear-gradient(135deg, #DC5014, #F07832) !important; color: white !important; transform: scale(1.04); box-shadow: 0 16px 48px rgba(220,80,20,0.28); }
        .nav-link:hover { color: #DC5014; }
        .faq-btn:hover { background: #FAF0E6; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(253,248,243,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(220,80,20,0.08)', padding: '10px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className="nunito" style={{ fontSize: 24, fontWeight: 900, color: '#DC5014' }}>fortunashop</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="#pricing" className="nav-link" style={{ fontSize: 14, fontWeight: 700, color: '#5C3D1E', textDecoration: 'none', display: 'none' }}>Tarifs</a>
            <a href="#contact" className="nav-link" style={{ fontSize: 14, fontWeight: 700, color: '#5C3D1E', textDecoration: 'none', fontFamily: 'var(--font-outfit), sans-serif' }}>Contact</a>
            <Link href={demoUrl} target="_blank"
              style={{ background: 'white', color: '#DC5014', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 14, padding: '10px 18px', borderRadius: 12, border: '2px solid #DC5014', textDecoration: 'none' }}>
              Voir la démo
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(135deg, #DC5014 0%, #F07832 50%, #F0A050 100%)', padding: '80px 0 60px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: '20%', width: 450, height: 450, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
          <div className="nunito" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100, padding: '8px 20px', fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            <span className="pulse" style={{ width: 8, height: 8, background: '#4CAF50', borderRadius: '50%', display: 'inline-block' }} />
            Disponible · Côte d'Ivoire
          </div>
          <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 44, fontWeight: 700, lineHeight: 1.1, marginBottom: 16, maxWidth: 650 }}>
            Votre boutique professionnelle<br />prête en 7 jours
          </h1>
          <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 18, opacity: 0.9, maxWidth: 550, marginBottom: 12, lineHeight: 1.6 }}>
            Acceptez les commandes, gérez vos stocks et encaissez via Wave, Orange Money et MTN MoMo.
          </p>
          <p className="nunito" style={{ fontSize: 18, fontWeight: 800, marginBottom: 32 }}>
            Communiquez-nous votre catalogue. On construit votre boutique.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            <a href="#contact"
               onClick={function(e: any) { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}
               style={{ background: 'white', color: '#DC5014', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, padding: '16px 36px', borderRadius: 12, textDecoration: 'none', transition: 'all 0.2s' }}>
              Je veux ma boutique
            </a>
            <Link href={demoUrl} target="_blank"
               style={{ background: 'transparent', color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, padding: '16px 36px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              Voir une boutique démo
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['7j max', 'Pour livrer votre boutique'], ['0', 'Aucune compétence technique requise'], ['3 plans', 'Adaptés à votre activité']].map(function([val, label]) {
              return (
                <div key={val} style={{ textAlign: 'center' }}>
                  <div className="nunito" style={{ fontSize: 28, fontWeight: 900 }}>{val}</div>
                  <div style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 13, opacity: 0.8 }}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PROBLÈMES */}
      <section id="section-problems" data-animate style={{ padding: '80px 0', background: 'white', ...animStyle('section-problems') }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>Le problème</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Vous perdez des ventes chaque jour</h2>
          <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>Ce n'est pas votre produit le problème. C'est votre canal de vente.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {problems.map(function(p) {
              return (
                <div key={p.title} style={{
                  background: '#FDF8F3', borderRadius: 16, padding: 24, textAlign: 'center',
                  border: '1px solid rgba(220,80,20,0.06)',
                  transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default',
                }}
                onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)' }}
                onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{p.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, color: '#5C3D1E', lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="section-steps" data-animate style={{ padding: '80px 0', background: '#FDF8F3', ...animStyle('section-steps') }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>Comment ça marche</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>3 étapes simples pour lancer votre boutique</h2>
          <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>Pas besoin de savoir coder. On s'occupe de tout.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {steps.map(function(s) {
              return (
                <div key={s.num} style={{
                  background: 'white', borderRadius: 16, padding: '32px 24px',
                  boxShadow: '0 8px 32px rgba(220,80,20,0.08)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                }}
                onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)' }}
                onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(220,80,20,0.08)' }}
                >
                  <div className="nunito" style={{ width: 48, height: 48, background: '#DC5014', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, marginBottom: 20, transition: 'transform 0.2s' }}>{s.num}</div>
                  <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, color: '#5C3D1E', lineHeight: 1.5, marginBottom: 12 }}>{s.desc}</p>
                  <span style={{ fontFamily: 'var(--font-outfit), sans-serif', background: 'rgba(220,80,20,0.08)', color: '#DC5014', fontWeight: 700, padding: '4px 10px', borderRadius: 8, fontSize: 13 }}>{s.tag}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" data-animate style={{ padding: '80px 0', background: 'white', ...animStyle('pricing') }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, textAlign: 'center', fontFamily: 'var(--font-outfit), sans-serif' }}>Tarifs</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Choisissez votre plan</h2>
          <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 17, color: '#5C3D1E', marginBottom: 40, textAlign: 'center' }}>Setup unique + abonnement mensuel. Sans engagement.</p>

          {/* SETUP UNIQUE */}
          <div style={{ background: '#2C1A0E', borderRadius: 16, padding: '20px 32px', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 20 }}>
                🔧 Setup unique : <span style={{ color: '#F0B43C' }}>{PRICING_SETUP_FCFA.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
                Frais de création de votre boutique — payé une seule fois · Indépendant du plan choisi
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-outfit), sans-serif', background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' }}>
              Puis abonnement mensuel<br />selon votre plan
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 48 }}>
            <span className="nunito" onClick={function() { setIsAnnual(false) }} style={{ fontWeight: 800, fontSize: 15, color: !isAnnual ? '#DC5014' : '#9B8070', cursor: 'pointer' }}>Mensuel</span>
            <div onClick={function() { setIsAnnual(!isAnnual) }}
                 style={{ width: 56, height: 30, background: '#DC5014', borderRadius: 30, position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
              <div style={{ width: 24, height: 24, background: 'white', borderRadius: '50%', position: 'absolute', top: 3, left: isAnnual ? 29 : 3, transition: 'left 0.3s' }} />
            </div>
            <span className="nunito" onClick={function() { setIsAnnual(true) }} style={{ fontWeight: 800, fontSize: 15, color: isAnnual ? '#DC5014' : '#9B8070', cursor: 'pointer' }}>Annuel</span>
            <span style={{ fontFamily: 'var(--font-outfit), sans-serif', background: '#F0B43C', color: '#2C1A0E', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>2 mois offerts</span>
          </div>

          {/* PLANS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start', marginBottom: 40 }}>
            {plans.map(function(plan) {
              var price = isAnnual ? plan.annual : plan.monthly
              var isPro = plan.key === 'pro'
              return (
                <div key={plan.name} className={plan.featured ? 'plan-featured' : ''}
                     style={{
                       borderRadius: 20, padding: '32px 24px', position: 'relative',
                       border: plan.featured ? 'none' : isPro ? '2px solid #DC5014' : '2px solid transparent',
                       background: plan.featured ? '' : '#FDF8F3',
                       transition: 'transform 0.3s, box-shadow 0.3s',
                     }}
                     onMouseEnter={function(e: any) { if (!plan.featured) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)' } }}
                     onMouseLeave={function(e: any) { if (!plan.featured) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' } }}
                >
                  {/* Badge Recommandé pour Pro */}
                  {isPro && !plan.featured && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      background: '#DC5014', color: 'white',
                      fontSize: 10, fontWeight: 600,
                      padding: '3px 14px', borderRadius: 10,
                      letterSpacing: 0.5,
                      fontFamily: 'var(--font-outfit), sans-serif',
                    }}>
                      Recommandé
                    </div>
                  )}
                  {plan.badge && (
                    <div className="nunito" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.featured ? 'white' : '#F0B43C', color: plan.featured ? '#DC5014' : '#2C1A0E', fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      {plan.badge}
                    </div>
                  )}
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 700, marginBottom: 4, color: plan.featured ? 'white' : '#2C1A0E' }}>{plan.name}</div>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 13, color: plan.featured ? 'rgba(255,255,255,0.9)' : '#DC5014', verticalAlign: 'super' }}>FCFA </span>
                    <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, color: plan.featured ? 'white' : '#DC5014' }}>{formatPrice(price)}</span>
                    <span style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 14, opacity: 0.7, color: plan.featured ? 'white' : '#2C1A0E' }}>/mois</span>
                  </div>
                  {isAnnual && (
                    <div style={{ fontFamily: 'var(--font-outfit), sans-serif', background: plan.featured ? 'rgba(255,255,255,0.2)' : 'rgba(76,175,80,0.1)', color: plan.featured ? 'white' : '#4CAF50', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8, marginBottom: 12, display: 'inline-block' }}>
                      Économie : {formatPrice(plan.savingsYear)} FCFA/an
                    </div>
                  )}
                  <ul style={{ listStyle: 'none', marginBottom: 24 }}>
                    {plan.features.map(function(f, i) {
                      return (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', fontSize: 14, lineHeight: 1.4, fontFamily: 'var(--font-outfit), sans-serif' }}>
                          <span style={{ color: plan.featured ? 'rgba(255,255,255,0.9)' : '#DC5014', flexShrink: 0, marginTop: 2 }}>✓</span>
                          <span style={{ color: plan.featured ? 'rgba(255,255,255,0.9)' : '#5C3D1E' }}>{f}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    onClick={function() { scrollToContact(plan.key) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'center',
                      background: plan.featured ? 'white' : isPro ? '#DC5014' : 'transparent',
                      color: plan.featured ? '#DC5014' : isPro ? 'white' : '#DC5014',
                      border: plan.featured ? 'none' : isPro ? 'none' : '1.5px solid #DC5014',
                      fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 16,
                      padding: '14px 0', borderRadius: 12, cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.03)' }}
                    onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    Choisir {plan.name}
                  </button>
                </div>
              )
            })}
          </div>

          {/* GARANTIE */}
          <div style={{ textAlign: 'center', fontSize: 14, color: '#9B8070', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>
            🔒 Sans engagement · Résiliable à tout moment · Boutique livrée en 7 jours max
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section id="section-addons" data-animate style={{ padding: '80px 0', background: '#FDF8F3', ...animStyle('section-addons') }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>Options</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Personnalisez votre boutique</h2>
          <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>Ajoutez des options selon vos besoins réels. Sans changer de plan.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {addons.map(function(addon) {
              var isSelected = selectedAddons.includes(addon.name)
              return (
                <div key={addon.name}
                     onClick={function() { toggleAddon(addon.name) }}
                     style={{
                       background: isSelected ? 'rgba(220,80,20,0.06)' : 'white', borderRadius: 14, padding: 24,
                       border: isSelected ? '2px solid #DC5014' : '1px solid rgba(220,80,20,0.06)',
                       transition: 'all 0.2s, transform 0.2s', cursor: 'pointer', position: 'relative',
                     }}
                     onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-2px)' }}
                     onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {/* CHECKBOX custom SVG */}
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 20, height: 20, borderRadius: 5,
                    background: isSelected ? '#DC5014' : 'transparent',
                    border: isSelected ? 'none' : '2px solid #D0C8BC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{addon.icon}</div>
                  <h4 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 700, marginBottom: 6, color: isSelected ? '#DC5014' : '#2C1A0E' }}>{addon.name}</h4>
                  <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 13, color: '#5C3D1E', marginBottom: 12, lineHeight: 1.4 }}>{addon.desc}</p>
                  <div style={{ fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, color: '#F07832', fontSize: 15 }}>
                    {addon.price} <span style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 11, fontWeight: 400, color: '#9B8070' }}>{addon.type}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-outfit), sans-serif', marginTop: 6, fontSize: 11, color: '#9B8070' }}>{addon.plans}</div>
                </div>
              )
            })}

            {/* RÉCAPITULATIF FLOTTANT */}
            {selectedAddons.length > 0 && (
              <div style={{ gridColumn: '1 / -1', background: '#2C1A0E', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="nunito" style={{ color: 'white', fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
                    {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''} sélectionné{selectedAddons.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedAddons.map(function(name) {
                      return (
                        <span key={name} style={{ fontFamily: 'var(--font-outfit), sans-serif', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 12, padding: '4px 10px', borderRadius: 100 }}>
                          ✓ {name}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <button
                  onClick={function() { var el = document.getElementById('contact'); if (el) el.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ background: '#DC5014', color: 'white', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 15, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                  onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.03)' }}
                  onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  Continuer avec ces add-ons →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CHECKLIST */}
      <section id="section-checklist" data-animate style={{ padding: '80px 0', background: 'white', ...animStyle('section-checklist') }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>Préparez-vous</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Ce dont on a besoin</h2>
          <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>6 éléments simples. Aucune compétence technique.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {checklist.map(function(item) {
              return (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#FDF8F3', borderRadius: 16, padding: 20 }}>
                  <div style={{ width: 48, height: 48, background: 'rgba(220,80,20,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, fontWeight: 700 }}>{item.text}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="section-faq" data-animate style={{ padding: '80px 0', background: '#FDF8F3', ...animStyle('section-faq') }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, textAlign: 'center', fontFamily: 'var(--font-outfit), sans-serif' }}>FAQ</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 40, textAlign: 'center' }}>Questions fréquentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {faqs.map(function(faq, i) {
              var isOpen = faqOpen === i
              return (
                <div key={i} style={{ borderBottom: '1px solid #E8DDD0', background: 'white' }}>
                  <button className="faq-btn" onClick={function() { setFaqOpen(isOpen ? null : i) }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <span style={{ fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 15, color: '#2C1A0E' }}>{faq.q}</span>
                    <span style={{
                      color: '#DC5014', fontWeight: 700, fontSize: 20, marginLeft: 12, flexShrink: 0,
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}>+</span>
                  </button>
                  {isOpen && (
                    <div className="fade-in" style={{ padding: '0 20px 18px' }}>
                      <div style={{ paddingLeft: 16, borderLeft: '2px solid #DC5014' }}>
                        <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, color: '#5C3D1E', lineHeight: 1.6 }}>{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" data-animate style={{ padding: '80px 0', background: 'white', ...animStyle('contact') }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

            {/* COLONNE GAUCHE */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>Lancez-vous</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Prêt à créer votre boutique ?</h2>
              <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 16, color: '#5C3D1E', marginBottom: 24, lineHeight: 1.6 }}>
                Remplissez le formulaire. On vous contacte sur WhatsApp sous 24h pour démarrer ensemble.
              </p>
              {/* OFFRE LANCEMENT */}
              <div style={{ background: 'linear-gradient(135deg, #DC5014, #F07832)', color: 'white', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h3 className="nunito" style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>🎉 Offre de lancement</h3>
                <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 14, opacity: 0.9, marginBottom: 8 }}>1 mois offert pour les 10 premiers</p>
                <div className="nunito" style={{ fontSize: 32, fontWeight: 900, margin: '8px 0' }}>10 places disponibles</div>
                <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 14, opacity: 0.9 }}>Envoyez votre demande maintenant</p>
              </div>
              {/* CONTACT DIRECT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="mailto:contact@fortunashop.fr"
                   style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#DC5014', color: 'white', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 16, padding: '14px 24px', borderRadius: 12, textDecoration: 'none', transition: 'transform 0.2s' }}
                   onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.03)' }}
                   onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
                >
                  ✉️ contact@fortunashop.fr
                </a>
              </div>
            </div>

            {/* FORMULAIRE */}
            <div style={{ background: '#FDF8F3', borderRadius: 20, padding: 32 }}>
              {formStatus === 'success' ? (
                <div className="fade-in" style={{ background: 'rgba(76,175,80,0.1)', color: '#4CAF50', borderRadius: 12, padding: 24, textAlign: 'center', fontWeight: 700, fontSize: 16, fontFamily: 'var(--font-outfit), sans-serif' }}>
                  ✅ Demande envoyée ! On vous contacte sur WhatsApp sous 24h.
                  {notifLink && (
                    <a href={notifLink} target="_blank" rel="noopener noreferrer"
                       style={{ display: 'block', background: '#25D366', color: 'white', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 16, padding: '14px 24px', borderRadius: 12, textAlign: 'center', textDecoration: 'none', marginTop: 16 }}>
                      📱 Confirmer sur WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, color: '#2C1A0E' }}>Votre nom *</label>
                    <input name="nom" value={formData.nom} onChange={handleChange} required
                           placeholder="Ex : Aminata Koné"
                           style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E8DDD0', borderRadius: 10, fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44, transition: 'border-color 0.2s' }}
                           onFocus={function(e: any) { e.target.style.borderColor = '#DC5014' }}
                           onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, color: '#2C1A0E' }}>WhatsApp *</label>
                    <input name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} required
                           placeholder="+225 07 00 00 00 00"
                           style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E8DDD0', borderRadius: 10, fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44, transition: 'border-color 0.2s' }}
                           onFocus={function(e: any) { e.target.style.borderColor = '#DC5014' }}
                           onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
                    />
                    <div style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, color: '#9B8070', marginTop: 4 }}>Format : +225 suivi de 10 chiffres</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, color: '#2C1A0E' }}>Votre activité *</label>
                    <select name="activite" value={formData.activite} onChange={handleChange} required
                            style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E8DDD0', borderRadius: 10, fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44, transition: 'border-color 0.2s' }}
                            onFocus={function(e: any) { e.target.style.borderColor = '#DC5014' }}
                            onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
                    >
                      <option value="">Choisissez votre activité</option>
                      <option value="bijoux">Bijoux & Accessoires</option>
                      <option value="mode">Vêtements & Mode</option>
                      <option value="alimentation">Alimentation & Traiteur</option>
                      <option value="beaute">Beauté & Cosmétiques</option>
                      <option value="artisanat">Artisanat & Décoration</option>
                      <option value="high_tech">High-Tech & Électronique</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, color: '#2C1A0E' }}>Plan souhaité</label>
                    <select name="plan" value={formData.plan} onChange={handleChange}
                            style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E8DDD0', borderRadius: 10, fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44, transition: 'border-color 0.2s' }}
                            onFocus={function(e: any) { e.target.style.borderColor = '#DC5014' }}
                            onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
                    >
                      <option value="">Je ne sais pas encore</option>
                      {plans.map(function(p) {
                        return (
                          <option key={p.key} value={p.key}>
                            {p.name} — {formatPrice(p.monthly)} FCFA/mois
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 12, letterSpacing: 0.5, marginBottom: 6, color: '#2C1A0E' }}>
                      Lien Instagram ou Facebook <span style={{ color: '#9B8070', fontWeight: 400 }}>(optionnel)</span>
                    </label>
                    <input name="lien_social" type="url" value={formData.lien_social} onChange={handleChange}
                           placeholder="https://instagram.com/votre-page"
                           style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #E8DDD0', borderRadius: 10, fontFamily: 'var(--font-outfit), sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44, transition: 'border-color 0.2s' }}
                           onFocus={function(e: any) { e.target.style.borderColor = '#DC5014' }}
                           onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
                    />
                  </div>
                  {selectedAddons.length > 0 && (
                    <div style={{ background: '#FFF0E6', borderRadius: 12, padding: 16, marginBottom: 0 }}>
                      <p style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#2C1A0E' }}>
                        Add-ons sélectionnés ({selectedAddons.length})
                      </p>
                      {selectedAddons.map(function(addon) {
                        return (
                          <div key={addon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#7C6C58', marginBottom: 4, fontFamily: 'var(--font-outfit), sans-serif' }}>
                            <span>{addon}</span>
                            <button type="button" onClick={function() { toggleAddon(addon) }}
                              style={{ background: 'none', border: 'none', color: '#DC5014', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                              Retirer
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <button type="submit" disabled={formLoading}
                          style={{
                            background: '#DC5014', color: 'white',
                            fontFamily: 'var(--font-outfit), sans-serif', fontWeight: 600, fontSize: 17,
                            padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer',
                            opacity: formLoading ? 0.7 : 1, transition: 'all 0.2s',
                          }}
                          onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.03)' }}
                          onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    {formLoading ? 'Envoi...' : 'Envoyer ma demande'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8070', fontFamily: 'var(--font-outfit), sans-serif' }}>On vous répond sur WhatsApp sous 24h</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#2C1A0E', color: 'rgba(255,255,255,0.6)', padding: '40px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', color: 'white' }}>fortuna</span><span style={{ fontFamily: 'var(--font-cormorant), serif', color: '#DC5014' }}>shop</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/mentions-legales" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Mentions légales</Link>
            <Link href="/cgu" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>CGU</Link>
            <Link href="/confidentialite" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Confidentialité</Link>
            <a href="#contact" style={{ fontFamily: 'var(--font-outfit), sans-serif', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Contact</a>
          </div>
          <div style={{ fontFamily: 'var(--font-outfit), sans-serif', fontSize: 14 }}>© 2026 fortunashop — Créons la boutique en ligne que vos clients méritent.</div>
        </div>
      </footer>

    </div>
  )
}
