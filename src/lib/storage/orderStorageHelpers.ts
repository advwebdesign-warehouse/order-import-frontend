//file path: src/lib/storage/orderStorageHelpers.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { getOrdersFromStorage, saveOrdersToStorage } from './orderStorage'
import { assignWarehouseToOrder } from '@/lib/warehouse/warehouseAssignment'

/**
 * Get order by external ID (e.g., Shopify order ID)
 */
export function getOrderByExternalId(externalId: string, storeId: string, accountId?: string): Order | null {
  const orders = getOrdersFromStorage(accountId)
  return orders.find(order => order.externalId === externalId && order.storeId === storeId) || null
}

/**
 * Save a new order
 * ✅ UPDATED: Now uses centralized saveOrdersToStorage which applies warehouse assignment
 */
 export function saveOrder(order: Order, accountId?: string): void {
   // Use centralized storage which handles warehouse assignment
   saveOrdersToStorage([order], accountId)
 }

 /**
  * Update an existing order by ID
  * ✅ UPDATED: Reassigns warehouse if shipping address changes
  */
  export function updateOrder(orderId: string, updates: Partial<Order>, accountId?: string): void {
    const orders = getOrdersFromStorage(accountId)

    const orderIndex = orders.findIndex(o => o.id === orderId)

    if (orderIndex >= 0) {
      const updatedOrder = {
        ...orders[orderIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      }

      // ✅ NEW: If shipping address changed, reassign warehouse
      const shippingChanged =
        updates.shippingProvince !== undefined ||
        updates.shippingCountryCode !== undefined

      if (shippingChanged && updatedOrder.storeId) {
        const orderWithWarehouse = assignWarehouseToOrder(updatedOrder, updatedOrder.storeId, accountId)
        orders[orderIndex] = orderWithWarehouse
        console.log(`[Order Helpers] Reassigned warehouse to order ${orderWithWarehouse.orderNumber}: ${orderWithWarehouse.warehouseId}`)
      } else {
        orders[orderIndex] = updatedOrder
      }

      // Save directly to avoid double warehouse assignment
      const aid = accountId || (typeof window !== 'undefined' ? localStorage.getItem('currentAccountId') || 'default-account' : 'default-account')
      const storageKey = `orderSync_orders_${aid}`
      localStorage.setItem(storageKey, JSON.stringify(orders))
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

    // Save directly without triggering warehouse reassignment
    const aid = accountId || (typeof window !== 'undefined' ? localStorage.getItem('currentAccountId') || 'default-account' : 'default-account')
    const storageKey = `orderSync_orders_${aid}`
    localStorage.setItem(storageKey, JSON.stringify(filteredOrders))
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

  // Save directly without triggering warehouse reassignment
  const aid = accountId || (typeof window !== 'undefined' ? localStorage.getItem('currentAccountId') || 'default-account' : 'default-account')
  const storageKey = `orderSync_orders_${aid}`
  localStorage.setItem(storageKey, JSON.stringify(updatedOrders))
}
