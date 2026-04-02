'use client'

import { useEffect, useState } from 'react'

var STORAGE_PREFIX = 'fortunashop_collecte_check_v1_'

export default function CollecteCheckItem({
  id,
  text,
  hint,
}: {
  id: string
  text: string
  hint?: string
}) {
  var storageKey = STORAGE_PREFIX + id

  var [checked, setChecked] = useState(function() {
    if (typeof window === 'undefined') return false
    try {
      return window.localStorage.getItem(storageKey) === '1'
    } catch {
      return false
    }
  })

  useEffect(function() {
    try {
      setChecked(window.localStorage.getItem(storageKey) === '1')
    } catch {
      // Si localStorage est indisponible (navigation privée, blocage navigateur, etc.), on reste à l'état local.
    }
  }, [storageKey])

  function toggleChecked() {
    var next = !checked
    setChecked(next)
    try {
      window.localStorage.setItem(storageKey, next ? '1' : '0')
    } catch {
      // Ignore : on ne doit pas bloquer la page si localStorage est indisponible.
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
      <button
        type="button"
        onClick={toggleChecked}
        aria-checked={checked}
        role="checkbox"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: '2px solid #DC5014',
          flexShrink: 0,
          marginTop: 2,
          background: checked ? '#2A7A50' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
        title={checked ? 'Marqué comme envoyé' : 'Marquer comme envoyé'}
      >
        {checked && (
          <span style={{ color: 'white', fontSize: 14, fontWeight: 900, lineHeight: 1 }}>
            ✓
          </span>
        )}
      </button>

      <div>
        <p
          style={{
            fontSize: 14,
            fontWeight: checked ? 800 : 600,
            color: checked ? '#2A7A50' : '#2C1A0E',
            margin: 0,
            textDecoration: checked ? 'line-through' : 'none',
          }}
        >
          {text}
        </p>
        {hint && (
          <p
            style={{
              fontSize: 11,
              color: checked ? '#2A7A50' : '#7C6C58',
              margin: '3px 0 0 0',
              lineHeight: 1.3,
            }}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  )
}

