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
  ]
  return (
    <div className="px-4 py-2 bg-fs-cream2 border-b border-fs-border">
      <div className="flex gap-2 max-w-lg mx-auto overflow-x-auto">
        {tabs.map(function(tab) {
          return (
            <Link key={tab.href} href={tab.href}
                  className={'px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ' +
                    (pathname === tab.href ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
              {tab.label}
            </Link>
          )
        })}
        {shopSlug && (
          <a href={'/boutique/' + shopSlug} target="_blank"
             className="px-4 py-2 rounded-full text-xs font-bold bg-fs-orange-pale text-fs-orange border border-fs-orange whitespace-nowrap">
            Voir ma boutique
          </a>
        )}
      </div>
    </div>
  )
}