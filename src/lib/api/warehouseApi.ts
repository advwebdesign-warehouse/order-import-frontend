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
}
