import { Metadata } from 'next'

export var metadata: Metadata = {
  title: "fortunashop — Ce dont j'ai besoin pour créer ta boutique",
  description: "Guide simple pour préparer la création de ta boutique en ligne fortunashop.",
  robots: 'noindex',
}

var WA_NUMBER = '33664765696'
var WA_LINK = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Bonjour fortunashop, je voudrais créer ma boutique en ligne !')

function CheckItem({ text, hint }: { text: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, border: '2px solid #DC5014',
        flexShrink: 0, marginTop: 2,
      }} />
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', margin: 0 }}>{text}</p>
        {hint && (
          <p style={{ fontSize: 11, color: '#7C6C58', margin: '3px 0 0 0' }}>{hint}</p>
        )}
      </div>
    </div>
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

export default function CollectePage() {
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

        {/* ÉTAPE 1 — TA MARQUE */}
        <StepCard number={1} title="Ta marque">
          <CheckItem text="Nom de ta boutique" hint="Le nom affiche sur ton site" />
          <CheckItem text="Ton logo" hint="Envoie-le en photo. Pas obligatoire" />
          <CheckItem text="Description de ton activité" hint='1-2 phrases. Ex : "Bijoux artisanaux en or et cauris"' />
          <CheckItem text="Tes couleurs préférées" hint="Dis-moi 2 couleurs ou envoie un exemple de site que tu aimes" />
        </StepCard>

        {/* ÉTAPE 2 — TES PRODUITS */}
        <StepCard number={2} title="Tes produits">

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
                15 produits et plus — recommande
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
          <CheckItem text="Numéro Wave" hint="Celui sur lequel tes clients t'envoient l'argent" />
          <CheckItem text="Numéro Orange Money" hint="Optionnel" />
          <CheckItem text="Numéro MTN MoMo" hint="Optionnel" />
        </StepCard>

        {/* ÉTAPE 4 — LA LIVRAISON */}
        <StepCard number={4} title="La livraison">
          <CheckItem text="Tu livres à domicile ?" hint="Oui / Non / Seulement dans certaines zones" />
          <CheckItem text="Retrait possible ?" hint="Si oui, donne l'adresse" />
          <CheckItem text="Nom et numéro de ton livreur" hint="Si tu en as un" />
        </StepCard>

        {/* ÉTAPE 5 — TES RÉSEAUX SOCIAUX */}
        <StepCard number={5} title="Tes réseaux sociaux">
          <CheckItem text="Ton Instagram" />
          <CheckItem text="Ton WhatsApp public" />
          <CheckItem text="Ta page Facebook" hint="Optionnel" />
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

        {/* FOOTER */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#7C6C58', margin: 0 }}>
          fortunashop — Ta boutique en ligne en 7 jours
        </p>
      </div>
    </div>
  )
}
