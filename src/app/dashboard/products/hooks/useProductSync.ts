//file path: app/dashboard/products/hooks/useProductSync.ts

import { useState, useCallback, useEffect } from 'react'
import { isEcommerceIntegration } from '@/app/dashboard/integrations/types/integrationTypes'
import type { Integration } from '@/app/dashboard/integrations/types/integrationTypes'
import { useProducts } from './useProducts'
import { IntegrationFactory } from '@/lib/integrations/integrationFactory'
import { EcommerceIntegrationService  } from '@/lib/integrations/base/baseIntegration'

interface SyncProgress {
  integration: string
  status: 'pending' | 'syncing' | 'success' | 'error'
  progress: number
  count: number
  message?: string
}

export function useProductSync(accountId: string, integrations: Integration[]) {
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<Record<string, SyncProgress>>({})
  const [error, setError] = useState<string | null>(null)
  const [ecommerceIntegrations, setEcommerceIntegrations] = useState<Integration[]>([])

  // Load products from API
  const { products: allProducts } = useProducts()

  // Filter to connected ecommerce integrations
  useEffect(() => {
    const ecommerce = integrations.filter(i =>
      isEcommerceIntegration(i) && i.status === 'connected' && i.enabled
    )
    setEcommerceIntegrations(ecommerce)
  }, [integrations])

  /**
   * Generic sync using factory pattern
   * Works with ANY integration automatically
   */
  const syncIntegrationWithFactory = async (integrationData: any) => {
    try {
      console.log(`[Factory Sync] Creating ${integrationData.name} instance...`)

      // Create integration instance using factory
      const integration = IntegrationFactory.create({
        ...integrationData,
        accountId: accountId
      })

      if (!integration) {
        return {
          success: false,
          count: 0,
          error: `${integrationData.name} not supported yet`
        }
      }

      // Verify it's an e-commerce integration
      if (!(integration instanceof EcommerceIntegrationService)) {
        return {
          success: false,
          count: 0,
          error: `${integrationData.name} is not an e-commerce integration`
        }
      }

      // Check if it supports product sync
      if (!integration.supportsFeature('productSync')) {
        return {
          success: false,
          count: 0,
          error: `${integrationData.name} does not support product sync`
        }
      }

      console.log(`[Factory Sync] Syncing products from ${integrationData.name}...`)

      // Sync products using the integration's method
      const result = await integration.syncProducts()

      console.log(`[Factory Sync] ${integrationData.name} result:`, result)

      return result
    } catch (error: any) {
      console.error(`[Factory Sync] Error syncing ${integrationData.name}:`, error)
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Main sync function - syncs products from all connected integrations
   * Uses factory pattern - automatically works with ANY integration
   */
  const syncProducts = useCallback(async () => {
    if (ecommerceIntegrations.length === 0) {
      setError('No ecommerce integrations connected')
      return { success: false, totalCount: 0 }
    }

    setSyncing(true)
    setError(null)

    // Initialize progress for each integration
    const initialProgress: Record<string, SyncProgress> = {}
    ecommerceIntegrations.forEach(integration => {
      initialProgress[integration.id] = {
        integration: integration.name,
        status: 'pending',
        progress: 0,
        count: 0
      }
    })
    setProgress(initialProgress)

    let totalCount = 0
    const errors: string[] = []

    // Sync each integration sequentially
    for (const integration of ecommerceIntegrations) {
      try {
        // Update status to syncing
        setProgress(prev => ({
          ...prev,
          [integration.id]: {
            ...prev[integration.id],
            status: 'syncing',
            progress: 50
          }
        }))

        // Use factory pattern - works with ANY integration
        const result = await syncIntegrationWithFactory(integration)

        if (result.success) {
          totalCount += result.count
          setProgress(prev => ({
            ...prev,
            [integration.id]: {
              ...prev[integration.id],
              status: 'success',
              progress: 100,
              count: result.count
            }
          }))
        } else {
          errors.push(`${integration.name}: ${result.error || 'Unknown error'}`)
          setProgress(prev => ({
            ...prev,
            [integration.id]: {
              ...prev[integration.id],
              status: 'error',
              progress: 0,
              message: result.error
            }
          }))
        }
      } catch (error: any) {
        errors.push(`${integration.name}: ${error.message}`)
        setProgress(prev => ({
          ...prev,
          [integration.id]: {
            ...prev[integration.id],
            status: 'error',
            progress: 0,
            message: error.message
          }
        }))
      }
    }

    setSyncing(false)

    if (errors.length > 0) {
      setError(errors.join('; '))
    }

    return {
      success: totalCount > 0,
      totalCount,
      errors: errors.length > 0 ? errors : undefined
    }
  }, [ecommerceIntegrations, accountId])

  /**
   * Sync products from a specific integration
   * Uses factory pattern - works with ANY integration
   */
  const syncSingleIntegration = useCallback(async (integrationId: string) => {
    const integration = ecommerceIntegrations.find(i => i.id === integrationId)
    if (!integration) {
      return { success: false, count: 0, error: 'Integration not found' }
    }

    setSyncing(true)
    setError(null)

    setProgress({
      [integrationId]: {
        integration: integration.name,
        status: 'syncing',
        progress: 50,
        count: 0
      }
    })

    // Use factory pattern
    const result = await syncIntegrationWithFactory(integration)

    setProgress({
      [integrationId]: {
        integration: integration.name,
        status: result.success ? 'success' : 'error',
        progress: result.success ? 100 : 0,
        count: result.count,
        message: result.error
      }
    })

    setSyncing(false)

    if (!result.success && result.error) {
      setError(result.error)
    }

    return result
  }, [ecommerceIntegrations, accountId])

  /**
   * Get sync statistics
   */
  const getSyncStats = useCallback(() => {
    // Use products from useProducts hook
    // allProducts is already available from the hook above

    // Count by platform
    const byPlatform: Record<string, number> = {}
    const byStore: Record<string, number> = {}

    allProducts.forEach(product => {
      // Count by platform
      if (product.platform) {
        byPlatform[product.platform] = (byPlatform[product.platform] || 0) + 1
      }

      // Count by store
      if (product.storeId) {
        byStore[product.storeId] = (byStore[product.storeId] || 0) + 1
      }
    })

    // Find most recent update date
    const productDates = allProducts
      .map(p => new Date(p.updatedAt))
      .filter(Boolean)

    const lastSyncDate = productDates.length > 0
      ? new Date(Math.max(...productDates.map(d => d.getTime())))
      : undefined

    return {
      totalProducts: allProducts.length,
      byPlatform,
      byStore,
      lastSyncDate
    }
  }, [allProducts])

  return {
    syncProducts,
    syncSingleIntegration,
    syncing,
    progress,
    error,
    ecommerceIntegrations,
    hasIntegrations: ecommerceIntegrations.length > 0,
    integrationCount: ecommerceIntegrations.length,
    getSyncStats
  }
}
