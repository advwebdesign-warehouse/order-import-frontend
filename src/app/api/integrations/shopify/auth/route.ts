//file path: app/api/integrations/shopify/auth/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { globalStateStore } from '@/lib/shopify/stateStore'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get('shop')
  const storeId = searchParams.get('storeId')

  console.log('[Shopify Auth] ========================================')
  console.log('[Shopify Auth] Starting OAuth flow')
  console.log('[Shopify Auth] Shop:', shop)
  console.log('[Shopify Auth] Store ID:', storeId)

  // FIX: Get the correct base URL (handles ngrok, production, localhost)
  const getBaseUrl = () => {
    // Check for forwarded host (ngrok and proxies set this)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

    if (forwardedHost) {
      console.log('[Shopify Auth] Using forwarded host:', forwardedHost)
      return `${forwardedProto}://${forwardedHost}`
    }

    // Check for host header
    const host = request.headers.get('host')
    if (host && !host.includes('localhost')) {
      console.log('[Shopify Auth] Using host header:', host)
      return `https://${host}`
    }

    // Fallback to environment variable if set
    if (process.env.NEXT_PUBLIC_APP_URL) {
      console.log('[Shopify Auth] Using NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
      return process.env.NEXT_PUBLIC_APP_URL
    }

    // Last resort - use request URL origin
    console.log('[Shopify Auth] Using request origin:', request.nextUrl.origin)
    return request.nextUrl.origin
  }

  const baseUrl = getBaseUrl()
  console.log('[Shopify Auth] Base URL:', baseUrl)

  try {
    if (!shop) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=missing_shop', baseUrl)
      )
    }

    // Normalize shop
    let normalizedShop = shop.trim().toLowerCase()
    normalizedShop = normalizedShop.replace(/^https?:\/\//, '')
    normalizedShop = normalizedShop.replace(/\/.*$/, '')

    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`
    }

    console.log('[Shopify Auth] Normalized shop:', normalizedShop)

    // Get credentials from environment
    const clientId = process.env.SHOPIFY_CLIENT_ID
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/integrations/shopify/callback`

    if (!clientId || !clientSecret) {
      throw new Error('Shopify credentials not configured in environment variables')
    }

    // Generate state and save in global store
    const state = crypto.randomBytes(16).toString('hex')

    // Use global state store that persists
    globalStateStore.set(state, {
      shop: normalizedShop,
      storeId: storeId || undefined,
      timestamp: Date.now()
    })

    console.log('[Shopify Auth] State saved:', state)
    console.log('[Shopify Auth] Client ID:', clientId)
    console.log('[Shopify Auth] Redirect URI:', redirectUri)

    // Build Shopify OAuth URL
    const scopes = [
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
      'read_locations'
    ].join(',')

    const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    console.log('[Shopify Auth] Auth URL:', authUrl.toString())
    console.log('[Shopify Auth] Redirecting to Shopify OAuth...')

    return NextResponse.redirect(authUrl.toString())

  } catch (error: any) {
    console.error('[Shopify Auth] ❌ Error:', error.message)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?error=${encodeURIComponent(error.message)}`, baseUrl)
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
