//file path: src/app/api/integrations/shopify/webhooks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyWebhooks } from '@/lib/shopify/shopifyWebhooks';

// ✅ Use backend API URL
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

/**
 * Shopify Webhook Handler (Frontend Proxy)
 * Verifies HMAC and forwards to backend for processing
 */
export async function POST(request: NextRequest) {
  console.log('=================================');
  console.log('🔔 SHOPIFY WEBHOOK RECEIVED (Frontend)');
  console.log('=================================');

  try {
    // Get raw body for HMAC verification
    const rawBody = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const shop = request.headers.get('x-shopify-shop-domain');

    console.log('[Shopify Webhook] Topic:', topic);
    console.log('[Shopify Webhook] Shop:', shop);
    console.log('[Shopify Webhook] Has HMAC:', !!hmac);

    // Verify webhook authenticity
    if (!hmac || !process.env.SHOPIFY_WEBHOOK_SECRET) {
      console.error('[Shopify Webhook] ❌ Missing HMAC or webhook secret');
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
      console.error('[Shopify Webhook] ❌ HMAC verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('[Shopify Webhook] ✅ HMAC verified');
    console.log('[Shopify Webhook] 📤 Forwarding to backend...');

    // ✅ Forward to backend for processing
    const backendResponse = await fetch(`${BACKEND_API_URL}/api/webhooks/shopify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Topic': topic || '',
        'X-Shopify-Shop-Domain': shop || '',
        'X-Webhook-Verified': 'true', // Tell backend HMAC is already verified
      },
      body: rawBody,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('[Shopify Webhook] ❌ Backend processing failed:', errorText);
      throw new Error(`Backend processing failed: ${backendResponse.status}`);
    }

    const result = await backendResponse.json();
    console.log('[Shopify Webhook] ✅ Backend processed successfully');

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Shopify Webhook] ❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Shopify Webhooks (Frontend Proxy)',
    timestamp: new Date().toISOString(),
  });
}
