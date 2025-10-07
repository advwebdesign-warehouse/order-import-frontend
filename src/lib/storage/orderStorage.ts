//file path: src/lib/storage/orderStorage.ts

import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { getCurrentUserId } from './integrationStorage'

const ORDERS_STORAGE_PREFIX = 'orderSync_orders_'

/**
 * Get all orders for a specific user
 */
export function getOrdersFromStorage(userId?: string): Order[] {
  if (typeof window === 'undefined') return []

  const uid = userId || getCurrentUserId()
  const storageKey = `${ORDERS_STORAGE_PREFIX}${uid}`

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
 * Save orders for a specific user
 */
export function saveOrdersToStorage(orders: Order[], userId?: string): void {
  if (typeof window === 'undefined') return

  const uid = userId || getCurrentUserId()
  const storageKey = `${ORDERS_STORAGE_PREFIX}${uid}`

  try {
    localStorage.setItem(storageKey, JSON.stringify(orders))
  } catch (error) {
    console.error('Error saving orders to storage:', error)
  }
}

/**
 * Update order tracking information
 */
export function updateOrderTracking(trackingNumber: string, trackingData: any, userId?: string): void {
  const orders = getOrdersFromStorage(userId)

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

  saveOrdersToStorage(updatedOrders, userId)
}

/**
 * Get all active tracking numbers for a specific user
 */
export function getActiveTrackingNumbers(userId?: string): string[] {
  const orders = getOrdersFromStorage(userId)

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
 * Get all user IDs who have active shipments
 */
export function getUsersWithActiveShipments(): string[] {
  if (typeof window === 'undefined') return []

  const currentUserId = getCurrentUserId()
  const activeTracking = getActiveTrackingNumbers(currentUserId)

  return activeTracking.length > 0 ? [currentUserId] : []
}
