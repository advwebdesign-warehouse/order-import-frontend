//file path: app/dashboard/orders/hooks/useOrders.ts

import { useState, useEffect } from 'react'
import { Order } from '../utils/orderTypes'
import { OrderAPI } from '@/lib/api/orderApi'

/**
 * Hook to fetch all orders across all warehouses
 * ✅ UPDATED: Now uses API instead of localStorage
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
        // ✅ UPDATED: Fetch orders from API (accountId handled by backend via auth token)
        const ordersData = await OrderAPI.getOrders()

        console.log('[useOrders] Loaded orders from API:', ordersData.length)

        setOrders(ordersData)
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
    // ✅ UPDATED: Refresh from API
    try {
      const ordersData = await OrderAPI.getOrders()
      console.log('[useOrders] Refreshed orders from API:', ordersData.length)
      setOrders(ordersData)
    } catch (err) {
      console.error('[useOrders] Error refreshing orders:', err)
      setError('Failed to refresh orders')
    }
  }

  // Add function to update order fulfillment status
  const updateOrdersFulfillmentStatus = async (orderIds: string[], newStatus: string) => {
    try {
      // Optimistic update - update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          orderIds.includes(order.id)
            ? { ...order, fulfillmentStatus: newStatus }
            : order
        )
      )

      // ✅ UPDATED: Update via API (accountId handled by backend)
      await Promise.all(
        orderIds.map(orderId =>
          OrderAPI.updateOrder(orderId, { fulfillmentStatus: newStatus })
        )
      )

      console.log('[useOrders] Updated fulfillment status for', orderIds.length, 'orders')
      return true
    } catch (err) {
      console.error('[useOrders] Error updating orders:', err)
      setError('Failed to update orders')
      // Refresh to get correct state from server
      await refreshOrders()
      return false
    }
  }

  /**
   * Update single order status
   */
  const updateStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      // Optimistic update - update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      // ✅ UPDATED: Update via API (accountId handled by backend)
      await OrderAPI.updateOrder(orderId, { status: newStatus })

      console.log(`[useOrders] Order ${orderId} status updated to ${newStatus}`)
    } catch (error) {
      console.error('[useOrders] Error updating order status:', error)
      // Refresh to get correct state from server
      await refreshOrders()
      throw error
    }
  }

  /**
   * Update single order fulfillment status
   */
  const updateFulfillmentStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      // Optimistic update - update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
        )
      )

      // ✅ UPDATED: Update via API (accountId handled by backend)
      await OrderAPI.updateOrder(orderId, { fulfillmentStatus: newStatus })

      console.log(`[useOrders] Order ${orderId} fulfillment status updated to ${newStatus}`)
    } catch (error) {
      console.error('[useOrders] Error updating order fulfillment status:', error)
      // Refresh to get correct state from server
      await refreshOrders()
      throw error
    }
  }

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
