//file path: src/lib/api/warehouseApi.ts

import { apiRequest } from './baseApi'

export class WarehouseAPI {
  /**
   * Get all warehouses for the current account
   */
  static async getAllWarehouses() {
    return apiRequest('/warehouses')
  }

  /**
   * Get warehouses by store ID
   */
  static async getWarehousesByStore(storeId: string) {
    return apiRequest(`/warehouses/store/${storeId}`)
  }

  /**
   * Get warehouse by ID
   */
  static async getWarehouseById(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}`)
  }

  /**
   * Create a new warehouse
   */
  static async createWarehouse(data: any) {
    return apiRequest('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Update a warehouse
   */
  static async updateWarehouse(warehouseId: string, data: any) {
    return apiRequest(`/warehouses/${warehouseId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * Delete a warehouse
   */
  static async deleteWarehouse(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}`, {
      method: 'DELETE'
    })
  }

  // ============================================================================
  // ✅ NEW: ORDER STATE MANAGEMENT (Replaces localStorage)
  // ============================================================================

  /**
   * Get warehouse order states (packed, picked items, picked orders)
   */
  static async getWarehouseOrderStates(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}/order-states`)
  }

  /**
   * Update packed orders state
   */
  static async updatePackedOrders(warehouseId: string, orderIds: string[]) {
    return apiRequest(`/warehouses/${warehouseId}/order-states/packed`, {
      method: 'PUT',
      body: JSON.stringify({ orderIds })
    })
  }

  /**
   * Update picked items state
   */
  static async updatePickedItems(warehouseId: string, itemIds: string[]) {
    return apiRequest(`/warehouses/${warehouseId}/order-states/picked-items`, {
      method: 'PUT',
      body: JSON.stringify({ itemIds })
    })
  }

  /**
   * Update picked orders state
   */
  static async updatePickedOrders(warehouseId: string, orderIds: string[]) {
    return apiRequest(`/warehouses/${warehouseId}/order-states/picked-orders`, {
      method: 'PUT',
      body: JSON.stringify({ orderIds })
    })
  }

  /**
   * Get warehouse settings (includes maxPickingOrders)
   */
  static async getWarehouseSettings(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}/settings`)
  }

  /**
   * Update warehouse settings
   */
  static async updateWarehouseSettings(warehouseId: string, settings: any) {
    return apiRequest(`/warehouses/${warehouseId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  }

  /**
   * Clear all order states for a warehouse
   */
  static async clearWarehouseOrderStates(warehouseId: string) {
    return apiRequest(`/warehouses/${warehouseId}/order-states`, {
      method: 'DELETE'
    })
  }
}
