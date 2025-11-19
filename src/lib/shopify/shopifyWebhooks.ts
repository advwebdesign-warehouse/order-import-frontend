//file path: lib/shopify/shopifyWebhooks.ts

import crypto from 'crypto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com';

export class ShopifyWebhooks {
  /**
   * Verify webhook HMAC signature
   */
  static verifyWebhook(
    body: string,
    hmacHeader: string,
    secret: string
  ): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }

  /**
   * Process order created/updated webhook
   * Note: Shopify sends REST format even with GraphQL API
   */
  static async processOrderWebhook(
    order: any,
    accountId: string,
    storeId: string,
    warehouseId?: string
  ): Promise<void> {
    try {
      // Import GraphQL transformation functions
      const { transformGraphQLOrder } = await import('./shopifyGraphQLTransform');

      // Transform using the REST-format webhook data
      const transformedOrder = transformGraphQLOrder(order, storeId, warehouseId);

      // ✅ Save to backend via API
      const response = await fetch(`${API_BASE_URL}/api/orders/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: [transformedOrder],
          accountId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save order: ${response.statusText}`);
      }

      console.log('[ShopifyWebhooks] Order saved successfully');
    } catch (error) {
      console.error('[ShopifyWebhooks] Error processing order webhook:', error);
      throw error;
    }
  }

  /**
   * Process product created/updated webhook
   */
  static async processProductWebhook(product: any, storeId: string, accountId: string): Promise<void> {
    try {
      // Import GraphQL transformation functions
      const { transformGraphQLProduct } = await import('./shopifyGraphQLTransform');

      // Transform the product
      const transformedProduct = transformGraphQLProduct(product, storeId);

      // ✅ Save to backend via API
      const response = await fetch(`${API_BASE_URL}/api/products/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [transformedProduct],
          accountId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save product: ${response.statusText}`);
      }

      console.log('[ShopifyWebhooks] Product saved successfully');
    } catch (error) {
      console.error('[ShopifyWebhooks] Error processing product webhook:', error);
      throw error;
    }
  }

  /**
   * Process order cancellation webhook
   */
  static async processOrderCancellation(
    order: any,
    accountId: string,
    storeId: string
  ): Promise<void> {
    try {
      // ✅ Check if order exists
      const checkResponse = await fetch(
        `${API_BASE_URL}/api/orders/check?externalId=${order.id}&storeId=${storeId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!checkResponse.ok) {
        throw new Error('Failed to check order existence');
      }

      const { exists, orderId } = await checkResponse.json();

      if (exists && orderId) {
        // ✅ Update order status to cancelled
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'CANCELLED',
            fulfillmentStatus: 'CANCELLED'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to cancel order: ${response.statusText}`);
        }

        console.log('[ShopifyWebhooks] Order cancelled successfully');
      } else {
        console.warn('[ShopifyWebhooks] Order not found for cancellation:', order.id);
      }
    } catch (error) {
      console.error('[ShopifyWebhooks] Error processing order cancellation:', error);
      throw error;
    }
  }

  /**
   * Process fulfillment webhook
   */
  static async processFulfillmentWebhook(
    fulfillment: any,
    accountId: string,
    storeId: string
  ): Promise<void> {
    try {
      // ✅ Check if order exists
      const checkResponse = await fetch(
        `${API_BASE_URL}/api/orders/check?externalId=${fulfillment.order_id}&storeId=${storeId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!checkResponse.ok) {
        throw new Error('Failed to check order existence');
      }

      const { exists, orderId } = await checkResponse.json();

      if (exists && orderId) {
        // ✅ Update order with fulfillment info
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'SHIPPED',
            fulfillmentStatus: 'SHIPPED',
            fulfillmentId: fulfillment.id?.toString(),
            trackingNumber: fulfillment.tracking_number,
            trackingCompany: fulfillment.tracking_company,
            trackingUrl: fulfillment.tracking_url
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to update fulfillment: ${response.statusText}`);
        }

        console.log('[ShopifyWebhooks] Order fulfillment updated successfully');
      } else {
        console.warn('[ShopifyWebhooks] Order not found for fulfillment:', fulfillment.order_id);
      }
    } catch (error) {
      console.error('[ShopifyWebhooks] Error processing fulfillment webhook:', error);
      throw error;
    }
  }

  /**
   * Get webhook topics to subscribe to
   */
  static getRequiredWebhookTopics(): string[] {
    return [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
      'orders/fulfilled',
      'products/create',
      'products/update',
      'products/delete',
    ];
  }

  /**
   * Generate webhook URL for a topic
   */
  static generateWebhookUrl(baseUrl: string, topic: string): string {
    const topicPath = topic.replace('/', '-');
    return `${baseUrl}/api/shopify/webhooks/${topicPath}`;
  }
}
