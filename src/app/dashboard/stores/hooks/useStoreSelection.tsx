//file path: app/dashboard/stores/hooks/useStoreSelection.tsx

import { useState } from 'react'
import { Store } from '../utils/storeTypes'

export function useStoreSelection() {
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set())

  const handleSelectStore = (storeId: string) => {
    setSelectedStores(prev => {
      const newSet = new Set(prev)
      if (newSet.has(storeId)) {
        newSet.delete(storeId)
      } else {
        newSet.add(storeId)
      }
      return newSet
    })
  }

  const handleSelectAll = (stores: Store[]) => {
    if (selectedStores.size === stores.length) {
      setSelectedStores(new Set())
    } else {
      setSelectedStores(new Set(stores.map(store => store.id)))
    }
  }

  const clearSelection = () => {
    setSelectedStores(new Set())
  }

  return {
    selectedStores,
    handleSelectStore,
    handleSelectAll,
    clearSelection
  }
}
