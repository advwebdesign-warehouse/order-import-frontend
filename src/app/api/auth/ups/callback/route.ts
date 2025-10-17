//file path: src/app/api/auth/ups/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('[UPS Callback] ========================================')
  console.log('[UPS Callback] Received callback from UPS')
  console.log('[UPS Callback] Code:', code ? 'present' : 'missing')
  console.log('[UPS Callback] State:', state)
  console.log('[UPS Callback] Error:', error)
  console.log('[UPS Callback] Full URL:', request.url)
  console.log('[UPS Callback] ========================================')

  // Handle OAuth errors
  if (error) {
    console.error('[UPS Callback] ❌ OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/dashboard/integrations?ups_error=${encodeURIComponent(error)}&ups_error_description=${encodeURIComponent(errorDescription || '')}`, request.url)
    )
  }

  // Check if authorization code is present
  if (!code) {
    console.error('[UPS Callback] ❌ No authorization code received')
    return NextResponse.redirect(
      new URL('/dashboard/integrations?ups_error=no_authorization_code', request.url)
    )
  }

  try {
    // Get cookies (server-side accessible) - AWAIT in Next.js 15
    const cookieStore = await cookies()
    const storedState = cookieStore.get('ups_oauth_state')?.value
    const accountNumber = cookieStore.get('ups_account_number')?.value
    const environment = cookieStore.get('ups_environment')?.value as 'sandbox' | 'production'

    console.log('[UPS Callback] Stored state:', storedState)
    console.log('[UPS Callback] Received state:', state)
    console.log('[UPS Callback] Account number:', accountNumber)
    console.log('[UPS Callback] Environment:', environment)

    // Validate state (CSRF protection)
    if (state !== storedState) {
      console.error('[UPS Callback] ❌ State mismatch!')
      console.error('[UPS Callback] Expected:', storedState)
      console.error('[UPS Callback] Received:', state)
      throw new Error('Invalid state parameter - possible CSRF attack')
    }

    if (!accountNumber) {
      throw new Error('Account number not found in cookies')
    }

    console.log('[UPS Callback] ✅ State validated')

    // Exchange authorization code for tokens
    const clientId = process.env.NEXT_PUBLIC_UPS_CLIENT_ID
    const clientSecret = process.env.UPS_CLIENT_SECRET
    const redirectUri = process.env.NEXT_PUBLIC_UPS_REDIRECT_URI || 'https://orders-warehouse.adv.design/api/auth/ups/callback'

    console.log('[UPS Callback] Client ID:', clientId?.substring(0, 10) + '...')
    console.log('[UPS Callback] Client Secret:', clientSecret ? 'present' : 'missing')
    console.log('[UPS Callback] Redirect URI:', redirectUri)

    if (!clientId || !clientSecret) {
      throw new Error('UPS credentials not configured in environment variables')
    }

    const baseUrl = environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com'

    const tokenUrl = `${baseUrl}/security/v1/oauth/token`

    console.log('[UPS Callback] Token URL:', tokenUrl)
    console.log('[UPS Callback] Exchanging code for tokens...')

    // Create Basic Auth header (client_id:client_secret)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })

    console.log('[UPS Callback] Token request body:', tokenRequestBody.toString())

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      },
      body: tokenRequestBody.toString()
    })

    const responseText = await response.text()
    console.log('[UPS Callback] Token response status:', response.status)
    console.log('[UPS Callback] Token response body:', responseText.substring(0, 200) + '...')

    if (!response.ok) {
      console.error('[UPS Callback] ❌ Token exchange failed')
      console.error('[UPS Callback] Status:', response.status)
      console.error('[UPS Callback] Response:', responseText)
      throw new Error(`Token exchange failed (${response.status}): ${responseText}`)
    }

    const tokens = JSON.parse(responseText)
    console.log('[UPS Callback] ✅ Tokens obtained successfully')
    console.log('[UPS Callback] Token type:', tokens.token_type)
    console.log('[UPS Callback] Expires in:', tokens.expires_in)
    console.log('[UPS Callback] Has refresh token:', !!tokens.refresh_token)

    // Create response with redirect
    const redirectUrl = new URL('/dashboard/integrations', request.url)
    redirectUrl.searchParams.set('ups_success', 'true')
    redirectUrl.searchParams.set('ups_account', accountNumber)
    redirectUrl.searchParams.set('ups_env', environment)
    redirectUrl.searchParams.set('ups_access_token', tokens.access_token)
    redirectUrl.searchParams.set('ups_refresh_token', tokens.refresh_token || '')
    redirectUrl.searchParams.set('ups_expires_in', tokens.expires_in?.toString() || '3600')

    console.log('[UPS Callback] ✅ Redirecting to:', redirectUrl.toString())

    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Clear cookies
    redirectResponse.cookies.delete('ups_oauth_state')
    redirectResponse.cookies.delete('ups_account_number')
    redirectResponse.cookies.delete('ups_environment')

    return redirectResponse

  } catch (error: any) {
    console.error('[UPS Callback] ❌ Error:', error.message)
    console.error('[UPS Callback] Stack:', error.stack)

    // Clear cookies on error
    const errorResponse = NextResponse.redirect(
      new URL(`/dashboard/integrations?ups_error=${encodeURIComponent(error.message)}`, request.url)
    )
    errorResponse.cookies.delete('ups_oauth_state')
    errorResponse.cookies.delete('ups_account_number')
    errorResponse.cookies.delete('ups_environment')

    return errorResponse
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
