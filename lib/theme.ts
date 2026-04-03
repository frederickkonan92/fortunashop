// lib/theme.ts
// Génère les variables CSS de thème à partir des données de la boutique
// Utilisé par le catalogue et les pages boutique pour appliquer les couleurs personnalisées

// Couleurs par défaut (thème fortunashop standard)
export var DEFAULT_THEME = {
  primary: '#DC5014',
  secondary: '#FDF8F3',
  accent: '#F07832',
  text: '#2C1A0E',
}

// Génère un objet de styles CSS à partir des couleurs de la boutique
// Si une couleur n'est pas définie, utilise la valeur par défaut
export function getThemeColors(shop: any) {
  return {
    primary: shop?.primary_color || DEFAULT_THEME.primary,
    secondary: shop?.secondary_color || DEFAULT_THEME.secondary,
    accent: shop?.accent_color || DEFAULT_THEME.accent,
    text: shop?.text_color || DEFAULT_THEME.text,
  }
}

// Génère une version claire d'une couleur (pour les fonds, les hovers)
// Ajoute de la transparence en convertissant hex en rgba
export function getLightColor(hex: string, opacity: number): string {
  var r = parseInt(hex.slice(1, 3), 16)
  var g = parseInt(hex.slice(3, 5), 16)
  var b = parseInt(hex.slice(5, 7), 16)
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')'
}

// Détermine si le texte doit être blanc ou noir sur un fond donné
// Basé sur la luminosité relative de la couleur de fond
export function getContrastText(hex: string): string {
  var r = parseInt(hex.slice(1, 3), 16)
  var g = parseInt(hex.slice(3, 5), 16)
  var b = parseInt(hex.slice(5, 7), 16)
  var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#2C1A0E' : '#FFFFFF'
}
