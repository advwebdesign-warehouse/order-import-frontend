//file path: src/lib/shopify/shopifyService.ts

import { ShopifyGraphQLClient } from './shopifyGraphQLClient'
import { transformGraphQLOrder, transformGraphQLProduct } from './shopifyGraphQLTransform'
import { saveShopifyOrder, saveShopifyProduct } from './shopifyStorage'
import { ShopifyIntegration } from '@/app/dashboard/integrations/types/integrationTypes'

export interface ShopifyServiceConfig {
  shop: string
  accessToken: string
  accountId: string
  storeId: string
  storeName: string
  warehouseId?: string
}

export class ShopifyService {
  private config: ShopifyServiceConfig
  private client: ShopifyGraphQLClient

  constructor(config: ShopifyServiceConfig) {
    this.config = config
    this.client = new ShopifyGraphQLClient({
      shop: config.shop,
      accessToken: config.accessToken,
    })
  }

  /**
   * Sync orders from Shopify using GraphQL
   * NOTE: This method should only be called server-side
   */
  async syncOrders(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log('[Shopify Service] 🔥 Starting order sync with GraphQL...')

      let allOrders: any[] = []
      let hasNextPage = true
      let endCursor: string | null = null

      // Fetch all orders with pagination
      while (hasNextPage) {
        const response = await this.client.getOrders({
          first: 50,
          after: endCursor || undefined,
        })

        if (response.orders.length === 0) {
          hasNextPage = false
          break
        }

        // Transform and save each order
        for (const graphqlOrder of response.orders) {
          const order = transformGraphQLOrder(
            graphqlOrder,
            this.config.storeId,
            this.config.storeName,
            this.config.warehouseId
          )

          // Save to storage using existing function
          await saveShopifyOrder(order, this.config.accountId)
          allOrders.push(order)
        }

        // Update pagination
        hasNextPage = response.pageInfo.hasNextPage
        endCursor = response.pageInfo.endCursor
      }

      console.log(`[Shopify Service] ✅ Synced ${allOrders.length} orders`)

      return { success: true, count: allOrders.length }
    } catch (error: any) {
      console.error('[Shopify Service] ❌ Order sync failed:', error)
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Sync products from Shopify using GraphQL
   * NOTE: This method should only be called server-side
   */
  async syncProducts(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      console.log('[Shopify Service] 🔥 Starting product sync with GraphQL...')

      let allProducts: any[] = []
      let hasNextPage = true
      let endCursor: string | null = null

      // Fetch all products with pagination
      while (hasNextPage) {
        const response = await this.client.getProducts({
          first: 50,
          after: endCursor || undefined,
        })

        if (response.products.length === 0) {
          hasNextPage = false
          break
        }

        // Transform and save each product
        for (const graphqlProduct of response.products) {
          const product = transformGraphQLProduct(
            graphqlProduct,
            this.config.storeId
          )

          // Save to storage using existing function
          await saveShopifyProduct(product, this.config.accountId)
          allProducts.push(product)
        }

        // Update pagination
        hasNextPage = response.pageInfo.hasNextPage
        endCursor = response.pageInfo.endCursor
      }

      console.log(`[Shopify Service] ✅ Synced ${allProducts.length} products`)

      return { success: true, count: allProducts.length }
    } catch (error: any) {
      console.error('[Shopify Service] ❌ Product sync failed:', error)
      return { success: false, count: 0, error: error.message }
    }
  }

  /**
   * Sync both orders and products
   * NOTE: This method should only be called server-side
   */
  async syncAll(): Promise<{
    success: boolean
    ordersCount: number
    productsCount: number
    errors: string[]
  }> {
    console.log('[Shopify Service] 🔄 Starting full sync with GraphQL...')

    const errors: string[] = []

    // Sync orders
    const ordersResult = await this.syncOrders()
    if (!ordersResult.success && ordersResult.error) {
      errors.push(`Orders: ${ordersResult.error}`)
    }

    // Sync products
    const productsResult = await this.syncProducts()
    if (!productsResult.success && productsResult.error) {
      errors.push(`Products: ${productsResult.error}`)
    }

    const success = ordersResult.success || productsResult.success

    console.log('[Shopify Service] ✅ Full sync complete', {
      orders: ordersResult.count,
      products: productsResult.count,
      errors: errors.length
    })

    return {
      success,
      ordersCount: ordersResult.count,
      productsCount: productsResult.count,
      errors
    }
  }

