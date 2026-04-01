'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { hasAddon, getMaxProductsForPlan, getMaxCatalogEditsForPlan } from '@/lib/plan-rules'
import AdminNav from '../nav'

export default function ProduitsPage() {
  var [products, setProducts] = useState<any[]>([])
  var [shop, setShop] = useState<any>(null)
  var [showForm, setShowForm] = useState(false)
  var [editing, setEditing] = useState<any>(null)
  var [loading, setLoading] = useState(false)
 // 3 slots photo : index 0 = photo principale, 1 = photo 2, 2 = photo 3
 var [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null])
 var [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null])
 var [form, setForm] = useState({
  name: '',
  price: '',
  description: '',
  stock_quantity: '',
  stock_alert: '3',
  stock_buffer: '0',
})
var [hasVariants, setHasVariants] = useState(false)
var [variants, setVariants] = useState<any[]>([])
var [variantType, setVariantType] = useState('custom')
var [monthEdits, setMonthEdits] = useState(0)

var VARIANT_PRESETS: any = {
  size_clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  size_shoes: ['38', '39', '40', '41', '42', '43', '44', '45'],
  color: ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Rose', 'Gris'],
  custom: [],
}

var addVariant = function(value: string) {
  if (!value.trim()) return
  if (variants.find(function(v) { return v.variant_value === value.trim() })) return
  setVariants(function(prev) {
    return [...prev, { variant_value: value.trim(), variant_type: variantType, stock_quantity: '', price_override: '', is_active: true }]
  })
}

var removeVariant = function(index: number) {
  setVariants(function(prev) { return prev.filter(function(_, i) { return i !== index }) })
}

var updateVariant = function(index: number, field: string, value: string) {
  setVariants(function(prev) {
    var next = [...prev]
    next[index] = { ...next[index], [field]: value }
    return next
  })
}

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var prodRes = await supabase.from('products').select('*')
        .eq('shop_id', shopRes.data.id).order('sort_order', { ascending: true })
      setProducts(prodRes.data || [])
      var now = new Date()
      var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      var editsRes = await supabase.from('catalog_edits').select('id').eq('shop_id', shopRes.data.id).gte('created_at', startOfMonth)
      setMonthEdits(editsRes.data?.length || 0)
    }
  }

  var maxEdits = getMaxCatalogEditsForPlan(shop?.plan)
  var maxProducts = getMaxProductsForPlan(shop?.plan)
  var canAddProduct = products.length < maxProducts
  var canEdit = shop?.plan === 'premium' || monthEdits < maxEdits

  var handleChange = function(e: any) { setForm({ ...form, [e.target.name]: e.target.value }) }

 // handleImageChange : gère le changement de photo pour un slot donné (0, 1 ou 2)
 var handleImageChange = function(index: number, e: any) {
  var file = e.target.files[0]
  if (!file) return
  var newFiles = [...imageFiles]
  newFiles[index] = file
  setImageFiles(newFiles)
  var reader = new FileReader()
  reader.onload = function(ev: any) {
    var newPreviews = [...imagePreviews]
    newPreviews[index] = ev.target.result as string
    setImagePreviews(newPreviews)
  }
  reader.readAsDataURL(file)
}

// uploadImage : upload un fichier dans Supabase Storage et retourne son URL publique
var uploadImage = async function(file: File) {
  if (!shop) return null
  var fileName = shop.id + '/' + Date.now() + '-' + file.name
  var res = await supabase.storage.from('product-images').upload(fileName, file)
  if (res.error) return null
  var urlRes = supabase.storage.from('product-images').getPublicUrl(fileName)
  return urlRes.data.publicUrl
}

var resetForm = function() {
  setForm({ name: '', price: '', description: '', stock_quantity: '', stock_alert: '3', stock_buffer: '0' })
  setEditing(null)
  setShowForm(false)
  setImageFiles([null, null, null])
  setImagePreviews([null, null, null])
  setHasVariants(false)
  setVariants([])
  setVariantType('custom')
}


