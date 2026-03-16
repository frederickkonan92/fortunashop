'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminNav from '../nav'

export default function LivreursPage() {
  var [livreurs, setLivreurs] = useState<any[]>([])
  var [shop, setShop] = useState<any>(null)
  var [showForm, setShowForm] = useState(false)
  var [editing, setEditing] = useState<any>(null)
  var [loading, setLoading] = useState(false)
  var [form, setForm] = useState({ name: '', phone: '', zone: '' })

  var planLimits: any = { starter: 1, pro: 3, premium: 999999 }

  useEffect(function() { loadData() }, [])

  var loadData = async function() {
    var userRes = await supabase.auth.getUser()
    var user = userRes.data.user
    if (!user) return
    var shopRes = await supabase.from('shops').select('*').eq('owner_id', user.id).single()
    setShop(shopRes.data)
    if (shopRes.data) {
      var res = await supabase.from('livreurs').select('*').eq('shop_id', shopRes.data.id).order('created_at', { ascending: true })
      setLivreurs(res.data || [])
    }
  }

  var maxLivreurs = planLimits[shop?.plan || 'starter'] || 1
  var canAdd = livreurs.length < maxLivreurs

  var handleChange = function(e: any) { setForm({ ...form, [e.target.name]: e.target.value }) }

  var resetForm = function() {
    setForm({ name: '', phone: '', zone: '' })
    setEditing(null)
    setShowForm(false)
  }

  var startEdit = function(livreur: any) {
    setForm({ name: livreur.name, phone: livreur.phone, zone: livreur.zone || '' })
    setEditing(livreur)
    setShowForm(true)
  }

  var handleSubmit = async function(e: any) {
    e.preventDefault()
    if (!shop) return
    setLoading(true)
    var data = { name: form.name, phone: form.phone, zone: form.zone || null, shop_id: shop.id }
    if (editing) {
      await supabase.from('livreurs').update(data).eq('id', editing.id)
    } else {
      await supabase.from('livreurs').insert(data)
    }
    resetForm()
    loadData()
    setLoading(false)
  }

  var deleteLivreur = async function(livreur: any) {
    if (!confirm('Supprimer ' + livreur.name + ' ?')) return
    await supabase.from('livreurs').delete().eq('id', livreur.id)
    loadData()
  }

  return (
    <div className="min-h-screen bg-fs-cream">
      <header className="bg-fs-ink text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-nunito font-black text-base">Mes livreurs</h1>
            <p className="text-xs text-gray-500">{livreurs.length}/{maxLivreurs} livreur{maxLivreurs > 1 ? 's' : ''}</p>
          </div>
          <button onClick={function() { if (canAdd) setShowForm(true); else alert('Limite de ' + maxLivreurs + ' livreur(s) pour le plan ' + (shop?.plan || 'starter') + '. Passez au plan superieur.') }}
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
              {editing ? 'Modifier le livreur' : 'Nouveau livreur'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Nom</label>
                <input name="name" value={form.name} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : Moussa" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Telephone</label>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : 0700000000" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Zone (optionnel)</label>
                <input name="zone" value={form.zone} onChange={handleChange}
                       className="w-full border border-fs-border rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-fs-orange"
                       placeholder="Ex : Cocody, Plateau" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={loading}
                        className="flex-1 bg-fs-orange text-white font-bold py-3 rounded-xl hover:bg-fs-orange-deep transition disabled:opacity-50">
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

        {livreurs.map(function(livreur) {
          return (
            <div key={livreur.id} className="bg-white rounded-2xl border border-fs-border p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-fs-orange-pale flex items-center justify-center shrink-0">
                <span className="text-lg">🛵</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{livreur.name}</p>
                <p className="text-xs text-fs-gray">{livreur.phone}</p>
                {livreur.zone && <p className="text-xs text-fs-gray2">Zone : {livreur.zone}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={function() { startEdit(livreur) }}
                        className="bg-fs-cream text-fs-ink text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-fs-border transition">
                  Modifier
                </button>
                <button onClick={function() { deleteLivreur(livreur) }}
                        className="bg-red-50 text-red-500 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-red-100 transition">
                  Suppr
                </button>
              </div>
            </div>
          )
        })}

        {livreurs.length === 0 && !showForm && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛵</p>
            <p className="text-fs-gray mb-4">Aucun livreur pour le moment</p>
            <button onClick={function() { setShowForm(true) }}
                    className="bg-fs-orange text-white font-bold px-6 py-3 rounded-xl">
              Ajouter mon premier livreur
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
