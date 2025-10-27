//file path: app/dashboard/stores/hooks/useStoreFilters.tsx

import { useState, useMemo } from 'react'
import { Store } from '../utils/storeTypes'

export function useStoreFilters(stores: Store[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Filter stores based on current search
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      // Search term filtering
      const matchesSearch = searchTerm === '' ||
        (store.storeName && store.storeName.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesSearch
    })
  }, [stores, searchTerm])

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('')
  }

  return {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filteredStores,
    clearAllFilters
  }
}