var startEdit = async function(product: any) {
  setForm({
    name: product.name,
    price: String(product.price),
    description: product.description || '',
    stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : '',
    stock_alert: String(product.stock_alert || 3),
    stock_buffer: String(product.stock_buffer || 0),
  })
  setEditing(product)
  setImagePreviews([product.image_url || null, product.image_url_2 || null, product.image_url_3 || null])
  setImageFiles([null, null, null])
  setHasVariants(product.has_variants || false)
  // Charge les variantes existantes du produit
  if (product.has_variants) {
    var varRes = await supabase.from('product_variants').select('*').eq('product_id', product.id).order('sort_order', { ascending: true })
    var loaded = (varRes.data || []).map(function(v: any) {
      return { ...v, stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '', price_override: v.price_override != null ? String(v.price_override) : '' }
    })
    setVariants(loaded)
    if (loaded.length > 0) setVariantType(loaded[0].variant_type)
  } else {
    setVariants([])
  }
  setShowForm(true)
}


  var handleSubmit = async function(e: any) {
    e.preventDefault()
    if (!shop) return
    // Verifier la limite de modifications (stock exclu)
    var isStockOnlyEdit = editing && form.name === editing.name && form.price === String(editing.price) && form.description === (editing.description || "") && !imageFiles[0] && !imageFiles[1] && !imageFiles[2]
    if (!isStockOnlyEdit && !canEdit) { alert("Limite de " + maxEdits + " modifications ce mois atteinte. Passez au plan superieur."); setLoading(false); return }
    setLoading(true)
   // Upload chaque photo si un nouveau fichier a été sélectionné
   var imageUrl = editing ? editing.image_url : null
   var imageUrl2 = editing ? editing.image_url_2 : null
   var imageUrl3 = editing ? editing.image_url_3 : null
   if (imageFiles[0]) { var u0 = await uploadImage(imageFiles[0]); if (u0) imageUrl = u0 }
   if (imageFiles[1]) { var u1 = await uploadImage(imageFiles[1]); if (u1) imageUrl2 = u1 }
   if (imageFiles[2]) { var u2 = await uploadImage(imageFiles[2]); if (u2) imageUrl3 = u2 }
    
    var stockQty = form.stock_quantity === '' ? null : parseInt(form.stock_quantity)
    var productData: any = {
      name: form.name,
      price: parseInt(form.price),
      description: form.description,
      image_url: imageUrl,
      image_url_2: imageUrl2,
      image_url_3: imageUrl3,
      shop_id: shop.id,
    }
    if (hasAddon(shop?.addons, 'stock')) {
      var bufferQty = parseInt(form.stock_buffer) || 0
      // Stock disponible en ligne = stock total - tampon physique
      var stockOnline = stockQty != null ? Math.max(0, stockQty - bufferQty) : null
      productData.stock_quantity = stockQty
      productData.stock_alert = parseInt(form.stock_alert) || 3
      productData.stock_buffer = bufferQty
      if (stockQty !== null && stockOnline !== null && stockOnline <= 0) {
        productData.is_active = false
      }
    }
    var productId = editing?.id
    if (editing) {
      await supabase.from('products').update({ ...productData, has_variants: hasVariants }).eq('id', editing.id)
      if (!isStockOnlyEdit) {
        await supabase.from('catalog_edits').insert({ shop_id: shop.id, action: 'update' })
      }
    } else {
      var insertRes = await supabase.from('products').insert({ ...productData, has_variants: hasVariants }).select().single()
      productId = insertRes.data?.id
      await supabase.from('catalog_edits').insert({ shop_id: shop.id, action: 'create' })
    }
    // Sauvegarde des variantes
    if (hasVariants && productId && variants.length > 0) {
      // Supprime les anciennes variantes puis réinsère
      await supabase.from('product_variants').delete().eq('product_id', productId)
      var variantsToInsert = variants.map(function(v: any, i: number) {
        return {
          product_id: productId,
          variant_type: variantType,
          variant_value: v.variant_value,
          stock_quantity: v.stock_quantity !== '' ? parseInt(v.stock_quantity) : null,
          price_override: v.price_override !== '' ? parseInt(v.price_override) : null,
          is_active: v.is_active !== false,
          sort_order: i,
        }
      })
      await supabase.from('product_variants').insert(variantsToInsert)
    } else if (!hasVariants && editing) {
      // Si on désactive les variantes → supprime toutes les variantes
      await supabase.from('product_variants').delete().eq('product_id', productId)
    }
    resetForm()
    loadData()
    setLoading(false)
  }

  var toggleActive = async function(product: any) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    loadData()
  }

  var deleteProduct = async function(product: any) {
    if (!confirm('Supprimer ' + product.name + ' ?')) return
    await supabase.from('products').delete().eq('id', product.id)
    loadData()
  }

  var getStockStatus = function(product: any) {
    if (product.stock_quantity == null) return 'none'
    if (product.stock_quantity <= 0) return 'out'
    if (product.stock_quantity <= (product.stock_alert || 3)) return 'low'
    return 'ok'
  }

  var stockColors: any = {
    ok: 'bg-fs-green-bg text-fs-green',
    low: 'bg-[#FEF3C7] text-[#D97706]',
    out: 'bg-red-50 text-red-500',
    none: 'bg-gray-100 text-gray-500',
  }

  var stockBarColors: any = {
    ok: 'bg-fs-green',
    low: 'bg-[#D97706]',
    out: 'bg-red-500',
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">Mes produits</h1>
            <p className="text-xs text-gray-500">
              {products.length}/{maxProducts} produit{products.length > 1 ? 's' : ''} ·{' '}
              {monthEdits}/{maxEdits} modif{monthEdits > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={function() {
              if (canAddProduct && canEdit) {
                setShowForm(true)
              } else if (!canAddProduct) {
                alert('Limite de ' + maxProducts + ' produits atteinte.')
              } else {
                alert(
                  'Limite de ' +
                    maxEdits +
                    ' modifications ce mois atteinte. Passez au plan superieur.'
                )
              }
            }}
            className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            + Ajouter
          </button>
        </div>
      </header>
      <AdminNav shopSlug={shop?.slug} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {showForm && (
          <div className="bg-white rounded-2xl border border-fs-border p-5">
            <h2 className="font-nunito font-extrabold text-base mb-4">
              {editing ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Nom du produit</label>
                <input name="name" value={form.name} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : Bague tressée en or" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Prix (FCFA)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : 15000" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description (optionnel)</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                          className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange resize-none"
                          placeholder="Ex : Fait main, taille ajustable" />
              </div>
             {hasAddon(shop?.addons, 'stock') && (
                <div className="bg-fs-cream rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-fs-gray">📦 Gestion du stock</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Quantite en stock</label>
                      <input name="stock_quantity" type="number" value={form.stock_quantity} onChange={handleChange}
                             className="w-full border border-fs-border rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange"
                             placeholder="Vide = illimite" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Seuil alerte</label>
                      <input name="stock_alert" type="number" value={form.stock_alert} onChange={handleChange}
                             className="w-full border border-fs-border rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange"
                             placeholder="3" />
                    </div>
                  </div>
                  {/* Stock tampon : unités réservées pour la boutique physique */}
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Stock tampon boutique physique
                    </label>
                    <input name="stock_buffer" type="number" value={form.stock_buffer} onChange={handleChange}
                           className="w-full border border-fs-border rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange"
                           placeholder="0" />
                    {/* Calcul temps réel du stock disponible en ligne */}
                    <p className="text-[11px] text-fs-gray2 mt-1">
                      Stock en ligne = {
                        form.stock_quantity && parseInt(form.stock_quantity) > 0
                          ? Math.max(0, parseInt(form.stock_quantity) - (parseInt(form.stock_buffer) || 0)) + ' unités disponibles'
                          : 'renseignez le stock total'
                      }
                    </p>
                  </div>
                  <p className="text-[11px] text-fs-gray2">Laissez vide pour un stock illimite. Le produit se desactive automatiquement quand le stock atteint 0.</p>
                </div>
              )}
              <div className="space-y-3">
                <label className="block text-sm font-semibold">Photos du produit (max 3)</label>
                {[0, 1, 2].map(function(index) {
                  return (
                    <div key={index}>
                      <p className="text-xs text-fs-gray mb-1">
                        {index === 0 ? 'Photo principale *' : 'Photo ' + (index + 1) + ' (optionnelle)'}
                      </p>
                      <input type="file" accept="image/*"
                             onChange={function(e) { handleImageChange(index, e) }}
                             className="w-full text-sm text-fs-gray file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-fs-orange-pale file:text-fs-orange hover:file:bg-fs-orange hover:file:text-white file:transition file:cursor-pointer" />
                      {/* Aperçu de la photo si déjà uploadée ou sélectionnée */}
                      {imagePreviews[index] && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-fs-border relative h-32 bg-fs-cream">
                          {imagePreviews[index]!.indexOf('data:') === 0 ? (
                            <img src={imagePreviews[index]!} alt={'Photo ' + (index + 1)} className="w-full h-32 object-cover" />
                          ) : (
                            <Image
                              src={imagePreviews[index]!}
                              alt={'Photo ' + (index + 1)}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 400px"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                        className="flex-1 bg-fs-orange text-white font-bold py-3 rounded-xl hover:bg-fs-orange-deep transition disabled:opacity-50">
                  {loading ? 'Enregistrement...' : (editing ? 'Modifier' : 'Ajouter')}
                </button>
                {/* SECTION VARIANTES */}
              <div className="border-t border-fs-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold">Variantes</p>
                    <p className="text-[11px] text-fs-gray">Tailles, couleurs, pointures...</p>
                  </div>
                  {/* Toggle activer/désactiver les variantes */}
                  <div onClick={function() { setHasVariants(!hasVariants); setVariants([]) }}
                       className={'w-12 h-6 rounded-full cursor-pointer transition-all relative ' + (hasVariants ? 'bg-fs-orange' : 'bg-fs-border')}>
                    <div className={'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ' + (hasVariants ? 'left-6' : 'left-0.5')} />
                  </div>
                </div>

                {hasVariants && (
                  <div className="space-y-3">
                    {/* TYPE DE VARIANTE */}
                    <div>
                      <label className="block text-xs font-semibold mb-2">Type de variante</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'size_clothing', label: '👗 Vêtements', sub: 'XS → XXL' },
                          { key: 'size_shoes', label: '👟 Chaussures', sub: '38 → 45' },
                          { key: 'color', label: '🎨 Couleurs', sub: 'Noir, Rouge...' },
                          { key: 'custom', label: '✏️ Personnalisé', sub: 'Valeurs libres' },
                        ].map(function(t) {
                          return (
                            <button key={t.key} type="button"
                                    onClick={function() { setVariantType(t.key); setVariants([]) }}
                                    className={'p-2 rounded-xl border text-left transition ' + (variantType === t.key ? 'border-fs-orange bg-fs-orange-pale' : 'border-fs-border bg-white')}>
                              <p className={'text-xs font-bold ' + (variantType === t.key ? 'text-fs-orange' : 'text-fs-ink')}>{t.label}</p>
                              <p className="text-[10px] text-fs-gray">{t.sub}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* AJOUT RAPIDE DEPUIS PRESET */}
                    {variantType !== 'custom' && VARIANT_PRESETS[variantType]?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Ajout rapide</p>
                        <div className="flex flex-wrap gap-2">
                          {VARIANT_PRESETS[variantType].map(function(val: string) {
                            var already = variants.find(function(v) { return v.variant_value === val })
                            return (
                              <button key={val} type="button"
                                      onClick={function() { already ? removeVariant(variants.findIndex(function(v) { return v.variant_value === val })) : addVariant(val) }}
                                      className={'px-3 py-1.5 rounded-full text-xs font-bold border transition ' + (already ? 'bg-fs-orange text-white border-fs-orange' : 'bg-white text-fs-gray border-fs-border')}>
                                {val}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* AJOUT VALEUR LIBRE */}
                    {variantType === 'custom' && (
                      <div className="flex gap-2">
                        <input id="custom-variant-input" type="text"
                               placeholder="Ex : Grande taille, Taille unique..."
                               className="flex-1 border border-fs-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange" />
                        <button type="button"
                                onClick={function() {
                                  var input = document.getElementById('custom-variant-input') as HTMLInputElement
                                  if (input?.value) { addVariant(input.value); input.value = '' }
                                }}
                                className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">
                          + Ajouter
                        </button>
                      </div>
                    )}

                    {/* LISTE DES VARIANTES AJOUTÉES */}
                    {variants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-fs-gray">{variants.length} variante{variants.length > 1 ? 's' : ''}</p>
                        {variants.map(function(v: any, i: number) {
                          return (
                            <div key={i} className="bg-fs-cream rounded-xl p-3 flex items-center gap-3">
                              {/* Nom variante */}
                              <span className="font-nunito font-extrabold text-xs text-fs-ink w-12 shrink-0">{v.variant_value}</span>
                              {/* Stock par variante */}
                              <div className="flex-1">
                                <input type="number" value={v.stock_quantity}
                                       onChange={function(e) { updateVariant(i, 'stock_quantity', e.target.value) }}
                                       placeholder="Stock"
                                       className="w-full border border-fs-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-fs-orange bg-white" />
                              </div>
                              {/* Prix override optionnel */}
                              <div className="flex-1">
                                <input type="number" value={v.price_override}
                                       onChange={function(e) { updateVariant(i, 'price_override', e.target.value) }}
                                       placeholder="Prix (opt.)"
                                       className="w-full border border-fs-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-fs-orange bg-white" />
                              </div>
                              {/* Supprimer */}
                              <button type="button" onClick={function() { removeVariant(i) }}
                                      className="text-red-400 text-xs font-bold shrink-0">✕</button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {variants.length === 0 && (
                      <p className="text-xs text-fs-gray2 text-center py-2">Aucune variante ajoutée</p>
                    )}
                  </div>
                )}
              </div>
                <button type="button" onClick={resetForm}
                        className="px-4 py-3 rounded-xl border border-fs-border text-fs-gray font-semibold">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {products.map(function(product) {
          var status = getStockStatus(product)
          return (
            <div key={product.id}
                 className={'bg-white rounded-2xl border border-fs-border p-4 flex gap-4' + (!product.is_active ? ' opacity-50' : '')}>
              <div className="w-16 h-16 rounded-xl bg-fs-cream flex items-center justify-center shrink-0 overflow-hidden relative">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <span className="font-nunito font-extrabold text-sm text-fs-orange shrink-0 ml-2">
                    {formatPrice(product.price)}
                  </span>
                </div>
                {hasAddon(shop?.addons, 'stock') && product.stock_quantity != null && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={'text-[11px] font-bold px-2 py-0.5 rounded-full ' + stockColors[status]}>
                        {status === 'out' ? 'Rupture' : status === 'low' ? 'Stock bas' : product.stock_quantity + ' en stock'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-fs-cream2 rounded-full overflow-hidden">
                      <div className={'h-full rounded-full transition-all ' + (stockBarColors[status] || 'bg-gray-300')}
                           style={{ width: Math.min((product.stock_quantity / (product.stock_alert * 3)) * 100, 100) + '%' }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={function() { startEdit(product) }}
                          className="bg-fs-cream text-fs-ink text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-fs-border transition">
                    Modifier
                  </button>
                  <button onClick={function() { toggleActive(product) }}
                          className={'text-xs font-bold py-1.5 px-3 rounded-lg transition ' +
                            (product.is_active ? 'bg-fs-green-bg text-fs-green' : 'bg-[#FEF3C7] text-[#D97706]')}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </button>
                  <button onClick={function() { deleteProduct(product) }}
                          className="bg-red-50 text-red-500 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-red-100 transition">
                    Suppr
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {products.length === 0 && !showForm && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-fs-gray mb-4">Aucun produit pour le moment</p>
            <button
              onClick={function() {
                if (canEdit) {
                  setShowForm(true)
                } else {
                  alert(
                    'Limite de ' +
                      maxEdits +
                      ' modifications par mois atteinte pour le plan ' +
                      (shop?.plan || 'starter') +
                      '. Passez au plan supérieur.'
                  )
                }
              }}
              className="bg-fs-orange text-white font-bold px-6 py-3 rounded-xl"
            >
              Ajouter mon premier produit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
