//file path: app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function GET(request: NextRequest) {
  try {
    // Get accountId from headers or auth
    const accountId = request.headers.get('x-account-id') || 'default'

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders?accountId=${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers if needed
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch orders from backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      orders: data.orders || data
    })
  } catch (error: any) {
    console.error('[Orders API] Error getting orders:', error)
    return NextResponse.json(
      { error: 'Failed to get orders', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order, accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ order, accountId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to create order on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      order: data.order || data
    })
  } catch (error: any) {
    console.error('[Orders API] Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', message: error.message },
      { status: 500 }
    )
  }
}
