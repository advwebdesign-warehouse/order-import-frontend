//file path: src/app/dashboard/billing/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Account {
  subscription: {
    plan: string
    billingProvider: string
  }
  integrations: {
    shopify: any[]
    woocommerce: any[]
    etsy: any[]
  }
}

// Mock function - replace with your actual auth system
async function loadAccount(): Promise<Account> {
  // TODO: Replace with actual API call
  const accountData = localStorage.getItem('account')
  if (accountData) {
    return JSON.parse(accountData)
  }

  // Return default account structure
  return {
    subscription: {
      plan: 'Free',
      billingProvider: 'Shopify'
    },
    integrations: {
      shopify: [],
      woocommerce: [],
      etsy: []
    }
  }
}

export default function BillingPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load account from your auth system
    loadAccount().then(setAccount)
  }, [])

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Subscription</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <p className="text-3xl font-bold text-indigo-600">
          {account.subscription.plan}
        </p>
        <p className="text-gray-600 mt-2">
          Billing managed through: {account.subscription.billingProvider}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Connected Platforms</h2>
        <div className="space-y-2">
          <p>🛍️ Shopify: {account.integrations.shopify.length} stores</p>
          <p>🛒 WooCommerce: {account.integrations.woocommerce.length} stores</p>
          <p>🎨 Etsy: {account.integrations.etsy.length} shops</p>
        </div>

        <button
          onClick={() => router.push('/dashboard/integrations')}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Add More Platforms
        </button>
      </div>
    </div>
  )
}
