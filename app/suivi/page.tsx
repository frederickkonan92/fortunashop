import { Suspense } from 'react'
import SuiviContent from './content'

export default function SuiviPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-fs-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-fs-orange border-t-transparent rounded-full" />
      </div>
    }>
      <SuiviContent />
    </Suspense>
  )
}