  /**
   * Test connection to Shopify using GraphQL
   * NOTE: This method should only be called server-side
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[Shopify Service] 🔍 Testing connection with GraphQL...')

      const result = await this.client.testConnection()

      if (result.success) {
        console.log('[Shopify Service] ✅ Connection test successful:', result.shop.name)
        return true
      } else {
        console.error('[Shopify Service] ❌ Connection test failed')
        return false
      }
    } catch (error) {
      console.error('[Shopify Service] ❌ Connection test error:', error)
      return false
    }
  }

  /**
   * Static helper: Get last sync time for an integration
   */
  static getLastSyncTime(integrationId: string): Date | null {
    if (typeof window === 'undefined') return null

    const syncKey = `shopify_last_sync_${integrationId}`
    const lastSync = localStorage.getItem(syncKey)
    return lastSync ? new Date(lastSync) : null
  }

  /**
   * Static helper: Update last sync time for an integration
   */
  static updateLastSyncTime(integrationId: string): void {
    if (typeof window === 'undefined') return

    const syncKey = `shopify_last_sync_${integrationId}`
    localStorage.setItem(syncKey, new Date().toISOString())
  }

  /**
   * Static helper: Create service from integration
   * ✅ FIXED: Warehouse must be passed from the store, not from integration
   * Caller should get warehouse from store.warehouseConfig.defaultWarehouseId
   */
  static fromIntegration(
    integration: ShopifyIntegration,
    storeName: string,
    warehouseId: string | undefined,
    accountId: string = 'default'
  ): ShopifyService {
    return new ShopifyService({
      shop: integration.config.storeUrl,
      accessToken: integration.config.accessToken,
      accountId: accountId,
      storeId: integration.storeId,
      storeName: storeName,
      warehouseId: warehouseId,
    })
  }

  /**
   * CLIENT-SAFE: Call API route to sync data via server-side proxy
   * This method can be safely called from the client (browser)
   * Uses your existing API route at /api/integrations/shopify/sync
   * Returns the data for the client to save
   */
  static async syncViaAPI(
    shop: string,
    accessToken: string,
    accountId: string,
    storeId: string,
    storeName: string,
    warehouseId: string | undefined,
    syncType: 'orders' | 'products' | 'all'
  ): Promise<any> {
    try {
      console.log(`[Shopify Service] 🌐 Calling API route for syncType: ${syncType}`)

      const response = await fetch('/api/integrations/shopify/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          accessToken,
          accountId,
          storeId,
          storeName,
          warehouseId,
          syncType, // Using 'syncType' to match your API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[Shopify Service] ✅ API route ${syncType} successful:`, result)

      // Return the result which includes the data
      return result
    } catch (error: any) {
      console.error(`[Shopify Service] ❌ API route ${syncType} failed:`, error)
      throw error
    }
  }

  /**
   * CLIENT-SAFE: Auto-sync on integration connection via API route
   * This is called automatically when a Shopify store is first connected
   * This method is safe to call from the client (browser)
   * Fetches data from API and saves it client-side
   *
   * ✅ FIXED: warehouseId now comes from the store, not from integration
   */
  static async autoSyncOnConnection(
    integration: ShopifyIntegration,
    storeName: string,
    warehouseId: string | undefined,
    accountId: string = 'default',
    onProgress?: (message: string) => void
  ): Promise<void> {
    console.log('[Shopify Service] 🚀 Auto-sync triggered on connection (via API route)')

    if (onProgress) onProgress('Starting sync via API...')

    try {
      // Call the API route to fetch data
      const result = await ShopifyService.syncViaAPI(
        integration.config.storeUrl,
        integration.config.accessToken,
        accountId,
        integration.storeId,
        storeName,
        warehouseId,
        'all' // Sync both orders and products
      )

      if (result.success && result.data) {
        console.log('[Shopify Service] 💾 Saving data to localStorage...')

        // Save orders to localStorage (client-side)
        if (result.data.orders && Array.isArray(result.data.orders)) {
          for (const order of result.data.orders) {
            await saveShopifyOrder(order, accountId)
          }
          console.log(`[Shopify Service] ✅ Saved ${result.data.orders.length} orders`)
        }

        // Save products to localStorage (client-side)
        if (result.data.products && Array.isArray(result.data.products)) {
          for (const product of result.data.products) {
            await saveShopifyProduct(product, accountId)
          }
          console.log(`[Shopify Service] ✅ Saved ${result.data.products.length} products`)
        }

        // Update last sync time
        ShopifyService.updateLastSyncTime(integration.id)

        const message = `✅ Synced ${result.orderCount || 0} orders and ${result.productCount || 0} products`

        if (onProgress) onProgress(message)
        console.log('[Shopify Service] ✅ Auto-sync complete via API')
      } else {
        const message = `❌ Sync failed: ${result.error || result.message || 'Unknown error'}`
        if (onProgress) onProgress(message)
        console.error('[Shopify Service] ❌ Auto-sync failed via API')
      }
    } catch (error: any) {
      const message = `❌ Sync error: ${error.message}`
      if (onProgress) onProgress(message)
      console.error('[Shopify Service] ❌ Auto-sync error:', error)
      throw error
    }
  }
}
