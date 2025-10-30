//file path: app/api/integrations/shopify/gdpr/customers-data-request/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * GDPR Customer Data Request Webhook
 * Called when a customer requests their data
 * Required for Shopify public apps
 *
 * Webhook URL: https://orders-warehouse.adv.design/api/integrations/shopify/gdpr/customers-data-request
 */
export async function POST(request: NextRequest) {
  try {
    // Log the webhook receipt
    console.log('[GDPR Customer Data Request] Webhook received')

    // Get the raw body for HMAC verification
    const rawBody = await request.text()
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256')

    // Verify webhook authenticity if webhook secret is configured
    if (hmacHeader && process.env.SHOPIFY_WEBHOOK_SECRET) {
      const hash = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest('base64')

      if (hash !== hmacHeader) {
        console.error('[GDPR Customer Data Request] HMAC verification failed')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const data = JSON.parse(rawBody)
    console.log('[GDPR Customer Data Request] Shop domain:', data.shop_domain)
    console.log('[GDPR Customer Data Request] Shop ID:', data.shop_id)
    console.log('[GDPR Customer Data Request] Customer email:', data.customer?.email)
    console.log('[GDPR Customer Data Request] Customer ID:', data.customer?.id)
    console.log('[GDPR Customer Data Request] Orders requested:', data.orders_requested)

    // TODO: Implement your logic to gather customer data from your database
    // This should return any personal data you store about the customer

    // Example response structure:
    const customerData = {
      customer: {
        id: data.customer?.id,
        email: data.customer?.email,
        phone: data.customer?.phone,
        // Add any customer data you store in your database
        stored_data: {
          // Example: preferences, saved addresses, etc.
          preferences: {},
          saved_addresses: [],
          order_history_metadata: []
        }
      }
    }

    // Log successful processing
    console.log('[GDPR Customer Data Request] ✅ Processed successfully')

    return NextResponse.json(customerData, { status: 200 })
  } catch (error: any) {
    console.error('[GDPR Customer Data Request] ❌ Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
