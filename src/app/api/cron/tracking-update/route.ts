//file path: src/app/api/cron/tracking-update/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSTrackingService } from '@/lib/usps/trackingService'
import { getAllUsersWithUSPS } from '@/lib/storage/integrationStorage'
import { getActiveTrackingNumbers, updateOrderTracking } from '@/lib/storage/orderStorage'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON] Unauthorized cron attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[CRON] Starting multi-user tracking update job...')

    const usersWithUSPS = getAllUsersWithUSPS()

    console.log(`[CRON] Found ${usersWithUSPS.length} users with USPS integration`)

    if (usersWithUSPS.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with USPS integration found',
        totalUsers: 0,
        totalShipments: 0,
        duration: Date.now() - startTime
      })
    }

    let totalUpdated = 0
    let totalDelivered = 0
    let totalExceptions = 0
    let totalShipments = 0

    for (const user of usersWithUSPS) {
      console.log(`[CRON] Processing user: ${user.userId}`)

      const trackingNumbers = getActiveTrackingNumbers(user.userId)

      if (trackingNumbers.length === 0) {
        console.log(`[CRON] No active shipments for user: ${user.userId}`)
        continue
      }

      console.log(`[CRON] User ${user.userId} has ${trackingNumbers.length} active shipments`)
      totalShipments += trackingNumbers.length

      const trackingService = new USPSTrackingService(
        user.credentials.consumerKey,
        user.credentials.consumerSecret,
        user.credentials.environment
      )

      const updates = await trackingService.getMultipleTrackingUpdates(trackingNumbers)

      console.log(`[CRON] Received ${updates.length} updates for user: ${user.userId}`)

      for (const update of updates) {
        updateOrderTracking(update.trackingNumber, update, user.userId)
        totalUpdated++

        if (trackingService.isDelivered(update.statusCategory)) {
          totalDelivered++
          console.log(`[CRON] Package delivered for user ${user.userId}: ${update.trackingNumber}`)
        }

        if (trackingService.needsAttention(update.statusCategory)) {
          totalExceptions++
          console.log(`[CRON] Package needs attention for user ${user.userId}: ${update.trackingNumber}`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const duration = Date.now() - startTime

    console.log(`[CRON] Multi-user tracking update completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${totalUpdated} shipments across ${usersWithUSPS.length} users`,
      stats: {
        totalUsers: usersWithUSPS.length,
        totalShipments,
        updated: totalUpdated,
        delivered: totalDelivered,
        exceptions: totalExceptions
      },
      duration
    })

  } catch (error: any) {
    console.error('[CRON] Multi-user tracking update error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update tracking',
        duration: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
