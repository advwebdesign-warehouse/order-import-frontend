// File: app/dashboard/orders/hooks/useOrderFilters.ts

import { useState, useEffect, useMemo, useCallback  } from 'react'
import { Order, FilterState } from '../utils/orderTypes'
import { DEFAULT_FILTERS } from '../constants/orderConstants'
import { useStores } from '@/app/dashboard/stores/hooks/useStores'
import { getStoreName, getWarehouseName } from '../utils/warehouseUtils'
import { useWarehouses } from '@/app/dashboard/warehouses/context/WarehouseContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'

// Default filters with Processing, Shipped, and Delivered pre-selected
const DEFAULT_FILTERS_WITH_PRESETS: FilterState = {
  ...DEFAULT_FILTERS,  // ✅ Uses constant from orderConstants
  status: ['PROCESSING'], // Processing status
  fulfillmentStatus: ['SHIPPED', 'DELIVERED'], // Shipped and Delivered fulfillment statuses
  platform: [],
  storeId: [],
  dateRange: '',
  startDate: '',
  endDate: '',
  warehouseId: ''
}

// Helper function to validate and normalize filter state
const validateFilterState = (filters: any): FilterState => {
  return {
    status: Array.isArray(filters?.status) ? filters.status : [],
    fulfillmentStatus: Array.isArray(filters?.fulfillmentStatus) ? filters.fulfillmentStatus : [],
    platform: Array.isArray(filters?.platform) ? filters.platform : [],
    storeId: Array.isArray(filters?.storeId) ? filters.storeId : [],
    dateRange: filters?.dateRange || '',
    startDate: filters?.startDate || '',
    endDate: filters?.endDate || '',
    warehouseId: filters?.warehouseId || ''
  }
}

export function useOrderFilters(orders: Order[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFiltersInternal] = useState<FilterState>(() =>
    validateFilterState(DEFAULT_FILTERS_WITH_PRESETS)
  )

  // ✅ Use backend preferences instead of localStorage
  const {
    preferences,
    updateField,
    loading: preferencesLoading
  } = useUserPreferences()

  // Load stores and warehouses for name resolution in search
  const { stores } = useStores()
  const { warehouses } = useWarehouses()

  // Safe setter that validates filter state
  const setFilters = useCallback((newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersInternal(prev => {
      const updatedFilters = typeof newFilters === 'function' ? newFilters(prev) : newFilters
      const validated = validateFilterState(updatedFilters)

      // ✅ Save to backend (async, non-blocking)
      updateField('orderFilters', validated).catch(err => {
        console.error('[useOrderFilters] Error saving filters:', err)
      })

      return validated
    })
  }, [updateField])

  const showFilters = preferences?.showOrderFilters ?? false

  const setShowFilters = useCallback((show: boolean | ((prev: boolean) => boolean)) => {
    // ✅ Get current value from preferences directly
    const currentValue = preferences?.showOrderFilters ?? false
    const newValue = typeof show === 'function' ? show(currentValue) : show

    // ✅ FIXED: Actually save the new value to backend
    updateField('showOrderFilters', newValue).catch(err => {
      console.error('[useOrderFilters] Error saving showOrderFilters:', err)
    })
  }, [preferences, updateField])

  // ✅ Load saved filter settings from backend preferences on mount
  useEffect(() => {
    if (!preferencesLoading && preferences) {
      // Load filters from backend
      if (preferences.orderFilters) {
        const validatedFilters = validateFilterState(preferences.orderFilters)
        setFiltersInternal(validatedFilters)
      } else {
        // Use defaults if no saved filters
        setFiltersInternal(validateFilterState(DEFAULT_FILTERS_WITH_PRESETS))
      }
    }
  }, [preferencesLoading, preferences])

  // Filter orders based on current filters and search term
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []

    // Ensure filters are always in the correct format
    const safeFilters = validateFilterState(filters)

    return orders.filter((order) => {
      // Text search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const searchableText = [
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          order.platform,
          getStoreName(order.storeId, stores),
          getWarehouseName(order.warehouseId, warehouses),
          order.country,
          order.status,
          order.fulfillmentStatus
        ].join(' ').toLowerCase()

        if (!searchableText.includes(searchLower)) {
          return false
        }
      }

      // Status filter (multi-select) - Safe array access
      if (safeFilters.status.length > 0 && !safeFilters.status.includes(order.status)) {
        return false
      }

      // Fulfillment status filter (multi-select) - Safe array access
      if (safeFilters.fulfillmentStatus.length > 0 && !safeFilters.fulfillmentStatus.includes(order.fulfillmentStatus)) {
        return false
      }

      // Platform filter (multi-select) - Safe array access
      if (safeFilters.platform.length > 0 && !safeFilters.platform.includes(order.platform)) {
        return false
      }

      // Warehouse filter (single select)
      if (safeFilters.warehouseId && order.warehouseId !== safeFilters.warehouseId) {
        return false
      }

      // Store filter - check storeId (required field in Order interface)
      if (safeFilters.storeId.length > 0) {
        const orderStoreId = order.storeId || ''
        if (!safeFilters.storeId.includes(orderStoreId)) {
          return false
        }
      }

      // Date range filter
      if (safeFilters.dateRange && safeFilters.dateRange !== '') {
        const orderDate = new Date(order.orderDate)
        const today = new Date()
        today.setHours(23, 59, 59, 999) // End of today

        switch (safeFilters.dateRange) {
          case 'today':
            const startOfToday = new Date()
            startOfToday.setHours(0, 0, 0, 0)
            if (orderDate < startOfToday || orderDate > today) return false
            break

          case 'yesterday':
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            yesterday.setHours(0, 0, 0, 0)
            const endOfYesterday = new Date(yesterday)
            endOfYesterday.setHours(23, 59, 59, 999)
            if (orderDate < yesterday || orderDate > endOfYesterday) return false
            break

          case 'last7days':
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            sevenDaysAgo.setHours(0, 0, 0, 0)
            if (orderDate < sevenDaysAgo) return false
            break

          case 'last30days':
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            thirtyDaysAgo.setHours(0, 0, 0, 0)
            if (orderDate < thirtyDaysAgo) return false
            break

          case 'last90days':
            const ninetyDaysAgo = new Date()
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
            ninetyDaysAgo.setHours(0, 0, 0, 0)
            if (orderDate < ninetyDaysAgo) return false
            break

          case 'thismonth':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            if (orderDate < startOfMonth) return false
            break

          case 'lastmonth':
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
            if (orderDate < startOfLastMonth || orderDate > endOfLastMonth) return false
            break

          case 'custom':
            if (safeFilters.startDate) {
              const startDate = new Date(safeFilters.startDate)
              startDate.setHours(0, 0, 0, 0)
              if (orderDate < startDate) return false
            }
            if (safeFilters.endDate) {
              const endDate = new Date(safeFilters.endDate)
              endDate.setHours(23, 59, 59, 999)
              if (orderDate > endDate) return false
            }
            break
        }
      }

      return true
    })
  }, [orders, searchTerm, filters, stores, warehouses])

  return {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters: validateFilterState(filters), // Always return validated filters
    setFilters, // Use the safe setter
    filteredOrders,
    preferencesLoading
  }
}
