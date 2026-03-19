'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  var [faqOpen, setFaqOpen] = useState<number | null>(null)
  var [isAnnual, setIsAnnual] = useState(false)
  var [formData, setFormData] = useState({ nom: '', whatsapp: '', activite: '', plan: '', lien_social: '' })
  var [selectedAddons, setSelectedAddons] = useState<string[]>([])

  var toggleAddon = function(addonName: string) {
    setSelectedAddons(function(prev) {
      if (prev.includes(addonName)) return prev.filter(function(a) { return a !== addonName })
      return [...prev, addonName]
    })
  }

  var scrollToContact = function(planName: string) {
    setFormData(function(prev) { return { ...prev, plan: planName.toLowerCase() } })
    var el = document.getElementById('contact')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
  var [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle')
  var [formLoading, setFormLoading] = useState(false)
  var whatsappBase = 'https://wa.me/33664765696'
  var demoUrl = '/boutique/boutique-test'

  var plans = [
    {
      name: 'Starter',
      monthly: 35000,
      annual: 29167,
      savingsYear: 70000,
      badge: '',
      featured: false,
      features: [
        'Boutique en ligne en 7 jours',
        "Jusqu'à 20 produits",
        'Paiement Wave intégré',
        '3 options de livraison',
        'Notification WhatsApp 1 livreur',
        'Suivi commande client',
        '10 modifications catalogue/mois',
        "Nom de domaine + hébergement inclus",
        '1h de formation incluse',
        'Support WhatsApp 48h',
      ]
    },
    {
      name: 'Pro',
      monthly: 55000,
      annual: 45833,
      savingsYear: 110000,
      badge: '⭐ Le plus choisi',
      featured: true,
      features: [
        'Tout le plan Starter +',
        "Jusqu'à 50 produits",
        'Wave + Orange Money + MTN MoMo',
        '3 livreurs notifiés via WhatsApp',
        '25 modifications catalogue/mois',
        'Dashboard ventes + analytics',
        'Lien confirmation livreur',
        'Gestion des stocks automatisée',
        "Système d'avis clients",
        '2h de formation incluse',
        'Support WhatsApp prioritaire 24h',
      ]
    },
    {
      name: 'Premium',
      monthly: 85000,
      annual: 70833,
      savingsYear: 170000,
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
      ]
    }
  ]

  var addons = [
    { icon: '🔗', name: 'Lien livraison livreur', desc: 'Votre livreur confirme la livraison en 1 clic depuis WhatsApp. Client notifié en temps réel.', price: '10 000 FCFA', type: '/mois', plans: 'Starter' },
    { icon: '📋', name: 'Pack Pilotage — Dashboard', desc: 'CA en temps réel, top produits, panier moyen, export CSV. Pilotez votre business comme un pro.', price: '15 000 FCFA', type: '/mois', plans: 'Starter' },
    { icon: '📈', name: 'Gestion des stocks', desc: 'Alertes stock bas, désactivation auto des produits épuisés, historique et stock tampon physique.', price: '10 000 FCFA', type: '/mois', plans: 'Starter · Pro' },
    { icon: '📦', name: 'Bundle Stocks + Dashboard', desc: 'Gérez vos stocks et pilotez votre business efficacement. Les deux outils réunis à prix réduit.', price: '20 000 FCFA', type: '/mois', plans: 'Starter' },
    { icon: '💳', name: 'Mobile Money complet', desc: 'Orange Money, MTN MoMo & Moov via CinetPay. Accès immédiat à tous les paiements mobile CI.', price: '75 000 FCFA', type: 'setup unique', plans: 'Starter' },
    { icon: '🌍', name: 'CB internationale Stripe', desc: 'Visa & Mastercard pour la diaspora et clients internationaux. Inclut accompagnement KYC.', price: '90 000 FCFA', type: 'setup unique', plans: 'Starter · Pro' },
    { icon: '📊', name: 'Rapport + recommandations IA', desc: 'Rapport mensuel des KPI business et recommandations stratégiques pour améliorer votre pilotage.', price: '10 000 FCFA', type: '/mois', plans: 'Starter · Pro' },
    { icon: '🚗', name: 'Intégration Yango/Uber', desc: 'Dispatch automatique du livreur. Suivi temps réel pour vous et votre client.', price: '75 000 + 10 000 FCFA', type: 'setup + /mois', plans: 'Tous plans' },
    { icon: '🛒', name: 'Produit supplémentaire', desc: 'Ajout d\'un produit hors forfait. Idéal pour les catalogues en croissance.', price: '10 000 FCFA', type: '/produit', plans: 'Starter · Pro' },
    { icon: '🌐', name: 'Multilingue', desc: 'Site en Français + Anglais. Idéal pour toucher la diaspora internationale.', price: '20 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
    { icon: '🎓', name: 'Formation extra', desc: 'Accompagnement personnalisé en présentiel ou visio pour maîtriser votre boutique.', price: '10 000 FCFA', type: '/heure', plans: 'Tous plans' },
    { icon: '⭐', name: "Système d'avis clients", desc: "Avis vérifiés sur chaque produit. Augmente la confiance et la conversion.", price: '20 000 FCFA', type: 'setup unique', plans: 'Starter' },
    { icon: '🏷️', name: 'Codes promo & réductions', desc: 'Créez des codes promo pour fidéliser et relancer vos clients.', price: '20 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
    { icon: '🔔', name: 'Relance panier abandonné', desc: "Message WhatsApp auto aux clients qui n'ont pas finalisé leur commande.", price: '35 000 FCFA', type: 'setup unique', plans: 'Starter · Pro' },
    { icon: '🎯', name: 'Bannière promo dynamique', desc: 'Bandeau personnalisable en haut de boutique avec offre spéciale ou compte à rebours.', price: '15 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
    { icon: '🚀', name: 'Kit Migration communauté', desc: 'Message WhatsApp, visuels Instagram, bios optimisées, script de lancement, 1h coaching.', price: '25 000 FCFA', type: 'setup unique', plans: 'Tous plans' },
  ]

  var faqs = [
    { q: 'Combien de temps pour avoir ma boutique ?', a: 'Votre boutique est livrée en 7 jours maximum après réception de votre catalogue et logo.' },
    { q: 'Est-ce que je dois savoir coder ?', a: "Non. Vous nous envoyez vos photos et prix via WhatsApp. On s'occupe de tout." },
    { q: 'Quels modes de paiement sont acceptés ?', a: 'Wave est inclus dans tous les plans. Orange Money et MTN MoMo sont disponibles en add-on CinetPay. La carte bancaire est disponible avec Stripe (plan Premium).' },
    { q: 'Puis-je modifier mon catalogue moi-même ?', a: "Oui, depuis votre espace admin. Le nombre de modifications mensuelles dépend de votre plan (10 pour Starter, 25 pour Pro, illimité pour Premium)." },
    { q: 'La livraison est-elle incluse ?', a: 'Nous intégrons votre livreur existant. Nous pouvons également vous mettre en relation avec nos partenaires livreurs à Abidjan.' },
    { q: 'Puis-je changer de plan ?', a: 'Oui, à tout moment. Contactez-nous sur WhatsApp et nous gérons la migration sans interruption de service.' },
    { q: 'La boutique fonctionne-t-elle sur mobile ?', a: 'Oui, votre boutique est 100% optimisée pour mobile. Vos clients commandent depuis leur téléphone en quelques clics.' },
    { q: 'Est-ce que mes clients de la diaspora peuvent commander ?', a: 'Oui. Avec le plan Premium et Stripe, vos clients en France, Belgique, Canada peuvent payer par carte bancaire internationale.' },
  ]

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
    setFormStatus('success')
    setFormLoading(false)
    setTimeout(function() {
      window.open('https://wa.me/33664765696?text=' + waMsg, '_blank')
    }, 500)
  }

  var formatPrice = function(price: number) {
    return price.toLocaleString('fr-FR')
  }

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Lato', sans-serif", backgroundColor: '#FDF8F3', color: '#2C1A0E' }}>

      {/* GOOGLE FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Lato:wght@300;400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .nunito { font-family: 'Nunito', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .pulse { animation: pulse 2s infinite; }
        .fade-in { animation: fadeIn 0.3s ease; }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(220,80,20,0.18); }
        .btn-wa:hover { background: #1DA851 !important; }
        .plan-featured { background: linear-gradient(135deg, #DC5014, #F07832) !important; color: white !important; transform: scale(1.04); box-shadow: 0 16px 48px rgba(220,80,20,0.28); }
        .nav-link:hover { color: #DC5014; }
        .addon-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(220,80,20,0.10); }
        .faq-btn:hover { background: #FAF0E6; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(253,248,243,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(220,80,20,0.08)', padding: '10px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className="nunito" style={{ fontSize: 24, fontWeight: 900, color: '#DC5014' }}>fortunashop</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <a href="#pricing" className="nav-link" style={{ fontSize: 14, fontWeight: 700, color: '#5C3D1E', textDecoration: 'none', display: 'none' }}>Tarifs</a>
            <a href="#contact" className="nav-link" style={{ fontSize: 14, fontWeight: 700, color: '#5C3D1E', textDecoration: 'none' }}>Contact</a>
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 100, padding: '8px 20px', fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            <span className="pulse" style={{ width: 8, height: 8, background: '#4CAF50', borderRadius: '50%', display: 'inline-block' }} />
            Disponible · Côte d'Ivoire
          </div>
          <h1 className="nunito" style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, maxWidth: 650 }}>
            Votre boutique professionnelle<br />prête en 7 jours
          </h1>
          <p style={{ fontSize: 18, opacity: 0.9, maxWidth: 550, marginBottom: 12, lineHeight: 1.6 }}>
            Acceptez les commandes, gérez vos stocks et encaissez via Wave, Orange Money et MTN MoMo.
          </p>
          <p className="nunito" style={{ fontSize: 18, fontWeight: 800, marginBottom: 32 }}>
            Communiquez-nous votre catalogue. On construit votre boutique.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
            <a href="#contact"
               style={{ background: 'white', color: '#DC5014', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, padding: '16px 36px', borderRadius: 12, textDecoration: 'none', transition: 'all 0.2s' }}>
              Je veux ma boutique
            </a>
            <Link href={demoUrl} target="_blank"
               style={{ background: 'transparent', color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, padding: '16px 36px', borderRadius: 12, border: '2px solid rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              Voir une boutique démo
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            {[['7j max', 'Pour livrer votre boutique'], ['0', 'Compétence technique requise'], ['3 plans', 'Adaptés à votre activité']].map(function([val, label]) {
              return (
                <div key={val} style={{ textAlign: 'center' }}>
                  <div className="nunito" style={{ fontSize: 28, fontWeight: 900 }}>{val}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PROBLÈMES */}
      <section style={{ padding: '80px 0', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8 }}>Le problème</div>
          <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Vous perdez des ventes chaque jour</h2>
          <p style={{ fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>Ce n'est pas votre produit le problème. C'est votre canal de vente.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: '💬', title: '100 DMs par jour', desc: 'Vous passez vos journées à répondre aux mêmes questions sur WhatsApp et Instagram. Prix ? Dispo ? Livraison ?' },
              { icon: '🌙', title: 'Ventes perdues la nuit', desc: "Quand vous dormez, vos clients ne peuvent pas commander. Résultat : ils achètent ailleurs." },
              { icon: '🚚', title: 'Livraisons chaotiques', desc: 'Coordonner client + livreur sur WhatsApp = erreurs, retards et clients mécontents.' },
            ].map(function(p) {
              return (
                <div key={p.title} style={{ background: '#FDF8F3', borderRadius: 16, padding: '32px 24px', textAlign: 'center', border: '1px solid rgba(220,80,20,0.06)' }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{p.icon}</div>
                  <h3 className="nunito" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{p.title}</h3>
                  <p style={{ fontSize: 15, color: '#5C3D1E', lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{ padding: '80px 0', background: '#FDF8F3' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8 }}>Comment ça marche</div>
          <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>3 étapes simples pour lancer votre boutique</h2>
          <p style={{ fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>Pas besoin de savoir coder. On s'occupe de tout.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { num: '1', title: 'Envoyez vos infos', desc: 'Photos produits, prix, logo — envoyez tout directement depuis votre téléphone.', tag: '📱 Via WhatsApp' },
              { num: '2', title: 'On crée votre boutique', desc: 'En 7 jours max, votre boutique est en ligne avec un lien unique à partager partout.', tag: '🔗 Votre lien personnalisé' },
              { num: '3', title: 'Vous vendez, on gère le reste', desc: 'Commandes, notifications livreur, paiement Wave intégré. Concentrez-vous sur vos créations.', tag: '💰 Paiement Wave inclus' },
            ].map(function(s) {
              return (
                <div key={s.num} className="hover-lift" style={{ background: 'white', borderRadius: 16, padding: '32px 24px', boxShadow: '0 8px 32px rgba(220,80,20,0.08)' }}>
                  <div className="nunito" style={{ width: 48, height: 48, background: '#DC5014', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, marginBottom: 20 }}>{s.num}</div>
                  <h3 className="nunito" style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 15, color: '#5C3D1E', lineHeight: 1.5, marginBottom: 12 }}>{s.desc}</p>
                  <span style={{ background: 'rgba(220,80,20,0.08)', color: '#DC5014', fontWeight: 700, padding: '4px 10px', borderRadius: 8, fontSize: 13 }}>{s.tag}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 0', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, textAlign: 'center' }}>Tarifs</div>
          <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Choisissez votre plan</h2>
          <p style={{ fontSize: 17, color: '#5C3D1E', marginBottom: 40, textAlign: 'center' }}>Setup unique + abonnement mensuel. Sans engagement.</p>

          {/* TOGGLE */}
          {/* SETUP UNIQUE */}
          <div style={{ background: '#2C1A0E', borderRadius: 16, padding: '20px 32px', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 20 }}>
                🔧 Setup unique : <span style={{ color: '#F0B43C' }}>100 000 FCFA</span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
                Frais de création de votre boutique — payé une seule fois · Indépendant du plan choisi
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 20px', color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' }}>
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
            <span style={{ background: '#F0B43C', color: '#2C1A0E', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }}>2 mois offerts</span>
          </div>

          {/* PLANS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start', marginBottom: 40 }}>
            {plans.map(function(plan) {
              var price = isAnnual ? plan.annual : plan.monthly
              return (
                <div key={plan.name} className={plan.featured ? 'plan-featured' : 'hover-lift'}
                     style={{ borderRadius: 20, padding: '32px 24px', position: 'relative', border: plan.featured ? 'none' : '2px solid transparent', background: plan.featured ? '' : '#FDF8F3', transition: 'transform 0.2s' }}>
                  {plan.badge && (
                    <div className="nunito" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.featured ? 'white' : '#F0B43C', color: plan.featured ? '#DC5014' : '#2C1A0E', fontSize: 12, fontWeight: 800, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="nunito" style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, color: plan.featured ? 'white' : '#2C1A0E' }}>{plan.name}</div>
                  <div style={{ marginBottom: 4 }}>
                    <span className="nunito" style={{ fontSize: 13, color: plan.featured ? 'rgba(255,255,255,0.9)' : '#DC5014', verticalAlign: 'super' }}>FCFA </span>
                    <span className="nunito" style={{ fontSize: 36, fontWeight: 900, color: plan.featured ? 'white' : '#DC5014' }}>{formatPrice(price)}</span>
                    <span style={{ fontSize: 14, opacity: 0.7, color: plan.featured ? 'white' : '#2C1A0E' }}>/mois</span>
                  </div>
                  {isAnnual && (
                    <div style={{ background: plan.featured ? 'rgba(255,255,255,0.2)' : 'rgba(76,175,80,0.1)', color: plan.featured ? 'white' : '#4CAF50', fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 8, marginBottom: 12, display: 'inline-block' }}>
                      Économie : {formatPrice(plan.savingsYear)} FCFA/an
                    </div>
                  )}
                  <ul style={{ listStyle: 'none', marginBottom: 24 }}>
                    {plan.features.map(function(f, i) {
                      return (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', fontSize: 14, lineHeight: 1.4 }}>
                          <span style={{ color: plan.featured ? 'rgba(255,255,255,0.9)' : '#DC5014', flexShrink: 0, marginTop: 2 }}>✓</span>
                          <span style={{ color: plan.featured ? 'rgba(255,255,255,0.9)' : '#5C3D1E' }}>{f}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <button
                    onClick={function() { scrollToContact(plan.name) }}
                    style={{ display: 'block', width: '100%', textAlign: 'center', background: plan.featured ? 'white' : '#DC5014', color: plan.featured ? '#DC5014' : 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                    Choisir {plan.name}
                  </button>
                </div>
              )
            })}
          </div>

          {/* GARANTIE */}
          <div style={{ textAlign: 'center', fontSize: 14, color: '#9B8070', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            🔒 Sans engagement · Résiliable à tout moment · Boutique livrée en 7 jours max
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section style={{ padding: '80px 0', background: '#FDF8F3' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8 }}>Options</div>
          <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Personnalisez votre boutique</h2>
          <p style={{ fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>Ajoutez des options selon vos besoins réels. Sans changer de plan.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {addons.map(function(addon) {
              var isSelected = selectedAddons.includes(addon.name)
              return (
                <div key={addon.name}
                     onClick={function() { toggleAddon(addon.name) }}
                     style={{ background: isSelected ? 'rgba(220,80,20,0.06)' : 'white', borderRadius: 16, padding: 24, border: isSelected ? '2px solid #DC5014' : '1px solid rgba(220,80,20,0.06)', transition: 'all 0.2s', cursor: 'pointer', position: 'relative' }}>
                  {/* CHECKBOX en haut à droite */}
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 8, border: isSelected ? '2px solid #DC5014' : '2px solid #ccc', background: isSelected ? '#DC5014' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {isSelected && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{addon.icon}</div>
                  <h4 className="nunito" style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, color: isSelected ? '#DC5014' : '#2C1A0E' }}>{addon.name}</h4>
                  <p style={{ fontSize: 13, color: '#5C3D1E', marginBottom: 12, lineHeight: 1.4 }}>{addon.desc}</p>
                  <div className="nunito" style={{ fontWeight: 800, color: '#DC5014', fontSize: 15 }}>
                    {addon.price} <span style={{ fontSize: 11, fontWeight: 400, color: '#9B8070' }}>{addon.type}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9B8070' }}>{addon.plans}</div>
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
                        <span key={name} style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 12, padding: '4px 10px', borderRadius: 100 }}>
                          ✓ {name}
                        </span>
                      )
                    })}
                  </div>
                </div>
                <button
                  onClick={function() { var el = document.getElementById('contact'); if (el) el.scrollIntoView({ behavior: 'smooth' }) }}
                  style={{ background: '#DC5014', color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 15, padding: '12px 24px', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
                  Continuer avec ces add-ons →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CHECKLIST */}
      <section style={{ padding: '80px 0', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8 }}>Préparez-vous</div>
          <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Ce dont on a besoin</h2>
          <p style={{ fontSize: 17, color: '#5C3D1E', marginBottom: 40 }}>6 éléments simples. Aucune compétence technique.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: '🏪', text: 'Nom de boutique + slogan' },
              { icon: '📸', text: 'Photos de vos produits' },
              { icon: '💰', text: 'Prix en FCFA' },
              { icon: '🎨', text: 'Votre logo (si vous en avez un)' },
              { icon: '📍', text: 'Adresse + zones de livraison' },
              { icon: '📱', text: 'Numéro WhatsApp du livreur' },
            ].map(function(item) {
              return (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#FDF8F3', borderRadius: 16, padding: 20 }}>
                  <div style={{ width: 48, height: 48, background: 'rgba(220,80,20,0.08)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{item.text}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 0', background: '#FDF8F3' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8, textAlign: 'center' }}>FAQ</div>
          <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 40, textAlign: 'center' }}>Questions fréquentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map(function(faq, i) {
              return (
                <div key={i} style={{ border: '1px solid rgba(220,80,20,0.12)', borderRadius: 16, overflow: 'hidden', background: 'white' }}>
                  <button className="faq-btn" onClick={function() { setFaqOpen(faqOpen === i ? null : i) }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <span className="nunito" style={{ fontWeight: 800, fontSize: 15, color: '#2C1A0E' }}>{faq.q}</span>
                    <span style={{ color: '#DC5014', fontWeight: 700, fontSize: 20, marginLeft: 12, flexShrink: 0 }}>{faqOpen === i ? '−' : '+'}</span>
                  </button>
                  {faqOpen === i && (
                    <div className="fade-in" style={{ padding: '0 20px 18px' }}>
                      <p style={{ fontSize: 15, color: '#5C3D1E', lineHeight: 1.6 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '80px 0', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'start' }}>

            {/* COLONNE GAUCHE */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#DC5014', marginBottom: 8 }}>Lancez-vous</div>
              <h2 className="nunito" style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Prêt à créer votre boutique ?</h2>
              <p style={{ fontSize: 16, color: '#5C3D1E', marginBottom: 24, lineHeight: 1.6 }}>
                Remplissez le formulaire. On vous contacte sur WhatsApp sous 24h pour démarrer ensemble.
              </p>
              {/* OFFRE LANCEMENT */}
              <div style={{ background: 'linear-gradient(135deg, #DC5014, #F07832)', color: 'white', borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <h3 className="nunito" style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>🎉 Offre de lancement</h3>
                <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>1 mois offert pour les 10 premiers</p>
                <div className="nunito" style={{ fontSize: 32, fontWeight: 900, margin: '8px 0' }}>10 places disponibles</div>
                <p style={{ fontSize: 14, opacity: 0.9 }}>Envoyez votre demande maintenant</p>
              </div>
              {/* CONTACT DIRECT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="mailto:contact@fortunashop.fr"
                   style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#DC5014', color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 16, padding: '14px 24px', borderRadius: 12, textDecoration: 'none' }}>
                  ✉️ contact@fortunashop.fr
                </a>
              </div>
            </div>

            {/* FORMULAIRE */}
            <div style={{ background: '#FDF8F3', borderRadius: 20, padding: 32 }}>
              {formStatus === 'success' ? (
                <div className="fade-in" style={{ background: 'rgba(76,175,80,0.1)', color: '#4CAF50', borderRadius: 12, padding: 24, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
                  ✅ Demande envoyée ! On vous contacte sur WhatsApp sous 24h.
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label className="nunito" style={{ display: 'block', fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#2C1A0E' }}>Votre nom *</label>
                    <input name="nom" value={formData.nom} onChange={handleChange} required
                           placeholder="Ex : Aminata Koné"
                           style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(220,80,20,0.12)', borderRadius: 10, fontFamily: 'Lato, sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44 }} />
                  </div>
                  <div>
                    <label className="nunito" style={{ display: 'block', fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#2C1A0E' }}>WhatsApp *</label>
                    <input name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} required
                           placeholder="+225 07 00 00 00 00"
                           style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(220,80,20,0.12)', borderRadius: 10, fontFamily: 'Lato, sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44 }} />
                    <div style={{ fontSize: 12, color: '#9B8070', marginTop: 4 }}>Format : +225 suivi de 10 chiffres</div>
                  </div>
                  <div>
                    <label className="nunito" style={{ display: 'block', fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#2C1A0E' }}>Votre activité *</label>
                    <select name="activite" value={formData.activite} onChange={handleChange} required
                            style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(220,80,20,0.12)', borderRadius: 10, fontFamily: 'Lato, sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44 }}>
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
                    <label className="nunito" style={{ display: 'block', fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#2C1A0E' }}>Plan souhaité</label>
                    <select name="plan" value={formData.plan} onChange={handleChange}
                            style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(220,80,20,0.12)', borderRadius: 10, fontFamily: 'Lato, sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44 }}>
                      <option value="">Je ne sais pas encore</option>
                      <option value="starter">Starter — 35 000 FCFA/mois</option>
                      <option value="pro">Pro — 55 000 FCFA/mois</option>
                      <option value="premium">Premium — 85 000 FCFA/mois</option>
                    </select>
                  </div>
                  <div>
                    <label className="nunito" style={{ display: 'block', fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#2C1A0E' }}>
                      Lien Instagram ou Facebook <span style={{ color: '#9B8070', fontWeight: 400 }}>(optionnel)</span>
                    </label>
                    <input name="lien_social" type="url" value={formData.lien_social} onChange={handleChange}
                           placeholder="https://instagram.com/votre-page"
                           style={{ width: '100%', padding: '12px 16px', border: '2px solid rgba(220,80,20,0.12)', borderRadius: 10, fontFamily: 'Lato, sans-serif', fontSize: 15, background: 'white', color: '#2C1A0E', outline: 'none', minHeight: 44 }} />
                  </div>
                  <button type="submit" disabled={formLoading}
                          style={{ background: '#DC5014', color: 'white', fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17, padding: 16, borderRadius: 12, border: 'none', cursor: 'pointer', opacity: formLoading ? 0.7 : 1, transition: 'all 0.2s' }}>
                    {formLoading ? 'Envoi...' : 'Envoyer ma demande'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8070' }}>On vous répond sur WhatsApp sous 24h</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#2C1A0E', color: 'rgba(255,255,255,0.6)', padding: '40px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div className="nunito" style={{ fontSize: 24, fontWeight: 900 }}>
            <span style={{ color: 'white' }}>fortuna</span><span style={{ color: '#DC5014' }}>shop</span>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/mentions-legales" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Mentions légales</Link>
            <Link href="/cgu" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>CGU</Link>
            <Link href="/confidentialite" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Confidentialité</Link>
            <a href="#contact" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Contact</a>
          </div>
          <div style={{ fontSize: 14 }}>© 2026 fortunashop — Créons la boutique en ligne que vos clients méritent.</div>
        </div>
      </footer>

    </div>
  )
}
