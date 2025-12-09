//file path: src/lib/shopify/shopifyService.ts (FRONTEND)

import { ShopifyIntegration } from '@/app/dashboard/integrations/types/integrationTypes'
import { IntegrationAPI } from '@/lib/api/integrationApi'

/**
 * ✅ CLEAN ARCHITECTURE: Uses IntegrationAPI for all backend calls
 * No manual fetch calls, consistent with rest of codebase
 */
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
      // ✅ Test connection using IntegrationAPI
      const testResult = await IntegrationAPI.testShopify({
        storeUrl: integration.config.storeUrl,
        accessToken: integration.config.accessToken
      })

      if (!testResult.success) {
        throw new Error(testResult.error || testResult.message || 'Connection test failed')
      }

      if (onProgress) onProgress('Connection successful! Syncing data...')

      // ✅ Sync data using IntegrationAPI
      const result = await IntegrationAPI.syncShopify({
        storeId: integration.storeId,
        syncType: 'all' // Sync both orders and products
      })

      if (!result.success) {
        throw new Error(result.error || 'Sync failed')
      }

      const message = `✅ Synced ${result.data.orders} orders and ${result.data.products} products`

      if (onProgress) onProgress(message)
      console.log('[Shopify Service Frontend] ✅ Auto-sync complete:', result.data)

      // ✅ Update last sync time using IntegrationAPI
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
      // ✅ Use IntegrationAPI
      const result = await IntegrationAPI.testShopify({
        storeUrl,
        accessToken
      })
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
   * Uses IntegrationAPI.updateIntegration
   */
   static async updateLastSyncTime(integrationId: string): Promise<void> {
     try {
       // ✅ Use IntegrationAPI - only update the timestamp
       await IntegrationAPI.updateIntegration(integrationId, {
         lastSyncedAt: new Date().toISOString()
       })
     } catch (error) {
       console.error('[Shopify Service Frontend] Error updating last sync time:', error)
       // Don't throw - this is not critical
     }
   }

   /**
    * Manual sync (called from UI)
    * Uses IntegrationAPI
    */
   static async manualSync(
     storeId: string,
     syncType: 'all' | 'orders' | 'products' = 'all',
     onProgress?: (message: string) => void
   ): Promise<{ orders: number; products: number }> {
     try {
       if (onProgress) onProgress('Starting sync...')

       // ✅ Use IntegrationAPI
       const result = await IntegrationAPI.syncShopify({
         storeId,
         syncType
       })

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
