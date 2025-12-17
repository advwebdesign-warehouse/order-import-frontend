//file path: app/dashboard/products/hooks/useProductColumns.tsx

import { useState, useEffect, useMemo } from 'react'
import { Product, ProductColumnConfig, ProductSortState } from '../utils/productTypes'
import { DEFAULT_PRODUCT_COLUMNS, DEFAULT_PRODUCT_SORT } from '../constants/productConstants'
import { useProductPreferences } from './useProductPreferences'

/**
 * Hook to manage product columns and sorting
 *
 * ✅ API-BASED: Uses backend storage for preferences
 * - Column order, visibility, and sorting persist across devices
 * - Synced via API, not localStorage
 */
export function useProductColumns(products: Product[]) {
  const {
    preferences,
    loading: prefsLoading,
    initialized,
    updateColumns: saveColumns,
    updateSortConfig: saveSortConfig,
    resetToDefaults: resetPreferences
  } = useProductPreferences()

  const [columns, setColumns] = useState<ProductColumnConfig[]>(preferences.columns)
  const [sortConfig, setSortConfig] = useState<ProductSortState>(preferences.sortConfig)

  // Sync local state with preferences when they load
  useEffect(() => {
    if (initialized) {
      setColumns(preferences.columns)
      setSortConfig(preferences.sortConfig)
    }
  }, [preferences, initialized])

  // Sort products based on current sort config
  const sortedProducts = useMemo(() => {
    if (!products.length) return []

    return [...products].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Get values based on field, with proper fallbacks
      switch (sortConfig.field) {
        case 'sku':
          aValue = a.sku || ''
          bValue = b.sku || ''
          break
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'type':
          aValue = a.type || ''
          bValue = b.type || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'visibility':
          aValue = a.visibility || ''
          bValue = b.visibility || ''
          break
        case 'stockStatus':
          aValue = a.stockStatus || ''
          bValue = b.stockStatus || ''
          break
        case 'category':
          aValue = a.category || ''
          bValue = b.category || ''
          break
        case 'vendor':
          aValue = a.vendor || ''
          bValue = b.vendor || ''
          break
        case 'brand':
          aValue = a.brand || ''
          bValue = b.brand || ''
          break
        case 'parentName':
          aValue = a.parentName || ''
          bValue = b.parentName || ''
          break
        // ✅ Platform sorting
        case 'platform':
          aValue = a.platform || ''
          bValue = b.platform || ''
          break
        // ✅ Store sorting (by storeId)
        case 'store':
          aValue = a.storeId || ''
          bValue = b.storeId || ''
          break
        case 'price':
          aValue = Number(a.price) || 0
          bValue = Number(b.price) || 0
          break
        case 'comparePrice':
          aValue = Number(a.comparePrice) || 0
          bValue = Number(b.comparePrice) || 0
          break
        case 'costPrice':
          aValue = Number(a.costPrice) || 0
          bValue = Number(b.costPrice) || 0
          break
        case 'stockQuantity':
          aValue = Number(a.stockQuantity) || 0
          bValue = Number(b.stockQuantity) || 0
          break
        case 'weight':
          aValue = Number(a.weight) || 0
          bValue = Number(b.weight) || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime() || 0
          bValue = new Date(b.createdAt).getTime() || 0
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime() || 0
          bValue = new Date(b.updatedAt).getTime() || 0
          break
        case 'publishedAt':
          aValue = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
          bValue = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
          break
        default:
          // Fallback for any other field
          aValue = String(a[sortConfig.field as keyof Product] || '')
          bValue = String(b[sortConfig.field as keyof Product] || '')
      }

      // Handle different data types for comparison
      if (sortConfig.field === 'price' || sortConfig.field === 'comparePrice' ||
          sortConfig.field === 'costPrice' || sortConfig.field === 'stockQuantity' ||
          sortConfig.field === 'weight') {
        // Numeric comparison
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else if (sortConfig.field === 'createdAt' || sortConfig.field === 'updatedAt' ||
                 sortConfig.field === 'publishedAt') {
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
  }, [products, sortConfig])

  // Handle sorting - prevent sorting on stock columns when stock management is disabled
  const handleSort = (field: string) => {
    const newSort: ProductSortState = {
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    }

    setSortConfig(newSort)
    saveSortConfig(newSort) // Save to API
  }

  // Handle column visibility changes
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    const newColumns = columns.map(col =>
      col.id === columnId ? { ...col, visible } : col
    )

    setColumns(newColumns)
    saveColumns(newColumns) // Save to API
  }

  // Handle column reordering (for drag & drop)
  const handleColumnReorder = (newColumns: ProductColumnConfig[]) => {
    setColumns(newColumns)
    saveColumns(newColumns) // Save to API
  }

  // Reset to defaults
  const resetToDefaults = async () => {
    setColumns(DEFAULT_PRODUCT_COLUMNS)
    setSortConfig(DEFAULT_PRODUCT_SORT)

    // Reset in API
    await resetPreferences()
  }

  return {
    columns,
    sortConfig,
    sortedProducts,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults,
    isLoading: prefsLoading || !initialized
  }
}
