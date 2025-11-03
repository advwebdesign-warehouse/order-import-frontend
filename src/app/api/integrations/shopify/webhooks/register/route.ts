//file path: src/app/api/integrations/shopify/webhooks/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyWebhookRegistration } from '@/lib/shopify/shopifyWebhookRegistration';

/**
 * Register Shopify webhooks for a store
 * This endpoint should be called after successfully connecting a Shopify store
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, accessToken } = body;

    if (!shop || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: shop, accessToken' },
        { status: 400 }
      );
    }

    console.log('[Webhook Registration API] Registering webhooks for:', shop);

    // Get the base URL for webhooks from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/integrations/shopify/webhooks`;

    console.log('[Webhook Registration API] Webhook URL:', webhookUrl);

    // Initialize webhook registration
    const registration = new ShopifyWebhookRegistration({
      shop,
      accessToken,
      webhookUrl,
    });

    // Register all webhooks
    const result = await registration.registerAllWebhooks();

    console.log('[Webhook Registration API] Registration result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully registered ${result.registered.length} webhooks`,
        registered: result.registered,
        errors: result.errors,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to register webhooks',
        registered: result.registered,
        errors: result.errors,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Webhook Registration API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook registration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get current webhooks for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const accessToken = searchParams.get('accessToken');

    if (!shop || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: shop, accessToken' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/integrations/shopify/webhooks`;

    const registration = new ShopifyWebhookRegistration({
      shop,
      accessToken,
      webhookUrl,
    });

    const webhooks = await registration.getWebhooks();

    return NextResponse.json({
      success: true,
      webhooks,
    });
  } catch (error) {
    console.error('[Webhook Registration API] Error getting webhooks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get webhooks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Delete all webhooks for a shop
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, accessToken } = body;

    if (!shop || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: shop, accessToken' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}/api/integrations/shopify/webhooks`;

    const registration = new ShopifyWebhookRegistration({
      shop,
      accessToken,
      webhookUrl,
    });

    const result = await registration.deleteAllWebhooks();

    return NextResponse.json({
      success: result.success,
      message: `Deleted ${result.deleted} webhooks`,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error('[Webhook Registration API] Error deleting webhooks:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete webhooks',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
