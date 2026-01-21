//file path: src/app/api/cron/tracking-update/route.ts

import { NextRequest, NextResponse } from 'next/server'

/**
 * Cron Job: Update tracking for all active shipments
 *
 * This route delegates to the backend API which handles:
 * - Fetching all accounts with active shipments
 * - Getting USPS credentials from database
 * - Calling USPS tracking API
 * - Updating order statuses
 *
 * Trigger: Set up in Vercel Cron or similar service
 * Schedule: Every 6 hours recommended
 */

// ✅ Use backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com';

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Verify cron secret
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[CRON Frontend] Unauthorized cron attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[CRON Frontend] Starting tracking update job...')
    console.log('[CRON Frontend] Calling backend API:', `${API_BASE_URL}/api/cron/tracking-update`)

    // Call backend cron endpoint
    const response = await fetch(`${API_BASE_URL}/api/cron/tracking-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}` // Pass cron secret to backend
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[CRON Frontend] Backend returned error:', errorText)
      throw new Error(`Backend cron failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    const duration = Date.now() - startTime

    console.log('[CRON Frontend] Tracking update completed:', result)

    return NextResponse.json({
      ...result,
      frontendDuration: duration,
      source: 'frontend-proxy'
    })

  } catch (error: any) {
    console.error('[CRON Frontend] Tracking update error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update tracking',
        duration: Date.now() - startTime,
        source: 'frontend-proxy'
      },
      { status: 500 }
    )
  }
}

// Support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
