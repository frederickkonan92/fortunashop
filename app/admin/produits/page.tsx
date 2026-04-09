'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { hasAddon, getMaxProductsForPlan, getMaxCatalogEditsForPlan } from '@/lib/plan-rules'
import { SHOP_SELECT, PRODUCT_SELECT } from '@/lib/admin-data'
import { HelpButton } from '@/components/help-panel'
import AdminNav from '../nav'
import { VariantForm } from './variant-form'

export default function ProduitsPage() {
  var [products, setProducts] = useState<any[]>([])
  var [shop, setShop] = useState<any>(null)
  var [showForm, setShowForm] = useState(false)
  var [editing, setEditing] = useState<any>(null)
  var [loading, setLoading] = useState(false)
 // Multi-photos illimité
 var [selectedImages, setSelectedImages] = useState<File[]>([])
 var [existingImages, setExistingImages] = useState<any[]>([])
 // Legacy 3 slots (pour rétrocompatibilité édition)
 var [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null])
 var [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null])
 var [form, setForm] = useState({
  name: '',
  price: '',
  description: '',
  stock_quantity: '',
  stock_alert: '3',
  stock_buffer: '0',
  category: '',
})
var [hasVariants, setHasVariants] = useState(false)
var [variants, setVariants] = useState<any[]>([])
var [variantType, setVariantType] = useState('custom')
var [monthEdits, setMonthEdits] = useState(0)
// Multi-axes : type et valeurs pour axe 1 et axe 2
var [variantType1, setVariantType1] = useState('')
var [variantType2, setVariantType2] = useState('')
var [values1Input, setValues1Input] = useState('')
var [values2Input, setValues2Input] = useState('')
var [combinations, setCombinations] = useState<any[]>([])

var VARIANT_PRESETS: any = {
  size_clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  size_shoes: ['38', '39', '40', '41', '42', '43', '44', '45'],
  color: ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Rose', 'Gris'],
  custom: [],
}

var generateCombinations = function() {
  var vals1 = values1Input.split(',').map(function(s) { return s.trim() }).filter(function(s) { return s !== '' })
  if (vals1.length === 0) return
  var newCombos: any[] = []
  if (variantType2 && values2Input.trim()) {
    var vals2 = values2Input.split(',').map(function(s) { return s.trim() }).filter(function(s) { return s !== '' })
    vals1.forEach(function(v1) {
      vals2.forEach(function(v2) {
        // Conserver stock/prix existants si la combinaison existait déjà
        var existing = combinations.find(function(c) { return c.value1 === v1 && c.value2 === v2 })
        newCombos.push({
          value1: v1,
          value2: v2,
          stock: existing ? existing.stock : '',
          priceOverride: existing ? existing.priceOverride : '',
        })
      })
    })
  } else {
    vals1.forEach(function(v1) {
      var existing = combinations.find(function(c) { return c.value1 === v1 && !c.value2 })
      newCombos.push({
        value1: v1,
        value2: '',
        stock: existing ? existing.stock : '',
        priceOverride: existing ? existing.priceOverride : '',
      })
    })
  }
  setCombinations(newCombos)
}

var updateComboStock = function(idx: number, value: string) {
  setCombinations(function(prev) {
    var next = prev.slice()
    next[idx] = { ...next[idx], stock: value }
    return next
  })
}

var updateComboPrice = function(idx: number, value: string) {
  setCombinations(function(prev) {
    var next = prev.slice()
    next[idx] = { ...next[idx], priceOverride: value }
    return next
  })
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
    var shopRes: any = await supabase.from('shops').select(SHOP_SELECT).eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var prodRes: any = await supabase.from('products').select(PRODUCT_SELECT + ', sort_order')
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
  setForm({ name: '', price: '', description: '', stock_quantity: '', stock_alert: '3', stock_buffer: '0', category: '' })
  setEditing(null)
  setShowForm(false)
  setImageFiles([null, null, null])
  setImagePreviews([null, null, null])
  setSelectedImages([])
  setExistingImages([])
  setHasVariants(false)
  setVariants([])
  setVariantType('custom')
  setVariantType1('')
  setVariantType2('')
  setValues1Input('')
  setValues2Input('')
  setCombinations([])
}


