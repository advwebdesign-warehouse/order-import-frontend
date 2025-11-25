//file path: app/services/orderApi.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gravityhub.co'

class OrderApiService {
  private getAuthToken(): string | null {
    // Get token from localStorage or wherever you store it
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken()

    // ✅ FIX: Create headers object with proper type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Get all orders for the authenticated account
  async getOrders(): Promise<Order[]> {
    const result = await this.fetchWithAuth('/api/orders')
    return result.orders
  }

  // Create or update multiple orders (bulk save)
  async saveOrders(orders: Order[], accountId: string): Promise<Order[]> {
    const result = await this.fetchWithAuth('/api/orders/bulk', {
      method: 'POST',
      body: JSON.stringify({ orders, accountId }),
    })
    return result.orders
  }

  // Update a single order
  async updateOrder(orderId: string, orderData: Partial<Order>): Promise<Order> {
    const result = await this.fetchWithAuth(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    })
    return result.order
  }

  // Update order tracking information
  async updateOrderTracking(trackingNumber: string, trackingData: any): Promise<void> {
    await this.fetchWithAuth('/api/orders/tracking', {
      method: 'PUT',
      body: JSON.stringify({ trackingNumber, trackingData }),
    })
  }

  // Delete orders
  async deleteOrders(orderIds: string[]): Promise<void> {
    await this.fetchWithAuth('/api/orders/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ orderIds }),
    })
  }

  // Get a single order by ID
  async getOrderById(orderId: string): Promise<Order> {
    const result = await this.fetchWithAuth(`/api/orders/${orderId}`)
    return result.order
  }

  // Get orders by store
  async getOrdersByStore(storeId: string): Promise<Order[]> {
    const result = await this.fetchWithAuth(`/api/orders?storeId=${storeId}`)
    return result.orders
  }

  // Get orders by warehouse
  async getOrdersByWarehouse(warehouseId: string): Promise<Order[]> {
    const result = await this.fetchWithAuth(`/api/orders?warehouseId=${warehouseId}`)
    return result.orders
  }
}

export const orderApi = new OrderApiService()
