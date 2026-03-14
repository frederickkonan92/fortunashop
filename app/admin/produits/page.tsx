'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import AdminNav from '../nav'
import Link from 'next/link'

export default function ProduitsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [shop, setShop] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
  })

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase
      .from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var prodRes = await supabase
        .from('products').select('*')
        .eq('shop_id', shopRes.data.id)
        .order('sort_order', { ascending: true })
      setProducts(prodRes.data || [])
    }
  }

  var handleChange = function(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  var handleImageChange = function(e: any) {
    var file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    var reader = new FileReader()
    reader.onload = function(ev: any) {
      setImagePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  var uploadImage = async function() {
    if (!imageFile || !shop) return null
    var fileName = shop.id + '/' + Date.now() + '-' + imageFile.name
    var { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile)
    if (error) return null
    var { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)
    return urlData.publicUrl
  }

  var resetForm = function() {
    setForm({ name: '', price: '', description: '' })
    setEditing(null)
    setShowForm(false)
    setImageFile(null)
    setImagePreview(null)
  }

  var startEdit = function(product: any) {
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description || '',
    })
    setEditing(product)
    setImagePreview(product.image_url || null)
    setImageFile(null)
    setShowForm(true)
  }

  var handleSubmit = async function(e: any) {
    e.preventDefault()
    if (!shop) return
    setLoading(true)

    var imageUrl = editing ? editing.image_url : null
    if (imageFile) {
      var uploaded = await uploadImage()
      if (uploaded) imageUrl = uploaded
    }

    var productData = {
      name: form.name,
      price: parseInt(form.price),
      description: form.description,
      image_url: imageUrl,
      shop_id: shop.id,
    }

    if (editing) {
      await supabase.from('products').update(productData).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(productData)
    }

    resetForm()
    loadData()
    setLoading(false)
  }

  var toggleActive = async function(product: any) {
    await supabase.from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    loadData()
  }

  var deleteProduct = async function(product: any) {
    if (!confirm('Supprimer ' + product.name + ' ?')) return
    await supabase.from('products').delete().eq('id', product.id)
    loadData()
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">Mes produits</h1>
            <p className="text-xs text-gray-500">{products.length} produit{products.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={function() { setShowForm(true) }}
                  className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">
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
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                                  focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : Bague tressée en or" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Prix (FCFA)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                                  focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : 15000" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description (optionnel)</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                          className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white
                                     focus:outline-none focus:ring-2 focus:ring-fs-orange resize-none"
                         placeholder="Ex : Fait main, taille ajustable" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Photo du produit</label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                       className="w-full text-sm text-fs-gray file:mr-3 file:py-2 file:px-4
                                  file:rounded-xl file:border-0 file:text-sm file:font-semibold
                                  file:bg-fs-orange-pale file:text-fs-orange hover:file:bg-fs-orange
                                  hover:file:text-white file:transition file:cursor-pointer" />
                {imagePreview && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-fs-border">
                    <img src={imagePreview} alt="Preview"
                         className="w-full h-40 object-cover" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                        className="flex-1 bg-fs-orange text-white font-bold py-3 rounded-xl
                                   hover:bg-fs-orange-deep transition disabled:opacity-50">
                  {loading ? 'Enregistrement...' : (editing ? 'Modifier' : 'Ajouter')}
                </button>
                <button type="button" onClick={resetForm}
                        className="px-4 py-3 rounded-xl border border-fs-border text-fs-gray font-semibold">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {products.map(function(product) {
          return (
            <div key={product.id}
                 className={'bg-white rounded-2xl border border-fs-border p-4 flex gap-4' + (!product.is_active ? ' opacity-50' : '')}>
              <div className="w-16 h-16 rounded-xl bg-fs-cream flex items-center justify-center shrink-0 overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
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
                {product.description && (
                  <p className="text-xs text-fs-gray mb-2 truncate">{product.description}</p>
                )}
                <div className="flex gap-2">
                  <button onClick={function() { startEdit(product) }}
                          className="bg-fs-cream text-fs-ink text-xs font-bold py-1.5 px-3 rounded-lg
                                   hover:bg-fs-border transition">
                    Modifier
                  </button>
                  <button onClick={function() { toggleActive(product) }}
                          className={'text-xs font-bold py-1.5 px-3 rounded-lg transition ' +
                            (product.is_active ? 'bg-fs-green-bg text-fs-green' : 'bg-[#FEF3C7] text-[#D97706]')}>
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </button>
                  <button onClick={function() { deleteProduct(product) }}
                          className="bg-red-50 text-red-500 text-xs font-bold py-1.5 px-3 rounded-lg
                                     hover:bg-red-100 transition">
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
            <button onClick={function() { setShowForm(true) }}
                    className="bg-fs-orange text-white font-bold px-6 py-3 rounded-xl">
              Ajouter mon premier produit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
