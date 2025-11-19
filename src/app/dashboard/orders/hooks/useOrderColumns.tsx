// File: app/dashboard/orders/hooks/useOrderColumns.tsx

import { useState, useEffect, useMemo } from 'react'
import { Order, ColumnConfig, SortState } from '../utils/orderTypes'
import { DEFAULT_COLUMNS, WAREHOUSE_ORDER_COLUMNS, DEFAULT_SORT } from '../constants/orderConstants'
import { getCurrentUserId } from '@/lib/storage/userStorage'
import { useStores } from '@/app/dashboard/stores/hooks/useStores'
import { getStoreName, getWarehouseName } from '../utils/warehouseUtils'
import { useWarehouses } from '@/app/dashboard/warehouses/context/WarehouseContext'

export function useOrderColumns(orders: Order[], useWarehouseColumns = false) {
  // Use warehouse columns for warehouse-specific pages
  const initialColumns = useWarehouseColumns ? WAREHOUSE_ORDER_COLUMNS : DEFAULT_COLUMNS

  const [columns, setColumns] = useState<ColumnConfig[]>(initialColumns)
  const [sortConfig, setSortConfig] = useState<SortState>(DEFAULT_SORT)
  const [initialized, setInitialized] = useState(false)

  // Load stores and warehouses for name resolution during sorting
  const { stores } = useStores()
  const { warehouses } = useWarehouses()

  const userId = getCurrentUserId()
  const storageKeys = {
    columns: `orderColumns_${userId}${useWarehouseColumns ? '_warehouse' : ''}`,
    sortConfig: `orderSort_${userId}${useWarehouseColumns ? '_warehouse' : ''}`
  }

  // Load saved settings on mount
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

        // Merge with defaults to handle new columns that might have been added
        const mergedColumns = []

        // First, add saved columns in their saved order
        for (const savedCol of parsedColumns) {
          const defaultCol = initialColumns.find(col => col.id === savedCol.id)
          if (defaultCol) {
            mergedColumns.push({
              ...defaultCol,
              ...savedCol // Override with saved preferences
            })
          }
        }

        // Then add any new default columns that weren't in saved config
        for (const defaultCol of initialColumns) {
          if (!mergedColumns.find(col => col.id === defaultCol.id)) {
            mergedColumns.push(defaultCol)
          }
        }

        setColumns(mergedColumns)
      } else {
        setColumns(initialColumns)
      }
    } catch (error) {
      console.error('Error loading column settings:', error)
      // On error, use defaults
      setColumns(initialColumns)
      setSortConfig(DEFAULT_SORT)
    } finally {
      setInitialized(true)
    }
  }, [storageKeys.columns, storageKeys.sortConfig, useWarehouseColumns])

  // Save column settings when they change
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKeys.columns, JSON.stringify(columns))
      } catch (error) {
        console.error('Error saving column settings:', error)
      }
    }
  }, [columns, initialized, storageKeys.columns])

  // Save sort settings when they change
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKeys.sortConfig, JSON.stringify(sortConfig))
      } catch (error) {
        console.error('Error saving sort settings:', error)
      }
    }
  }, [sortConfig, initialized, storageKeys.sortConfig])

  // Sort orders based on current sort config
  const sortedOrders = useMemo(() => {
    if (!orders.length) return []

    return [...orders].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Get values based on field, using the ACTUAL field names from the data
      switch (sortConfig.field) {
        case 'orderNumber':
          aValue = a.orderNumber || ''
          bValue = b.orderNumber || ''
          break
        case 'customerName':
          aValue = a.customerName || ''
          bValue = b.customerName || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'totalAmount':
          aValue = Number(a.totalAmount) || 0
          bValue = Number(b.totalAmount) || 0
          break
        case 'orderDate':
          aValue = new Date(a.orderDate).getTime() || 0
          bValue = new Date(b.orderDate).getTime() || 0
          break
        case 'fulfillmentStatus':
          aValue = a.fulfillmentStatus || ''
          bValue = b.fulfillmentStatus || ''
          break
        case 'itemCount':
          aValue = a.itemCount || 0
          bValue = b.itemCount || 0
          break
        case 'storeName':
          aValue = getStoreName(a.storeId, stores)
          bValue = getStoreName(b.storeId, stores)
          break
        case 'platform':
          aValue = a.platform || ''
          bValue = b.platform || ''
          break
        case 'requestedShipping':
          aValue = a.requestedShipping || ''
          bValue = b.requestedShipping || ''
          break
        case 'warehouseName':
          aValue = getWarehouseName(a.warehouseId, warehouses)
          bValue = getWarehouseName(b.warehouseId, warehouses)
          break
        case 'country':
          aValue = a.country || ''
          bValue = b.country || ''
          break
        default:
          aValue = String(a[sortConfig.field as keyof Order] || '')
          bValue = String(b[sortConfig.field as keyof Order] || '')
      }

      // Handle numeric comparisons
      if (sortConfig.field === 'totalAmount' || sortConfig.field === 'itemCount') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle date comparisons
      if (sortConfig.field === 'orderDate') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortConfig.direction === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
      }
    })
  }, [orders, sortConfig])

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle column visibility
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    )
  }

  // Handle column reordering
  const handleColumnReorder = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setColumns(initialColumns)
    setSortConfig(DEFAULT_SORT)

    // Also clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKeys.columns)
        localStorage.removeItem(storageKeys.sortConfig)
      } catch (error) {
        console.error('Error clearing column settings:', error)
      }
    }
  }

  return {
    columns,
    sortConfig,
    sortedOrders,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults,
    isLoading: !initialized
  }
}
