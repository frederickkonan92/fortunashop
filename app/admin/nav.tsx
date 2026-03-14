'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav({ shopSlug }: { shopSlug?: string }) {
  const pathname = usePathname()

  return (
    <div className="px-4 py-2 bg-fs-cream2 border-b border-fs-border">
      <div className="flex gap-2 max-w-lg mx-auto overflow-x-auto">
        <Link href="/admin"
              className={'px-4 py-2 rounded-full text-xs font-bold transition ' +
                (pathname === '/admin' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
          Commandes
        </Link>
        <Link href="/admin/produits"
              className={'px-4 py-2 rounded-full text-xs font-bold transition ' +
                (pathname === '/admin/produits' ? 'bg-fs-ink text-white' : 'bg-white text-fs-gray border border-fs-border')}>
          Produits
        </Link>
        {shopSlug && (
          <a href={'/boutique/' + shopSlug} target="_blank"
             className="px-4 py-2 rounded-full text-xs font-bold bg-fs-orange-pale text-fs-orange border border-fs-orange">
            Voir ma boutique ↗
          </a>
        )}
      </div>
    </div>
  )
}
