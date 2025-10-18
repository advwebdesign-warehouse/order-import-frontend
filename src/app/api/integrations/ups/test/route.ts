//file path: src/app/api/integrations/ups/test/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, environment } = await request.json()

    console.log('[UPS Test] Testing connection...')
    console.log('[UPS Test] Environment:', environment)
    console.log('[UPS Test] Token present:', !!accessToken)

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      )
    }

    const baseUrl = environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com'

    // Make a lightweight API call to test the token
    // Using the OAuth token validation endpoint
    const testUrl = `${baseUrl}/security/v1/oauth/validate-token`

    console.log('[UPS Test] Testing token at:', testUrl)

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('[UPS Test] Response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('[UPS Test] ✅ Token is valid')
      return NextResponse.json({
        success: true,
        message: 'UPS connection verified successfully',
        details: data
      })
    }

    if (response.status === 401) {
      console.log('[UPS Test] ❌ Token expired or invalid')
      return NextResponse.json(
        { success: false, error: 'Token expired or invalid. Please reconnect to UPS.' },
        { status: 401 }
      )
    }

    const errorText = await response.text()
    console.error('[UPS Test] ❌ Test failed:', errorText)

    return NextResponse.json(
      { success: false, error: 'Connection test failed', details: errorText },
      { status: response.status }
    )

  } catch (error: any) {
    console.error('[UPS Test] ❌ Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}
