//file path: src/app/api/shipping/usps/validate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2, USPSAddress } from '@/lib/usps/uspsServiceV2'
import { getUserIntegrations } from '@/lib/storage/integrationStorage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, credentials } = body

    console.log('[USPS Validate] Request received')

    // Validate required fields
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    if (!address.streetAddress && !address.address1) {
      return NextResponse.json(
        { error: 'Street address is required' },
        { status: 400 }
      )
    }

    if (!address.city) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      )
    }

    if (!address.state) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      )
    }

    if (!address.ZIPCode && !address.zip) {
      return NextResponse.json(
        { error: 'ZIP code is required' },
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

    // Prepare address data
    const uspsAddress: Partial<USPSAddress> = {
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      streetAddress: address.streetAddress || address.address1,
      secondaryAddress: address.secondaryAddress || address.address2,
      city: address.city,
      state: address.state,
      ZIPCode: address.ZIPCode || address.zip,
      ZIPPlus4: address.ZIPPlus4 || address.zip4
    }

    console.log('[USPS Validate] Validating address:', uspsAddress)

    // Validate address with USPS
    const validatedAddress = await uspsService.validateAddress(uspsAddress)

    console.log('[USPS Validate] Success! Address validated')

    return NextResponse.json({
      success: true,
      address: validatedAddress,
      message: 'Address validated successfully'
    })

  } catch (error: any) {
    console.error('[USPS Validate] Error:', error)

    // Check for common validation errors
    if (error.message?.includes('not found') || error.message?.includes('invalid')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Address validation failed',
          message: 'The address could not be validated. Please check the address and try again.',
          details: error.message
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to validate address',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
