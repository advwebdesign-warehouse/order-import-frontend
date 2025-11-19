//file path: src/app/api/integrations/shopify/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  getShopifyCredentials,
  getOAuthState,
  deleteOAuthState,
} from '@/lib/utils/shopifyAuth';
import { saveIntegration, updateIntegrationConfig } from '@/lib/storage/shopifyIntegrationHelpers';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { registerShopifyWebhooks } from '@/lib/shopify/shopifyWebhookRegistration';

/**
 * Shopify OAuth Callback Handler
 * Handles the OAuth callback from Shopify and registers webhooks
 */
export async function GET(request: NextRequest) {
  console.log('=================================');
  console.log('🔐 SHOPIFY OAUTH CALLBACK');
  console.log('=================================');

  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    console.log('[OAuth Callback] Shop:', shop);
    console.log('[OAuth Callback] State:', state);
    console.log('[OAuth Callback] Has Code:', !!code);
    console.log('[OAuth Callback] Has HMAC:', !!hmac);

    // Validate parameters
    if (!code || !shop || !state) {
      console.error('[OAuth Callback] ❌ Missing required parameters');
      return redirectWithError('Missing required OAuth parameters');
    }

    // Verify state
    const stateData = getOAuthState(state);
    if (!stateData || stateData.shop !== shop) {
      console.error('[OAuth Callback] ❌ Invalid OAuth state');
      deleteOAuthState(state);
      return redirectWithError('Invalid OAuth state');
    }

    const { storeId } = stateData;
    console.log('[OAuth Callback] Store ID:', storeId);

    // Clean up state
    deleteOAuthState(state);

    // Get credentials
    const { apiKey, apiSecret } = getShopifyCredentials();

    // Exchange code for access token
    console.log('[OAuth Callback] Exchanging code for access token...');
    const tokenResponse = await exchangeCodeForToken(shop, code, apiKey, apiSecret);
    const { access_token: accessToken, scope } = tokenResponse;

    console.log('[OAuth Callback] ✅ Access token received');
    console.log('[OAuth Callback] Scopes:', scope);

    // Test the connection
    console.log('[OAuth Callback] Testing connection...');
    const client = new ShopifyGraphQLClient({ shop, accessToken });
    const testResult = await client.testConnection();

    console.log('[OAuth Callback] ✅ Connection test successful');
    console.log('[OAuth Callback] Shop name:', testResult.shop.name);

    // Generate unique integration ID
    const integrationId = `shopify-${shop.replace('.myshopify.com', '')}-${Date.now()}`;
    const accountId = shop.replace('.myshopify.com', '');

    // Save integration
    const integration = {
      id: integrationId,
      provider: 'shopify' as const,
      storeId: storeId || `store-${Date.now()}`,
      accountId,
      status: 'connected' as const,
      config: {
        storeUrl: shop,
        storeName: testResult.shop.name,
        accessToken,
        scope,
        webhooksRegistered: false,
        lastSyncTime: null,
      },
      connectedAt: new Date().toISOString(),
    };

    await saveIntegration(integration, accountId);
    console.log('[OAuth Callback] ✅ Integration saved');

    // Register webhooks
    console.log('[OAuth Callback] 🔔 Registering webhooks...');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
      const webhookUrl = `${baseUrl}/api/integrations/shopify/webhooks`;

      console.log('[OAuth Callback] Webhook URL:', webhookUrl);

      const webhookResult = await registerShopifyWebhooks(shop, accessToken, webhookUrl);

      if (webhookResult.success) {
        console.log('[OAuth Callback] ✅ Webhooks registered:', webhookResult.registered);

        // Update integration with webhook status
        await updateIntegrationConfig(integrationId, {
          ...integration.config,
          webhooksRegistered: true,
          registeredWebhooks: webhookResult.registered,
        });
      } else {
        console.error('[OAuth Callback] ⚠️  Webhook registration had errors:', webhookResult.errors);

        // Still mark as partial success
        await updateIntegrationConfig(integrationId, {
          ...integration.config,
          webhooksRegistered: webhookResult.registered.length > 0,
          registeredWebhooks: webhookResult.registered,
          webhookErrors: webhookResult.errors,
        });
      }
    } catch (webhookError) {
      console.error('[OAuth Callback] ⚠️  Webhook registration failed:', webhookError);
      // Don't fail the entire OAuth flow if webhooks fail
      // User can try registering webhooks manually later
    }

    // Trigger initial sync
    console.log('[OAuth Callback] 🔄 Triggering initial sync...');
    try {
      const syncResponse = await fetch(`${request.nextUrl.origin}/api/integrations/shopify/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          accessToken,
          accountId: integration.accountId,
          storeId: integration.storeId,
          syncType: 'all',
        }),
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        console.log('[OAuth Callback] ✅ Initial sync completed:', {
          orders: syncData.orderCount,
          products: syncData.productCount,
        });

        // Update last sync time
        await updateIntegrationConfig(integrationId, {
          ...integration.config,
          lastSyncTime: new Date().toISOString(),
          lastSyncOrderCount: syncData.orderCount,
          lastSyncProductCount: syncData.productCount,
        });
      } else {
        console.error('[OAuth Callback] ⚠️  Initial sync failed');
      }
    } catch (syncError) {
      console.error('[OAuth Callback] ⚠️  Initial sync error:', syncError);
      // Don't fail the OAuth flow if sync fails
    }

    console.log('=================================');
    console.log('✅ SHOPIFY OAUTH CALLBACK COMPLETE');
    console.log('=================================');

    // Redirect back to integrations page with success message
    const redirectUrl = new URL('/dashboard/integrations', request.nextUrl.origin);
    redirectUrl.searchParams.set('shopify_connected', 'true');
    redirectUrl.searchParams.set('shop', testResult.shop.name);

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[OAuth Callback] ❌ Error:', error);
    return redirectWithError(
      error instanceof Error ? error.message : 'OAuth callback failed'
    );
  }
}

/**
 * Helper function to redirect with error message
 */
function redirectWithError(message: string): NextResponse {
  const redirectUrl = new URL('/dashboard/integrations', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  redirectUrl.searchParams.set('shopify_error', message);
  return NextResponse.redirect(redirectUrl);
}
