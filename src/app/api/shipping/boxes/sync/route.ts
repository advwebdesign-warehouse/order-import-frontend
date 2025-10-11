//file path: app/api/shipping/boxes/sync/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2 } from '@/lib/usps/uspsServiceV2'

export async function POST(request: NextRequest) {
  console.log('=================================')
  console.log('🚀 SYNC API ROUTE CALLED')
  console.log('=================================')

  try {
    const { carriers, credentials } = await request.json()
    const boxes: any[] = []

    console.log('[Sync] Starting box sync for carriers:', carriers)
    console.log('[Sync] Credentials received:', credentials ? 'Yes' : 'No')

    // Sync USPS boxes from API
    if (carriers.includes('USPS')) {
      console.log('[Sync] USPS found in carriers list')

      if (!credentials) {
        console.error('[Sync] No USPS credentials provided')
        return NextResponse.json(
          { error: 'USPS credentials are required' },
          { status: 400 }
        )
      }

      console.log('[Sync] USPS credentials found, initializing service...')
      console.log('[Sync] Environment:', credentials.environment)

      // Create USPS service with OAuth credentials
      const uspsService = new USPSServiceV2(
        credentials.consumerKey,
        credentials.consumerSecret,
        credentials.environment
      )

      // Get available containers from API
      console.log('[Sync] Fetching available USPS containers...')
      const availableContainers = await uspsService.getAvailableContainers()

      // Get container specifications with dimensions
      const specifications = uspsService.getContainerSpecifications()

      console.log(`[Sync] Found ${availableContainers.length} available containers`)
      console.log(`[Sync] Have ${specifications.length} container specifications`)

      // Match available containers with specifications
      const uspsBoxes = specifications
        .filter(spec => {
          // Check if this container/mailClass combo is available
          const available = availableContainers.find(
            c => c.packageType === spec.packageType && c.mailClass === spec.mailClass
          )
          return available !== undefined
        })
        .map((spec, index) => {
          // Get the rate info from available containers
          const containerInfo = availableContainers.find(
            c => c.packageType === spec.packageType && c.mailClass === spec.mailClass
          )

          // Check if this is a "Your Own Box" type that needs dimensions
          const isVariableBox = spec.code === 'PACKAGE_VARIABLE' ||
                                spec.code === 'PACKAGE_GROUND' ||
                                spec.packageType === 'PACKAGE'

          // Variable boxes start as inactive until dimensions are set
          const hasZeroDimensions = spec.dimensions.length === 0 &&
                                     spec.dimensions.width === 0 &&
                                     spec.dimensions.height === 0

          return {
            id: `usps-${Date.now()}-${index}`,
            name: spec.name,
            boxType: 'usps' as const,
            carrierCode: spec.code,
            dimensions: spec.dimensions,
            weight: spec.weight,
            description: spec.description,
            isActive: isVariableBox && hasZeroDimensions ? false : true,
            flatRate: spec.flatRate,
            flatRatePrice: spec.flatRatePrice,
            availableFor: spec.availableFor,
            mailClass: spec.mailClass,
            packageType: spec.packageType,
            isEditable: isVariableBox,
            needsDimensions: isVariableBox && hasZeroDimensions,
            sampleRate: containerInfo?.rates?.[0]?.rate || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })

      boxes.push(...uspsBoxes)
      console.log(`[Sync] Successfully synced ${uspsBoxes.length} USPS boxes`)

      if (uspsBoxes.length === 0) {
        console.warn('[Sync] No USPS boxes found via API')
        return NextResponse.json(
          {
            error: 'No boxes available from USPS API. Please check your account configuration.',
            boxes: [],
            count: 0
          },
          { status: 200 } // Still return 200 so UI doesn't show error
        )
      }
    }

    // Future: Sync UPS, FedEx, DHL boxes
    if (carriers.includes('UPS')) {
      console.log('[Sync] UPS sync not yet implemented')
    }
    if (carriers.includes('FedEx') || carriers.includes('FEDEX')) {
      console.log('[Sync] FedEx sync not yet implemented')
    }

    console.log(`[Sync] Sync complete: ${boxes.length} total boxes`)

    return NextResponse.json({
      success: true,
      boxes,
      count: boxes.length,
      message: `Successfully synced ${boxes.length} boxes from carrier APIs`
    })
  } catch (error: any) {
    console.error('[Sync] Box sync error:', error)
    console.error('[Sync] Error message:', error.message)
    console.error('[Sync] Error stack:', error.stack)

    return NextResponse.json(
      {
        error: `Failed to sync boxes: ${error.message}. Please check your USPS credentials and try again.`,
        boxes: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
