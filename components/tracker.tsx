'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PageTracker({ shopId, page, productId }: { shopId: string, page: string, productId?: string }) {
  useEffect(function() {
    var referrer = ''
    try {
      var ref = document.referrer || ''
      if (ref.includes('instagram')) referrer = 'instagram'
      else if (ref.includes('facebook')) referrer = 'facebook'
      else if (ref.includes('wa.me') || ref.includes('whatsapp')) referrer = 'whatsapp'
      else if (ref.includes('t.co') || ref.includes('twitter')) referrer = 'twitter'
      else if (ref.length > 0) referrer = 'autre'
      else referrer = 'direct'
    } catch (e) {
      referrer = 'direct'
    }

    console.log("TRACKER FIRED", shopId, page); supabase.from('page_views').insert({
      shop_id: shopId,
      page: page,
      product_id: productId || null,
      referrer: referrer,
    }).then(function(res) {
      if (res.error) console.log('Tracker error:', res.error)
    })
  }, [])

  return null
}
