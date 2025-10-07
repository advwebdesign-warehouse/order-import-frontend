//file path: src/app/api/shipping/usps/rates/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2, USPSShipment } from '@/lib/usps/uspsServiceV2'
import { getUserIntegrations } from '@/lib/storage/integrationStorage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipment, credentials } = body

    console.log('[USPS Rates] Request received')

    // Validate required fields
    if (!shipment?.fromAddress || !shipment?.toAddress) {
      return NextResponse.json(
        { error: 'From and to addresses are required' },
        { status: 400 }
      )
    }

    // Get USPS credentials from storage or request
    let consumerKey = credentials?.consumerKey
    let consumerSecret = credentials?.consumerSecret
    let environment = credentials?.environment || 'sandbox'

    // If not provided in request, try to get from storage
    if (!consumerKey || !consumerSecret) {
      const integrations = getUserIntegrations()
      const uspsIntegration = integrations?.integrations.find(
        i => i.id === 'usps' && i.enabled
      )

      if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
        consumerKey = uspsIntegration.config.consumerKey
        consumerSecret = uspsIntegration.config.consumerSecret
        environment = uspsIntegration.config.environment
      }
    }

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'USPS credentials not configured. Please set up USPS integration first.' },
        { status: 400 }
      )
    }

    // Initialize USPS service
    const uspsService = new USPSServiceV2(consumerKey, consumerSecret, environment)

    // Prepare shipment data
    const uspsShipment: USPSShipment = {
      fromAddress: {
        firstName: shipment.fromAddress.firstName || '',
        lastName: shipment.fromAddress.lastName || '',
        streetAddress: shipment.fromAddress.streetAddress || shipment.fromAddress.address1,
        secondaryAddress: shipment.fromAddress.secondaryAddress || shipment.fromAddress.address2,
        city: shipment.fromAddress.city,
        state: shipment.fromAddress.state,
        ZIPCode: shipment.fromAddress.ZIPCode || shipment.fromAddress.zip,
        ZIPPlus4: shipment.fromAddress.ZIPPlus4 || shipment.fromAddress.zip4
      },
      toAddress: {
        firstName: shipment.toAddress.firstName || '',
        lastName: shipment.toAddress.lastName || '',
        streetAddress: shipment.toAddress.streetAddress || shipment.toAddress.address1,
        secondaryAddress: shipment.toAddress.secondaryAddress || shipment.toAddress.address2,
        city: shipment.toAddress.city,
        state: shipment.toAddress.state,
        ZIPCode: shipment.toAddress.ZIPCode || shipment.toAddress.zip,
        ZIPPlus4: shipment.toAddress.ZIPPlus4 || shipment.toAddress.zip4
      },
      weight: shipment.weight || 16, // Default 16 oz (1 lb)
      length: shipment.length || 10,
      width: shipment.width || 8,
      height: shipment.height || 6,
      mailClass: shipment.mailClass || 'USPS_GROUND_ADVANTAGE',
      packageType: shipment.packageType || 'PACKAGE',
      extraServices: shipment.extraServices || []
    }

    console.log('[USPS Rates] Getting rates for shipment:', uspsShipment)

    // Get rates from USPS
    const rates = await uspsService.getRates(uspsShipment)

    console.log('[USPS Rates] Success! Received', rates.length, 'rates')

    return NextResponse.json({
      success: true,
      rates,
      count: rates.length
    })

  } catch (error: any) {
    console.error('[USPS Rates] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get shipping rates',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
