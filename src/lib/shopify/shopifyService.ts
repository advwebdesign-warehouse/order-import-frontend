//file path: src/lib/shopify/shopifyService.ts (FRONTEND)

import { ShopifyIntegration } from '@/app/dashboard/integrations/types/integrationTypes'

export class ShopifyService {
  /**
   * Auto-sync on connection (called after OAuth completes)
   * This just calls the backend API - all the heavy lifting happens there
   */
  static async autoSyncOnConnection(
    integration: ShopifyIntegration,
    accountId: string,
    onProgress?: (message: string) => void
  ): Promise<void> {
    console.log('[Shopify Service Frontend] 🚀 Auto-sync triggered')

    if (onProgress) onProgress('Testing connection to Shopify...')

    try {
      // Test connection first
      const testResult = await this.testConnectionViaAPI(
        integration.config.storeUrl,
        integration.config.accessToken
      )

      if (!testResult.success) {
        throw new Error(testResult.error || testResult.message || 'Connection test failed')
      }

      if (onProgress) onProgress('Connection successful! Syncing data...')

      // Call backend API to sync
      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include httpOnly cookies
        body: JSON.stringify({
          storeId: integration.storeId,
          syncType: 'all' // Sync both orders and products
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Sync failed')
      }

      const message = `✅ Synced ${result.data.orders} orders and ${result.data.products} products`

      if (onProgress) onProgress(message)
      console.log('[Shopify Service Frontend] ✅ Auto-sync complete:', result.data)

      // Update last sync time
      await this.updateLastSyncTime(integration.id)

    } catch (error: any) {
      const message = `❌ Sync error: ${error.message}`

      console.error('[Shopify Service Frontend] ❌ Auto-sync error:', error)

      if (onProgress) onProgress(message)

      // Re-throw so caller knows sync failed
      throw new Error(`Shopify sync failed: ${error.message}`)
    }
  }

  /**
   * Test connection via backend API
   */
  static async testConnectionViaAPI(
    storeUrl: string,
    accessToken: string
  ): Promise<{ success: boolean; error?: string; message?: string; data?: any }> {
    try {
      const response = await fetch('/api/integrations/shopify/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          storeUrl,
          accessToken
        }),
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Connection test failed'
      }
    }
  }

  /**
   * Update last sync time for integration
   */
  static async updateLastSyncTime(integrationId: string): Promise<void> {
    try {
      await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          lastSyncedAt: new Date().toISOString()
        }),
      })
    } catch (error) {
      console.error('[Shopify Service Frontend] Error updating last sync time:', error)
      // Don't throw - this is not critical
    }
  }

  /**
   * Manual sync (called from UI)
   */
  static async manualSync(
    storeId: string,
    syncType: 'all' | 'orders' | 'products' = 'all',
    onProgress?: (message: string) => void
  ): Promise<{ orders: number; products: number }> {
    try {
      if (onProgress) onProgress('Starting sync...')

      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          storeId,
          syncType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Sync failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Sync failed')
      }

      const message = `✅ Synced ${result.data.orders} orders and ${result.data.products} products`
      if (onProgress) onProgress(message)

      return result.data
    } catch (error: any) {
      if (onProgress) onProgress(`❌ ${error.message}`)
      throw error
    }
  }
}
