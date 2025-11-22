//file path: src/lib/api/orderFulfillmentApi.ts

import { apiRequest } from './baseApi'

export interface OrderFulfillmentState {
  id: string
  accountId: string
  warehouseId: string | null
  pickedItems: string[]
  pickedOrders: string[]
  packedOrders: string[]
  lastUpdatedBy: string | null
  createdAt: string
  updatedAt: string
}

/**
 * API for managing order fulfillment state
 * Alternative to warehouse-specific endpoints
 */
export class OrderFulfillmentAPI {
  /**
   * Get fulfillment state for a warehouse
   * @param warehouseId - Warehouse ID (or null/empty for "all warehouses")
   */
  static async getState(warehouseId?: string | null): Promise<OrderFulfillmentState> {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    return apiRequest(`/order-fulfillment-state${params}`)
  }

  /**
   * Update fulfillment state (partial update supported)
   * @param data - Partial state to update
   */
  static async updateState(data: {
    warehouseId?: string | null
    pickedItems?: string[]
    pickedOrders?: string[]
    packedOrders?: string[]
  }): Promise<OrderFulfillmentState> {
    return apiRequest('/order-fulfillment-state', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * Clear fulfillment state for a warehouse
   * @param warehouseId - Warehouse ID (or null/empty for "all warehouses")
   */
  static async clearState(warehouseId?: string | null): Promise<OrderFulfillmentState> {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : ''
    return apiRequest(`/order-fulfillment-state${params}`, {
      method: 'DELETE'
    })
  }
}
