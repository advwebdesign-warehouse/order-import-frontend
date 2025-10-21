//file path: app/dashboard/shared/hooks/usePagination.ts

import { useState, useEffect } from 'react'
import { getCurrentUserId } from '@/lib/storage/userStorage'

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

  // ✅ UPDATED: Use centralized user storage
  const userId = getCurrentUserId()
  const storageKey = `pagination_settings_${userId}`

  // Load saved settings on mount
  useEffect(() => {
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

  // Save settings when they change
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings))
      } catch (error) {
        console.error('Error saving pagination settings:', error)
      }
    }
  }, [settings, initialized, storageKey])

  const setOrdersPerPage = (count: number) => {
    setSettings(prev => ({
      ...prev,
      ordersPerPage: count
    }))
  }

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
