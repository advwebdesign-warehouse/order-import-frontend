//file path: src/lib/integrations/ecommerce/shopifyIntegration.ts
// ✅ FIXED: Now uses IntegrationAPI for sync operations (proper auth + backend URL)

import { EcommerceIntegrationService, IntegrationConfig, SyncResult, TestConnectionResult } from '../base/baseIntegration'
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient'
import { IntegrationAPI } from '@/lib/api/integrationApi'

/**
 * Shopify Integration Implementation
 * ✅ Extends EcommerceIntegrationService
 *
 * ✅ FIXED: Uses IntegrationAPI for sync operations
 * - IntegrationAPI.syncShopify() uses apiRequest which:
 *   - Calls the correct backend URL (API_BASE)
 *   - Includes credentials: 'include' for httpOnly cookies
 *   - Handles errors properly
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
   * ✅ FIXED: Uses IntegrationAPI.syncShopify() for proper backend API call
   */
   async syncProducts(): Promise<SyncResult> {
     try {
       console.log('[ShopifyIntegration] Starting product sync via IntegrationAPI...')
       console.log('[ShopifyIntegration] Store ID:', this.config.storeId)

       // ✅ FIXED: Use IntegrationAPI which handles auth and correct URL
       const result = await IntegrationAPI.syncShopify({
         storeId: this.config.storeId,
         syncType: 'products',
         fullSync: false
       })

      console.log('[ShopifyIntegration] Sync result:', result)

       if (!result.success) {
         throw new Error(result.error || 'Product sync failed')
       }

       const productCount = result.data?.products || 0
       console.log(`[ShopifyIntegration] ✅ Synced ${productCount} products via IntegrationAPI`)

       return {
         success: true,
         count: productCount,
         data: result.data
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
    * ✅ FIXED: Uses IntegrationAPI.syncShopify() for proper backend API call
    */
   async syncOrders(): Promise<SyncResult> {
     try {
      console.log('[ShopifyIntegration] Starting order sync via IntegrationAPI...')

      // ✅ FIXED: Use IntegrationAPI which handles auth and correct URL
      const result = await IntegrationAPI.syncShopify({
        storeId: this.config.storeId,
        syncType: 'orders',
        fullSync: false
      })

       if (!result.success) {
         throw new Error(result.error || 'Order sync failed')
       }

       const orderCount = result.data?.orders || 0
       console.log(`[ShopifyIntegration] ✅ Synced ${orderCount} orders via IntegrationAPI`)

       return {
         success: true,
         count: orderCount,
         data: result.data
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
