//file path: app/services/orderFulfillmentStateApi.ts

/**
 * Order Fulfillment State API
 * ✅ UPDATED: Now uses httpOnly cookies via baseApi
 * Uses apiRequest for consistent authentication
 *
 * Manages shared picking/packing state across all users in an account.
 * Replaces localStorage for: pickedItems, pickedOrders, packedOrders
 */

import { apiRequest } from '@/lib/api/baseApi'

export interface OrderFulfillmentState {
  id: string
  accountId: string
  warehouseId: string | null
  pickedItems: string[]
  pickedOrders: string[]
  packedOrders: string[]
  lastUpdatedBy?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateFulfillmentStatePayload {
  warehouseId?: string | null
  pickedItems?: string[]
  pickedOrders?: string[]
  packedOrders?: string[]
}

class OrderFulfillmentStateApi {
  /**
   * Get fulfillment state for a specific warehouse (or all warehouses)
   */
  async getState(warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const params = new URLSearchParams()
    if (warehouseId) {
      params.append('warehouseId', warehouseId)
    }

    return apiRequest(`/order-fulfillment-state?${params.toString()}`)
  }

  /**
   * Update fulfillment state (partial updates supported)
   */
  async updateState(
    payload: UpdateFulfillmentStatePayload
  ): Promise<OrderFulfillmentState> {
    return apiRequest('/order-fulfillment-state', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  }

  /**
   * Add a picked item
   */
  async addPickedItem(itemId: string, warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const currentState = await this.getState(warehouseId)
    const pickedItems = Array.from(new Set([...currentState.pickedItems, itemId]))
    return this.updateState({ warehouseId, pickedItems })
  }

  /**
   * Remove a picked item
   */
  async removePickedItem(itemId: string, warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const currentState = await this.getState(warehouseId)
    const pickedItems = currentState.pickedItems.filter(id => id !== itemId)
    return this.updateState({ warehouseId, pickedItems })
  }

  /**
   * Add a picked order
   */
  async addPickedOrder(orderId: string, warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const currentState = await this.getState(warehouseId)
    const pickedOrders = Array.from(new Set([...currentState.pickedOrders, orderId]))
    return this.updateState({ warehouseId, pickedOrders })
  }

  /**
   * Remove a picked order
   */
  async removePickedOrder(orderId: string, warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const currentState = await this.getState(warehouseId)
    const pickedOrders = currentState.pickedOrders.filter(id => id !== orderId)
    return this.updateState({ warehouseId, pickedOrders })
  }

  /**
   * Add a packed order
   */
  async addPackedOrder(orderId: string, warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const currentState = await this.getState(warehouseId)
    const packedOrders = Array.from(new Set([...currentState.packedOrders, orderId]))
    return this.updateState({ warehouseId, packedOrders })
  }

  /**
   * Remove a packed order
   */
  async removePackedOrder(orderId: string, warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    const currentState = await this.getState(warehouseId)
    const packedOrders = currentState.packedOrders.filter(id => id !== orderId)
    return this.updateState({ warehouseId, packedOrders })
  }

  /**
   * Clear all picking state
   */
  async clearPickingState(warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    return this.updateState({
      warehouseId,
      pickedItems: [],
      pickedOrders: []
    })
  }

  /**
   * Clear all packing state
   */
  async clearPackingState(warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    return this.updateState({
      warehouseId,
      packedOrders: []
    })
  }

  /**
   * Clear all fulfillment state
   */
  async clearAllState(warehouseId: string | null = null): Promise<OrderFulfillmentState> {
    return this.updateState({
      warehouseId,
      pickedItems: [],
      pickedOrders: [],
      packedOrders: []
    })
  }
}

export const orderFulfillmentStateApi = new OrderFulfillmentStateApi()
