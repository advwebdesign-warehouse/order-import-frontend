// File: app/dashboard/shared/hooks/usePagination.ts

import { useState, useEffect } from 'react'

// Fixed getUserId function with client-side check
function getUserId(): string {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    // Return a default ID for server-side rendering
    return 'user_ssr_fallback'
  }

  try {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', id)
    }
    return id
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available:', error)
    return 'user_fallback_' + Math.random().toString(36).substr(2, 9)
  }
}

interface PaginationSettings {
  ordersPerPage: number
  productsPerPage: number
}

const DEFAULT_PAGINATION: PaginationSettings = {
  ordersPerPage: 20,
  productsPerPage: 20
}

export function usePagination() {
  const [settings, setSettings] = useState<PaginationSettings>(DEFAULT_PAGINATION)
  const [initialized, setInitialized] = useState(false)

  const userId = getUserId()
  const storageKey = `pagination_settings_${userId}`

  // Load saved settings on mount (same pattern as your other hooks)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setInitialized(true)
      return
    }

    try {
      const savedSettings = localStorage.getItem(storageKey)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          ...DEFAULT_PAGINATION,
          ...parsed
        })
      }
    } catch (error) {
      console.error('Error loading pagination settings:', error)
    } finally {
      setInitialized(true)
    }
  }, [storageKey])

  // Save settings when they change (same pattern as your other hooks)
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings))
      } catch (error) {
        console.error('Error saving pagination settings:', error)
      }
    }
  }, [settings, initialized, storageKey])

  // Update orders per page
  const setOrdersPerPage = (count: number) => {
    setSettings(prev => ({
      ...prev,
      ordersPerPage: count
    }))
  }

  // Update products per page
  const setProductsPerPage = (count: number) => {
    setSettings(prev => ({
      ...prev,
      productsPerPage: count
    }))
  }

  return {
    ordersPerPage: settings.ordersPerPage,
    productsPerPage: settings.productsPerPage,
    setOrdersPerPage,
    setProductsPerPage,
    isLoading: !initialized
  }
}
