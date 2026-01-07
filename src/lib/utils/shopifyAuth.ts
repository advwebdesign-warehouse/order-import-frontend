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
 * ✅ OAuth State Store with Global Persistence
 *
 * This ensures the state persists across Next.js serverless function invocations.
 * In production with multiple servers, consider using Redis or a database.
 *
 * Note: "shop" parameter is kept for Shopify OAuth compatibility (Shopify's term),
 * but we refer to it as "store" in logging for consistency with our app.
 */

// ✅ NEW: Inventory config interface
interface InventoryConfig {
  inventorySync: boolean
  syncDirection: string
  managesInventory: boolean
}

// ✅ UPDATED: StateData now includes inventoryConfig
interface StateData {
  shop: string
  timestamp: number
  storeId?: string
  warehouseConfig?: any
  inventoryConfig?: InventoryConfig  // ✅ NEW: Added inventory config
}

// ✅ Use global variable to persist across serverless invocations
declare global {
  var __shopifyOAuthStateStore: Map<string, StateData> | undefined
}

// Initialize or retrieve the global state store
const getStateStore = (): Map<string, StateData> => {
  if (!global.__shopifyOAuthStateStore) {
    global.__shopifyOAuthStateStore = new Map()
    console.log('[Shopify Auth] ✅ Initialized global OAuth state store')
  }
  return global.__shopifyOAuthStateStore
}

/**
 * ✅ Save OAuth state with 30-minute timeout and better logging
 * @param state - Random state token for CSRF protection
 * @param shop - Store domain from Shopify (e.g., store.myshopify.com)
 * @param storeId - Internal store ID (optional)
 * @param warehouseConfig - Warehouse routing configuration (optional)
 * @param inventoryConfig - Inventory sync configuration (optional) ✅ NEW
 */
 export function saveOAuthState(
   state: string,
   shop: string,
   storeId?: string,
   warehouseConfig?: any,
   inventoryConfig?: InventoryConfig  // ✅ NEW: Added parameter
 ) {
  const stateStore = getStateStore()

  stateStore.set(state, {
    shop,
    storeId,
    warehouseConfig,
    inventoryConfig,  // ✅ NEW: Save inventory config
    timestamp: Date.now(),
  })

  console.log('[Shopify Auth] ✅ Saved OAuth state:', {
    statePreview: state.substring(0, 10) + '...',
    shop,
    storeId,
    hasWarehouseConfig: !!warehouseConfig,
    hasInventoryConfig: !!inventoryConfig,  // ✅ NEW: Log inventory config
    inventorySync: inventoryConfig?.inventorySync,  // ✅ NEW: Log specific values
    syncDirection: inventoryConfig?.syncDirection,
    totalStates: stateStore.size
  })

  // ✅ Clean up old states (older than 30 minutes instead of 10)
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
  let cleanedCount = 0

  stateStore.forEach((value, key) => {
    if (value.timestamp < thirtyMinutesAgo) {
      stateStore.delete(key)
      cleanedCount++
    }
  })

  if (cleanedCount > 0) {
    console.log(`[Shopify Auth] 🧹 Cleaned up ${cleanedCount} expired state(s)`)
  }
}

/**
 * ✅ UPDATED: Get OAuth state with inventory config support
 * @param state - State token to retrieve
 * @returns StateData or undefined if not found
 */
export function getOAuthState(state: string): StateData | undefined {
  const stateStore = getStateStore()

  console.log('[Shopify Auth] 🔍 Retrieving OAuth state:', {
    statePreview: state.substring(0, 10) + '...',
    totalStates: stateStore.size,
    availableStates: Array.from(stateStore.keys()).map(k => k.substring(0, 10) + '...')
  })

  // Clean up expired states before retrieval
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
  stateStore.forEach((value, key) => {
    if (value.timestamp < thirtyMinutesAgo) {
      stateStore.delete(key)
    }
  })

  const stateData = stateStore.get(state)

  if (!stateData) {
    console.error('[Shopify Auth] ❌ OAuth state not found:', state.substring(0, 10) + '...')
    console.error('[Shopify Auth] This usually means:')
    console.error('[Shopify Auth] 1. User took longer than 30 minutes to authorize')
    console.error('[Shopify Auth] 2. State was never created (check /auth route logs)')
    console.error('[Shopify Auth] 3. Next.js serverless functions restarted')
    console.error('[Shopify Auth] Available states:', Array.from(stateStore.keys()).map(k => k.substring(0, 10) + '...'))
  } else {
    const ageSeconds = Math.floor((Date.now() - stateData.timestamp) / 1000)
    console.log('[Shopify Auth] ✅ OAuth state found:', {
      shop: stateData.shop,
      storeId: stateData.storeId,
      hasWarehouseConfig: !!stateData.warehouseConfig,
      hasInventoryConfig: !!stateData.inventoryConfig,  // ✅ NEW
      inventorySync: stateData.inventoryConfig?.inventorySync,  // ✅ NEW
      syncDirection: stateData.inventoryConfig?.syncDirection,  // ✅ NEW
      ageSeconds
    })
  }

  return stateData
}

/**
 * Delete OAuth state after use
 * @param state - State token to delete
 */
export function deleteOAuthState(state: string) {
  const stateStore = getStateStore()
  stateStore.delete(state)
  console.log('[Shopify Auth] 🗑️  Deleted OAuth state:', state.substring(0, 10) + '...')
}

/**
 * ✅ NEW: Debug helper to inspect current state store
 */
export function debugStateStore() {
  const stateStore = getStateStore()
  console.log('[Shopify Auth] 🔍 State Store Debug:')
  console.log('[Shopify Auth] Total states:', stateStore.size)

  stateStore.forEach((value, key) => {
    const ageSeconds = Math.floor((Date.now() - value.timestamp) / 1000)
    console.log(`[Shopify Auth]   - State: ${key.substring(0, 10)}... | Shop: ${value.shop} | Age: ${ageSeconds}s`)
  })
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
 * @param endpoint - API endpoint (e.g., '/admin/api/2025-10/graphql.json')
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
 * Get Shopify GraphQL API version
 * @returns string - GraphQL API version (2025-10)
 */
export function getShopifyApiVersion(): string {
  return process.env.SHOPIFY_API_VERSION || '2025-10'
}
