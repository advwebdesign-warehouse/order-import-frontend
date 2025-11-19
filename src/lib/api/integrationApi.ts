//file path: src/lib/api/integrationApi.ts

import { apiRequest } from './baseApi'

/**
 * IntegrationAPI
 * Handles all API calls related to integrations
 * ✅ UPDATED: Now matches backend routes exactly
 */
export class IntegrationAPI {
  /**
   * Get all integrations for the current account
   * Automatically filtered by account based on auth token
   * Backend returns: { integrations: [...], lastUpdated: string }
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

    const response = await apiRequest(endpoint)
    return response.integrations || []
  }

  /**
   * Get a specific integration by ID
   * Backend returns: { integration: {...}, lastUpdated: string }
   */
  static async getIntegrationById(integrationId: string) {
    const response = await apiRequest(`/integrations/${integrationId}`)
    return response.integration
  }

  /**
   * Save a new integration (create or update via upsert)
   * ✅ Backend uses POST for both create and update (upsert)
   * Backend returns: { integration: {...}, lastUpdated: string }
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
   * ✅ Uses POST (upsert) - backend doesn't have separate PUT /:id route
   * Sends full integration object to backend
   */
  static async updateIntegration(integrationId: string, integration: any) {
    const response = await apiRequest('/integrations', {
      method: 'POST',
      body: JSON.stringify({
        ...integration,
        id: integrationId
      })
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
   */
  static async getWarehouseServices(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}/services`)
  }

  /**
   * Save/update shipping services for a warehouse
   */
  static async saveWarehouseServices(warehouseId: string, services: any[]) {
    return apiRequest(`/warehouses/${warehouseId}/services`, {
      method: 'POST',
      body: JSON.stringify({ services })
    })
  }

  /**
   * Update a single shipping service
   */
  static async updateWarehouseService(warehouseId: string, serviceId: string, updates: any) {
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
   */
  static async getWarehouseBoxes(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}/boxes`)
  }

  /**
   * Get all shipping boxes across all warehouses
   */
  static async getAllWarehouseBoxes() {
    return apiRequest('/warehouses/boxes/all')
  }

  /**
   * Save/update shipping boxes for a warehouse
   */
  static async saveWarehouseBoxes(warehouseId: string, boxes: any[]) {
    return apiRequest(`/warehouses/${warehouseId}/boxes`, {
      method: 'POST',
      body: JSON.stringify({ boxes })
    })
  }

  /**
   * Add a new shipping box
   */
  static async addWarehouseBox(warehouseId: string, box: any) {
    return apiRequest(`/warehouses/${warehouseId}/boxes`, {
      method: 'POST',
      body: JSON.stringify(box)
    })
  }

  /**
   * Update a single shipping box
   */
  static async updateWarehouseBox(warehouseId: string, boxId: string, updates: any) {
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
   */
  static async getWarehousePresets(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}/presets`)
  }

  /**
   * Save/update shipping presets for a warehouse
   */
  static async saveWarehousePresets(warehouseId: string, presets: any[]) {
    return apiRequest(`/warehouses/${warehouseId}/presets`, {
      method: 'POST',
      body: JSON.stringify({ presets })
    })
  }

  /**
   * Add a new shipping preset
   */
  static async addWarehousePreset(warehouseId: string, preset: any) {
    return apiRequest(`/warehouses/${warehouseId}/presets`, {
      method: 'POST',
      body: JSON.stringify(preset)
    })
  }

  /**
   * Update a single shipping preset
   */
  static async updateWarehousePreset(warehouseId: string, presetId: string, updates: any) {
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
   * Backend route: POST /integrations/shopify/callback
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
   * Backend route: POST /integrations/shopify/test
   */
  static async testShopify(data: {
    shopUrl: string
    accessToken: string
  }) {
    return apiRequest('/integrations/shopify/test', {
      method: 'POST',
      body: JSON.stringify(data)
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
   */
  static async syncShopifyOrders(integrationId: string) {
    return apiRequest(`/integrations/${integrationId}/shopify/orders/sync`, {
      method: 'POST'
    })
  }

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
  // CARRIER-SPECIFIC ENDPOINTS
  // Backend routes at /api/integrations/carriers/*
  // ============================================================================

  /**
   * Get available services from a carrier
   * Backend route: GET /integrations/carriers/:carrier/services
   */
  static async getCarrierServices(carrier: string, warehouseId?: string) {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    return apiRequest(`/integrations/carriers/${carrier}/services${params}`)
  }

  /**
   * Get available boxes from a carrier
   * Backend route: GET /integrations/carriers/:carrier/boxes
   */
  static async getCarrierBoxes(carrier: string, warehouseId?: string) {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    return apiRequest(`/integrations/carriers/${carrier}/boxes${params}`)
  }
}
