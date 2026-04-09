// Extraire les axes de variantes (1 ou 2 axes) depuis un tableau de variantes
// Utilisé par la fiche produit et le popup variantes du catalogue

export function getVariantAxes(vars: any[]) {
  var axes: any[] = []
  // Axe 1
  var types1: string[] = []
  vars.forEach(function(v: any) {
    if (v.variant_type && types1.indexOf(v.variant_type) === -1) types1.push(v.variant_type)
  })
  if (types1.length > 0) {
    var values1: string[] = []
    vars.forEach(function(v: any) {
      if (v.variant_type === types1[0] && values1.indexOf(v.variant_value) === -1) values1.push(v.variant_value)
    })
    axes.push({ type: types1[0], values: values1 })
  }
  // Axe 2 (si existe)
  var types2: string[] = []
  vars.forEach(function(v: any) {
    if (v.variant_type_2 && types2.indexOf(v.variant_type_2) === -1) types2.push(v.variant_type_2)
  })
  if (types2.length > 0) {
    var values2: string[] = []
    vars.forEach(function(v: any) {
      if (v.variant_type_2 === types2[0] && v.variant_value_2 && values2.indexOf(v.variant_value_2) === -1) values2.push(v.variant_value_2)
    })
    axes.push({ type: types2[0], values: values2 })
  }
  return axes
}
