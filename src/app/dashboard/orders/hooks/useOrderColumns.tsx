import { useState, useEffect, useMemo } from 'react'
import { Order, ColumnConfig, SortState } from '../utils/orderTypes'
import { DEFAULT_COLUMNS, DEFAULT_SORT } from '../constants/orderConstants'
import { getUserId, generateStorageKeys } from '../utils/orderUtils'

export function useOrderColumns(orders: Order[]) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [sortConfig, setSortConfig] = useState<SortState>(DEFAULT_SORT)
  const [initialized, setInitialized] = useState(false)

  const userId = getUserId()
  const storageKeys = generateStorageKeys(userId)

  // Load saved settings on mount
  useEffect(() => {
    try {
      const savedSort = localStorage.getItem(storageKeys.sortConfig)
      const savedColumns = localStorage.getItem(storageKeys.columns)

      if (savedSort) {
        setSortConfig(JSON.parse(savedSort))
      }

      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns)
        // Ensure all default columns exist, merge with saved preferences
        const mergedColumns = DEFAULT_COLUMNS.map(defaultCol => {
          const savedCol = parsedColumns.find((col: ColumnConfig) => col.id === defaultCol.id)
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol
        })

        // Preserve the order from saved columns
        const orderedColumns = []
        for (const savedCol of parsedColumns) {
          const foundCol = mergedColumns.find(col => col.id === savedCol.id)
          if (foundCol) {
            orderedColumns.push(foundCol)
          }
        }
        // Add any new columns that weren't in the saved set
        for (const defaultCol of DEFAULT_COLUMNS) {
          if (!orderedColumns.find(col => col.id === defaultCol.id)) {
            orderedColumns.push(defaultCol)
          }
        }
        setColumns(orderedColumns)
      }
    } catch (error) {
      console.error('Error loading column settings:', error)
    } finally {
      setInitialized(true)
    }
  }, [storageKeys.sortConfig, storageKeys.columns])

  // Save settings when they change
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(storageKeys.sortConfig, JSON.stringify(sortConfig))
      } catch (error) {
        console.error('Error saving sort config:', error)
      }
    }
  }, [sortConfig, initialized, storageKeys.sortConfig])

  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(storageKeys.columns, JSON.stringify(columns))
      } catch (error) {
        console.error('Error saving columns config:', error)
      }
    }
  }, [columns, initialized, storageKeys.columns])

  // Sort orders based on current sort config
  const sortedOrders = useMemo(() => {
    if (!orders.length) return []

    return [...orders].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Get values based on field, with proper fallbacks
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
        case 'fulfillmentStatus':
          aValue = a.fulfillmentStatus || ''
          bValue = b.fulfillmentStatus || ''
          break
        case 'platform':
          aValue = a.platform || ''
          bValue = b.platform || ''
          break
        case 'country':
          aValue = a.country || ''
          bValue = b.country || ''
          break
        case 'countryName':
          aValue = a.country || ''
          bValue = b.country || ''
          break
        case 'countryCode':
          aValue = a.countryCode || ''
          bValue = b.countryCode || ''
          break
        case 'currency':
          aValue = a.currency || ''
          bValue = b.currency || ''
          break
        case 'shippingFirstName':
          aValue = a.shippingFirstName || ''
          bValue = b.shippingFirstName || ''
          break
        case 'shippingLastName':
          aValue = a.shippingLastName || ''
          bValue = b.shippingLastName || ''
          break
        case 'shippingFullName':
          aValue = `${a.shippingFirstName} ${a.shippingLastName}`
          bValue = `${b.shippingFirstName} ${b.shippingLastName}`
          break
        case 'requestedShipping':
          aValue = a.requestedShipping || ''
          bValue = b.requestedShipping || ''
          break
        case 'totalAmount':
          aValue = Number(a.totalAmount) || 0
          bValue = Number(b.totalAmount) || 0
          break
        case 'itemCount':
          aValue = Number(a.itemCount) || 0
          bValue = Number(b.itemCount) || 0
          break
        case 'orderDate':
          aValue = new Date(a.orderDate).getTime() || 0
          bValue = new Date(b.orderDate).getTime() || 0
          break
        case 'orderTime':
          aValue = new Date(a.orderDate).getTime() || 0
          bValue = new Date(b.orderDate).getTime() || 0
          break
        case 'orderDay':
          aValue = new Date(a.orderDate).getDay() || 0
          bValue = new Date(b.orderDate).getDay() || 0
          break
        case 'orderMonth':
          aValue = new Date(a.orderDate).getMonth() || 0
          bValue = new Date(b.orderDate).getMonth() || 0
          break
        case 'orderYear':
          aValue = new Date(a.orderDate).getFullYear() || 0
          bValue = new Date(b.orderDate).getFullYear() || 0
          break
        default:
          // Fallback for any other field
          aValue = String(a[sortConfig.field as keyof Order] || '')
          bValue = String(b[sortConfig.field as keyof Order] || '')
      }

      // Handle different data types for comparison
      if (sortConfig.field === 'orderDate' || sortConfig.field === 'orderTime') {
        // Already converted to timestamps above
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else if (sortConfig.field === 'totalAmount' || sortConfig.field === 'itemCount' ||
                 sortConfig.field === 'orderDay' || sortConfig.field === 'orderMonth' || sortConfig.field === 'orderYear') {
        // Numeric comparison
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
  }, [orders, sortConfig])

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
  const handleColumnReorder = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSortConfig(DEFAULT_SORT)
    setColumns(DEFAULT_COLUMNS)

    // Clear localStorage
    try {
      localStorage.removeItem(storageKeys.sortConfig)
      localStorage.removeItem(storageKeys.columns)
    } catch (error) {
      console.error('Error clearing column settings:', error)
    }
  }

  return {
    columns,
    sortConfig,
    sortedOrders,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  }
}
