//file path: src/lib/api/orderApi.ts
// ✅ UPDATED: Added syncToIntegration support for status updates

import { apiRequest } from './baseApi'

export interface OrderUpdateOptions {
  syncToIntegration?: boolean;  // If true, sync status change to Shopify/WooCommerce/etc.
  trackingInfo?: {
    trackingNumber?: string;
    trackingCompany?: string;
    trackingUrl?: string;
  };
  notifyCustomer?: boolean;  // If true, send notification email to customer
}

export interface IntegrationSyncResult {
  success: boolean;
  message: string;
  shopifyAction?: 'created_fulfillment' | 'updated_tracking' | 'added_tag' | 'no_action';
  shopifyFulfillmentId?: string;
}

export interface OrderUpdateResponse {
  id: string;
  status: string;
  fulfillmentStatus: string;
  integrationSync?: IntegrationSyncResult;
  [key: string]: any;  // Other order fields
}

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

  /**
   * Update an order
   *
   * @param orderId - The order ID to update
   * @param updates - Fields to update (status, fulfillmentStatus, etc.)
   * @param options - Additional options including syncToIntegration
   *
   * @example
   * // Update status locally only
   * await OrderAPI.updateOrder('order-123', { fulfillmentStatus: 'SHIPPED' })
   *
   * @example
   * // Update status and sync to Shopify
   * await OrderAPI.updateOrder('order-123', { fulfillmentStatus: 'SHIPPED' }, {
   *   syncToIntegration: true,
   *   trackingInfo: { trackingNumber: '1Z999...' },
   *   notifyCustomer: true
   * })
   */
  static async updateOrder(
    orderId: string,
    updates: any,
    options?: OrderUpdateOptions
  ): Promise<OrderUpdateResponse> {
    const body: any = { ...updates }

    // Add sync options if provided
    if (options) {
      if (options.syncToIntegration !== undefined) {
        body.syncToIntegration = options.syncToIntegration
      }
      if (options.trackingInfo) {
        body.trackingInfo = options.trackingInfo
      }
      if (options.notifyCustomer !== undefined) {
        body.notifyCustomer = options.notifyCustomer
      }
    }

    return apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  /**
   * ✅ NEW: Update order status with integration sync
   * Convenience method that defaults to syncing to integration
   */
  static async updateOrderStatus(
    orderId: string,
    status: string,
    syncToIntegration: boolean = true
  ): Promise<OrderUpdateResponse> {
    return this.updateOrder(orderId, { status }, { syncToIntegration })
  }

  /**
   * ✅ NEW: Update order fulfillment status with integration sync
   * Convenience method that defaults to syncing to integration
   */
  static async updateOrderFulfillmentStatus(
    orderId: string,
    fulfillmentStatus: string,
    options?: {
      syncToIntegration?: boolean;
      trackingInfo?: {
        trackingNumber?: string;
        trackingCompany?: string;
        trackingUrl?: string;
      };
      notifyCustomer?: boolean;
    }
  ): Promise<OrderUpdateResponse> {
    return this.updateOrder(
      orderId,
      { fulfillmentStatus },
      {
        syncToIntegration: options?.syncToIntegration ?? true, // Default to true
        trackingInfo: options?.trackingInfo,
        notifyCustomer: options?.notifyCustomer
      }
    )
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

  /**
   * ✅ NEW: Manually sync an order to its integration
   * Use this to force-sync an order that might not have been synced
   */
  static async syncToIntegration(
    orderId: string,
    options?: {
      trackingNumber?: string;
      trackingCompany?: string;
      trackingUrl?: string;
      notifyCustomer?: boolean;
    }
  ): Promise<IntegrationSyncResult> {
    return apiRequest(`/orders/${orderId}/sync-to-integration`, {
      method: 'POST',
      body: JSON.stringify(options || {})
    })
  }

  /**
   * ✅ NEW: Bulk sync multiple orders to their integrations
   * Useful for syncing all orders with a certain status
   */
  static async bulkSyncToIntegration(
    orderIds: string[],
    options?: {
      notifyCustomer?: boolean;
    }
  ): Promise<{
    success: boolean;
    message: string;
    results: Array<{
      orderId: string;
      success: boolean;
      message: string;
    }>;
  }> {
    return apiRequest('/orders/bulk-sync-to-integration', {
      method: 'POST',
      body: JSON.stringify({
        orderIds,
        ...options
      })
    })
  }
}
