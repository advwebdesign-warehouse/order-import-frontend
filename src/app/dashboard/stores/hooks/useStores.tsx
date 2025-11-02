//file path: src/app/dashboard/stores/hooks/useStores.tsx

'use client'

import { useState, useEffect } from 'react'
import { Store } from '../utils/storeTypes'
import { getStoresFromStorage } from '../utils/storeStorage'

export function useStores() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = () => {
    setLoading(true)
    try {
      const loadedStores = getStoresFromStorage()
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
