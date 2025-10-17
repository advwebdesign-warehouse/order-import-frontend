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
    const environment = cookieStore.get('ups_environment')?.value

    console.log('[UPS Callback] Stored state:', storedState)
    console.log('[UPS Callback] Account number:', accountNumber ? 'present' : 'missing')
    console.log('[UPS Callback] Environment:', environment)

    // Validate state (CSRF protection)
    if (state !== storedState) {
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

    if (!clientId || !clientSecret) {
      throw new Error('UPS credentials not configured')
    }

    const baseUrl = environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com'

    const tokenUrl = `${baseUrl}/security/v1/oauth/token`

    console.log('[UPS Callback] Exchanging code for tokens...')
    console.log('[UPS Callback] Token URL:', tokenUrl)

    // Create Basic Auth header
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    })

    const responseText = await response.text()
    console.log('[UPS Callback] Token response status:', response.status)

    if (!response.ok) {
      console.error('[UPS Callback] ❌ Token exchange failed:', responseText)
      throw new Error(`Token exchange failed: ${responseText}`)
    }

    const tokens = JSON.parse(responseText)
    console.log('[UPS Callback] ✅ Tokens obtained successfully')

    // Create response with redirect
    const redirectResponse = NextResponse.redirect(
      new URL(`/dashboard/integrations?ups_success=true&ups_account=${accountNumber}&ups_env=${environment}&ups_access_token=${tokens.access_token}&ups_refresh_token=${tokens.refresh_token}&ups_expires_in=${tokens.expires_in}`, request.url)
    )

    // Clear cookies
    redirectResponse.cookies.delete('ups_oauth_state')
    redirectResponse.cookies.delete('ups_account_number')
    redirectResponse.cookies.delete('ups_environment')

    return redirectResponse

  } catch (error: any) {
    console.error('[UPS Callback] ❌ Error:', error.message)

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
