//file path: lib/shopify/shopifyWebhooks.ts

import crypto from 'crypto';

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
    storeId: string
  ): Promise<void> {
    // Import GraphQL transformation functions
    const { transformGraphQLOrder } = await import('./shopifyGraphQLTransform');
    const { saveShopifyOrder } = await import('./shopifyStorage');

    // Transform using the REST-format webhook data
    // (Shopify webhooks still use REST format regardless of API)
    const transformedOrder = transformGraphQLOrder(order, storeId, accountId);
    await saveShopifyOrder(transformedOrder, accountId);
  }

  /**
   * Process product created/updated webhook
   */
  static async processProductWebhook(
    product: any,
    accountId: string,
    storeId: string
  ): Promise<void> {
    // Import GraphQL transformation functions
    const { transformGraphQLProduct } = await import('./shopifyGraphQLTransform');
    const { saveShopifyProduct } = await import('./shopifyStorage');

    // Transform and save the product
    const transformedProduct = transformGraphQLProduct(product, storeId);
    await saveShopifyProduct(transformedProduct, accountId);
  }

  /**
   * Process order cancellation webhook
   */
  static async processOrderCancellation(
    order: any,
    accountId: string
  ): Promise<void> {
    const { updateOrderStatus } = await import('./shopifyStorage');

    // Update order status to cancelled
    await updateOrderStatus(order.id.toString(), 'cancelled', accountId);
  }

  /**
   * Process fulfillment webhook
   */
  static async processFulfillmentWebhook(
    fulfillment: any,
    accountId: string
  ): Promise<void> {
    const { updateOrderFulfillment } = await import('./shopifyStorage');

    // Update order with fulfillment info
    await updateOrderFulfillment(
      fulfillment.order_id.toString(),
      {
        fulfillmentId: fulfillment.id.toString(),
        trackingNumber: fulfillment.tracking_number,
        trackingCompany: fulfillment.tracking_company,
        status: fulfillment.status,
      },
      accountId
    );
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
