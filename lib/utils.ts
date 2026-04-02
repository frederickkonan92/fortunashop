export function formatPrice(price: number) {
  return price.toLocaleString('fr-FR') + ' FCFA'
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export { getStatusLabel as statusLabel } from '@/lib/order-status'

export function statusStyle(status: string) {
  var styles: any = {
    nouvelle:       'bg-[#FEF3C7] text-[#D97706]',
    confirmee:      'bg-[#DBEAFE] text-[#2563EB]',
    en_preparation: 'bg-[#FFF0E6] text-[#E8621A]',
    en_livraison:   'bg-[#FFF0E6] text-[#E8621A]',
    prete:          'bg-[#E6F5EE] text-[#2A7A50]',
    livree:         'bg-[#E6F5EE] text-[#2A7A50]',
    annulee:        'bg-[#FEE2E2] text-[#DC2626]',
  }
  return styles[status] || 'bg-gray-100 text-gray-600'
}
