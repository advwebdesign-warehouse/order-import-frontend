//file path: src/app/api/integrations/shopify/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { getOAuthState, deleteOAuthState } from '@/lib/utils/shopifyAuth';

/**
 * Shopify OAuth Callback Handler
 * ✅ FIXED: Simplified to only handle OAuth token exchange
 * The frontend will create/update the integration after redirect
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
      console.error('[OAuth Callback]  Missing required parameters');
      return redirectWithError('Missing required OAuth parameters');
    }

    // ⭐ Get state data (includes warehouse config!)
    const stateData = getOAuthState(state);
    if (!stateData || stateData.shop !== shop) {
      console.error('[OAuth Callback] ❌ Invalid OAuth state');
      deleteOAuthState(state);
      return redirectWithError('Invalid OAuth state');
    }

    // ⭐ Extract warehouse config from state
    const { storeId, warehouseConfig } = stateData;

    // Validate storeId exists
    if (!storeId) {
      console.error('[OAuth Callback] ❌ Missing store ID in state data');
      deleteOAuthState(state);
      return redirectWithError('Invalid OAuth state: missing store ID');
    }

    console.log('[OAuth Callback] Store ID:', storeId);
    console.log('[OAuth Callback] Warehouse Config available:', !!warehouseConfig);

    // Clean up state
    deleteOAuthState(state);

    // ✅ FIXED: Get Shopify credentials from environment variables
    // The integration doesn't exist yet when callback runs, so we can't get credentials from it
    const apiKey = process.env.SHOPIFY_CLIENT_ID;
    const apiSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('[OAuth Callback] ❌ Missing Shopify API credentials in environment');
      throw new Error('Shopify API credentials not configured. Please set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET environment variables.');
    }

    console.log('[OAuth Callback] ✅ Using Shopify credentials from environment');

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

    console.log('=================================');
    console.log('✅ SHOPIFY OAUTH CALLBACK COMPLETE');
    console.log('=================================');

    // ✅ Redirect to frontend with credentials and warehouse config
    // The frontend will create/update the integration
    const redirectUrl = new URL('/dashboard/integrations', request.nextUrl.origin);
    redirectUrl.searchParams.set('shopify_auth', 'success');
    redirectUrl.searchParams.set('shop', shop);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('store_id', storeId);

    // ✅ Add warehouse config if present
    if (warehouseConfig) {
      redirectUrl.searchParams.set('warehouse_config', JSON.stringify(warehouseConfig));
      console.log('[OAuth Callback] ✅ Warehouse config included in redirect');
    }

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('[OAuth Callback] ❌ Error:', error);
    return redirectWithError(
      error instanceof Error ? error.message : 'OAuth callback failed'
    );
  }
}

// ============================================================================
// ✅ HELPER FUNCTIONS
// ============================================================================

/**
 * Exchange OAuth code for access token
 */
async function exchangeCodeForToken(
  shop: string,
  code: string,
  apiKey: string,
  apiSecret: string
): Promise<{ access_token: string; scope: string }> {
  const url = `https://${shop}/admin/oauth/access_token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Helper function to redirect with error message
 */
function redirectWithError(message: string): NextResponse {
  const redirectUrl = new URL(
    '/dashboard/integrations',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  );
  redirectUrl.searchParams.set('shopify_error', message);
  return NextResponse.redirect(redirectUrl);
}
