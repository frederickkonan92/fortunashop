'use client'

import { useState, useEffect } from 'react'

var STORAGE_KEY = 'fortunashop-collecte-checks'
var WA_NUMBER = '33664765696'
var WA_LINK = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Bonjour fortunashop, je voudrais créer ma boutique en ligne !')

var totalItems = 14

function CheckItem({ id, label, hint, checks, toggleCheck }: {
  id: string; label: string; hint?: string
  checks: Record<string, boolean>; toggleCheck: (id: string) => void
}) {
  var isChecked = checks[id] || false
  return (
    <li
      onClick={function() { toggleCheck(id) }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 0', borderBottom: '1px solid #E8DDD0',
        fontSize: 13, color: '#2C1A0E', cursor: 'pointer',
        userSelect: 'none',
        opacity: isChecked ? 0.6 : 1,
        transition: 'opacity 0.2s',
        listStyle: 'none',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 6,
        border: isChecked ? 'none' : '2px solid #DC5014',
        background: isChecked ? '#DC5014' : 'transparent',
        flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}>
        {isChecked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ textDecoration: isChecked ? 'line-through' : 'none' }}>
          {label}
        </span>
        {hint && (
          <span style={{ fontSize: 11, color: '#7C6C58', display: 'block', marginTop: 2 }}>
            {hint}
          </span>
        )}
      </div>
    </li>
  )
}

