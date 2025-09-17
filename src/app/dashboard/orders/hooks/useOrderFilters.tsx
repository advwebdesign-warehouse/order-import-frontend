import { useState, useEffect, useMemo } from 'react'
import { Order, FilterState } from '../utils/orderTypes'
import { DEFAULT_FILTERS } from '../constants/orderConstants'
import { getUserId, generateStorageKeys } from '../utils/orderUtils'

export function useOrderFilters(orders: Order[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [initialized, setInitialized] = useState(false)

  const userId = getUserId()
  const storageKeys = generateStorageKeys(userId)

  // Load saved filter settings on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(storageKeys.filters)
      const savedShowFilters = localStorage.getItem(storageKeys.showFilters)

      if (savedFilters) {
        setFilters(JSON.parse(savedFilters))
      }

      if (savedShowFilters) {
        setShowFilters(JSON.parse(savedShowFilters))
      }
    } catch (error) {
      console.error('Error loading filter settings:', error)
    } finally {
      setInitialized(true)
    }
  }, [storageKeys.filters, storageKeys.showFilters])

  // Save filter settings when they change
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(storageKeys.filters, JSON.stringify(filters))
      } catch (error) {
        console.error('Error saving filter settings:', error)
      }
    }
  }, [filters, initialized, storageKeys.filters])

  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(storageKeys.showFilters, JSON.stringify(showFilters))
      } catch (error) {
        console.error('Error saving show filters setting:', error)
      }
    }
  }, [showFilters, initialized, storageKeys.showFilters])

  // Filter orders based on current search and filter settings
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search term filtering
      const matchesSearch = searchTerm === '' ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filtering
      const matchesStatus = filters.status === '' || order.status === filters.status

      // Fulfillment status filtering
      const matchesFulfillment = filters.fulfillmentStatus === '' || order.fulfillmentStatus === filters.fulfillmentStatus

      // Platform filtering
      const matchesPlatform = filters.platform === '' || order.platform === filters.platform

      // Date range filtering
      let matchesDateRange = true
      const orderDate = new Date(order.orderDate)

      if (filters.dateRange && filters.dateRange !== '') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        switch (filters.dateRange) {
          case 'today':
            const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
            matchesDateRange = orderDate >= today && orderDate <= todayEnd
            break
          case 'yesterday':
            const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
            const yesterdayEnd = new Date(today.getTime() - 1)
            matchesDateRange = orderDate >= yesterday && orderDate <= yesterdayEnd
            break
          case 'last7days':
            const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDateRange = orderDate >= last7Days
            break
          case 'last30days':
            const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDateRange = orderDate >= last30Days
            break
          case 'thismonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            matchesDateRange = orderDate >= thisMonthStart
            break
          case 'lastmonth':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            matchesDateRange = orderDate >= lastMonthStart && orderDate <= lastMonthEnd
            break
          case 'custom':
            // Use custom date range
            if (filters.startDate) {
              const startDate = new Date(filters.startDate)
              matchesDateRange = matchesDateRange && orderDate >= startDate
            }
            if (filters.endDate) {
              const endDate = new Date(filters.endDate + 'T23:59:59') // Include the entire end date
              matchesDateRange = matchesDateRange && orderDate <= endDate
            }
            break
        }
      }

      return matchesSearch && matchesStatus && matchesFulfillment && matchesPlatform && matchesDateRange
    })
  }, [orders, searchTerm, filters])

  // Helper function to reset filters to defaults
  const resetFilters = () => {
    setSearchTerm('')
    setFilters(DEFAULT_FILTERS)
  }

  return {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredOrders,
    resetFilters
  }
}
