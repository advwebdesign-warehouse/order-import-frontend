//file path: lib/shopify/shopifyWebhooks.ts

import crypto from 'crypto';
import { OrderAPI } from '@/lib/api/orderApi';
import { ProductAPI } from '@/lib/api/productApi';

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
   * ✅ UPDATED: Uses API to save orders
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
      await OrderAPI.saveOrders([transformedOrder]);

      console.log('[ShopifyWebhooks] Order saved successfully');
    } catch (error) {
      console.error('[ShopifyWebhooks] Error processing order webhook:', error);
      throw error;
    }
  }

  /**
   * Process product created/updated webhook
   * ✅ UPDATED: Uses API to save products
   */
  static async processProductWebhook(product: any, storeId: string, accountId: string): Promise<void> {
    try {
      // Import GraphQL transformation functions
      const { transformGraphQLProduct } = await import('./shopifyGraphQLTransform');

      // Transform the product
      const transformedProduct = transformGraphQLProduct(product, storeId);

      // ✅ Save to backend via API
      await ProductAPI.saveProducts([transformedProduct]);

      console.log('[ShopifyWebhooks] Product saved successfully');
    } catch (error) {
      console.error('[ShopifyWebhooks] Error processing product webhook:', error);
      throw error;
    }
  }

  /**
   * Process order cancellation webhook
   * ✅ UPDATED: Uses API to update order
   */
  static async processOrderCancellation(
    order: any,
    accountId: string,
    storeId: string
  ): Promise<void> {
    try {
      // ✅ Find order by externalId
      const orders = await OrderAPI.getOrders();
      const existingOrder = orders.find(
        (o: any) => o.externalId === order.id.toString() && o.storeId === storeId
      );

      if (existingOrder) {
        // ✅ Update order status to cancelled
        await OrderAPI.updateOrder(existingOrder.id, {
          status: 'CANCELLED',
          fulfillmentStatus: 'CANCELLED'
        });

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
   * ✅ UPDATED: Uses API to update order
   */
  static async processFulfillmentWebhook(
    fulfillment: any,
    accountId: string,
    storeId: string
  ): Promise<void> {
    try {
      // ✅ Find order by externalId
      const orders = await OrderAPI.getOrders();
      const existingOrder = orders.find(
        (o: any) => o.externalId === fulfillment.order_id.toString() && o.storeId === storeId
      );

      if (existingOrder) {
        // ✅ Update order with fulfillment info
        await OrderAPI.updateOrder(existingOrder.id, {
          status: 'SHIPPED',
          fulfillmentStatus: 'SHIPPED',
          fulfillmentId: fulfillment.id?.toString(),
          trackingNumber: fulfillment.tracking_number,
          trackingCompany: fulfillment.tracking_company,
          trackingUrl: fulfillment.tracking_url
        });

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
