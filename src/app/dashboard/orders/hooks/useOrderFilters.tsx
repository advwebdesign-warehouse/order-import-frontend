// File: app/dashboard/orders/hooks/useOrderFilters.ts

import { useState, useEffect, useMemo } from 'react'
import { Order, FilterState } from '../utils/orderTypes'
import { DEFAULT_FILTERS } from '../constants/orderConstants'
import { getUserId, generateStorageKeys } from '../utils/orderUtils'

// Default filters with Processing, Shipped, and Delivered pre-selected
const DEFAULT_FILTERS_WITH_PRESETS: FilterState = {
  status: ['PROCESSING'], // Processing status
  fulfillmentStatus: ['SHIPPED', 'DELIVERED'], // Shipped and Delivered fulfillment statuses
  platform: [],
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
    dateRange: filters?.dateRange || '',
    startDate: filters?.startDate || '',
    endDate: filters?.endDate || '',
    warehouseId: filters?.warehouseId || ''
  }
}

export function useOrderFilters(orders: Order[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFiltersInternal] = useState<FilterState>(() => validateFilterState(DEFAULT_FILTERS_WITH_PRESETS))
  const [initialized, setInitialized] = useState(false)

  const userId = getUserId()
  const storageKeys = generateStorageKeys(userId)

  // Safe setter that validates filter state
  const setFilters = (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
    setFiltersInternal(prev => {
      const updatedFilters = typeof newFilters === 'function' ? newFilters(prev) : newFilters
      return validateFilterState(updatedFilters)
    })
  }

  // Load saved filter settings on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setInitialized(true)
      return
    }

    try {
      const savedFilters = localStorage.getItem(storageKeys.filters)
      const savedShowFilters = localStorage.getItem(storageKeys.showFilters)

      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters)
        // Use the validation helper to ensure proper structure
        const validatedFilters = validateFilterState({
          ...DEFAULT_FILTERS_WITH_PRESETS,
          ...parsedFilters
        })
        setFiltersInternal(validatedFilters)
      } else {
        // Use defaults with presets when no saved filters exist
        setFiltersInternal(validateFilterState(DEFAULT_FILTERS_WITH_PRESETS))
      }

      if (savedShowFilters) {
        setShowFilters(JSON.parse(savedShowFilters))
      }
    } catch (error) {
      console.error('Error loading filter settings:', error)
      // Reset to safe defaults on error
      setFiltersInternal(validateFilterState(DEFAULT_FILTERS_WITH_PRESETS))
    } finally {
      setInitialized(true)
    }
  }, [storageKeys.filters, storageKeys.showFilters])

  // Save filter settings when they change
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKeys.filters, JSON.stringify(filters))
      } catch (error) {
        console.error('Error saving filter settings:', error)
      }
    }
  }, [filters, initialized, storageKeys.filters])

  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKeys.showFilters, JSON.stringify(showFilters))
      } catch (error) {
        console.error('Error saving show filters setting:', error)
      }
    }
  }, [showFilters, initialized, storageKeys.showFilters])

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
          order.warehouseName,
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
  }, [orders, searchTerm, filters])

  return {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters: validateFilterState(filters), // Always return validated filters
    setFilters, // Use the safe setter
    filteredOrders
  }
}
