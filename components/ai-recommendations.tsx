'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Composant recommandations IA — appelle Claude Haiku via /api/recommendations
export default function AIRecommendations({ shopId }: { shopId: string }) {
  var [recs, setRecs] = useState<any[]>([])
  var [loading, setLoading] = useState(false)
  var [cached, setCached] = useState(false)
  var [nextRefresh, setNextRefresh] = useState<string | null>(null)
  var [error, setError] = useState<string | null>(null)

  // Charge les recommandations au montage du composant
  useEffect(function() {
    if (shopId) fetchRecs()
  }, [shopId])

  var fetchRecs = async function() {
    setLoading(true)
    setError(null)
    try {
      // Recupere la session Supabase active pour prouver l'identite de l'artisan
      var { data: sessionData } = await supabase.auth.getSession()
      var accessToken = sessionData?.session?.access_token || ''

      var res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Envoie le JWT dans le header Authorization (format Bearer)
          'Authorization': 'Bearer ' + accessToken,
        },
        body: JSON.stringify({ shop_id: shopId })
      })
      var data = await res.json()
      if (data.error) { setError(data.error); return }
      setRecs(data.recommendations || [])
      setCached(data.cached)
      setNextRefresh(data.next_refresh)
    } catch (e: any) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-fs-ink rounded-2xl p-4">
      {/* Header avec bouton actualiser */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-white">💡 Recommandations IA</p>
          {cached && nextRefresh && (
            <p className="text-[10px] text-white/40 mt-0.5">Actualisable dans {nextRefresh}</p>
          )}
        </div>
        <button
          onClick={fetchRecs}
          disabled={loading || cached}
          className={'text-[10px] font-bold px-3 py-1.5 rounded-lg transition ' +
            (cached ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-fs-orange text-white hover:bg-fs-orange-deep')}>
          {loading ? '...' : cached ? 'À jour' : '↻ Actualiser'}
        </button>
      </div>

      {/* État chargement */}
      {loading && (
        <div className="flex items-center gap-2 py-4">
          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          <p className="text-xs text-white/60">Analyse en cours...</p>
        </div>
      )}

      {/* Erreur */}
      {error && !loading && (
        <div className="bg-red-500/20 rounded-xl p-3">
          <p className="text-xs text-red-300">Erreur : {error}</p>
        </div>
      )}

      {/* Recommandations */}
      {!loading && !error && recs.length > 0 && (
        <div className="space-y-2">
          {recs.map(function(rec: any, i: number) {
            return (
              <div key={i} className="bg-white/10 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{rec.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-white mb-0.5">{rec.titre}</p>
                    <p className="text-xs text-white/70 leading-relaxed">{rec.conseil}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Vide */}
      {!loading && !error && recs.length === 0 && (
        <p className="text-xs text-white/50 text-center py-4">
          Cliquez sur Actualiser pour générer vos recommandations.
        </p>
      )}
    </div>
  )
}
