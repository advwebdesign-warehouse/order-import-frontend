//file path: app/dashboard/products/hooks/useProductColumns.tsx

import { useState, useEffect, useMemo } from 'react'
import { Product, ProductColumnConfig, ProductSortState } from '../utils/productTypes'
import { DEFAULT_PRODUCT_COLUMNS, DEFAULT_PRODUCT_SORT } from '../constants/productConstants'
import { useSettings } from '../../shared/hooks/useSettings'
import { getCurrentUserId } from '@/lib/storage/userStorage'

export function useProductColumns(products: Product[]) {
  const { settings } = useSettings()
  const [columns, setColumns] = useState<ProductColumnConfig[]>([])
  const [sortConfig, setSortConfig] = useState<ProductSortState>(DEFAULT_PRODUCT_SORT)
  const [initialized, setInitialized] = useState(false)

  // ✅ NEW: User-specific storage keys
  const userId = getCurrentUserId()
  const storageKeys = {
    columns: `productColumns_${userId}`,
    sortConfig: `productSort_${userId}`
  }

  // ✅ NEW: Load saved user preferences on mount
  useEffect(() => {
    if (typeof window === 'undefined') {
      setInitialized(true)
      return
    }

    try {
      // Load sort config
      const savedSort = localStorage.getItem(storageKeys.sortConfig)
      if (savedSort) {
        const parsedSort = JSON.parse(savedSort)
        setSortConfig(parsedSort)
      }

      // Load column config
      const savedColumns = localStorage.getItem(storageKeys.columns)
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns)

        // Merge with defaults to handle new columns
        const mergedColumns = []

        // First, add saved columns in their saved order
        for (const savedCol of parsedColumns) {
          const defaultCol = DEFAULT_PRODUCT_COLUMNS.find(col => col.id === savedCol.id)
          if (defaultCol) {
            mergedColumns.push({
              ...defaultCol,
              ...savedCol // Override with saved preferences
            })
          }
        }

        // Then add any new default columns that weren't in saved config
        for (const defaultCol of DEFAULT_PRODUCT_COLUMNS) {
          if (!mergedColumns.find(col => col.id === defaultCol.id)) {
            mergedColumns.push(defaultCol)
          }
        }

        setColumns(mergedColumns)
      }
    } catch (error) {
      console.error('Error loading product column settings:', error)
    } finally {
      setInitialized(true)
    }
  }, [storageKeys.columns, storageKeys.sortConfig])

  // ✅ NEW: Save column settings when they change
  useEffect(() => {
    if (initialized && typeof window !== 'undefined' && columns.length > 0) {
      try {
        localStorage.setItem(storageKeys.columns, JSON.stringify(columns))
      } catch (error) {
        console.error('Error saving product column settings:', error)
      }
    }
  }, [columns, initialized, storageKeys.columns])

  // ✅ NEW: Save sort config when it changes
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKeys.sortConfig, JSON.stringify(sortConfig))
      } catch (error) {
        console.error('Error saving product sort config:', error)
      }
    }
  }, [sortConfig, initialized, storageKeys.sortConfig])

  // Initialize columns based on stock management settings
  useEffect(() => {
    // ✅ UPDATED: Only initialize if we don't have saved columns
    if (!initialized) return

    const getFilteredColumns = () => {
      // If we have saved columns, use those
      if (columns.length > 0) {
        return columns
      }

      // Otherwise, initialize from defaults based on stock management
      if (settings.inventory.manageStock) {
        return DEFAULT_PRODUCT_COLUMNS
      } else {
        return DEFAULT_PRODUCT_COLUMNS.map(column => {
          if (column.field === 'stockStatus' || column.field === 'stockQuantity') {
            return { ...column, visible: false }
          }
          return column
        })
      }
    }

    // Only set if columns are empty (first load)
    if (columns.length === 0) {
      setColumns(getFilteredColumns())
    }
  }, [settings.inventory.manageStock, initialized, columns.length])

  // Filter columns for display based on stock management setting
  const visibleColumns = useMemo(() => {
    if (settings.inventory.manageStock) {
      return columns
    } else {
      // Completely hide stock columns from the UI when stock management is disabled
      return columns.filter(col =>
        col.field !== 'stockStatus' &&
        col.field !== 'stockQuantity'
      )
    }
  }, [columns, settings.inventory.manageStock])

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
    if (!settings.inventory.manageStock && (field === 'stockStatus' || field === 'stockQuantity')) {
      return // Don't allow sorting on hidden stock columns
    }

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
    // Don't allow hiding/showing stock columns when stock management is disabled
    const column = columns.find(col => col.id === columnId)
    if (!settings.inventory.manageStock && column &&
        (column.field === 'stockStatus' || column.field === 'stockQuantity')) {
      return
    }

    setColumns(prevColumns => {
      return prevColumns.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    })
  }

  // Handle column reordering (for drag & drop)
  const handleColumnReorder = (newColumns: ProductColumnConfig[]) => {
    setColumns(newColumns)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSortConfig(DEFAULT_PRODUCT_SORT)

    // Reset columns based on current stock management setting
    if (settings.inventory.manageStock) {
      setColumns(DEFAULT_PRODUCT_COLUMNS)
    } else {
      setColumns(DEFAULT_PRODUCT_COLUMNS.map(column => {
        if (column.field === 'stockStatus' || column.field === 'stockQuantity') {
          return { ...column, visible: false }
        }
        return column
      }))
    }
  }

  return {
    columns: visibleColumns,
    sortConfig,
    sortedProducts,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults,
    // Additional helpers
    isStockManagementEnabled: settings.inventory.manageStock,
    stockSettings: settings.inventory,
    isLoading: !initialized // ✅ NEW: Expose loading state
  }
}
