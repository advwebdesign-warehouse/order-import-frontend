//file path: src/app/api/shipping/usps/test-validate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2 } from '@/lib/usps/uspsServiceV2'

export async function GET(request: NextRequest) {
  try {
    const consumerKey = process.env.USPS_CONSUMER_KEY || ''
    const consumerSecret = process.env.USPS_CONSUMER_SECRET || ''

    if (!consumerSecret) {
      return NextResponse.json({
        error: 'Set USPS_CONSUMER_SECRET in .env.local'
      }, { status: 400 })
    }

    const uspsService = new USPSServiceV2(consumerKey, consumerSecret, 'sandbox')

    const address = {
      streetAddress: "475 L'Enfant Plaza SW",
      city: 'Washington',
      state: 'DC',
      ZIPCode: '20260'
    }

    console.log('[Test Validate] Validating address...')
    const validatedAddress = await uspsService.validateAddress(address)

    console.log('[Test Validate] ✅ Success!')

    return NextResponse.json({
      success: true,
      original: address,
      validated: validatedAddress
    })

  } catch (error: any) {
    console.error('[Test Validate] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}
