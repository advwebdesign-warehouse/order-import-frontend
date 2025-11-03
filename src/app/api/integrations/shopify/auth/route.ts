//file path: src/app/api/integrations/shopify/auth/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getShopifyCredentials,
  getOAuthRedirectUri,
  saveOAuthState,
  SHOPIFY_SCOPES,
} from '@/lib/utils/shopifyAuth';
import { randomBytes } from 'crypto';

/**
 * Shopify OAuth Initiation Handler
 * Redirects user to Shopify OAuth authorization page
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const storeId = searchParams.get('storeId');

    console.log('[OAuth Initiation] Shop:', shop);
    console.log('[OAuth Initiation] Store ID:', storeId);

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400 }
      );
    }

    // Validate shop format
    let normalizedShop = shop.trim().toLowerCase();
    normalizedShop = normalizedShop.replace(/^https?:\/\//, '');
    normalizedShop = normalizedShop.replace(/\/$/, '');
    normalizedShop = normalizedShop.split('/')[0];

    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`;
    }

    // Validate format
    if (!normalizedShop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
      return NextResponse.json(
        { error: 'Invalid shop URL format' },
        { status: 400 }
      );
    }

    // Get credentials
    const { apiKey } = getShopifyCredentials();
    const redirectUri = getOAuthRedirectUri();

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Save state with shop and storeId
    saveOAuthState(state, normalizedShop, storeId || undefined);

    console.log('[OAuth Initiation] Generated state:', state);

    // Build Shopify OAuth URL
    const scopes = SHOPIFY_SCOPES.join(',');
    const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', apiKey);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    console.log('[OAuth Initiation] Redirecting to:', authUrl.toString());

    // Redirect to Shopify
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[OAuth Initiation] Error:', error);
    return NextResponse.json(
      {
        error: 'OAuth initiation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
