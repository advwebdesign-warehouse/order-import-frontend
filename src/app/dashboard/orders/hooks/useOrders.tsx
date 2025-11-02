//file path: app/dashboard/orders/hooks/useOrders.ts

import { useState, useEffect } from 'react'
import { Order } from '../utils/orderTypes'
import { getOrdersFromStorage, saveOrdersToStorage } from '@/lib/storage/orderStorage'
import { getCurrentAccountId } from '@/lib/storage/integrationStorage'

/**
 * Hook to fetch all orders across all warehouses
 */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)

      try {
        // ✅ FIX: Read orders from localStorage where Shopify sync saves them
        const accountId = getCurrentAccountId()
        const storedOrders = getOrdersFromStorage(accountId)

        console.log('[useOrders] Loaded orders from storage:', storedOrders.length)

        setOrders(storedOrders)
      } catch (err) {
        console.error('[useOrders] Error fetching orders:', err)
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const refreshOrders = async () => {
    // ✅ FIX: Refresh from localStorage, not mock data
    try {
      const accountId = getCurrentAccountId()
      const storedOrders = getOrdersFromStorage(accountId)
      console.log('[useOrders] Refreshed orders from storage:', storedOrders.length)
      setOrders(storedOrders)
    } catch (err) {
      console.error('[useOrders] Error refreshing orders:', err)
      setError('Failed to refresh orders')
    }
  }

  // Add function to update order fulfillment status
  const updateOrdersFulfillmentStatus = async (orderIds: string[], newStatus: string) => {
    try {
      const accountId = getCurrentAccountId()

      // Update the orders in state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          orderIds.includes(order.id)
            ? { ...order, fulfillmentStatus: newStatus }
            : order
        )
      )

      // ✅ FIX: Save back to localStorage
      const allOrders = getOrdersFromStorage(accountId)
      const updatedOrders = allOrders.map(order =>
        orderIds.includes(order.id)
          ? { ...order, fulfillmentStatus: newStatus }
          : order
      )
      saveOrdersToStorage(updatedOrders, accountId)

      console.log('[useOrders] Updated fulfillment status for', orderIds.length, 'orders')
      return true
    } catch (err) {
      console.error('[useOrders] Error updating orders:', err)
      setError('Failed to update orders')
      return false
    }
  }

  /**
   * Update single order status
   */
  const updateStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const accountId = getCurrentAccountId()

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      // ✅ FIX: Save back to localStorage
      const allOrders = getOrdersFromStorage(accountId)
      const updatedOrders = allOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
      saveOrdersToStorage(updatedOrders, accountId)

      console.log(`[useOrders] Order ${orderId} status updated to ${newStatus}`)
    } catch (error) {
      console.error('[useOrders] Error updating order status:', error)
      throw error
    }
  }

  /**
   * Update single order fulfillment status
   */
  const updateFulfillmentStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const accountId = getCurrentAccountId()

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
        )
      )

      // ✅ FIX: Save back to localStorage
      const allOrders = getOrdersFromStorage(accountId)
      const updatedOrders = allOrders.map(order =>
        order.id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
      )
      saveOrdersToStorage(updatedOrders, accountId)

      console.log(`[useOrders] Order ${orderId} fulfillment status updated to ${newStatus}`)
    } catch (error) {
      console.error('[useOrders] Error updating order fulfillment status:', error)
      throw error
    }
  }

  // Then UPDATE your return statement to include these:
  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrdersFulfillmentStatus,
    updateStatus,
    updateFulfillmentStatus
  }
}
