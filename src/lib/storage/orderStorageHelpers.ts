//file path: src/lib/storage/orderStorageHelpers.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { getOrdersFromStorage, saveOrdersToStorage } from './orderStorage'

/**
 * Get order by external ID (e.g., Shopify order ID)
 */
export function getOrderByExternalId(externalId: string, storeId: string, accountId?: string): Order | null {
  const orders = getOrdersFromStorage(accountId)
  return orders.find(order => order.externalId === externalId && order.storeId === storeId) || null
}

/**
 * Save a new order
 */
export function saveOrder(order: Order, accountId?: string): void {
  const orders = getOrdersFromStorage(accountId)

  // Check if order already exists
  const existingIndex = orders.findIndex(o => o.id === order.id)

  if (existingIndex >= 0) {
    // Update existing order
    orders[existingIndex] = {
      ...orders[existingIndex],
      ...order,
      updatedAt: new Date().toISOString()
    }
  } else {
    // Add new order with timestamps
    orders.push({
      ...order,
      updatedAt: new Date().toISOString()
    })
  }

  saveOrdersToStorage(orders, accountId)
}

/**
 * Update an existing order by ID
 */
export function updateOrder(orderId: string, updates: Partial<Order>, accountId?: string): void {
  const orders = getOrdersFromStorage(accountId)

  const orderIndex = orders.findIndex(o => o.id === orderId)

  if (orderIndex >= 0) {
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    saveOrdersToStorage(orders, accountId)
  } else {
    console.warn(`Order not found with ID: ${orderId}`)
  }
}

/**
 * Delete an order by ID
 */
export function deleteOrder(orderId: string, accountId?: string): void {
  const orders = getOrdersFromStorage(accountId)
  const filteredOrders = orders.filter(o => o.id !== orderId)
  saveOrdersToStorage(filteredOrders, accountId)
}

/**
 * Bulk update orders
 */
export function bulkUpdateOrders(orderIds: string[], updates: Partial<Order>, accountId?: string): void {
  const orders = getOrdersFromStorage(accountId)
  const orderIdSet = new Set(orderIds)

  const updatedOrders = orders.map(order => {
    if (orderIdSet.has(order.id)) {
      return {
        ...order,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
    return order
  })

  saveOrdersToStorage(updatedOrders, accountId)
}
