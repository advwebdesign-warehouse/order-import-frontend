//file path: app/api/orders/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orders, accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(orders)) {
      return NextResponse.json(
        { error: 'orders must be an array' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ orders, accountId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to save orders on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      orders: data.orders || data,
      count: data.count || (data.orders || data).length
    })
  } catch (error: any) {
    console.error('[Orders Bulk API] Error saving orders:', error)
    return NextResponse.json(
      { error: 'Failed to save orders', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderIds } = body

    if (!Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: 'orderIds must be an array' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ orderIds })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete orders on backend')
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${orderIds.length} orders`
    })
  } catch (error: any) {
    console.error('[Orders Bulk API] Error deleting orders:', error)
    return NextResponse.json(
      { error: 'Failed to delete orders', message: error.message },
      { status: 500 }
    )
  }
}
