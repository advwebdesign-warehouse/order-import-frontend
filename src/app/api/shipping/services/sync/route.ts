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
    if (carriers.includes('USPS') && credentials) {
      console.log('[Services Sync] Syncing USPS services...')

      try {
        const uspsService = new USPSServiceV2(
          credentials.userId,
          credentials.apiKey,
          credentials.apiUrl.includes('test') ? 'sandbox' : 'production'
        )

        // Get available USPS services from API
        const uspsServices = await uspsService.getAvailableServices()

        console.log(`[Services Sync] Found ${uspsServices.length} USPS services`)

        services.push(...uspsServices)
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
