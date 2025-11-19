//file path: app/api/products/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { products, accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: 'products must be an array' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ products, accountId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to save products on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      products: data.products || data,
      count: data.count || (data.products || data).length
    })
  } catch (error: any) {
    console.error('[Products Bulk API] Error saving products:', error)
    return NextResponse.json(
      { error: 'Failed to save products', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { integrationId } = body

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ integrationId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete products on backend')
    }

    return NextResponse.json({
      success: true,
      message: `Deleted products for integration ${integrationId}`
    })
  } catch (error: any) {
    console.error('[Products Bulk API] Error deleting products:', error)
    return NextResponse.json(
      { error: 'Failed to delete products', message: error.message },
      { status: 500 }
    )
  }
}
