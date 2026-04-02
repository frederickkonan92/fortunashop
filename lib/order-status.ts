var ORDER_STATUSES: Record<string, { label: string; color: string; isFinal: boolean }> = {
  nouvelle: { label: 'Nouvelle', color: 'blue', isFinal: false },
  confirmee: { label: 'Confirmée', color: 'green', isFinal: false },
  en_preparation: { label: 'En préparation', color: 'orange', isFinal: false },
  en_livraison: { label: 'En livraison', color: 'orange', isFinal: false },
  prete: { label: 'Prête', color: 'green', isFinal: true },
  livree: { label: 'Livrée', color: 'green', isFinal: true },
  annulee: { label: 'Annulée', color: 'red', isFinal: true },
}

function getStatusLabel(status: string): string {
  var s = ORDER_STATUSES[status]
  return s ? s.label : status
}

function isStatusFinal(status: string): boolean {
  var s = ORDER_STATUSES[status]
  return s ? s.isFinal : false
}

export { ORDER_STATUSES, getStatusLabel, isStatusFinal }
