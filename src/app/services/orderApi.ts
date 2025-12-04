//file path: app/services/orderApi.ts

/**
 * ✅ UPDATED: Now uses httpOnly cookies via baseApi
 * Removed localStorage token authentication
 * Uses apiRequest for consistent authentication
 */

import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { apiRequest } from '@/lib/api/baseApi'

class OrderApiService {
  // Get all orders for the authenticated account
  async getOrders(): Promise<Order[]> {
    const result = await apiRequest('/orders')
    return result.orders || result
  }

  // Create or update multiple orders (bulk save)
  async saveOrders(orders: Order[], accountId: string): Promise<Order[]> {
    const result = await apiRequest('/orders/bulk', {
      method: 'POST',
      body: JSON.stringify({ orders, accountId }),
    })
    return result.orders || result
  }

  // Update a single order
  async updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order> {
    const result = await apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    })
    return result.order || result
  }

  // Update order tracking information
  async updateOrderTracking(trackingNumber: string, trackingData: any): Promise<void> {
    await apiRequest('/orders/tracking', {
      method: 'PUT',
      body: JSON.stringify({ trackingNumber, trackingData }),
    })
  }

  // Delete orders
  async deleteOrders(orderIds: string[]): Promise<void> {
    await apiRequest('/orders/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ orderIds }),
    })
  }

  // Get a single order by ID
  async getOrderById(orderId: string): Promise<Order> {
    const result = await apiRequest(`/orders/${orderId}`)
    return result.order || result
  }

  // Get orders by store
  async getOrdersByStore(storeId: string): Promise<Order[]> {
    const result = await apiRequest(`/orders?storeId=${storeId}`)
    return result.orders || result
  }

  // Get orders by warehouse
  async getOrdersByWarehouse(warehouseId: string): Promise<Order[]> {
    const result = await apiRequest(`/orders?warehouseId=${warehouseId}`)
    return result.orders || result
  }
}

export const orderApi = new OrderApiService()
