//file path: src/app/api/cron/tracking-update/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { USPSTrackingService } from '@/lib/usps/trackingService'
import { getAllAccountsWithUSPS } from '@/lib/storage/integrationStorage'
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
    console.log('[CRON] Starting multi-account tracking update job...')

    const accountsWithUSPS = getAllAccountsWithUSPS()

    console.log(`[CRON] Found ${accountsWithUSPS.length} accounts with USPS integration`)

    if (accountsWithUSPS.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No accounts with USPS integration found',
        totalAccounts: 0,
        totalShipments: 0,
        duration: Date.now() - startTime
      })
    }

    let totalUpdated = 0
    let totalDelivered = 0
    let totalExceptions = 0
    let totalShipments = 0

    for (const account of accountsWithUSPS) {
      console.log(`[CRON] Processing account: ${account.accountId}`)

      const trackingNumbers = getActiveTrackingNumbers(account.accountId)

      if (trackingNumbers.length === 0) {
        console.log(`[CRON] No active shipments for account: ${account.accountId}`)
        continue
      }

      console.log(`[CRON] Account ${account.accountId} has ${trackingNumbers.length} active shipments`)
      totalShipments += trackingNumbers.length

      const trackingService = new USPSTrackingService(
        account.credentials.consumerKey,
        account.credentials.consumerSecret,
        account.credentials.environment
      )

      const updates = await trackingService.getMultipleTrackingUpdates(trackingNumbers)

      console.log(`[CRON] Received ${updates.length} updates for account: ${account.accountId}`)

      for (const update of updates) {
        updateOrderTracking(update.trackingNumber, update, account.accountId)
        totalUpdated++

        if (trackingService.isDelivered(update.statusCategory)) {
          totalDelivered++
          console.log(`[CRON] Package delivered for account ${account.accountId}: ${update.trackingNumber}`)
        }

        if (trackingService.needsAttention(update.statusCategory)) {
          totalExceptions++
          console.log(`[CRON] Package needs attention for account ${account.accountId}: ${update.trackingNumber}`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    const duration = Date.now() - startTime

    console.log(`[CRON] Multi-account tracking update completed in ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${totalUpdated} shipments across ${accountsWithUSPS.length} accounts`,
      stats: {
        totalAccounts: accountsWithUSPS.length,
        totalShipments,
        updated: totalUpdated,
        delivered: totalDelivered,
        exceptions: totalExceptions
      },
      duration
    })

  } catch (error: any) {
    console.error('[CRON] Multi-account tracking update error:', error)

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
