//file path: src/app/api/integrations/shopify/webhooks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyWebhooks } from '@/lib/shopify/shopifyWebhooks';

/**
 * Shopify Webhook Handler
 * Processes incoming webhooks from Shopify
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for HMAC verification
    const rawBody = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shop = request.headers.get('x-shopify-shop-domain');

    console.log('[Shopify Webhook] Received webhook:', {
      topic,
      shop,
      hasHmac: !!hmac,
    });

    // Verify webhook authenticity
    if (!hmac || !process.env.SHOPIFY_WEBHOOK_SECRET) {
      console.error('[Shopify Webhook] Missing HMAC or webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isValid = ShopifyWebhooks.verifyWebhook(
      rawBody,
      hmac,
      process.env.SHOPIFY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error('[Shopify Webhook] HMAC verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Shopify Webhook] ✅ HMAC verified');

    // Parse webhook data
    const data = JSON.parse(rawBody);

    // Get account/store info from shop domain
    // In production, you'd query your database to find the account
    // For now, we'll extract from localStorage or use a default
    const accountId = 'default'; // TODO: Get from your database
    const storeId = `shopify-${shop}`;

    // Process webhook based on topic
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
        console.log('[Shopify Webhook] Processing order webhook:', data.id);
        await ShopifyWebhooks.processOrderWebhook(data, accountId, storeId);
        break;

      case 'orders/cancelled':
        console.log('[Shopify Webhook] Processing order cancellation:', data.id);
        await ShopifyWebhooks.processOrderCancellation(data, accountId);
        break;

      case 'orders/fulfilled':
        console.log('[Shopify Webhook] Processing order fulfillment:', data.id);
        if (data.fulfillments && data.fulfillments.length > 0) {
          await ShopifyWebhooks.processFulfillmentWebhook(
            data.fulfillments[0],
            accountId
          );
        }
        break;

      case 'products/create':
      case 'products/update':
        console.log('[Shopify Webhook] Processing product webhook:', data.id);
        await ShopifyWebhooks.processProductWebhook(data, accountId, storeId);
        break;

      case 'products/delete':
        console.log('[Shopify Webhook] Product deleted:', data.id);
        // TODO: Implement product deletion
        break;

      default:
        console.log('[Shopify Webhook] Unhandled topic:', topic);
    }

    console.log('[Shopify Webhook] ✅ Webhook processed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Shopify Webhook] Error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Shopify Webhooks',
  });
}
