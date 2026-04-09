// Composants extraits de commander-client.tsx pour réduire la taille du fichier principal

import { getContrastText } from '@/lib/theme'

// Composant champ de formulaire réutilisable
export function FormField({ label, value, onChange, placeholder, type, required, name, theme, multiline, rows }: any) {
  if (multiline) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          color: theme.text, marginBottom: 6, letterSpacing: 0.5,
          fontFamily: 'var(--font-outfit), sans-serif',
        }}>
          {label} {required && <span style={{ color: theme.primary }}>*</span>}
        </label>
        <textarea name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required} rows={rows || 3}
          style={{
            width: '100%', padding: '12px 16px',
            borderRadius: 10, border: '1.5px solid #E8DDD0',
            fontSize: 14, color: theme.text,
            background: 'white',
            fontFamily: 'var(--font-outfit), sans-serif',
            transition: 'border-color 0.2s',
            outline: 'none', resize: 'none',
          }}
          onFocus={function(e: any) { e.target.style.borderColor = theme.primary }}
          onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
        />
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: theme.text, marginBottom: 6, letterSpacing: 0.5,
        fontFamily: 'var(--font-outfit), sans-serif',
      }}>
        {label} {required && <span style={{ color: theme.primary }}>*</span>}
      </label>
      <input type={type || 'text'} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        style={{
          width: '100%', padding: '12px 16px',
          borderRadius: 10, border: '1.5px solid #E8DDD0',
          fontSize: 14, color: theme.text,
          background: 'white',
          fontFamily: 'var(--font-outfit), sans-serif',
          transition: 'border-color 0.2s',
          outline: 'none',
        }}
        onFocus={function(e: any) { e.target.style.borderColor = theme.primary }}
        onBlur={function(e: any) { e.target.style.borderColor = '#E8DDD0' }}
      />
    </div>
  )
}

// Stepper de progression (3 étapes)
export function Stepper({ currentStep, theme }: any) {
  var steps = [
    { label: 'Panier', step: 1 },
    { label: 'Infos', step: 2 },
    { label: 'Paiement', step: 3 },
  ]
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 0,
      padding: '16px 20px', background: theme.secondary,
    }}>
      {steps.map(function(s, idx) {
        var isActive = s.step <= currentStep
        return (
          <div key={s.step} style={{
            display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: isActive ? theme.primary : '#E8DDD0',
                color: isActive ? getContrastText(theme.primary) : '#7C6C58',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
                transition: 'all 0.3s',
              }}>
                {s.step}
              </div>
              <span style={{
                fontSize: 10, color: isActive ? theme.primary : '#7C6C58',
                fontWeight: isActive ? 600 : 400,
                fontFamily: 'var(--font-outfit), sans-serif',
              }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                width: 40, height: 2, margin: '0 8px',
                background: s.step < currentStep ? theme.primary : '#E8DDD0',
                borderRadius: 1, transition: 'background 0.3s',
                marginBottom: 18,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
