//file path: app/dashboard/orders/hooks/useOrders.ts
// ✅ Now uses API instead of localStorage
// ✅ NEW: Added integration sync support for status updates

import { useState, useEffect } from 'react'
import { Order } from '../utils/orderTypes'
import { OrderAPI, IntegrationSyncResult } from '@/lib/api/orderApi'

export interface StatusUpdateOptions {
  syncToIntegration?: boolean;  // Default: true - sync to Shopify/etc.
  trackingInfo?: {
    trackingNumber?: string;
    trackingCompany?: string;
    trackingUrl?: string;
  };
  notifyCustomer?: boolean;  // Default: true for shipped, false for others
}

export interface StatusUpdateResult {
  success: boolean;
  order?: Order;
  integrationSync?: IntegrationSyncResult;
  error?: string;
}

/**
 * Hook to fetch all orders across all warehouses
 * ✅ Now uses API instead of localStorage
 * ✅ NEW: Status updates can sync to integrations (Shopify, WooCommerce, etc.)
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
        // ✅ Fetch orders from API (accountId handled by backend via auth token)
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
    // ✅ Refresh from API
    try {
      const ordersData = await OrderAPI.getOrders()
      console.log('[useOrders] Refreshed orders from API:', ordersData.length)
      setOrders(ordersData)
    } catch (err) {
      console.error('[useOrders] Error refreshing orders:', err)
      setError('Failed to refresh orders')
    }
  }

  // Add function to update order fulfillment status (bulk)
  const updateOrdersFulfillmentStatus = async (
    orderIds: string[],
    newStatus: string,
    options?: StatusUpdateOptions
  ) => {
    try {
      // Optimistic update - update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          orderIds.includes(order.id)
            ? { ...order, fulfillmentStatus: newStatus }
            : order
        )
      )

      // ✅ UPDATED: Update via API with integration sync option
      const results = await Promise.all(
        orderIds.map(orderId =>
          OrderAPI.updateOrderFulfillmentStatus(orderId, newStatus, {
            syncToIntegration: options?.syncToIntegration ?? true,
            trackingInfo: options?.trackingInfo,
            notifyCustomer: options?.notifyCustomer
          })
        )
      )

      // Check for any sync failures
      const syncFailures = results.filter(r => r.integrationSync && !r.integrationSync.success)
      if (syncFailures.length > 0) {
        console.warn('[useOrders] Some integration syncs failed:', syncFailures)
      }

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
   * ✅ NEW: Now supports syncing to integrations
   *
   * @param orderId - Order ID to update
   * @param newStatus - New status value
   * @param options - Optional sync settings
   */
   const updateStatus = async (
     orderId: string,
     newStatus: string,
     options?: StatusUpdateOptions
   ): Promise<StatusUpdateResult> => {
    try {
      // Optimistic update - update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      // ✅ UPDATED: Update via API with integration sync
      const result = await OrderAPI.updateOrder(
        orderId,
        { status: newStatus },
        {
          syncToIntegration: options?.syncToIntegration ?? true,
          notifyCustomer: options?.notifyCustomer
        }
      )

      console.log(`[useOrders] Order ${orderId} status updated to ${newStatus}`, {
        integrationSync: result.integrationSync
      })

      return {
        success: true,
        order: result as Order,
        integrationSync: result.integrationSync
      }

    } catch (err: unknown) {
      console.error('[useOrders] Error updating order status:', err)
      // Refresh to get correct state from server
      await refreshOrders()
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update status'
      }
    }
  }

  /**
   * Update single order fulfillment status
   * ✅ NEW: Now supports syncing to integrations with tracking info
   *
   * @param orderId - Order ID to update
   * @param newStatus - New fulfillment status
   * @param options - Optional sync settings including tracking info
   *
   * @example
   * // Update status and sync to Shopify
   * await updateFulfillmentStatus('order-123', 'SHIPPED', {
   *   syncToIntegration: true,
   *   trackingInfo: {
   *     trackingNumber: '1Z999AA...',
   *     trackingCompany: 'UPS'
   *   },
   *   notifyCustomer: true
   * })
   */
   const updateFulfillmentStatus = async (
     orderId: string,
     newStatus: string,
     options?: StatusUpdateOptions
   ): Promise<StatusUpdateResult> => {
    try {
      // Optimistic update - update local state immediately
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
        )
      )

      // Determine if we should notify customer (default to true for SHIPPED)
      const shouldNotify = options?.notifyCustomer ??
        (newStatus === 'SHIPPED' || newStatus === 'DELIVERED')

      // ✅ UPDATED: Update via API with integration sync
      const result = await OrderAPI.updateOrderFulfillmentStatus(
        orderId,
        newStatus,
        {
          syncToIntegration: options?.syncToIntegration ?? true,
          trackingInfo: options?.trackingInfo,
          notifyCustomer: shouldNotify
        }
      )

      console.log(`[useOrders] Order ${orderId} fulfillment status updated to ${newStatus}`, {
        integrationSync: result.integrationSync
      })

      return {
        success: true,
        order: result as Order,
        integrationSync: result.integrationSync
      }
    } catch (err: unknown) {
      console.error('[useOrders] Error updating order fulfillment status:', err)
      // Refresh to get correct state from server
      await refreshOrders()
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update fulfillment status'
      }
    }
  }

  /**
   * ✅ NEW: Sync an order to its integration manually
   * Use this when you want to re-sync an order that might have failed
   */
  const syncOrderToIntegration = async (
    orderId: string,
    options?: {
      trackingNumber?: string;
      trackingCompany?: string;
      notifyCustomer?: boolean;
    }
  ): Promise<IntegrationSyncResult> => {
    try {
      const result = await OrderAPI.syncToIntegration(orderId, options)
      console.log(`[useOrders] Order ${orderId} synced to integration:`, result)
      return result
    } catch (err: unknown) {
      console.error('[useOrders] Error syncing order to integration:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Sync failed'
      }
    }
  }

  /**
   * ✅ NEW: Bulk sync multiple orders to their integrations
   */
  const bulkSyncToIntegration = async (
    orderIds: string[],
    options?: {
      notifyCustomer?: boolean;
    }
  ) => {
    try {
      const result = await OrderAPI.bulkSyncToIntegration(orderIds, options)
      console.log(`[useOrders] Bulk sync complete:`, result.message)
      return result
    } catch (err: unknown) {
      console.error('[useOrders] Error bulk syncing orders:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Bulk sync failed',
        results: []
      }
    }
  }

  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrdersFulfillmentStatus,
    updateStatus,
    updateFulfillmentStatus,
    // ✅ NEW: Integration sync methods
    syncOrderToIntegration,
    bulkSyncToIntegration
  }
}
