//file path: app/dashboard/products/hooks/useProductPreferences.tsx

import { useState, useEffect, useCallback } from 'react'
import { UserAPI } from '@/lib/api/userApi'
import { ProductColumnConfig, ProductSortState, ProductFilterState } from '../utils/productTypes'
import { DEFAULT_PRODUCT_COLUMNS, DEFAULT_PRODUCT_SORT, DEFAULT_PRODUCT_FILTERS } from '../constants/productConstants'

interface ProductPreferences {
  columns: ProductColumnConfig[]
  sortConfig: ProductSortState
  filters: ProductFilterState
  showFilters: boolean
}

/**
 * Hook to manage product page preferences via API
 * Syncs user preferences across devices using backend storage
 */
export function useProductPreferences() {
  const [preferences, setPreferences] = useState<ProductPreferences>({
    columns: DEFAULT_PRODUCT_COLUMNS,
    sortConfig: DEFAULT_PRODUCT_SORT,
    filters: DEFAULT_PRODUCT_FILTERS,
    showFilters: false
  })
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Load preferences from API on mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const userPrefs = await UserAPI.getPreferences()

      // Parse and validate preferences
      const loadedColumns = userPrefs.productColumns
        ? mergeColumnsWithDefaults(userPrefs.productColumns)
        : DEFAULT_PRODUCT_COLUMNS

      const loadedSort = userPrefs.productSortConfig || DEFAULT_PRODUCT_SORT
      const loadedFilters = userPrefs.productFilters || DEFAULT_PRODUCT_FILTERS
      const loadedShowFilters = userPrefs.showProductFilters ?? false

      setPreferences({
        columns: loadedColumns,
        sortConfig: loadedSort,
        filters: loadedFilters,
        showFilters: loadedShowFilters
      })
    } catch (error) {
      console.error('[useProductPreferences] Error loading preferences:', error)
      // Use defaults on error
      setPreferences({
        columns: DEFAULT_PRODUCT_COLUMNS,
        sortConfig: DEFAULT_PRODUCT_SORT,
        filters: DEFAULT_PRODUCT_FILTERS,
        showFilters: false
      })
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  /**
   * Merge saved columns with defaults to handle new columns
   */
  const mergeColumnsWithDefaults = (savedColumns: any[]): ProductColumnConfig[] => {
    const mergedColumns: ProductColumnConfig[] = []

    // First, add saved columns in their saved order
    for (const savedCol of savedColumns) {
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

    return mergedColumns
  }

  /**
   * Update columns and save to API
   */
  const updateColumns = useCallback(async (newColumns: ProductColumnConfig[]) => {
    try {
      setPreferences(prev => ({ ...prev, columns: newColumns }))
      await UserAPI.updatePreferenceField('productColumns', newColumns)
    } catch (error) {
      console.error('[useProductPreferences] Error saving columns:', error)
    }
  }, [])

  /**
   * Update sort config and save to API
   */
  const updateSortConfig = useCallback(async (newSort: ProductSortState) => {
    try {
      setPreferences(prev => ({ ...prev, sortConfig: newSort }))
      await UserAPI.updatePreferenceField('productSortConfig', newSort)
    } catch (error) {
      console.error('[useProductPreferences] Error saving sort config:', error)
    }
  }, [])

  /**
   * Update filters and save to API
   */
  const updateFilters = useCallback(async (newFilters: ProductFilterState) => {
    try {
      setPreferences(prev => ({ ...prev, filters: newFilters }))
      await UserAPI.updatePreferenceField('productFilters', newFilters)
    } catch (error) {
      console.error('[useProductPreferences] Error saving filters:', error)
    }
  }, [])

  /**
   * Update showFilters and save to API
   */
  const updateShowFilters = useCallback(async (show: boolean) => {
    try {
      setPreferences(prev => ({ ...prev, showFilters: show }))
      await UserAPI.updatePreferenceField('showProductFilters', show)
    } catch (error) {
      console.error('[useProductPreferences] Error saving showFilters:', error)
    }
  }, [])

  /**
   * Reset all preferences to defaults
   */
  const resetToDefaults = useCallback(async () => {
    try {
      const defaultPrefs = {
        columns: DEFAULT_PRODUCT_COLUMNS,
        sortConfig: DEFAULT_PRODUCT_SORT,
        filters: DEFAULT_PRODUCT_FILTERS,
        showFilters: false
      }

      setPreferences(defaultPrefs)

      await UserAPI.updatePreferences({
        productColumns: DEFAULT_PRODUCT_COLUMNS,
        productSortConfig: DEFAULT_PRODUCT_SORT,
        productFilters: DEFAULT_PRODUCT_FILTERS,
        showProductFilters: false
      })
    } catch (error) {
      console.error('[useProductPreferences] Error resetting preferences:', error)
    }
  }, [])

  return {
    preferences,
    loading,
    initialized,
    updateColumns,
    updateSortConfig,
    updateFilters,
    updateShowFilters,
    resetToDefaults
  }
}
