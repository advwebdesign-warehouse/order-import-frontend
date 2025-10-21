//file path: app/api/shipping/boxes/sync/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSServiceV2 } from '@/lib/usps/uspsServiceV2'
import { UPSService } from '@/lib/ups/upsService'

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

      if (!credentials?.usps) {
        console.error('[Sync] No USPS credentials provided')
        return NextResponse.json(
          { error: 'USPS credentials are required' },
          { status: 400 }
        )
      }

      console.log('[Sync] USPS credentials found, initializing service...')
      console.log('[Sync] Environment:', credentials.usps.environment)

      // Create USPS service with OAuth credentials
      const uspsService = new USPSServiceV2(
        credentials.usps.consumerKey,
        credentials.usps.consumerSecret,
        credentials.usps.environment
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
      }
    }

    // Sync UPS boxes from API
    if (carriers.includes('UPS')) {
      console.log('[Sync] UPS found in carriers list')

      if (!credentials?.ups) {
        console.error('[Sync] No UPS credentials provided')
        return NextResponse.json(
          { error: 'UPS credentials are required' },
          { status: 400 }
        )
      }

      console.log('[Sync] UPS credentials found, initializing service...')
      console.log('[Sync] Environment:', credentials.ups.environment)

      try {
        // Create UPS service
        const upsService = new UPSService(
          credentials.ups.accountNumber,
          credentials.ups.accessToken,
          credentials.ups.refreshToken,
          credentials.ups.environment
        )

        // Get available containers from API
        console.log('[Sync] Fetching available UPS containers...')
        const upsContainers = await upsService.getAvailableContainers()

        console.log(`[Sync] Found ${upsContainers.length} available UPS containers`)

        // Map UPS containers to our box format
        const upsBoxes = upsContainers.map((container: any, index: number) => {
          const isVariableBox = container.code === 'CUSTOMER_SUPPLIED'
          const hasZeroDimensions = container.dimensions.length === 0 &&
                                     container.dimensions.width === 0 &&
                                     container.dimensions.height === 0

          return {
            id: `ups-${Date.now()}-${index}`,
            name: container.name,
            boxType: 'ups' as const,
            carrierCode: container.code,
            dimensions: container.dimensions,
            weight: container.weight,
            description: container.description,
            isActive: isVariableBox && hasZeroDimensions ? false : true,
            flatRate: container.flatRate,
            flatRatePrice: container.flatRatePrice,
            availableFor: container.availableFor,
            packageType: container.packageType,
            isEditable: isVariableBox,
            needsDimensions: isVariableBox && hasZeroDimensions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        })

        boxes.push(...upsBoxes)
        console.log(`[Sync] Successfully synced ${upsBoxes.length} UPS boxes`)
      } catch (error: any) {
        console.error('[Sync] UPS sync error:', error)
        return NextResponse.json(
          {
            error: `Failed to sync UPS boxes: ${error.message}`,
            boxes: [],
            count: 0
          },
          { status: 500 }
        )
      }
    }

    // Future: Sync FedEx, DHL boxes
    if (carriers.includes('FedEx') || carriers.includes('FEDEX')) {
      console.log('[Sync] FedEx sync not yet implemented')
    }

    console.log(`[Sync] Sync complete: ${boxes.length} total boxes`)

    if (boxes.length === 0) {
      return NextResponse.json(
        {
          error: 'No boxes available from carrier APIs. Please check your account configuration.',
          boxes: [],
          count: 0
        },
        { status: 200 }
      )
    }

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
        error: `Failed to sync boxes: ${error.message}. Please check your credentials and try again.`,
        boxes: [],
        count: 0
      },
      { status: 500 }
    )
  }
}
