//file path: src/app/api/integrations/shopify/test/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shopUrl, accessToken } = await request.json()

    console.log('[Shopify Test] ========================================')
    console.log('[Shopify Test] Testing connection')
    console.log('[Shopify Test] Shop:', shopUrl)
    console.log('[Shopify Test] Token present:', !!accessToken)
    console.log('[Shopify Test] ========================================')

    if (!shopUrl || !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing credentials',
          message: 'Shop URL and Access Token are required'
        },
        { status: 400 }
      )
    }

    // Normalize shop URL
    let normalizedShop = shopUrl.trim().toLowerCase()
    normalizedShop = normalizedShop.replace(/^https?:\/\//, '')
    normalizedShop = normalizedShop.replace(/\/$/, '')

    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`
    }

    console.log('[Shopify Test] Normalized shop:', normalizedShop)

    // Test the connection by making a simple API call to get shop info
    const testUrl = `https://${normalizedShop}/admin/api/2024-10/shop.json`

    console.log('[Shopify Test] Testing URL:', testUrl)

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    console.log('[Shopify Test] Response status:', response.status)

    if (response.ok) {
      const data = await response.json()
      console.log('[Shopify Test] ✅ Connection successful!')
      console.log('[Shopify Test] Shop name:', data.shop?.name)

      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${data.shop?.name || normalizedShop}`,
        details: {
          shopName: data.shop?.name,
          domain: data.shop?.domain,
          email: data.shop?.email
        }
      })
    }

    // Handle error responses
    if (response.status === 401) {
      console.log('[Shopify Test] ❌ Unauthorized - invalid token')
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
          message: 'Access token is invalid or expired. Please reconnect your Shopify store.'
        },
        { status: 200 } // Return 200 so the UI can display the error nicely
      )
    }

    if (response.status === 404) {
      console.log('[Shopify Test] ❌ Shop not found')
      return NextResponse.json(
        {
          success: false,
          error: 'Shop not found',
          message: `Shop "${normalizedShop}" not found. Please verify the shop URL is correct.`
        },
        { status: 200 }
      )
    }

    // Generic error
    const errorText = await response.text()
    console.error('[Shopify Test] ❌ Test failed:', errorText)

    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        message: 'Unable to connect to Shopify. Please check your credentials and try again.'
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('[Shopify Test] ❌ Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        message: error.message || 'An unexpected error occurred while testing the connection.'
      },
      { status: 500 }
    )
  }
}
