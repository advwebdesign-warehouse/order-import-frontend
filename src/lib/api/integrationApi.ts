//file path: src/lib/api/integrationApi.ts

import { apiRequest, apiRequestOptional } from './baseApi'
import type { CarrierService, ShippingBox, ShippingPreset } from '@/app/dashboard/shipping/utils/shippingTypes'
import type { Integration } from '@/app/dashboard/integrations/types/integrationTypes'

// Re-export Integration type for convenience
export type { Integration } from '@/app/dashboard/integrations/types/integrationTypes'

/**
 * Warehouse type for integration-warehouse linking
 * Matches the warehouse schema from the backend
 */
export interface Warehouse {
  id: string
  accountId: string
  name: string
  code: string
  description?: string
  type: 'PHYSICAL' | 'VIRTUAL' | 'DROPSHIP' | '3PL'
  address: any
  contactInfo: any
  settings: any
  layout?: any
  status: 'ACTIVE' | 'INACTIVE'
  isDefault: boolean
  useDifferentReturnAddress: boolean
  returnAddress?: any
  servesRegions?: string[]
  defaultForRegions?: string[]
  createdAt: string
  updatedAt: string
  // Link config from integrationWarehouses junction table
  linkConfig?: {
    isDefault?: boolean
    priority?: number
    isActive?: boolean
    fulfillmentMethod?: string
    stockCheckRequired?: boolean
    fallbackOnNoStock?: boolean
    minStockThreshold?: number
    servesRegions?: string[]
    servesCountries?: string[]
    servesStates?: string[]
    servesZipCodes?: string[]
    shippingCostFactor?: number
    avgShippingDays?: number
  }
}

/**
 * IntegrationAPI
 * Handles all API calls related to integrations
 * ✅ Added proper type annotations using shippingTypes
 * ✅ Added getIntegrationWarehouses for integration-based warehouse linking
 * ✅ UPDATED: syncShopify now supports fullSync parameter for incremental sync
 */
