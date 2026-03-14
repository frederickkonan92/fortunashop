'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-fs-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-fs-orange to-fs-orange-deep
                          rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🏪</span>
          </div>
          <h1 className="font-nunito font-black text-xl">Mon espace</h1>
          <p className="text-sm text-fs-gray mt-1">Connectez-vous pour gérer votre boutique</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                   className="w-full border border-fs-border rounded-xl px-4 py-3
                              focus:outline-none focus:ring-2 focus:ring-fs-orange"
                   placeholder="artisan@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-fs-border rounded-xl px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-fs-orange"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
                  className="w-full bg-fs-ink text-white font-bold py-3.5 rounded-xl
                             hover:bg-fs-orange transition disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
