'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav({ shopSlug }: { shopSlug?: string }) {
  var pathname = usePathname()
  var tabs = [
    { href: '/admin', label: 'Commandes' },
    { href: '/admin/produits', label: 'Produits' },
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/livreurs', label: 'Livreurs' },
    { href: '/admin/ventes', label: '🏪 Ventes' },  // Nouvel onglet vente physique
    { href: '/admin/analytics', label: 'Analytics' },
  ]
  return (
    <div style={{ padding: '0 16px', background: '#FDF8F3', borderBottom: '1px solid #E8DDD0' }}>
      <div style={{ display: 'flex', gap: 0, maxWidth: 512, margin: '0 auto', overflowX: 'auto' }}>
        {tabs.map(function(tab) {
          var isActive = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href}
                  style={{
                    padding: '12px 16px', fontSize: 14, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#DC5014' : '#7C6C58', textDecoration: 'none',
                    borderBottom: isActive ? '2px solid #DC5014' : '2px solid transparent',
                    fontFamily: 'var(--font-outfit), sans-serif',
                    whiteSpace: 'nowrap', transition: 'color 0.2s, border-color 0.2s',
                  }}>
              {tab.label}
            </Link>
          )
        })}
        {shopSlug && (
          <a href={'/boutique/' + shopSlug} target="_blank"
             style={{
               padding: '12px 16px', fontSize: 14, fontWeight: 500,
               color: '#DC5014', textDecoration: 'none', whiteSpace: 'nowrap',
               fontFamily: 'var(--font-outfit), sans-serif',
             }}>
            Voir ma boutique
          </a>
        )}
      </div>
    </div>
  )
}