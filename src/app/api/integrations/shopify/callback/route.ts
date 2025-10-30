//file path: app/api/integrations/shopify/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { globalStateStore } from '@/lib/shopify/stateStore'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const state = searchParams.get('state')
  const hmac = searchParams.get('hmac')
  const timestamp = searchParams.get('timestamp')

  console.log('[Shopify Callback] ========================================')
  console.log('[Shopify Callback] OAuth callback received')
  console.log('[Shopify Callback] Shop:', shop)
  console.log('[Shopify Callback] Code:', code ? 'present' : 'missing')
  console.log('[Shopify Callback] State:', state)
  console.log('[Shopify Callback] ========================================')

  // FIX: Get the correct base URL (handles ngrok, production, localhost)
  const getBaseUrl = () => {
    // Check for forwarded host (ngrok and proxies set this)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'

    if (forwardedHost) {
      console.log('[Shopify Callback] Using forwarded host:', forwardedHost)
      return `${forwardedProto}://${forwardedHost}`
    }

    // Check for host header
    const host = request.headers.get('host')
    if (host && !host.includes('localhost')) {
      console.log('[Shopify Callback] Using host header:', host)
      return `https://${host}`
    }

    // Fallback to environment variable if set
    if (process.env.NEXT_PUBLIC_APP_URL) {
      console.log('[Shopify Callback] Using NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
      return process.env.NEXT_PUBLIC_APP_URL
    }

    // Last resort - use request URL origin
    console.log('[Shopify Callback] Using request origin:', request.nextUrl.origin)
    return request.nextUrl.origin
  }

  const baseUrl = getBaseUrl()
  console.log('[Shopify Callback] Base URL for redirect:', baseUrl)

  try {
    // Validate required parameters
    if (!shop || !code || !state || !hmac) {
      throw new Error('Missing required OAuth parameters')
    }

    // Get state from global store
    const storedState = globalStateStore.get(state)

    if (!storedState) {
      console.error('[Shopify Callback] ❌ State not found or expired')
      throw new Error('Invalid or expired state parameter')
    }

    console.log('[Shopify Callback] ✅ State found:', storedState)

    // Verify shop matches
    if (storedState.shop !== shop) {
      console.error('[Shopify Callback] Shop mismatch!')
      throw new Error('Shop mismatch in OAuth flow')
    }

    // Delete state after validation
    globalStateStore.delete(state)

    // Verify HMAC signature
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
    if (!clientSecret) {
      throw new Error('SHOPIFY_CLIENT_SECRET not configured')
    }

    // Build message for HMAC
    const params = new URLSearchParams(searchParams)
    params.delete('hmac')
    params.delete('signature')

    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    const generatedHmac = crypto
      .createHmac('sha256', clientSecret)
      .update(sortedParams)
      .digest('hex')

    if (generatedHmac !== hmac) {
      console.error('[Shopify Callback] ❌ HMAC verification failed!')
      throw new Error('HMAC verification failed')
    }

    console.log('[Shopify Callback] ✅ HMAC verified')

    // Exchange code for access token
    const clientId = process.env.SHOPIFY_CLIENT_ID

    console.log('[Shopify Callback] Exchanging code for access token...')

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
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

    const responseText = await tokenResponse.text()

    if (!tokenResponse.ok) {
      console.error('[Shopify Callback] Token exchange failed:', responseText)
      throw new Error(`Token exchange failed: ${responseText}`)
    }

    const tokenData = JSON.parse(responseText)

    if (!tokenData.access_token) {
      throw new Error('No access token received from Shopify')
    }

    console.log('[Shopify Callback] ✅ Access token obtained!')
    console.log('[Shopify Callback] Scopes:', tokenData.scope)

    // Build success redirect URL - using the correct base URL
    const redirectUrl = new URL('/dashboard/integrations', baseUrl)
    redirectUrl.searchParams.set('shopify_auth', 'success')
    redirectUrl.searchParams.set('shop', shop)
    redirectUrl.searchParams.set('access_token', tokenData.access_token)

    if (storedState.storeId) {
      redirectUrl.searchParams.set('store_id', storedState.storeId)
    }

    console.log('[Shopify Callback] ✅ SUCCESS! Redirecting to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)

  } catch (error: any) {
    console.error('[Shopify Callback] ❌ ERROR:', error.message)

    // Redirect with error - using the correct base URL
    const errorUrl = new URL('/dashboard/integrations', baseUrl)
    errorUrl.searchParams.set('error', error.message)
    errorUrl.searchParams.set('shopify_auth', 'error')

    console.log('[Shopify Callback] Redirecting with error to:', errorUrl.toString())
    return NextResponse.redirect(errorUrl)
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
