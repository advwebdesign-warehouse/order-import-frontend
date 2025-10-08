//file path: src/app/api/shipping/usps/test-rates/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2 } from '@/lib/usps/uspsServiceV2'

export async function GET(request: NextRequest) {
  try {
    // Use your actual credentials here for testing
    const consumerKey = process.env.USPS_CONSUMER_KEY || 'xIIkS49yfntk1lDbXogXxo4vmehqDSvmj52BEy47GZanth0N'
    const consumerSecret = process.env.USPS_CONSUMER_SECRET || 'YOUR_ACTUAL_SECRET_HERE'

    if (!consumerSecret || consumerSecret === 'YOUR_ACTUAL_SECRET_HERE') {
      return NextResponse.json({
        error: 'Set USPS_CONSUMER_SECRET in .env.local or update the code'
      }, { status: 400 })
    }

    const uspsService = new USPSServiceV2(consumerKey, consumerSecret, 'sandbox')

    const shipment = {
      fromAddress: {
        firstName: '',
        lastName: '',
        streetAddress: "475 L'Enfant Plaza SW",
        secondaryAddress: '',
        city: 'Washington',
        state: 'DC',
        ZIPCode: '20260',
        ZIPPlus4: ''
      },
      toAddress: {
        firstName: '',
        lastName: '',
        streetAddress: '123 Main St',
        secondaryAddress: '',
        city: 'New York',
        state: 'NY',
        ZIPCode: '10001',
        ZIPPlus4: ''
      },
      weight: 16,
      length: 10,
      width: 8,
      height: 6,
      mailClass: 'USPS_GROUND_ADVANTAGE' as const, 
      packageType: 'PACKAGE' as const,
      extraServices: []
    }

    const rates = await uspsService.getRates(shipment)

    return NextResponse.json({
      success: true,
      rates,
      count: rates.length
    })

  } catch (error: any) {
    console.error('[Test Rates] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}
