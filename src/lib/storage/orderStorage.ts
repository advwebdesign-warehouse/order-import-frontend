//file path: src/lib/storage/orderStorage.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { getCurrentAccountId } from './integrationStorage'

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
 * Save orders for a specific account
 */
export function saveOrdersToStorage(orders: Order[], accountId?: string): void {
  if (typeof window === 'undefined') return

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${ORDERS_STORAGE_PREFIX}${aid}`

  try {
    localStorage.setItem(storageKey, JSON.stringify(orders))
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
