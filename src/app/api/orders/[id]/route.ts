//file path: app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch order from backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      order: data.order || data
    })
  } catch (error: any) {
    console.error('[Orders API] Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to update order on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      order: data.order || data,
      message: 'Order updated successfully'
    })
  } catch (error: any) {
    console.error('[Orders API] Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order', message: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await request.json()

    if (!body.status && !body.fulfillmentStatus) {
      return NextResponse.json(
        { error: 'Either status or fulfillmentStatus must be provided' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to update order status on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      order: data.order || data,
      message: 'Order status updated successfully'
    })
  } catch (error: any) {
    console.error('[Orders API] Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order status', message: error.message },
      { status: 500 }
    )
  }
}
