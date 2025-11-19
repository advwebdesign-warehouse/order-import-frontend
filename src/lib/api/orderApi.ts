//file path: src/lib/api/orderApi.ts

import { apiRequest } from './baseApi'

export class OrderAPI {
  static async getOrders() {
    return apiRequest('/orders')
  }

  static async saveOrders(orders: any[]) {
    return apiRequest('/orders/bulk', {
      method: 'POST',
      body: JSON.stringify({ orders })
    })
  }

  static async updateOrder(orderId: string, updates: any) {
    return apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  static async updateOrderTracking(trackingNumber: string, trackingData: any) {
    return apiRequest('/orders/tracking', {
      method: 'PUT',
      body: JSON.stringify({ trackingNumber, trackingData })
    })
  }

  static async getActiveTrackingNumbers() {
    return apiRequest('/orders/tracking/active')
  }
}
