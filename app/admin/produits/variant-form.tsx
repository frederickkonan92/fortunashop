// Formulaire de gestion des variantes multi-axes (extrait de produits/page.tsx)

export function VariantForm({
  hasVariants, setHasVariants, setVariants,
  variantType1, setVariantType1, variantType2, setVariantType2,
  values1Input, setValues1Input, values2Input, setValues2Input,
  combinations, generateCombinations, updateComboStock, updateComboPrice,
}: any) {
  return (
    <div className="border-t border-fs-border pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold">Variantes</p>
          <p className="text-[11px] text-fs-gray">Tailles, couleurs, pointures...</p>
        </div>
        {/* Toggle activer/désactiver les variantes */}
        <div onClick={function() { setHasVariants(!hasVariants); setVariants([]) }}
             className={'w-12 h-6 rounded-full cursor-pointer transition-all relative ' + (hasVariants ? 'bg-fs-orange' : 'bg-fs-border')}>
          <div className={'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow ' + (hasVariants ? 'left-6' : 'left-0.5')} />
        </div>
      </div>

      {hasVariants && (
        <div className="space-y-3">
          {/* TYPE DE VARIANTE 1 */}
          <div>
            <label className="block text-xs font-semibold mb-1">Type de variante 1 (ex: Couleur)</label>
            <input type="text" value={variantType1}
              onChange={function(e: any) { setVariantType1(e.target.value) }}
              placeholder="Ex: Couleur, Taille, Matiere..."
              className="w-full border border-fs-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange" />
          </div>

          {/* VALEURS AXE 1 */}
          <div>
            <label className="block text-xs font-semibold mb-1">Valeurs {variantType1 || 'axe 1'} (separees par des virgules)</label>
            <input type="text" value={values1Input}
              onChange={function(e: any) { setValues1Input(e.target.value) }}
              placeholder="Ex: Noir, Rouge, Bleu, Blanc"
              className="w-full border border-fs-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange" />
          </div>

          {/* TYPE DE VARIANTE 2 (optionnel) */}
          <div>
            <label className="block text-xs font-semibold mb-1">Type de variante 2 (optionnel)</label>
            <input type="text" value={variantType2}
              onChange={function(e: any) { setVariantType2(e.target.value) }}
              placeholder="Ex: Taille (laissez vide si un seul axe)"
              className="w-full border border-fs-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange" />
          </div>

          {/* VALEURS AXE 2 (si axe 2 defini) */}
          {variantType2 && (
            <div>
              <label className="block text-xs font-semibold mb-1">Valeurs {variantType2} (separees par des virgules)</label>
              <input type="text" value={values2Input}
                onChange={function(e: any) { setValues2Input(e.target.value) }}
                placeholder="Ex: S, M, L, XL"
                className="w-full border border-fs-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fs-orange" />
            </div>
          )}

          {/* BOUTON GENERER */}
          <button type="button" onClick={generateCombinations}
            className="bg-fs-orange text-white text-xs font-bold px-4 py-2 rounded-xl">
            Generer les combinaisons
          </button>

          {/* TABLEAU DES COMBINAISONS */}
          {combinations.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <p className="text-xs font-semibold text-fs-gray mb-2">{combinations.length} combinaison{combinations.length > 1 ? 's' : ''}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #E8DDD0', fontSize: 11, fontWeight: 600 }}>{variantType1 || 'Axe 1'}</th>
                    {variantType2 && <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #E8DDD0', fontSize: 11, fontWeight: 600 }}>{variantType2}</th>}
                    <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #E8DDD0', fontSize: 11, fontWeight: 600 }}>Stock</th>
                    <th style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '1px solid #E8DDD0', fontSize: 11, fontWeight: 600 }}>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map(function(combo: any, idx: number) {
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #F0EAE0' }}>
                        <td style={{ padding: '6px 8px', fontSize: 12, fontWeight: 600 }}>{combo.value1}</td>
                        {variantType2 && <td style={{ padding: '6px 8px', fontSize: 12 }}>{combo.value2}</td>}
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          <input type="number" value={combo.stock}
                            onChange={function(e: any) { updateComboStock(idx, e.target.value) }}
                            placeholder="-"
                            style={{ width: 56, padding: 4, borderRadius: 6, border: '1px solid #E8DDD0', textAlign: 'center', fontSize: 12 }} />
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                          <input type="number" value={combo.priceOverride}
                            onChange={function(e: any) { updateComboPrice(idx, e.target.value) }}
                            placeholder="-"
                            style={{ width: 72, padding: 4, borderRadius: 6, border: '1px solid #E8DDD0', textAlign: 'center', fontSize: 12 }} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <p className="text-[10px] text-fs-gray2 mt-2">Laissez le stock vide pour illimite. Le prix remplace le prix du produit pour cette combinaison.</p>
            </div>
          )}

          {combinations.length === 0 && (
            <p className="text-xs text-fs-gray2 text-center py-2">Saisissez les valeurs puis cliquez sur &quot;Generer les combinaisons&quot;</p>
          )}
        </div>
      )}
    </div>
  )
}
