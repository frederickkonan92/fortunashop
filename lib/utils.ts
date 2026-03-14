export function formatPrice(price: number) {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function statusStyle(status: string) {
  const styles: any = {
    nouvelle:     'bg-[#FEF3C7] text-[#D97706]',
    confirmee:    'bg-[#DBEAFE] text-[#2563EB]',
    en_livraison: 'bg-[#FFF0E6] text-[#E8621A]',
    livree:       'bg-[#E6F5EE] text-[#2A7A50]',
  }
  return styles[status] || 'bg-gray-100 text-gray-600'
}

export function statusLabel(status: string) {
  const labels: any = {
    nouvelle: 'Nouvelle',
    confirmee: 'Confirmée',
    en_livraison: 'En livraison',
    livree: 'Livrée'
  }
  return labels[status] || status
}
