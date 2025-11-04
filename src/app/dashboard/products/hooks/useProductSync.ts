//file path: app/dashboard/products/hooks/useProductSync.ts

import { useState, useCallback, useEffect } from 'react'
import { getAccountIntegrations, getCurrentAccountId } from '@/lib/storage/integrationStorage'
import { isEcommerceIntegration } from '@/app/dashboard/integrations/types/integrationTypes'
import type { Integration } from '@/app/dashboard/integrations/types/integrationTypes'
import { saveProduct, getProductsFromStorage } from '@/lib/storage/productStorage'

interface SyncProgress {
  integration: string
  status: 'pending' | 'syncing' | 'success' | 'error'
  progress: number
  count: number
  message?: string
}

export function useProductSync(accountId?: string) {
  const aid = accountId || getCurrentAccountId()
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState<Record<string, SyncProgress>>({})
  const [error, setError] = useState<string | null>(null)
  const [ecommerceIntegrations, setEcommerceIntegrations] = useState<Integration[]>([])

  // Load connected ecommerce integrations
  useEffect(() => {
    const integrations = getAccountIntegrations(aid)
    if (integrations) {
      const ecommerce = integrations.integrations.filter(i =>
        isEcommerceIntegration(i) && i.status === 'connected' && i.enabled
      )
      setEcommerceIntegrations(ecommerce)
    }
  }, [aid])

  /**
   * Sync products from Shopify
   */
  const syncShopifyProducts = async (integration: any) => {
    try {
      // Import Shopify-specific sync
      const { ShopifyService } = await import('@/lib/shopify/shopifyService')

      const service = new ShopifyService({
        shop: integration.config.storeUrl,
        accessToken: integration.config.accessToken,
        accountId: aid,
        storeId: integration.storeId,
      })

      const result = await service.syncProducts()
      return result
    } catch (error: any) {
      console.error('[Shopify Sync] Error:', error)
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Sync products from WooCommerce
   */
  const syncWooCommerceProducts = async (integration: any) => {
    try {
      // TODO: Implement WooCommerce product sync
      console.log('[WooCommerce Sync] Starting...')

      // Placeholder - replace with actual WooCommerce sync logic
      return { success: true, count: 0, error: 'WooCommerce sync not implemented yet' }
    } catch (error: any) {
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Sync products from Etsy
   */
  const syncEtsyProducts = async (integration: any) => {
    try {
      // TODO: Implement Etsy product sync
      console.log('[Etsy Sync] Starting...')

      return { success: true, count: 0, error: 'Etsy sync not implemented yet' }
    } catch (error: any) {
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Sync products from eBay
   */
  const syncEbayProducts = async (integration: any) => {
    try {
      // TODO: Implement eBay product sync
      console.log('[eBay Sync] Starting...')

      return { success: true, count: 0, error: 'eBay sync not implemented yet' }
    } catch (error: any) {
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Main sync function - syncs products from all connected integrations
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

        let result
        switch (integration.name) {
          case 'Shopify':
            result = await syncShopifyProducts(integration)
            break
          case 'WooCommerce':
            result = await syncWooCommerceProducts(integration)
            break
          case 'Etsy':
            result = await syncEtsyProducts(integration)
            break
          case 'eBay':
            result = await syncEbayProducts(integration)
            break
          default:
            result = { success: false, count: 0, error: 'Unknown integration type' }
        }

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
  }, [ecommerceIntegrations, aid])

  /**
   * Sync products from a specific integration
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

    let result
    switch (integration.name) {
      case 'Shopify':
        result = await syncShopifyProducts(integration)
        break
      case 'WooCommerce':
        result = await syncWooCommerceProducts(integration)
        break
      case 'Etsy':
        result = await syncEtsyProducts(integration)
        break
      case 'eBay':
        result = await syncEbayProducts(integration)
        break
      default:
        result = { success: false, count: 0, error: 'Unknown integration type' }
    }

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
  }, [ecommerceIntegrations, aid])

  /**
   * Get sync statistics
   */
  const getSyncStats = useCallback(() => {
    const allProducts = getProductsFromStorage(aid)

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
  }, [aid])

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
