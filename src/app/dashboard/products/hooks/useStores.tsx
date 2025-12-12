//file path: app/dashboard/stores/hooks/useStores.tsx

import { useState, useEffect } from 'react'
import { Store } from '@/app/dashboard/stores/utils/storeTypes'
import { apiRequest } from '@/lib/api/baseApi'

export function useStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Mark as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load stores after mounting
  useEffect(() => {
    if (!mounted) {
      return // Skip during SSR
    }

    const fetchStores = async () => {
      console.log('[useStores] 📦 Loading stores from API...')
      setLoading(true)

      try {
        const storesData = await apiRequest('/stores')

        console.log('[useStores] ✅ Loaded stores:', storesData.length)
        setStores(storesData)
        setError(null)
      } catch (err) {
        console.error('[useStores] ❌ Error fetching stores:', err)
        setError('Failed to fetch stores')
        setStores([])
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [mounted])

  const refetchStores = async () => {
    if (!mounted) {
      console.warn('[useStores] ⚠️ Cannot refetch - not mounted yet')
      return
    }

    console.log('[useStores] 🔄 Refetching stores...')
    setLoading(true)

    try {
      const storesData = await apiRequest('/stores')

      console.log('[useStores] ✅ Refetched stores:', storesData.length)
      setStores([...storesData]) // Force re-render with fresh data
      setError(null)
    } catch (err) {
      console.error('[useStores] ❌ Error refetching stores:', err)
      setError('Failed to refetch stores')
    } finally {
      setLoading(false)
    }
  }

  return {
    stores,
    loading,
    error,
    refetchStores
  }
}
