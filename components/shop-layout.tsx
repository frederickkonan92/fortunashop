// Header et Footer boutique partagés (catalogue, fiche produit, commande)
import { getContrastText, getLightColor } from '@/lib/theme'

export function ShopHeader({ shop, theme }: any) {
  return (
    <header style={{
      background: theme.primary,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <a href={'/boutique/' + shop.slug} style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
        {shop.logo_url ? (
          <img src={shop.logo_url} alt={shop.name}
            style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', background: 'white', padding: 3 }} />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: theme.accent, color: theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 600,
          }}>
            {shop.name?.charAt(0)}
          </div>
        )}
        <div>
          <div style={{
            fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 600,
            color: getContrastText(theme.primary), letterSpacing: 0.5,
          }}>
            {shop.name}
          </div>
          {shop.description && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.6)',
              letterSpacing: 1, textTransform: 'uppercase', marginTop: 1,
              maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {shop.description}
            </div>
          )}
        </div>
      </a>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, color: 'rgba(255,255,255,0.7)',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50' }} />
        En ligne
      </div>
    </header>
  )
}

export function ShopFooter({ shop, theme }: any) {
  return (
    <footer style={{
      background: getLightColor(theme.primary, 0.04),
      padding: '24px 20px',
      borderTop: '1px solid #E8DDD0',
    }}>
      {(shop?.social_instagram || shop?.social_facebook || shop?.social_whatsapp) && (
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16,
        }}>
          {shop.social_instagram && (
            <a href={shop.social_instagram.startsWith('http') ? shop.social_instagram : 'https://instagram.com/' + shop.social_instagram}
              target="_blank" rel="noopener noreferrer"
              style={{ color: theme.primary, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              Instagram
            </a>
          )}
          {shop.social_whatsapp && (
            <a href={'https://wa.me/' + shop.social_whatsapp.replace(/[^0-9+]/g, '')}
              target="_blank" rel="noopener noreferrer"
              style={{ color: theme.primary, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              WhatsApp
            </a>
          )}
          {shop.social_facebook && (
            <a href={shop.social_facebook.startsWith('http') ? shop.social_facebook : 'https://facebook.com/' + shop.social_facebook}
              target="_blank" rel="noopener noreferrer"
              style={{ color: theme.primary, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              Facebook
            </a>
          )}
        </div>
      )}
      <div style={{ textAlign: 'center' }}>
        <a href="https://fortunashop.fr" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: '#7C6C58', textDecoration: 'none' }}>
          Propulsé par <span style={{ color: '#DC5014', fontWeight: 600 }}>fortunashop</span>
        </a>
      </div>
    </footer>
  )
}