function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, border: '1px solid #E8DDD0',
      padding: '28px 20px 20px', marginBottom: 20, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: -12, left: 20,
        width: 32, height: 32, borderRadius: '50%', background: '#DC5014',
        color: 'white', fontSize: 15, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {number}
      </div>
      <h2 style={{
        fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 17,
        color: '#2C1A0E', margin: '0 0 16px 0',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

export default function CollecteContent() {
  var [checks, setChecks] = useState<Record<string, boolean>>({})
  var [loaded, setLoaded] = useState(false)

  useEffect(function() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setChecks(JSON.parse(saved))
      }
    } catch (e) {}
    setLoaded(true)
  }, [])

  useEffect(function() {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks))
    } catch (e) {}
  }, [checks, loaded])

  var toggleCheck = function(id: string) {
    setChecks(function(prev) {
      var next = { ...prev }
      next[id] = !prev[id]
      return next
    })
  }

  var checkedCount = Object.values(checks).filter(Boolean).length
  var progressPercent = Math.round((checkedCount / totalItems) * 100)

  return (
    <div style={{ minHeight: '100vh', background: '#FDF8F3' }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #DC5014, #F07832)',
        padding: '40px 20px 36px', textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 900, fontSize: 22,
          color: 'white', margin: '0 0 8px 0', lineHeight: 1.3,
        }}>
          Ce dont j'ai besoin pour créer ta boutique
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
          Tout par WhatsApp, à ton rythme
        </p>
      </div>

      {/* CONTENU */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* INTRO */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #E8DDD0',
          padding: 20, marginBottom: 24, textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#2C1A0E', lineHeight: 1.6, margin: 0 }}>
            Pour te livrer ta boutique en 7 jours, j'ai besoin de quelques infos.
            Pas de stress — envoie tout en plusieurs fois sur WhatsApp.
          </p>
        </div>

        {/* BARRE DE PROGRESSION */}
        <div style={{
          background: 'white', border: '1.5px solid #E8DDD0',
          borderRadius: 16, padding: '16px 20px', marginBottom: 16,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2C1A0E' }}>
              Ta progression
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#DC5014' }}>
              {checkedCount}/{totalItems}
            </span>
          </div>
          <div style={{
            width: '100%', height: 8, background: '#E8DDD0',
            borderRadius: 4, overflow: 'hidden',
          }}>
            <div style={{
              width: progressPercent + '%', height: '100%',
              background: checkedCount === totalItems ? '#2A7A50' : '#DC5014',
              borderRadius: 4, transition: 'width 0.3s, background 0.3s',
            }} />
          </div>
          {checkedCount === totalItems && (
            <p style={{
              fontSize: 13, color: '#2A7A50', fontWeight: 700,
              marginTop: 8, textAlign: 'center',
            }}>
              Tout est prêt ! Envoie-moi tout sur WhatsApp
            </p>
          )}
        </div>

        {/* ÉTAPE 1 — TA MARQUE */}
        <StepCard number={1} title="Ta marque">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <CheckItem id="marque-nom" label="Nom de ta boutique" hint="Le nom affiché sur ton site" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="marque-logo" label="Ton logo" hint="Envoie-le en photo. Pas obligatoire" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="marque-description" label="Description de ton activité" hint='1-2 phrases. Ex : "Bijoux artisanaux en or et cauris"' checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="marque-couleurs" label="Tes couleurs préférées" hint="Dis-moi 2 couleurs ou envoie un exemple de site que tu aimes" checks={checks} toggleCheck={toggleCheck} />
          </ul>
        </StepCard>

        {/* ÉTAPE 2 — TES PRODUITS */}
        <StepCard number={2} title="Tes produits">

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
            <CheckItem id="produits-catalogue" label="Catalogue produits (photos + noms + prix)" hint="Envoie par WhatsApp ou via le tableau" checks={checks} toggleCheck={toggleCheck} />
          </ul>

          {/* Méthode A */}
          <div style={{
            background: 'white', borderRadius: 12, border: '1px solid #E8DDD0',
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 10,
                background: '#E6F5EE', color: '#2A7A50', fontSize: 11, fontWeight: 700,
              }}>
                Moins de 15 produits
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: '0 0 10px 0' }}>
              Par WhatsApp directement
            </p>
            <div style={{
              background: '#FFF5EE', borderRadius: 10, padding: 14,
              fontSize: 13, color: '#5C4A3A', lineHeight: 1.7,
            }}>
              <strong>Nom :</strong> Collier cauris doré<br />
              <strong>Prix :</strong> 15 000 FCFA<br />
              <strong>Catégorie :</strong> bijoux<br />
              <strong>Tailles :</strong> taille unique<br />
              + la photo
            </div>
          </div>

          {/* Méthode B */}
          <div style={{
            background: 'white', borderRadius: 12, border: '2px solid #DC5014',
            padding: 16, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 10,
                background: '#FEF3C7', color: '#D97706', fontSize: 11, fontWeight: 700,
              }}>
                15 produits et plus — recommandée
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: '0 0 10px 0' }}>
              Remplis le tableau que je t'envoie
            </p>
            <div style={{
              background: '#FFF5EE', borderRadius: 10, padding: 14,
              fontSize: 12, color: '#5C4A3A', lineHeight: 1.8,
            }}>
              <strong>Colonne 1</strong> — Numéro du produit<br />
              <strong>Colonne 2</strong> — Nom du produit<br />
              <strong>Colonne 3</strong> — Prix en FCFA<br />
              <strong>Colonne 4</strong> — Catégorie (bijoux, sacs, homme, femme...)<br />
              <strong>Colonne 5</strong> — Tailles ou couleurs disponibles<br />
              <strong>Colonne 6</strong> — Description courte (optionnel)<br />
              <strong>Colonne 7</strong> — Stock (optionnel)
            </div>
            <p style={{ fontSize: 13, color: '#5C4A3A', margin: '12px 0 0 0', lineHeight: 1.5 }}>
              Le tableau contient déjà 2 exemples pour te guider. Demande-moi le lien sur WhatsApp !
            </p>
          </div>

          {/* Photos */}
          <div style={{
            background: '#FDF8F3', borderRadius: 12, border: '1px solid #E8DDD0',
            padding: 16,
          }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: '0 0 10px 0' }}>
              Ensuite, envoie les photos
            </p>
            <div style={{ fontSize: 13, color: '#5C4A3A', lineHeight: 1.7 }}>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>Photo 1</strong> — une photo par produit (la plus belle)
              </p>
              <p style={{ margin: 0 }}>
                <strong>Photos 2 à 5</strong> — envoie-les d'affilée, je fais le tri
              </p>
            </div>
          </div>

        </StepCard>

        {/* ÉTAPE 3 — TES MOYENS DE PAIEMENT */}
        <StepCard number={3} title="Tes moyens de paiement">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <CheckItem id="paiement-wave" label="Numéro Wave" hint="Celui sur lequel tes clients t'envoient l'argent" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="paiement-orange" label="Numéro Orange Money" hint="Optionnel" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="paiement-mtn" label="Numéro MTN MoMo" hint="Optionnel" checks={checks} toggleCheck={toggleCheck} />
          </ul>
        </StepCard>

        {/* ÉTAPE 4 — LA LIVRAISON */}
        <StepCard number={4} title="La livraison">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <CheckItem id="livraison-domicile" label="Tu livres à domicile ?" hint="Oui / Non / Seulement dans certaines zones" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="livraison-retrait" label="Retrait possible ?" hint="Si oui, donne l'adresse" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="livraison-livreur" label="Nom et numéro de ton livreur" hint="Si tu en as un" checks={checks} toggleCheck={toggleCheck} />
          </ul>
        </StepCard>

        {/* ÉTAPE 5 — TES RÉSEAUX SOCIAUX */}
        <StepCard number={5} title="Tes réseaux sociaux">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <CheckItem id="social-instagram" label="Ton Instagram" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="social-whatsapp" label="Ton WhatsApp public" checks={checks} toggleCheck={toggleCheck} />
            <CheckItem id="social-facebook" label="Ta page Facebook" hint="Optionnel" checks={checks} toggleCheck={toggleCheck} />
          </ul>
        </StepCard>

        {/* ASTUCES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <div style={{
            background: '#E6F5EE', borderRadius: 14, padding: 16,
            border: '1px solid #B8E0D0',
          }}>
            <p style={{ fontSize: 13, color: '#1A5C38', margin: 0, lineHeight: 1.5 }}>
              <strong>Astuce</strong> — Commence par tes 10 best-sellers. Pas besoin d'envoyer 60 produits d'un coup.
            </p>
          </div>
          <div style={{
            background: '#E6F5EE', borderRadius: 14, padding: 16,
            border: '1px solid #B8E0D0',
          }}>
            <p style={{ fontSize: 13, color: '#1A5C38', margin: 0, lineHeight: 1.5 }}>
              <strong>Astuce</strong> — Photos : fond clair, bonne lumière. Une bonne photo = plus de ventes.
            </p>
          </div>
        </div>

        {/* BOUTON WHATSAPP */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', width: '100%', padding: '16px 20px',
            background: '#25D366', color: 'white', textAlign: 'center',
            borderRadius: 14, fontSize: 15, fontWeight: 700,
            textDecoration: 'none', marginBottom: 24,
          }}
        >
          M'envoyer mes infos par WhatsApp
        </a>

        {/* RECOMMENCER */}
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={function() {
              setChecks({})
              try { localStorage.removeItem(STORAGE_KEY) } catch (e) {}
            }}
            style={{
              display: 'block', margin: '16px auto 0', background: 'none',
              border: 'none', color: '#7C6C58', fontSize: 12,
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Recommencer la checklist
          </button>
        )}

        {/* FOOTER */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#7C6C58', marginTop: 24 }}>
          fortunashop — Ta boutique en ligne en 7 jours
        </p>
      </div>
    </div>
  )
}