export class IntegrationAPI {
  /**
   * Get all integrations for the current account
   * ✅ Uses apiRequestOptional - returns empty array on error instead of crashing
   * This is intentional because integrations are optional and shouldn't block the dashboard
   */
  static async getAccountIntegrations(filters?: {
    type?: string
    storeId?: string
  }) {
    let endpoint = '/integrations'
    const params = new URLSearchParams()

    if (filters?.type) {
      params.append('type', filters.type)
    }
    if (filters?.storeId) {
      params.append('storeId', filters.storeId)
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    // ✅ Use apiRequestOptional - won't throw on error
    const response = await apiRequestOptional<{ integrations: Integration[], lastUpdated: string | null }>(
      endpoint,
      { integrations: [], lastUpdated: null }
    )
    return response.integrations || []
  }

  static async getIntegrationById(integrationId: string) {
    const response = await apiRequest(`/integrations/${integrationId}`)
    return response.integration
  }

  // ============================================================================
  // ✅ NEW: INTEGRATION-WAREHOUSE LINKING
  // ============================================================================

  /**
   * ✅ Get warehouses linked to an integration
   * Backend route: GET /integrations/:id/warehouses
   * Returns warehouses with their linkConfig (isDefault, priority, isActive, etc.)
   */
   static async getIntegrationWarehouses(integrationId: string): Promise<Warehouse[]> {
     return apiRequestOptional<Warehouse[]>(
       `/integrations/${integrationId}/warehouses`,
       [] as Warehouse[]
     )
   }

  /**
   * ✅ Link a warehouse to an integration
   * Backend route: POST /integrations/:id/warehouses/:warehouseId
   */
   static async linkWarehouseToIntegration(
     integrationId: string,
     warehouseId: string,
     config?: {
       isDefault?: boolean
       priority?: number
       isActive?: boolean
       fulfillmentMethod?: string
       stockCheckRequired?: boolean
       fallbackOnNoStock?: boolean
       minStockThreshold?: number
       servesRegions?: string[]
       servesCountries?: string[]
       servesStates?: string[]
       servesZipCodes?: string[]
       shippingCostFactor?: number
       avgShippingDays?: number
     }
   ) {
     return apiRequest(`/integrations/${integrationId}/warehouses/${warehouseId}`, {
       method: 'POST',
       body: JSON.stringify(config || {})
     })
   }

   /**
    * ✅ Update warehouse-integration link configuration
    * Backend route: PUT /integrations/:id/warehouses/:warehouseId
    */
    static async updateIntegrationWarehouseLink(
      integrationId: string,
      warehouseId: string,
      updates: any
    ) {
      return apiRequest(`/integrations/${integrationId}/warehouses/${warehouseId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    }

    /**
     * ✅ Unlink a warehouse from an integration
     * Backend route: DELETE /integrations/:id/warehouses/:warehouseId
     */
    static async unlinkWarehouseFromIntegration(integrationId: string, warehouseId: string) {
      return apiRequest(`/integrations/${integrationId}/warehouses/${warehouseId}`, {
        method: 'DELETE'
      })
    }

  // ============================================================================
  // INTEGRATION CRUD
  // ============================================================================

  /**
   * Save a new integration (create or update via upsert)
   * ✅ Backend uses POST for both create and update (upsert)
   * Backend returns: { integration: {...}, lastupdate string }
   */
  static async saveIntegration(integration: any) {
    const response = await apiRequest('/integrations', {
      method: 'POST',
      body: JSON.stringify(integration)
    })
    return response.integration || response
  }

  /**
   * Update an existing integration
   * Sends full integration object to backend
   */
   static async updateIntegration(integrationId: string, integration: any) {
     const response = await apiRequest(`/integrations/${integrationId}`, {
       method: 'PUT',
       body: JSON.stringify(integration)
     })
     return response.integration || response
   }

  /**
   * Update only the config of an integration
   * More efficient for config-only updates
   * Backend route: PUT /integrations/:id/config
   */
  static async updateIntegrationConfig(integrationId: string, config: any) {
    const response = await apiRequest(`/integrations/${integrationId}/config`, {
      method: 'PUT',
      body: JSON.stringify(config)
    })
    return response.integration || response
  }

  /**
   * Delete an integration
   * Backend route: DELETE /integrations/:id
   */
  static async deleteIntegration(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Test an integration connection
   * Backend route: POST /integrations/:id/test
   */
  static async testIntegration(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/test`, {
      method: 'POST'
    })
  }

  /**
   * Trigger manual sync for an integration
   * Backend route: POST /integrations/:id/sync
   */
  static async syncIntegration(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/sync`, {
      method: 'POST'
    })
  }

  /**
   * Get sync history for an integration
   * Backend route: GET /integrations/:id/sync-history
   */
  static async getSyncHistory(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/sync-history`)
  }

  // ============================================================================
  // WAREHOUSE SHIPPING SERVICES
  // ============================================================================

  /**
   * Get shipping services for a warehouse
   * ✅ Explicit type annotation to prevent 'never' type inference
   */
  static async getWarehouseServices(warehouseId: string): Promise<CarrierService[]> {
    return apiRequestOptional<CarrierService[]>(
      `/warehouses/${warehouseId}/services`,
      [] as CarrierService[]
    )
  }

  /**
   * Save/update shipping services for a warehouse
   */
  static async saveWarehouseServices(warehouseId: string, services: CarrierService[]) {
    return apiRequest(`/warehouses/${warehouseId}/services`, {
      method: 'POST',
      body: JSON.stringify({ services })
    })
  }

