//file path: app/dashboard/stores/hooks/useStoreColumns.tsx

import { useState, useMemo } from 'react'
import { Store, StoreColumnConfig, StoreSortState } from '../utils/storeTypes'

const DEFAULT_COLUMNS: StoreColumnConfig[] = [
  { id: 'select', field: 'select', label: '', sortable: false, visible: true },
  { id: 'storeName', field: 'storeName', label: 'Store Name', sortable: true, visible: true },
  { id: 'address', field: 'address', label: 'Address', sortable: false, visible: true },
  { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },
]

const DEFAULT_SORT: StoreSortState = {
  field: 'storeName',
  direction: 'asc'
}

export function useStoreColumns(stores: Store[]) {
  const [columns, setColumns] = useState<StoreColumnConfig[]>(DEFAULT_COLUMNS)
  const [sortConfig, setSortConfig] = useState<StoreSortState>(DEFAULT_SORT)

  // Sort stores based on current sort config
  const sortedStores = useMemo(() => {
    if (!stores.length) return []

    return [...stores].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortConfig.field) {
        case 'storeName':
          aValue = (a.storeName || '').toLowerCase()
          bValue = (b.storeName || '').toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = String(a[sortConfig.field as keyof Store] || '')
          bValue = String(b[sortConfig.field as keyof Store] || '')
      }

      // Handle different data types for comparison
      if (sortConfig.field === 'createdAt') {
        // Date comparison (already converted to timestamps)
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else {
        // String comparison (case insensitive)
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()

        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }
    })
  }, [stores, sortConfig])

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig(prevSort => {
      const newDirection = prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
      return {
        field,
        direction: newDirection
      }
    })
  }

  // Handle column visibility changes
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumns(prevColumns => {
      return prevColumns.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    })
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSortConfig(DEFAULT_SORT)
    setColumns(DEFAULT_COLUMNS)
  }

  return {
    columns,
    sortConfig,
    sortedStores,
    handleSort,
    handleColumnVisibilityChange,
    resetToDefaults
  }
}
