'use client'

export default function PaiementSection({ shop, onSelect, selected }: any) {
  var hasAddon = function(addon: string) { return shop?.addons?.includes(addon) }
  var hasCinetpay = hasAddon('cinetpay')

  var modes = [
    { id: 'whatsapp', label: 'Paiement WhatsApp', desc: 'Contactez l artisan pour payer', icon: '💬', always: true },
  ]

  if (hasCinetpay) {
    modes.push({ id: 'wave', label: 'Wave', desc: 'Paiement mobile Wave', icon: '🌊', always: false })
    modes.push({ id: 'orange', label: 'Orange Money', desc: 'Paiement Orange Money', icon: '🟠', always: false })
    modes.push({ id: 'mtn', label: 'MTN MoMo', desc: 'Paiement MTN Mobile Money', icon: '🟡', always: false })
  }

  return (
    <div>
      <label className="block text-sm font-semibold mb-2">Mode de paiement</label>
      <div className="space-y-2">
        {modes.map(function(mode) {
          return (
            <button key={mode.id} type="button" onCnction() { onSelect(mode.id) }}
                    className={'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ' +
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
      {!hasCinetpay && (
        <p className="text-[11px] text-fs-gray2 mt-2">
          Paiement mobile money disponible prochainement.
        </p>
      )}
    </div>
  )
}
