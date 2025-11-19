//file path: app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function GET(request: NextRequest) {
  try {
    // Get accountId from headers or auth
    const accountId = request.headers.get('x-account-id') || 'default'

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products?accountId=${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch products from backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      products: data.products || data
    })
  } catch (error: any) {
    console.error('[Products API] Error getting products:', error)
    return NextResponse.json(
      { error: 'Failed to get products', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product, accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      )
    }

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify({ product, accountId })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to create product on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      product: data.product || data
    })
  } catch (error: any) {
    console.error('[Products API] Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product', message: error.message },
      { status: 500 }
    )
  }
}
