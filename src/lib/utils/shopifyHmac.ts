//file path: lib/utils/shopifyHmac.ts

import crypto from 'crypto'

/**
 * Verify Shopify webhook HMAC signature
 * @param body - Raw request body as string
 * @param hmacHeader - X-Shopify-Hmac-SHA256 header value
 * @param secret - Shopify API secret key
 * @returns boolean - true if signature is valid
 */
export function verifyShopifyWebhook(
  body: string,
  hmacHeader: string,
  secret: string
): boolean {
  if (!hmacHeader || !secret) {
    return false
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmacHeader)
  )
}

/**
 * Verify Shopify OAuth callback HMAC
 * @param params - Query parameters from OAuth callback
 * @param secret - Shopify API secret key
 * @returns boolean - true if HMAC is valid
 */
export function verifyShopifyOAuth(
  params: Record<string, string>,
  secret: string
): boolean {
  const { hmac, ...rest } = params

  if (!hmac) {
    return false
  }

  // Sort parameters alphabetically
  const sortedParams = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&')

  const hash = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmac)
  )
}

/**
 * Generate nonce for OAuth state parameter
 * @returns string - Random nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Build Shopify OAuth authorization URL
 * @param shop - Shop domain (e.g., 'mystore.myshopify.com')
 * @param clientId - Shopify API key
 * @param redirectUri - OAuth redirect URI
 * @param scopes - Array of permission scopes
 * @param state - State parameter for CSRF protection
 * @returns string - Authorization URL
 */
export function buildAuthorizationUrl(
  shop: string,
  clientId: string,
  redirectUri: string,
  scopes: string[],
  state: string
): string {
  const scopeString = scopes.join(',')
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopeString,
    redirect_uri: redirectUri,
    state: state,
  })

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`
}

/**
 * Extract shop domain from various formats
 * @param input - Shop URL or domain
 * @returns string - Normalized shop domain
 */
export function normalizeShopDomain(input: string): string {
  // Remove protocol if present
  let domain = input.replace(/^https?:\/\//, '')

  // Remove trailing slash
  domain = domain.replace(/\/$/, '')

  // Extract domain if full URL provided
  domain = domain.split('/')[0]

  // Ensure .myshopify.com suffix
  if (!domain.endsWith('.myshopify.com')) {
    domain = `${domain}.myshopify.com`
  }

  return domain
}

/**
 * Validate shop domain format
 * @param shop - Shop domain to validate
 * @returns boolean - true if valid
 */
export function isValidShopDomain(shop: string): boolean {
  const shopPattern = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i
  return shopPattern.test(shop)
}
