import { useState, useEffect, useMemo } from 'react'
import { Product, ProductColumnConfig, ProductSortState } from '../utils/productTypes'
import { DEFAULT_PRODUCT_COLUMNS, DEFAULT_PRODUCT_SORT } from '../constants/productConstants'

export function useProductColumns(products: Product[]) {
  const [columns, setColumns] = useState<ProductColumnConfig[]>(DEFAULT_PRODUCT_COLUMNS)
  const [sortConfig, setSortConfig] = useState<ProductSortState>(DEFAULT_PRODUCT_SORT)

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

  // Handle column reordering (for drag & drop)
  const handleColumnReorder = (newColumns: ProductColumnConfig[]) => {
    setColumns(newColumns)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSortConfig(DEFAULT_PRODUCT_SORT)
    setColumns(DEFAULT_PRODUCT_COLUMNS)
  }

  return {
    columns,
    sortConfig,
    sortedProducts,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  }
}
