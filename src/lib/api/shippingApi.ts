//file path: src/lib/api/shippingApi.ts

import { apiRequest } from './baseApi'

export const ShippingAPI = {
  // ============================================================================
  // BOXES
  // ============================================================================

  /**
   * Get all boxes for a warehouse
   */
  async getBoxes(warehouseId: string) {
    return apiRequest(`/shipping/boxes?warehouseId=${warehouseId}`)
  },

  /**
   * Create a new box
   */
  async createBox(warehouseId: string, box: any) {
    return apiRequest('/shipping/boxes', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, box })
    })
  },

  /**
   * Update an existing box
   */
  async updateBox(boxId: string, box: any) {
    return apiRequest(`/shipping/boxes/${boxId}`, {
      method: 'PUT',
      body: JSON.stringify({ box })
    })
  },

  /**
   * Delete a box
   */
  async deleteBox(boxId: string) {
    return apiRequest(`/shipping/boxes/${boxId}`, {
      method: 'DELETE'
    })
  },

  /**
   * Toggle box active status
   */
  async toggleBox(boxId: string) {
    return apiRequest(`/shipping/boxes/${boxId}/toggle`, {
      method: 'PATCH'
    })
  },

  /**
   * Bulk sync boxes from carrier API
   */
  async bulkSyncBoxes(warehouseId: string, boxes: any[]) {
    return apiRequest('/shipping/boxes/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, boxes })
    })
  },

  /**
   * Sync boxes from carrier APIs (USPS, UPS, FedEx)
   * Fetches boxes directly from carrier APIs and returns them
   */
  async syncBoxesFromCarriers(data: {
    carriers: string[]
    credentials: any
  }) {
    return apiRequest('/shipping/boxes/sync', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // ============================================================================
  // SERVICES
  // ============================================================================

  /**
   * Get all services for a warehouse
   */
  async getServices(warehouseId: string) {
    return apiRequest(`/shipping/services?warehouseId=${warehouseId}`)
  },

  /**
   * Create a new service
   */
  async createService(warehouseId: string, service: any) {
    return apiRequest('/shipping/services', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, service })
    })
  },

  /**
   * Update an existing service
   */
  async updateService(serviceId: string, service: any) {
    return apiRequest(`/shipping/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify({ service })
    })
  },

  /**
   * Delete a service
   */
  async deleteService(serviceId: string) {
    return apiRequest(`/shipping/services/${serviceId}`, {
      method: 'DELETE'
    })
  },

  /**
   * Toggle service active status
   */
  async toggleService(serviceId: string) {
    return apiRequest(`/shipping/services/${serviceId}/toggle`, {
      method: 'PATCH'
    })
  },

  /**
   * Bulk sync services from carrier API
   */
  async bulkSyncServices(warehouseId: string, services: any[]) {
    return apiRequest('/shipping/services/bulk-sync', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, services })
    })
  },

  /**
   * Sync services from carrier APIs (USPS, UPS, FedEx)
   * Fetches services directly from carrier APIs and returns them
   */
  async syncServicesFromCarriers(data: {
    carriers: string[]
    credentials: any
  }) {
    return apiRequest('/shipping/services/sync', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  
  // ============================================================================
  // PRESETS
  // ============================================================================

  /**
   * Get all presets for a warehouse
   */
  async getPresets(warehouseId: string) {
    return apiRequest(`/shipping/presets?warehouseId=${warehouseId}`)
  },

  /**
   * Create a new preset
   */
  async createPreset(warehouseId: string, preset: any) {
    return apiRequest('/shipping/presets', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, preset })
    })
  },

  /**
   * Update an existing preset
   */
  async updatePreset(presetId: string, preset: any) {
    return apiRequest(`/shipping/presets/${presetId}`, {
      method: 'PUT',
      body: JSON.stringify({ preset })
    })
  },

  /**
   * Delete a preset
   */
  async deletePreset(presetId: string) {
    return apiRequest(`/shipping/presets/${presetId}`, {
      method: 'DELETE'
    })
  },

  /**
   * Toggle preset active status
   */
  async togglePreset(presetId: string) {
    return apiRequest(`/shipping/presets/${presetId}/toggle`, {
      method: 'PATCH'
    })
  },

  /**
   * Reorder presets (update priorities)
   */
  async reorderPresets(warehouseId: string, presetIds: string[]) {
    return apiRequest('/shipping/presets/reorder', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, presetIds })
    })
  }
}
