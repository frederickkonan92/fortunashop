import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export default async function BoutiquePage({ params }: any) {
  const { slug } = await params

  // Récupérer la boutique par son slug
  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-fs-cream px-6">
        <p className="text-6xl mb-4">🔍</p>
        <h1 className="font-nunito font-extrabold text-xl mb-2">Boutique introuvable</h1>
        <p className="text-fs-gray text-center">
          Cette boutique n'existe pas ou est temporairement hors ligne.
        </p>
      </div>
    )
  }

  // Récupérer les produits actifs de cette boutique
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="min-h-screen bg-fs-cream">

      {/* TOP BAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-fs-border
                          px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fs-orange to-fs-orange-deep
                        flex items-center justify-center text-white font-nunito font-black text-lg
                        shrink-0">
          {shop.name[0]}
        </div>
        <div className="min-w-0">
          <h1 className="font-nunito font-extrabold text-base truncate">{shop.name}</h1>
          <p className="text-xs text-fs-gray truncate">{shop.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 bg-fs-green rounded-full animate-pulse" />
          <span className="text-xs font-bold text-fs-green">En ligne</span>
        </div>
      </header>

      {/* BANNIÈRE */}
      <div className="bg-gradient-to-br from-fs-orange-pale to-fs-cream2
                      px-5 py-6 border-b border-fs-border">
        <h2 className="font-nunito font-extrabold text-lg mb-1">
          Bienvenue chez {shop.name} 👋
        </h2>
        <p className="text-sm text-fs-gray leading-relaxed">
          Parcourez nos créations et commandez directement en ligne.
        </p>
      </div>

      {/* GRILLE PRODUITS */}
      <main className="px-4 py-5">
        <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-fs-gray mb-4">
          Nos créations · {products?.length || 0} produit{(products?.length || 0) > 1 ? 's' : ''}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {products?.map((product: any) => (
            <div key={product.id}
                 className="bg-white border border-fs-border rounded-2xl overflow-hidden
                            hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="aspect-square bg-fs-cream flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name}
                       className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🛍️</span>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-[13px] leading-tight mb-1 line-clamp-2">
                  {product.name}
                </p>
                <p className="font-nunito font-extrabold text-sm text-fs-orange mb-3">
                  {formatPrice(product.price)}
                </p>
                <Link
                  href={`/boutique/${slug}/commander?product=${product.id}`}
                  className="block w-full bg-fs-ink text-white text-center text-xs
                             font-bold py-2.5 rounded-xl hover:bg-fs-orange transition">
                  Commander
                </Link>
              </div>
            </div>
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✨</p>
            <p className="text-fs-gray">Les créations arrivent bientôt...</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-fs-cream2 border-t border-fs-border py-5 text-center">
        <p className="text-sm text-fs-gray">
          Propulsé par <strong className="text-fs-orange">fortunashop</strong>
        </p>
      </footer>
    </div>
  )
}