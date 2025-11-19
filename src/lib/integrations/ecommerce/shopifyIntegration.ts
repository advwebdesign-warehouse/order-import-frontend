//file path: src/lib/integrations/ecommerce/shopifyIntegration.ts
// UPDATED: Now uses API routes for sync operations to avoid CORS errors

import { EcommerceIntegrationService, IntegrationConfig, SyncResult, TestConnectionResult } from '../base/baseIntegration'
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient'

/**
 * Shopify Integration Implementation
 * ✅ UPDATED: Extends EcommerceIntegrationService (renamed class)
 *
 * UPDATED: Uses API routes for sync operations (no CORS!)
 * - testConnection: Uses client directly (only for testing)
 * - syncProducts: Calls /api/integrations/shopify/sync
 * - syncOrders: Calls /api/integrations/shopify/sync
 */
export class ShopifyIntegration extends EcommerceIntegrationService  {
  private client: ShopifyGraphQLClient | null = null

  constructor(config: IntegrationConfig) {
    super(config)

    // Only initialize client for testConnection
    try {
      this.client = new ShopifyGraphQLClient({
        shop: config.config.storeUrl,
        accessToken: config.config.accessToken,
      })
    } catch (error) {
      console.warn('[ShopifyIntegration] Could not initialize client:', error)
    }
  }

  /**
   * Test connection to Shopify
   * Uses client directly - this is OK because it's typically called from server-side
   */
  async testConnection(): Promise<TestConnectionResult> {
    try {
      console.log('[ShopifyIntegration] Testing connection...')

      if (!this.client) {
        throw new Error('Shopify client not initialized')
      }

      const result = await this.client.testConnection()

      return {
        success: result.success,
        message: `Connected to ${result.shop.name}`,
        details: result.shop
      }
    } catch (error: any) {
      console.error('[ShopifyIntegration] Connection test failed:', error)
      return {
        success: false,
        error: error.message || 'Connection test failed'
      }
    }
  }

  /**
   * Sync products from Shopify
   * UPDATED: Uses API route (server-side) to avoid CORS errors
   */
   async syncProducts(): Promise<SyncResult> {
     try {
       console.log('[ShopifyIntegration] Starting product sync via API route...')

       // ✅ CALL YOUR API ROUTE (not Shopify directly!)
       const response = await fetch('/api/integrations/shopify/sync', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           shop: this.config.config.storeUrl,
           accessToken: this.config.config.accessToken,
           accountId: this.config.accountId,
           syncType: 'products',
           storeId: this.config.storeId,
           forceFullSync: false
         })
       })

       if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: response.statusText }))
         throw new Error(errorData.error || `API error: ${response.statusText}`)
       }

       const result = await response.json()

       if (!result.success) {
         throw new Error(result.error || 'Product sync failed')
       }

       console.log(`[ShopifyIntegration] ✅ Synced ${result.productCount} products via API route`)

       // API route handles saving to storage
      if (result.data?.products && result.data.products.length > 0) {
        console.log(`[ShopifyIntegration] ✅ Saved ${result.data.products.length} products`)
      }

       return {
         success: true,
         count: result.productCount || 0,
         data: result.data?.products || []
       }
     } catch (error: any) {
       console.error('[ShopifyIntegration] Product sync failed:', error)
       return {
         success: false,
         count: 0,
         error: error.message || 'Product sync failed'
       }
     }
   }

   /**
    * Sync orders from Shopify
    * Now actually calls API route (no CORS!)
    */
   async syncOrders(): Promise<SyncResult> {
     try {
       console.log('[ShopifyIntegration] Starting order sync via API route...')

       // ✅ CALL YOUR API ROUTE (not Shopify directly!)
       const response = await fetch('/api/integrations/shopify/sync', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           shop: this.config.config.storeUrl,
           accessToken: this.config.config.accessToken,
           accountId: this.config.accountId,
           syncType: 'orders',
           storeId: this.config.storeId,
           warehouseId: this.config.config.warehouseId,
           forceFullSync: false
         })
       })

       if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: response.statusText }))
         throw new Error(errorData.error || `API error: ${response.statusText}`)
       }

       const result = await response.json()

       if (!result.success) {
         throw new Error(result.error || 'Order sync failed')
       }

       console.log(`[ShopifyIntegration] ✅ Synced ${result.orderCount} orders via API route`)

       // API route already saved to localStorage, just return result
       return {
         success: true,
         count: result.orderCount || 0,
         data: result.data?.orders || []
       }
     } catch (error: any) {
       console.error('[ShopifyIntegration] Order sync failed:', error)
       return {
         success: false,
         count: 0,
         error: error.message || 'Order sync failed'
       }
     }
   }

  /**
   * Get supported features
   */
  getSupportedFeatures(): string[] {
    return [
      'productSync',
      'orderSync',
      'inventorySync',
      'fulfillmentSync',
      'customerSync',
      'webhooks'
    ]
  }

  /**
   * Check if feature is supported
   */
  supportsFeature(feature: string): boolean {
    return this.getSupportedFeatures().includes(feature)
  }
}