  /**
   * Update a single shipping service
   */
  static async updateWarehouseService(warehouseId: string, serviceId: string, updates: Partial<CarrierService>) {
    return apiRequest(`/warehouses/${warehouseId}/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  /**
   * Delete a shipping service
   */
  static async deleteWarehouseService(warehouseId: string, serviceId: string) {
    return apiRequest(`/warehouses/${warehouseId}/services/${serviceId}`, {
      method: 'DELETE'
    })
  }

  // ============================================================================
  // WAREHOUSE SHIPPING BOXES
  // ============================================================================

  /**
   * Get shipping boxes for a warehouse
   * ✅ Explicit type annotation to prevent 'never' type inference
   */
   static async getWarehouseBoxes(warehouseId: string): Promise<ShippingBox[]> {
     return apiRequestOptional<ShippingBox[]>(
       `/warehouses/${warehouseId}/boxes`,
       [] as ShippingBox[]
     )
   }

   /**
    * Get all shipping boxes across all warehouses
    */
   static async getAllWarehouseBoxes(): Promise<{ boxes: ShippingBox[] }> {
     return apiRequestOptional<{ boxes: ShippingBox[] }>(
       '/warehouses/boxes/all',
       { boxes: [] as ShippingBox[] }
     )
   }

  /**
   * Save/update shipping boxes for a warehouse
   */
  static async saveWarehouseBoxes(warehouseId: string, boxes: ShippingBox[]) {
    return apiRequest(`/warehouses/${warehouseId}/boxes`, {
      method: 'POST',
      body: JSON.stringify({ boxes })
    })
  }

  /**
   * Add a new shipping box
   */
  static async addWarehouseBox(warehouseId: string, box: Omit<ShippingBox, 'id'>) {
    return apiRequest(`/warehouses/${warehouseId}/boxes`, {
      method: 'POST',
      body: JSON.stringify(box)
    })
  }

  /**
   * Update a single shipping box
   */
  static async updateWarehouseBox(warehouseId: string, boxId: string, updates: Partial<ShippingBox>) {
    return apiRequest(`/warehouses/${warehouseId}/boxes/${boxId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  /**
   * Delete a shipping box
   */
  static async deleteWarehouseBox(warehouseId: string, boxId: string) {
    return apiRequest(`/warehouses/${warehouseId}/boxes/${boxId}`, {
      method: 'DELETE'
    })
  }

  // ============================================================================
  // WAREHOUSE SHIPPING PRESETS
  // ============================================================================

  /**
   * Get shipping presets for a warehouse
   * ✅ Explicit type annotation to prevent 'never' type inference
   */
  static async getWarehousePresets(warehouseId: string): Promise<ShippingPreset[]> {
    return apiRequestOptional<ShippingPreset[]>(
      `/warehouses/${warehouseId}/presets`,
      [] as ShippingPreset[]
    )
  }

  /**
   * Save/update shipping presets for a warehouse
   */
  static async saveWarehousePresets(warehouseId: string, presets: ShippingPreset[]) {
    return apiRequest(`/warehouses/${warehouseId}/presets`, {
      method: 'POST',
      body: JSON.stringify({ presets })
    })
  }

  /**
   * Add a new shipping preset
   */
  static async addWarehousePreset(warehouseId: string, preset: Omit<ShippingPreset, 'id'>) {
    return apiRequest(`/warehouses/${warehouseId}/presets`, {
      method: 'POST',
      body: JSON.stringify(preset)
    })
  }

  /**
   * Update a single shipping preset
   */
  static async updateWarehousePreset(warehouseId: string, presetId: string, updates: Partial<ShippingPreset>) {
    return apiRequest(`/warehouses/${warehouseId}/presets/${presetId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  /**
   * Delete a shipping preset
   */
  static async deleteWarehousePreset(warehouseId: string, presetId: string) {
    return apiRequest(`/warehouses/${warehouseId}/presets/${presetId}`, {
      method: 'DELETE'
    })
  }

  // ============================================================================
  // SHOPIFY-SPECIFIC ENDPOINTS
  // Backend routes at /api/integrations/shopify/*
  // ============================================================================

  /**
   * Complete Shopify OAuth callback
   */
  static async shopifyCallback(data: {
    code?: string
    shop: string
    storeId: string
    accessToken: string
  }) {
    return apiRequest('/integrations/shopify/callback', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Test Shopify connection
   */
  static async testShopify(data: {
    storeUrl: string
    accessToken: string
  }) {
    return apiRequest('/integrations/shopify/test', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * ✅ UPDATED: Sync Shopify data (orders and/or products)
   * Backend route: POST /integrations/shopify/sync
   *
   * @param data.storeId - The store ID to sync
   * @param data.syncType - What to sync: 'all' | 'orders' | 'products' (default: 'all')
   * @param data.fullSync - If true, fetches ALL orders. If false (default),
   *                        only fetches orders updated since lastSyncedAt
   *
   * ✅ INCREMENTAL SYNC: By default only syncs orders modified since last sync
   * ✅ FIELD PRESERVATION: Never overwrites local fields (fulfillmentStatus, warehouseId, etc.)
   */
   static async syncShopify(data: {
     storeId: string
     syncType?: 'all' | 'orders' | 'products'
     fullSync?: boolean  // ✅ NEW: Option to force full sync
   }) {
     return apiRequest('/integrations/shopify/sync', {
       method: 'POST',
       body: JSON.stringify({
         storeId: data.storeId,
         syncType: data.syncType || 'all',
         fullSync: data.fullSync || false
       })
     })
   }

   /**
    * ✅ NEW: Force full sync - Re-sync ALL orders from Shopify
    * Backend route: POST /integrations/shopify/sync/full
    *
    * Use this when you want to completely refresh all orders from Shopify
    * NOTE: This will NOT overwrite local fields (fulfillmentStatus, warehouseId, etc.)
    */
   static async fullSyncShopify(data: {
     storeId: string
     syncType?: 'all' | 'orders' | 'products'
   }) {
     return apiRequest('/integrations/shopify/sync/full', {
       method: 'POST',
       body: JSON.stringify({
         storeId: data.storeId,
         syncType: data.syncType || 'all'
       })
     })
   }

   /**
    * Sync Shopify products
    * Backend route: POST /integrations/:id/shopify/products/sync
    */
  static async syncShopifyProducts(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/shopify/products/sync`, {
      method: 'POST'
    })
  }

  /**
   * Sync Shopify orders
   * Backend route: POST /integrations/:id/shopify/orders/sync

  static async syncShopifyOrders(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/shopify/orders/sync`, {
      method: 'POST'
    })
  }
*/
  // ============================================================================
  // WOOCOMMERCE-SPECIFIC ENDPOINTS
  // Backend routes at /api/integrations/woocommerce/*
  // ============================================================================

  /**
   * Test WooCommerce connection
   * Backend route: POST /integrations/woocommerce/test
   */
  static async testWooCommerce(data: {
    storeUrl: string
    consumerKey: string
    consumerSecret: string
  }) {
    return apiRequest('/integrations/woocommerce/test', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Sync WooCommerce products
   * Backend route: POST /integrations/:id/woocommerce/products/sync
   */
  static async syncWooCommerceProducts(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/woocommerce/products/sync`, {
      method: 'POST'
    })
  }

  /**
   * Sync WooCommerce orders
   * Backend route: POST /integrations/:id/woocommerce/orders/sync
   */
  static async syncWooCommerceOrders(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/woocommerce/orders/sync`, {
      method: 'POST'
    })
  }

  // ============================================================================
  // ETSY-SPECIFIC ENDPOINTS
  // Backend routes at /api/integrations/etsy/*
  // ============================================================================

  /**
   * Test Etsy connection
   * Backend route: POST /integrations/etsy/test
   */
  static async testEtsy(data: {
    apiKey: string
    sharedSecret: string
  }) {
    return apiRequest('/integrations/etsy/test', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ============================================================================
  // CARRIER-SPECIFIC ENDPOINTS
  // Backend routes at /api/integrations/carriers/*
  // ============================================================================

  /**
   * Test USPS connection
   * Backend route: POST /api/shipping/usps/test
   */
  static async testUSPS(data: {
    storeId: string
  }) {
    return apiRequest('/shipping/usps/test', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Test UPS connection
   * Backend route: POST /api/integrations/ups/test
   */
  static async testUPS(data: {
    storeId: string
  }) {
    return apiRequest('/integrations/ups/test', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Get available services from a carrier
   * Backend route: GET /integrations/carriers/:carrier/services
   */
  static async getCarrierServices(carrier: string, warehouseId?: string): Promise<CarrierService[]> {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    return apiRequestOptional<CarrierService[]>(
      `/integrations/carriers/${carrier}/services${params}`,
      [] as CarrierService[]
    )
  }

  /**
   * Get available boxes from a carrier
   * Backend route: GET /integrations/carriers/:carrier/boxes
   */
  static async getCarrierBoxes(carrier: string, warehouseId?: string): Promise<ShippingBox[]> {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    return apiRequestOptional<ShippingBox[]>(
      `/integrations/carriers/${carrier}/boxes${params}`,
      [] as ShippingBox[]
    )
  }
}
