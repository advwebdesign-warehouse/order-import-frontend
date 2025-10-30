//file path: lib/utils/shopifyAuth.ts

import { ShopifyAccessTokenResponse } from '@/lib/shopify/shopifyTypes'

/**
 * Required Shopify OAuth scopes for the app
 * Adjust these based on your app's needs
 */
export const SHOPIFY_SCOPES = [
  'read_orders',
  'write_orders',
  'read_products',
  'write_products',
  'read_inventory',
  'write_inventory',
  'read_fulfillments',
  'write_fulfillments',
  'read_shipping',
  'write_shipping',
  'read_customers',
  'read_locations',
]

/**
 * Exchange authorization code for access token
 * @param shop - Shop domain
 * @param code - Authorization code from OAuth callback
 * @param clientId - Shopify API key
 * @param clientSecret - Shopify API secret
 * @returns Promise<ShopifyAccessTokenResponse>
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string,
  clientId: string,
  clientSecret: string
): Promise<ShopifyAccessTokenResponse> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for token: ${error}`)
  }

  return response.json()
}

/**
 * Get Shopify API credentials from environment
 * @returns Object with API key and secret
 * @throws Error if credentials are missing
 */
export function getShopifyCredentials() {
  const apiKey = process.env.SHOPIFY_CLIENT_ID
  const apiSecret = process.env.SHOPIFY_CLIENT_SECRET
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Shopify API credentials not configured in environment variables')
  }

  return {
    apiKey,
    apiSecret,
    webhookSecret: webhookSecret || apiSecret, // Use API secret as fallback
  }
}

/**
 * Get OAuth redirect URI
 * @returns string - Full redirect URI
 */
export function getOAuthRedirectUri(): string {
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI

  if (!redirectUri) {
    throw new Error('SHOPIFY_REDIRECT_URI not configured in environment variables')
  }

  return redirectUri
}

/**
 * Store OAuth state in session/database
 * This is a simple in-memory store - replace with Redis/Database in production
 */
const stateStore = new Map<string, { shop: string; timestamp: number; storeId?: string }>()

export function saveOAuthState(state: string, shop: string, storeId?: string) {
  stateStore.set(state, {
    shop,
    storeId,
    timestamp: Date.now(),
  })

  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000
  stateStore.forEach((value, key) => {
    if (value.timestamp < tenMinutesAgo) {
      stateStore.delete(key)
    }
  })
}

export function getOAuthState(state: string) {
  return stateStore.get(state)
}

export function deleteOAuthState(state: string) {
  stateStore.delete(state)
}

/**
 * Create Shopify API headers for authenticated requests
 * @param accessToken - Shopify access token
 * @returns Headers object
 */
export function createShopifyHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': accessToken,
  }
}

/**
 * Make authenticated request to Shopify API
 * @param shop - Shop domain
 * @param accessToken - Access token
 * @param endpoint - API endpoint (e.g., '/admin/api/2024-01/orders.json')
 * @param options - Fetch options
 * @returns Promise with response data
 */
export async function shopifyApiRequest<T>(
  shop: string,
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `https://${shop}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...createShopifyHeaders(accessToken),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Shopify API request failed: ${response.status} ${error}`)
  }

  return response.json()
}

/**
 * Get Shopify API version
 * @returns string - API version (e.g., '2024-01')
 */
export function getShopifyApiVersion(): string {
  return process.env.SHOPIFY_API_VERSION || '2024-01'
}
