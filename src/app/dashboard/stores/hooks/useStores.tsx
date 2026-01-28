//file path: src/app/dashboard/stores/hooks/useStores.tsx

'use client'

import { useState, useEffect } from 'react'
import { Store, LinkedIntegration } from '@/app/dashboard/stores/utils/storeTypes'
import { storeApi } from '@/app/services/storeApi'

// ✅ NEW: Helper to compute linked integrations for stores
async function computeLinkedIntegrations(stores: Store[]): Promise<Store[]> {
  try {
    // Fetch all integrations
    const response = await fetch('/api/integrations', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.warn('[useStores] Failed to fetch integrations, skipping linking')
      return stores
    }

    const data = await response.json()
    const integrations = data.integrations || []

    console.log('[useStores] Computing linked integrations for', stores.length, 'stores from', integrations.length, 'integrations')

    // Map each store to include linked integrations
    return stores.map(store => {
      const linkedIntegrations: LinkedIntegration[] = []

      for (const integration of integrations) {
        // Only e-commerce integrations are linked to stores
        // Shipping and warehouse integrations are not store-specific
        if (integration.type === 'ecommerce' && integration.storeId === store.id) {
          linkedIntegrations.push({
            id: integration.id,
            name: integration.name,
            type: integration.type,
            status: integration.status || 'active',
            logo: integration.logo,
            provider: integration.provider || integration.name, // e.g., 'Shopify', 'WooCommerce'
          })
        }
      }

      return {
        ...store,
        linkedIntegrations,
      }
    })
  } catch (error) {
    console.error('[useStores] Error computing linked integrations:', error)
    return stores
  }
}

export function useStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    setLoading(true)
    try {
      // ✅ Fetch stores from API (accountId handled by backend via auth token)
      let loadedStores = await storeApi.getStores()

      // ✅ Compute linked integrations
      loadedStores = await computeLinkedIntegrations(loadedStores)

      console.log('[useStores] ✅ Loaded', loadedStores.length, 'stores with integrations')

      setStores(loadedStores)
    } catch (error) {
      console.error('[useStores] Error loading stores:', error)
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  const refetchStores = () => {
    loadStores()
  }

  return {
    stores,
    loading,
    refetchStores
  }
}
