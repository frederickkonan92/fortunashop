'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import SupportButton from './support-button'
import { HelpButton } from '@/components/help-panel'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      }
      setChecked(true)
    }
    checkAuth()
  }, [])

  if (!checked) {
    return (
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
      {children}
      {pathname !== '/admin/login' && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 100 }}>
          <HelpButton section="faq" label="Aide et FAQ" variant="floating" />
        </div>
      )}
      <SupportButton />
    </>
  )


}
