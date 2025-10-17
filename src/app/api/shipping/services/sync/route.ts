//file path: app/api/shipping/services/sync/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2 } from '@/lib/usps/uspsServiceV2'

export async function POST(request: NextRequest) {
  console.log('=================================')
  console.log('🚀 SERVICES SYNC API ROUTE CALLED')
  console.log('=================================')

  try {
    const { carriers, credentials } = await request.json()
    const services: any[] = []

    console.log('[Services Sync] Starting service sync for carriers:', carriers)
    console.log('[Services Sync] Credentials received:', credentials ? 'Yes' : 'No')

    // Sync USPS Services
    if (carriers.includes('USPS')) {
      console.log('[Services Sync] USPS found in carriers list')

      if (!credentials) {
        console.error('[Services Sync] No USPS credentials provided')
        return NextResponse.json(
          { error: 'USPS credentials are required' },
          { status: 400 }
        )
      }

      console.log('[Services Sync] USPS credentials found, initializing service...')
      console.log('[Services Sync] Environment:', credentials.environment)

      try {
        // Create USPS service with OAuth credentials - CORRECTED PROPERTY NAMES
        const uspsService = new USPSServiceV2(
          credentials.consumerKey,  // ✅ Correct property from integrationTypes.ts
          credentials.consumerSecret,  // ✅ Correct property from integrationTypes.ts
          credentials.environment
        )

        // Get available USPS services from API
        console.log('[Services Sync] Fetching available USPS services...')
        const uspsServices = await uspsService.getAvailableServices()

        console.log(`[Services Sync] Found ${uspsServices.length} USPS services`)

        // Add unique IDs and timestamps to each service
        const servicesWithIds = uspsServices.map((service: any, index: number) => ({
          ...service,
          id: `usps-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))

        services.push(...servicesWithIds)
        console.log(`[Services Sync] Successfully synced ${servicesWithIds.length} USPS services`)
      } catch (error: any) {
        console.error('[Services Sync] USPS sync error:', error)
        return NextResponse.json(
          {
            error: `Failed to sync USPS services: ${error.message}`,
            services: [],
            count: 0
          },
          { status: 500 }
        )
      }
    }

    // Future: Sync UPS, FedEx, DHL services
    if (carriers.includes('UPS')) {
      console.log('[Services Sync] UPS sync not yet implemented')
    }
    if (carriers.includes('FedEx') || carriers.includes('FEDEX')) {
      console.log('[Services Sync] FedEx sync not yet implemented')
    }

    console.log(`[Services Sync] Sync complete: ${services.length} total services`)

    if (services.length === 0) {
      return NextResponse.json(
        {
          error: 'No services available from carrier APIs. Please check your account configuration.',
          services: [],
          count: 0
        },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
      message: `Successfully synced ${services.length} services from carrier APIs`
    })
  } catch (error: any) {
    console.error('[Services Sync] Service sync error:', error)
    console.error('[Services Sync] Error message:', error.message)
    console.error('[Services Sync] Error stack:', error.stack)

    return NextResponse.json(
      {
        error: `Failed to sync services: ${error.message}. Please check your credentials and try again.`,
        services: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
