//file path: app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch product from backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      product: data.product || data
    })
  } catch (error: any) {
    console.error('[Products API] Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product', message: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const body = await request.json()

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to update product on backend')
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      product: data.product || data,
      message: 'Product updated successfully'
    })
  } catch (error: any) {
    console.error('[Products API] Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product', message: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PATCH delegates to PUT
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params

    // Call backend server
    const response = await fetch(`${BACKEND_API_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('authorization') || '',
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to delete product on backend')
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error: any) {
    console.error('[Products API] Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product', message: error.message },
      { status: 500 }
    )
  }
}
