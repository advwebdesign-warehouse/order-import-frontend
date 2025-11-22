//file path: src/app/api/integrations/shopify/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { registerShopifyWebhooks } from '@/lib/shopify/shopifyWebhookRegistration';

/**
 * Shopify OAuth Callback Handler
 * ✅ UPDATED: Now uses backend API instead of localStorage
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

    // ✅ Get API base URL
    const baseUrl = getApiBaseUrl(request);

    // ✅ Verify state and get integration info from backend
    const stateData = await verifyOAuthState(baseUrl, state);
    if (!stateData || stateData.shop !== shop) {
      console.error('[OAuth Callback] ❌ Invalid OAuth state');
      await deleteOAuthState(baseUrl, state);
      return redirectWithError('Invalid OAuth state');
    }

    const { storeId, integrationId } = stateData;
    console.log('[OAuth Callback] Store ID:', storeId);
    console.log('[OAuth Callback] Integration ID:', integrationId);

    // Clean up state
    await deleteOAuthState(baseUrl, state);

    // ✅ Get integration from backend to get API credentials
    const integration = await getIntegrationFromAPI(baseUrl, integrationId);
    if (!integration) {
      console.error('[OAuth Callback] ❌ Integration not found');
      return redirectWithError('Integration not found');
    }

    // ✅ Get API key and secret from integration config (REQUIRED - no fallback)
    const apiKey = integration.config?.apiKey
    const apiSecret = integration.config?.apiSecret

    if (!apiKey || !apiSecret) {
      console.error('[Shopify Callback] ❌ Missing API credentials in integration config')
      throw new Error('Shopify API credentials not configured in integration. Please add apiKey and apiSecret to integration config.')
    }

    console.log('[OAuth Callback] Using API key from integration config');

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

    // Get accountId from authenticated user
    const accountId = await getAccountIdFromRequest(request);
    if (!accountId) {
      console.error('[OAuth Callback] ❌ No account ID found');
      return redirectWithError('Authentication required');
    }

    // Update integration with connection details
    const updatedConfig = {
      ...integration.config,
      storeUrl: shop,
      storeName: testResult.shop.name,
      accessToken,
      scope,
      webhooksRegistered: false,
      lastSyncTime: null,
      connectedAt: new Date().toISOString(),
    };

    // ✅ Update integration status and config via API
    await updateIntegrationAPI(baseUrl, integrationId, {
      status: 'connected',
      enabled: true,
      config: updatedConfig,
    });

    console.log('[OAuth Callback] ✅ Integration updated in database');

    // Register webhooks
    console.log('[OAuth Callback] 🔔 Registering webhooks...');
    try {
      const webhookUrl = `${baseUrl}/api/webhooks/shopify`;

      console.log('[OAuth Callback] Webhook URL:', webhookUrl);

      const webhookResult = await registerShopifyWebhooks(shop, accessToken, webhookUrl);

      if (webhookResult.success) {
        console.log('[OAuth Callback] ✅ Webhooks registered:', webhookResult.registered);

        // ✅ Update integration config via API
        await updateIntegrationConfigAPI(baseUrl, integrationId, {
          ...updatedConfig,
          webhooksRegistered: true,
          registeredWebhooks: webhookResult.registered,
        });
      } else {
        console.error('[OAuth Callback] ⚠️  Webhook registration had errors:', webhookResult.errors);

        // Still mark as partial success
        await updateIntegrationConfigAPI(baseUrl, integrationId, {
          ...updatedConfig,
          webhooksRegistered: webhookResult.registered.length > 0,
          registeredWebhooks: webhookResult.registered,
          webhookErrors: webhookResult.errors,
        });
      }
    } catch (webhookError) {
      console.error('[OAuth Callback] ⚠️  Webhook registration failed:', webhookError);
      // Don't fail the entire OAuth flow if webhooks fail
    }

    // Trigger initial sync
    console.log('[OAuth Callback] 🔄 Triggering initial sync...');
    try {
      const syncResponse = await fetch(`${baseUrl}/api/integrations/shopify/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop,
          accessToken,
          accountId,
          storeId,
          integrationId,
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
        await updateIntegrationConfigAPI(baseUrl, integrationId, {
          ...updatedConfig,
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

// ============================================================================
// ✅ HELPER FUNCTIONS - UPDATED TO USE BACKEND API
// ============================================================================

/**
 * Get API base URL
 */
function getApiBaseUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL ||
         request.headers.get('origin') ||
         'http://localhost:3001';
}

/**
 * Get account ID from authenticated request
 */
async function getAccountIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Get auth cookie
    const authCookie = request.cookies.get('auth_token');
    if (!authCookie) {
      return null;
    }

    // Call backend to get current user
    const baseUrl = getApiBaseUrl(request);
    const response = await fetch(`${baseUrl}/api/users/current`, {
      headers: {
        'Cookie': `auth_token=${authCookie.value}`
      }
    });

    if (!response.ok) {
      return null;
    }

    const user = await response.json();
    return user.accountId;
  } catch (error) {
    console.error('[OAuth Callback] Error getting account ID:', error);
    return null;
  }
}

/**
 * Verify OAuth state via backend API
 */
async function verifyOAuthState(
  baseUrl: string,
  state: string
): Promise<{ shop: string; storeId: string; integrationId: string } | null> {
  try {
    // ✅ Call backend endpoint to verify state
    const response = await fetch(`${baseUrl}/api/auth/oauth/state/${state}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[OAuth Callback] Error verifying state:', error);
    return null;
  }
}

/**
 * Delete OAuth state via backend API
 */
async function deleteOAuthState(baseUrl: string, state: string): Promise<void> {
  try {
    await fetch(`${baseUrl}/api/auth/oauth/state/${state}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('[OAuth Callback] Error deleting state:', error);
  }
}

/**
 * Get integration from backend API
 */
async function getIntegrationFromAPI(baseUrl: string, integrationId: string): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/api/integrations/${integrationId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.integration;
  } catch (error) {
    console.error('[OAuth Callback] Error getting integration:', error);
    return null;
  }
}

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
 * Update integration via backend API
 */
async function updateIntegrationAPI(
  baseUrl: string,
  integrationId: string,
  updates: any
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/integrations/${integrationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update integration: ${error}`);
  }

  console.log('[OAuth Callback] Integration updated successfully');
}

/**
 * Update integration config via backend API
 */
async function updateIntegrationConfigAPI(
  baseUrl: string,
  integrationId: string,
  config: any
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/integrations/${integrationId}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update integration config: ${error}`);
  }

  console.log('[OAuth Callback] Config updated successfully');
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
