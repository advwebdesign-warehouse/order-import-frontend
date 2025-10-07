//file path: src/app/api/integrations/usps/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2 } from '@/lib/usps/uspsServiceV2'

export async function POST(request: NextRequest) {
  try {
    const { consumerKey, consumerSecret, environment } = await request.json()

    console.log('[USPS Test] ========================================')
    console.log('[USPS Test] Starting connection test')
    console.log('[USPS Test] Environment:', environment)
    console.log('[USPS Test] Consumer Key length:', consumerKey?.length)
    console.log('[USPS Test] Consumer Secret length:', consumerSecret?.length)
    console.log('[USPS Test] ========================================')

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing credentials',
          message: 'Consumer Key and Secret are required'
        },
        { status: 400 }
      )
    }

    // Validate key length
    if (consumerKey.length !== 48) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid key format',
          message: 'Consumer Key should be 48 characters. Please verify you copied it correctly.'
        },
        { status: 400 }
      )
    }

    const uspsService = new USPSServiceV2(consumerKey, consumerSecret, environment)

    await uspsService.testConnection()

    console.log('[USPS Test] ✅ Connection successful!')

    return NextResponse.json({
      success: true,
      message: 'Connection successful! USPS API is accessible.'
    })

  } catch (error: any) {
    console.error('[USPS Test] ❌ Connection failed')
    console.error('[USPS Test] Error:', error.message)

    const errorMessage = error.message || 'Connection failed'

    // Check for specific error types
    if (errorMessage.includes('invalid_request') || errorMessage.includes('malformed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'OAuth Authentication Failed',
          message: 'Unable to authenticate with USPS API. Please verify: (1) Your app status is "Enrolled" (not "Pending"), (2) Consumer Key and Secret are correct, (3) You completed all enrollment steps in the Customer Onboarding Portal.'
        },
        { status: 200 }
      )
    }

    if (errorMessage.includes('invalid_client')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Credentials',
          message: 'Consumer Key or Secret is incorrect. Please verify your credentials in the USPS Developer Portal.'
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Connection Failed',
        message: errorMessage.length > 100 ? 'Connection failed. Please check your credentials and try again.' : errorMessage
      },
      { status: 200 }
    )
  }
}
