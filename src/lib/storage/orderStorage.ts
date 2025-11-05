//file path: src/lib/storage/orderStorage.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { getCurrentAccountId } from './integrationStorage'
import { assignWarehouseToOrder } from '@/lib/warehouse/warehouseAssignment'

const ORDERS_STORAGE_PREFIX = 'orderSync_orders_'

/**
 * Get all orders for a specific account
 * Orders belong to the account, not individual users
 */
export function getOrdersFromStorage(accountId?: string): Order[] {
  if (typeof window === 'undefined') return []

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${ORDERS_STORAGE_PREFIX}${aid}`

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading orders from storage:', error)
  }

  return []
}

/**
 * UPDATED: Save orders for a specific account
 * Now merges new orders with existing ones and applies warehouse assignment
 */
export function saveOrdersToStorage(orders: Order[], accountId?: string): void {
  if (typeof window === 'undefined') return

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${ORDERS_STORAGE_PREFIX}${aid}`

  try {
    // Get existing orders
    const existingOrders = getOrdersFromStorage(aid)

    //Apply warehouse assignment to each order based on shipping address
    const ordersWithWarehouses = orders.map(order => {
      if (order.storeId) {
        return assignWarehouseToOrder(order, order.storeId, aid)
      }
      return order
    })

    // âœ… NEW: Merge with existing orders (update if exists, add if new)
    const orderMap = new Map(existingOrders.map(o => [o.id, o]))

    ordersWithWarehouses.forEach(order => {
      orderMap.set(order.id, {
        ...orderMap.get(order.id),
        ...order,
        updatedAt: new Date().toISOString()
      })
    })

    const mergedOrders = Array.from(orderMap.values())

    localStorage.setItem(storageKey, JSON.stringify(mergedOrders))

    console.log(`[Order Storage] âœ… Saved ${ordersWithWarehouses.length} orders (total: ${mergedOrders.length})`)
  } catch (error) {
    console.error('Error saving orders to storage:', error)
  }
}

/**
 * Update order tracking information
 */
export function updateOrderTracking(trackingNumber: string, trackingData: any, accountId?: string): void {
  const orders = getOrdersFromStorage(accountId)

  const updatedOrders = orders.map(order => {
    if (order.trackingNumber === trackingNumber || order.shippingLabel?.trackingNumber === trackingNumber) {
      return {
        ...order,
        shippingLabel: order.shippingLabel ? {
          ...order.shippingLabel,
          trackingStatus: trackingData.status,
          trackingCategory: trackingData.statusCategory,
          trackingLocation: trackingData.location,
          trackingLastUpdate: trackingData.timestamp,
          trackingEvents: trackingData.events
        } : undefined,
        fulfillmentStatus: trackingData.statusCategory === 'delivered' ? 'DELIVERED' : order.fulfillmentStatus
      }
    }
    return order
  })

  saveOrdersToStorage(updatedOrders, accountId)
}

/**
 * Get all active tracking numbers for a specific account
 */
export function getActiveTrackingNumbers(accountId?: string): string[] {
  const orders = getOrdersFromStorage(accountId)

  return orders
    .filter(order => {
      const isShipped = ['SHIPPED', 'IN_TRANSIT'].includes(order.fulfillmentStatus)
      const notDelivered = order.fulfillmentStatus !== 'DELIVERED'
      const hasTracking = order.trackingNumber || order.shippingLabel?.trackingNumber

      return isShipped && notDelivered && hasTracking
    })
    .map(order => order.trackingNumber || order.shippingLabel?.trackingNumber!)
    .filter(Boolean)
}

/**
 * Get all accounts that have active shipments
 * In production with database, this would query all accounts
 * In browser with localStorage, we can only check current account
 */
export function getAccountsWithActiveShipments(): Array<{
  accountId: string
  trackingNumbers: string[]
}> {
  if (typeof window === 'undefined') return []

  const currentAccountId = getCurrentAccountId()
  const activeTracking = getActiveTrackingNumbers(currentAccountId)

  if (activeTracking.length === 0) return []

  return [{
    accountId: currentAccountId,
    trackingNumbers: activeTracking
  }]
}

/**
 * âœ… NEW: Reassign warehouses to all existing orders
 * Call this when warehouse assignments change
 */
export function reassignAllOrderWarehouses(accountId?: string): { updated: number; skipped: number } {
  const orders = getOrdersFromStorage(accountId)

  let updated = 0
  let skipped = 0

  const updatedOrders = orders.map(order => {
    if (order.storeId) {
      const orderWithWarehouse = assignWarehouseToOrder(order, order.storeId, accountId)

      // Only count as updated if warehouse changed
      if (orderWithWarehouse.warehouseId !== order.warehouseId) {
        updated++
        console.log(
          `[Order Storage] Order ${order.orderNumber}: ${order.warehouseId || 'none'} â†' ${orderWithWarehouse.warehouseId}`
        )
      } else {
        skipped++
      }
      
      return orderWithWarehouse
    } else {
      skipped++
      return order
    }
  })

  // Save directly without triggering warehouse assignment again
  const aid = accountId || getCurrentAccountId()
  const storageKey = `${ORDERS_STORAGE_PREFIX}${aid}`
  localStorage.setItem(storageKey, JSON.stringify(updatedOrders))

  console.log(`[Order Storage] âœ… Warehouse reassignment: ${updated} updated, ${skipped} skipped`)
  return { updated, skipped }
}
