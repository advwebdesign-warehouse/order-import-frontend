//file path: src/lib/shopify/shopifyService.ts (FRONTEND)

import { ShopifyIntegration } from '@/app/dashboard/integrations/types/integrationTypes'
import { IntegrationAPI } from '@/lib/api/integrationApi'

/**
 * ✅ CLEAN ARCHITECTURE: Uses IntegrationAPI for all backend calls
 * ✅ INCREMENTAL SYNC: By default, only syncs orders modified since lastSyncedAt
 * ✅ FIELD PRESERVATION: Never overwrites local fields during sync
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

      // ✅ Initial sync should be a FULL sync to get all orders
      const result = await IntegrationAPI.syncShopify({
        storeId: integration.storeId,
        syncType: 'all',
        fullSync: true  // ✅ Full sync on initial connection
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
   */
   static async updateLastSyncTime(integrationId: string): Promise<void> {
     try {
       await IntegrationAPI.updateIntegration(integrationId, {
         lastSyncedAt: new Date().toISOString()
       })
     } catch (error) {
       console.error('[Shopify Service Frontend] Error updating last sync time:', error)
       // Don't throw - this is not critical
     }
   }

   /**
    * Manual sync (called from UI button)
    *
    * ✅ INCREMENTAL BY DEFAULT: Only fetches orders modified since lastSyncedAt
    * This means your local fulfillmentStatus changes won't be overwritten
    *
    * @param storeId - Store ID
    * @param syncType - What to sync: 'all' | 'orders' | 'products'
    * @param onProgress - Progress callback
    * @param fullSync - If true, fetches ALL orders (use sparingly)
    */
   static async manualSync(
     storeId: string,
     syncType: 'all' | 'orders' | 'products' = 'all',
     onProgress?: (message: string) => void,
    fullSync: boolean = false  // ✅ NEW: Default to incremental sync
  ): Promise<{ orders: number; products: number; ordersNew?: number; ordersUpdated?: number }> {
     try {
       const syncMode = fullSync ? 'full' : 'incremental'
       if (onProgress) onProgress(`Starting ${syncMode} sync...`)

       console.log(`[Shopify Service Frontend] 📦 Starting ${syncMode} sync for store: ${storeId}`)

       // ✅ Use IntegrationAPI with fullSync option
       const result = await IntegrationAPI.syncShopify({
         storeId,
         syncType,
         fullSync
       })

       if (!result.success) {
         throw new Error(result.error || 'Sync failed')
       }

       const message = fullSync
         ? `✅ Full sync: ${result.data.orders} orders (${result.data.ordersNew || 0} new, ${result.data.ordersUpdated || 0} updated)`
         : `✅ Synced ${result.data.ordersNew || 0} new orders, ${result.data.ordersUpdated || 0} updated`

       if (onProgress) onProgress(message)

       return {
         orders: result.data.orders,
         products: result.data.products,
         ordersNew: result.data.ordersNew,
         ordersUpdated: result.data.ordersUpdated
       }
     } catch (error: any) {
       if (onProgress) onProgress(`❌ ${error.message}`)
       throw error
     }
   }

   /**
    * Force full sync - Re-download ALL orders from Shopify
    *
    * ⚠️ USE WITH CAUTION: This will update all orders from Shopify
    * However, it will NOT overwrite local fields like:
    * - fulfillmentStatus
    * - warehouseId
    * - trackingNumber
    * - trackingCarrier
    * - shippingLabel
    */
   static async forceFullSync(
     storeId: string,
     syncType: 'all' | 'orders' | 'products' = 'all',
     onProgress?: (message: string) => void
   ): Promise<{ orders: number; products: number; ordersNew?: number; ordersUpdated?: number }> {
     console.log('[Shopify Service Frontend] 🔄 FORCE FULL SYNC requested')

     return this.manualSync(storeId, syncType, onProgress, true)
   }
 }
