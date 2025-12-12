//file path: src/app/dashboard/stores/hooks/useStores.tsx

'use client'

import { useState, useEffect } from 'react'
import { Store } from '@/app/dashboard/stores/utils/storeTypes'
import { storeApi } from '@/app/services/storeApi'

export function useStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    setLoading(true)
    try {
      // ✅ UPDATED: Fetch stores from API (accountId handled by backend via auth token)
      const loadedStores = await storeApi.getStores()
      setStores(loadedStores)
    } catch (error) {
      console.error('Error loading stores:', error)
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
