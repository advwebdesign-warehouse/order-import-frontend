//file path: src/app/shopify/auth/page.tsx

import { Suspense } from 'react'
import ShopifyAuthContent from './ShopifyAuthContent'

export default function ShopifyAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <ShopifyAuthContent />
    </Suspense>
  )
}