var startEdit = async function(product: any) {
  setForm({
    name: product.name,
    price: String(product.price),
    description: product.description || '',
    stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : '',
    stock_alert: String(product.stock_alert || 3),
    stock_buffer: String(product.stock_buffer || 0),
    category: product.category || '',
  })
  setEditing(product)
  // Charger les images existantes depuis product_images
  var imgs = product.product_images && product.product_images.length > 0
    ? product.product_images.slice().sort(function(a: any, b: any) { return a.position - b.position })
    : []
  setExistingImages(imgs)
  setSelectedImages([])
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
    // Charger les axes multi-combinaisons si variant_type_2 existe
    if (loaded.length > 0 && loaded[0].variant_type_2) {
      setVariantType1(loaded[0].variant_type || '')
      setVariantType2(loaded[0].variant_type_2 || '')
      // Extraire les valeurs uniques
      var v1s: string[] = []
      var v2s: string[] = []
      loaded.forEach(function(v: any) {
        if (v.variant_value && v1s.indexOf(v.variant_value) === -1) v1s.push(v.variant_value)
        if (v.variant_value_2 && v2s.indexOf(v.variant_value_2) === -1) v2s.push(v.variant_value_2)
      })
      setValues1Input(v1s.join(', '))
      setValues2Input(v2s.join(', '))
      // Reconstituer les combinaisons
      var combos = loaded.map(function(v: any) {
        return {
          value1: v.variant_value,
          value2: v.variant_value_2 || '',
          stock: v.stock_quantity !== '' ? String(v.stock_quantity) : '',
          priceOverride: v.price_override !== '' ? String(v.price_override) : '',
        }
      })
      setCombinations(combos)
    } else if (loaded.length > 0) {
      // Mode 1 axe : pré-remplir variantType1 et values1Input
      setVariantType1(loaded[0].variant_type || '')
      setVariantType2('')
      var v1sOnly: string[] = []
      loaded.forEach(function(v: any) {
        if (v.variant_value && v1sOnly.indexOf(v.variant_value) === -1) v1sOnly.push(v.variant_value)
      })
      setValues1Input(v1sOnly.join(', '))
      setValues2Input('')
      var combosOnly = loaded.map(function(v: any) {
        return {
          value1: v.variant_value,
          value2: '',
          stock: v.stock_quantity !== '' ? String(v.stock_quantity) : '',
          priceOverride: v.price_override !== '' ? String(v.price_override) : '',
        }
      })
      setCombinations(combosOnly)
    } else {
      setVariantType1('')
      setVariantType2('')
      setValues1Input('')
      setValues2Input('')
      setCombinations([])
    }
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
      category: form.category.trim() || null,
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
    // Upload des nouvelles images dans product_images
    if (productId && selectedImages.length > 0) {
      // Détermine la position de départ (après les images existantes)
      var startPos = existingImages.length
      for (var si = 0; si < selectedImages.length; si++) {
        var file = selectedImages[si]
        var fileName = shop.id + '/' + productId + '-' + si + '-' + Date.now() + '.jpg'
        var uploadRes = await supabase.storage.from('product-images').upload(fileName, file, { contentType: file.type, upsert: true })
        if (!uploadRes.error) {
          var urlData = supabase.storage.from('product-images').getPublicUrl(fileName)
          await supabase.from('product_images').insert({
            product_id: productId,
            image_url: urlData.data.publicUrl,
            position: startPos + si,
          })
          // La première image uploadée = image principale (rétrocompatibilité)
          if (si === 0 && !imageUrl) {
            await supabase.from('products').update({ image_url: urlData.data.publicUrl }).eq('id', productId)
          }
        }
      }
    }
    // Sauvegarde des variantes (mode combinaisons multi-axes)
    if (hasVariants && productId && combinations.length > 0) {
      await supabase.from('product_variants').delete().eq('product_id', productId)
      var variantsToInsert = combinations.map(function(combo: any, i: number) {
        return {
          product_id: productId,
          variant_type: variantType1 || variantType,
          variant_value: combo.value1,
          variant_type_2: combo.value2 ? (variantType2 || null) : null,
          variant_value_2: combo.value2 || null,
          stock_quantity: combo.stock !== '' ? parseInt(combo.stock) : null,
          price_override: combo.priceOverride !== '' ? parseInt(combo.priceOverride) : null,
          is_active: true,
          sort_order: i,
        }
      })
      await supabase.from('product_variants').insert(variantsToInsert)
    } else if (hasVariants && productId && variants.length > 0) {
      // Fallback ancien mode (ne devrait plus arriver)
      await supabase.from('product_variants').delete().eq('product_id', productId)
      var legacyInserts = variants.map(function(v: any, i: number) {
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
      await supabase.from('product_variants').insert(legacyInserts)
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 24, fontWeight: 600, color: 'white' }}>Mes produits</h1>
              <HelpButton section="produits" />
            </div>
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
            style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#DC5014', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-outfit), sans-serif', transition: 'transform 0.15s' }}
            onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'scale(1.03)' }}
            onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'scale(1)' }}
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
                <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: '#2C1A0E', marginBottom: 4 }}>Nom du produit</label>
                <input name="name" value={form.name} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : Bague tressée en or" />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: '#2C1A0E', marginBottom: 4 }}>Prix (FCFA)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : 15000" />
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: '#2C1A0E', marginBottom: 4 }}>Description (optionnel)</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                          className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange resize-none"
                          placeholder="Ex : Fait main, taille ajustable" />
              </div>
              {/* Catégorie du produit — pour organiser le catalogue */}
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-outfit), sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: '#2C1A0E', marginBottom: 4 }}>Categorie (optionnel)</label>
                <input name="category" type="text" value={form.category} onChange={handleChange}
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex: homme, femme, bijoux, sacs..." />
                <p className="text-[11px] text-fs-gray2 mt-1">
                  Les produits de la même catégorie seront regroupés dans le catalogue
                </p>
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
                <label className="block text-sm font-semibold">Photos du produit</label>
                <input type="file" accept="image/*" multiple
                  onChange={function(e) {
                    var files = Array.from(e.target.files || [])
                    setSelectedImages(function(prev) { return prev.concat(files) })
                  }}
                  className="w-full text-sm text-fs-gray file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-fs-orange-pale file:text-fs-orange hover:file:bg-fs-orange hover:file:text-white file:transition file:cursor-pointer" />
                {/* Images existantes (en édition) */}
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-xs text-fs-gray mb-2">Photos actuelles</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {existingImages.map(function(img: any, idx: number) {
                        return (
                          <div key={img.id} style={{ position: 'relative' }}>
                            <img src={img.image_url} alt=""
                              style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                            <button type="button" onClick={function() {
                              supabase.from('product_images').delete().eq('id', img.id).then(function() {
                                setExistingImages(function(prev) { return prev.filter(function(_, i) { return i !== idx }) })
                              })
                            }}
                              style={{
                                position: 'absolute', top: -6, right: -6,
                                width: 20, height: 20, borderRadius: '50%',
                                background: '#D32F2F', color: 'white', border: 'none',
                                cursor: 'pointer', fontSize: 12, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                              x
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {/* Aperçu des nouvelles images sélectionnées */}
                {selectedImages.length > 0 && (
                  <div>
                    <p className="text-xs text-fs-gray mb-2">Nouvelles photos</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {selectedImages.map(function(file, idx) {
                        return (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img src={URL.createObjectURL(file)} alt=""
                              style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
                            <button type="button" onClick={function() {
                              setSelectedImages(function(prev) { return prev.filter(function(_, i) { return i !== idx }) })
                            }}
                              style={{
                                position: 'absolute', top: -6, right: -6,
                                width: 20, height: 20, borderRadius: '50%',
                                background: '#D32F2F', color: 'white', border: 'none',
                                cursor: 'pointer', fontSize: 12, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                              x
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                        className="flex-1 bg-fs-orange text-white font-bold py-3 rounded-xl hover:bg-fs-orange-deep transition disabled:opacity-50">
                  {loading ? 'Enregistrement...' : (editing ? 'Modifier' : 'Ajouter')}
                </button>
                {/* SECTION VARIANTES */}
              <VariantForm
                hasVariants={hasVariants} setHasVariants={setHasVariants} setVariants={setVariants}
                variantType1={variantType1} setVariantType1={setVariantType1}
                variantType2={variantType2} setVariantType2={setVariantType2}
                values1Input={values1Input} setValues1Input={setValues1Input}
                values2Input={values2Input} setValues2Input={setValues2Input}
                combinations={combinations} generateCombinations={generateCombinations}
                updateComboStock={updateComboStock} updateComboPrice={updateComboPrice}
              />
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
                 style={{
                   background: 'white', borderRadius: 14, border: '1px solid #E8DDD0', padding: 16,
                   display: 'flex', gap: 16, opacity: !product.is_active ? 0.5 : 1,
                   transition: 'transform 0.15s, box-shadow 0.15s',
                 }}
                 onMouseEnter={function(e: any) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)' }}
                 onMouseLeave={function(e: any) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 10, background: '#FDF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                {product.image_url ? (
                  product.image_url.indexOf('images.unsplash.com') !== -1 ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" sizes="64px" />
                  )
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</h3>
                  <span style={{ fontFamily: 'var(--font-outfit), sans-serif', color: '#DC5014', fontWeight: 600, fontSize: 14, flexShrink: 0, marginLeft: 8 }}>
                    {formatPrice(product.price)}
                  </span>
                </div>
                {product.category && (
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#FFF0E6',
                    color: '#DC5014',
                    fontSize: 11,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}>
                    {product.category}
                  </span>
                )}
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
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📦</div>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 18, fontWeight: 500, color: '#2C1A0E', marginBottom: 8 }}>
              Aucun produit pour le moment
            </div>
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
