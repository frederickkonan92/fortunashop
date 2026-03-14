'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export default function ProduitsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [shop, setShop] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
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

  var resetForm = function() {
    setForm({ name: '', price: '', description: '' })
    setEditing(null)
    setShowForm(false)
  }

  var startEdit = function(product: any) {
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description || '',
    })
    setEditing(product)
    setShowForm(true)
  }

  var handleSubmit = async function(e: any) {
    e.preventDefault()
    if (!shop) return
    setLoading(true)

    var productData = {
      name: form.name,
      price: parseInt(form.price),
      description: form.description,
      shop_id: shop.id,
    }

    if (editing) {
      await supabase.from('products')
        .update(productData)
        .eq('id', editing.id)
    } else {
      await supabase.from('products')
        .insert(productData)
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
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-white">←</Link>
            <div>
              <h1 className="font-nunito font-black text-base">Mes produits</h1>
              <p className="text-xs text-gray-500">{products.length} produit{products.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={function() { setShowForm(true) }}
                  className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">
            + Ajouter
          </button>
        </div>
      </header>

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
                 className={'bg-white rounded-2xl border border-fs-border p-4' + (!product.is_active ? ' opacity-50' : '')}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{product.name}</h3>
                <span className="font-nunito font-extrabold text-sm text-fs-orange">
                  {formatPrice(product.price)}
                </span>
              </div>
              {product.description && (
                <p className="text-xs text-fs-gray mb-3">{product.description}</p>
              )}
              <div className="flex gap-2">
                <button onClick={function() { startEdit(product) }}
                        className="flex-1 bg-fs-cream text-fs-ink text-xs font-bold py-2 rounded-xl
                                   hover:bg-fs-border transition">
                  Modifier
                </button>
                <button onClick={function() { toggleActive(product) }}
                        className={'flex-1 text-xs font-bold py-2 rounded-xl transition ' +
                          (product.is_active
                            ? 'bg-fs-green-bg text-fs-green'
                            : 'bg-[#FEF3C7] text-[#D97706]')}>
                  {product.is_active ? 'Actif' : 'Inactif'}
                </button>
                <button onClick={function() { deleteProduct(product) }}
                        className="px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold
                                   hover:bg-red-100 transition">
                  Suppr
                </button>
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
