//file path: app/api/orders/tracking/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber, trackingData } = body

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'trackingNumber is required' },
        { status: 400 }
      )
    }

    if (!trackingData) {
      return NextResponse.json(
        { error: 'trackingData is required' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders/tracking`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ trackingNumber, trackingData })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to update tracking on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      result: data.result || data,
      message: 'Tracking updated successfully'
    })
  } catch (error: any) {
    console.error('[Orders Tracking API] Error updating tracking:', error)
    return NextResponse.json(
      { error: 'Failed to update tracking', message: error.message },
      { status: 500 }
    )
  }
}
