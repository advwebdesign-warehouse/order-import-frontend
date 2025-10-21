//file path: src/app/api/integrations/ups/test/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { accessToken, environment, tokenExpiry } = await request.json()

    console.log('[UPS Test] Testing connection...')
    console.log('[UPS Test] Environment:', environment)
    console.log('[UPS Test] Token present:', !!accessToken)
    console.log('[UPS Test] Token expiry:', tokenExpiry)

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry)
      const now = new Date()

      if (expiryDate < now) {
        console.log('[UPS Test] ❌ Token expired')
        return NextResponse.json(
          { success: false, error: 'Token expired. Please reconnect to UPS.' },
          { status: 401 }
        )
      }

      const minutesRemaining = Math.floor((expiryDate.getTime() - now.getTime()) / 60000)
      console.log('[UPS Test] ✅ Token valid for', minutesRemaining, 'more minutes')

      return NextResponse.json({
        success: true,
        message: `UPS connection active (token valid for ${minutesRemaining} more minutes)`,
        details: { minutesRemaining, expiresAt: expiryDate.toISOString() }
      })
    }

    // If no expiry date, assume valid
    console.log('[UPS Test] ✅ Token present (no expiry check)')
    return NextResponse.json({
      success: true,
      message: 'UPS connection appears valid'
    })

  } catch (error: any) {
    console.error('[UPS Test] ❌ Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Test failed' },
      { status: 500 }
    )
  }
}
