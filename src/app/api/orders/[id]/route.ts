//file path: app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'

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

    // In production, replace with database update:
    // const order = await prisma.orders.update({
    //   where: { id: orderId },
    //   data: {
    //     status: body.status,
    //     fulfillmentStatus: body.fulfillmentStatus,
    //     updatedAt: new Date()
    //   }
    // })

    const updatedOrder = {
      id: orderId,
      status: body.status,
      fulfillmentStatus: body.fulfillmentStatus,
      updatedAt: new Date().toISOString()
    }

    // Sync to external platforms if needed:
    // await syncOrderStatusToExternalPlatform(orderId, body.status, body.fulfillmentStatus)

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully'
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // In production: const order = await prisma.orders.findUnique({ where: { id: orderId } })

    return NextResponse.json({
      success: true,
      order: { id: orderId }
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
