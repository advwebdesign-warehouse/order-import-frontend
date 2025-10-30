//file path: app/api/integrations/shopify/graphql-fulfillment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient';
import { Order } from '@/app/dashboard/orders/utils/orderTypes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, accessToken, order } = body;

    if (!shop || !accessToken || !order) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Extract Shopify order ID from the order.id (format: "shopify-{id}")
    const shopifyOrderId = order.id.replace('shopify-', '');

    if (!shopifyOrderId || shopifyOrderId === order.id) {
      return NextResponse.json(
        { error: 'Order does not have a valid Shopify order ID' },
        { status: 400 }
      );
    }

    // Initialize Shopify GraphQL client
    const client = new ShopifyGraphQLClient({
      shop,
      accessToken,
    });

    // Parse line items from JSON string
    const lineItems = order.lineItems ? JSON.parse(order.lineItems) : [];

    // Create fulfillment in Shopify
    const result = await client.createFulfillment(shopifyOrderId, {
      trackingNumber: order.trackingNumber,
      trackingCompany: order.shippingLabel?.carrier || 'Other',
      notifyCustomer: true,
      lineItems: lineItems.map((item: any) => ({
        id: item.id.replace('shopify-line-', ''),
        quantity: item.quantity,
      })),
    });

    return NextResponse.json({
      success: true,
      fulfillment: result,
    });
  } catch (error) {
    console.error('Shopify GraphQL fulfillment error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create fulfillment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
