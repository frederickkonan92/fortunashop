'use client'

export default function PaiementSection({ shop, onSelect, selected }: any) {
  var hasCinetpay = shop?.addons?.includes('cinetpay')

  var modes = [
    { id: 'whatsapp', label: 'Paiement WhatsApp', desc: 'Contactez l artisan pour payer', icon: '💬' },
  ]

  if (hasCinetpay) {
    modes.push({ id: 'wave', label: 'Wave', desc: 'Paiement mobile Wave', icon: '🌊' })
    modes.push({ id: 'orange', label: 'Orange Money', desc: 'Paiement Orange Money', icon: '🟠' })
    modes.push({ id: 'mtn', label: 'MTN MoMo', desc: 'Paiement MTN Mobile Money', icon: '🟡' })
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-2">Mode de paiement</label>
      <div className="space-y-2">
        {modes.map(function(mode) {
          return (
            <button key={mode.id} type="button" onClick={function() { onSelect(mode.id) }}
                    className={'w-full flex items-center gap-3 p-3 rounded-xl border texransition ' +
                      (selected === mode.id ? 'bg-fs-ink text-white border-fs-ink' : 'bg-white text-fs-ink border-fs-border')}>
              <span className="text-xl">{mode.icon}</span>
              <div>
                <p className="text-sm font-semibold">{mode.label}</p>
                <p className={'text-xs ' + (selected === mode.id ? 'text-gray-300' : 'text-fs-gray')}>{mode.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
