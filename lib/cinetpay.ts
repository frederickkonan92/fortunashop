// Configuration CinetPay
// Remplace ces valeurs par tes vraies clés une fois ton compte validé
// Obtiens-les sur https://app.cinetpay.com/credential

export var CINETPAY_CONFIG = {
  apikey: process.env.NEXT_PUBLIC_CINETPAY_APIKEY || '',
  site_id: process.env.NEXT_PUBLIC_CINETPAY_SITE_ID || '',
  notify_url: '', // URL webhook — à configurer après deploy
  return_url: '', // URL retour après paiement
  channels: 'ALL', // MOBILE_MONEY, CREDIT_CARD, ou ALL
  currency: 'XOF',
  lang: 'fr',
}

export function getCinetPayUrl(amount: number, orderId: string, description: string) {
  var baseUrl = 'https://api-checkout.cinetpay.com/v2/payment'
  return {
    url: baseUrl,
    payload: {
      apikey: CINETPAY_CONFIG.apikey,
      site_id: CINETPAY_CONFIG.site_id,
      transaction_id: orderId + '-' + Date.now(),
      amount: amount,
      currency: CINETPAY_CONFIG.currency,
      description: description,
      notify_url: CINETPAY_CONFIG.notify_url,
      rel: CINETPAY_CONFIG.return_url,
      channels: CINETPAY_CONFIG.channels,
      lang: CINETPAY_CONFIG.lang,
    }
  }
}
