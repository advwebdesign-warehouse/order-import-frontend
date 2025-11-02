//file path: src/app/api/integrations/shopify/test/route.ts

/**
 * Shopify Connection Test API Route
 *
 * ✅ UPDATED: Enhanced error handling and more consistent responses
 * Tests the connection using Shopify's REST API for shop.json endpoint
 */

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
          email: data.shop?.email,
          currencyCode: data.shop?.currency
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

    // ✅ NEW: Check for permission errors in response
    if (response.status === 403) {
      console.log('[Shopify Test] ❌ Permission denied')
      const errorText = await response.text()

      // Check if it's a protected customer data error
      if (errorText.includes('not approved to access') ||
          errorText.includes('protected customer data')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Permission denied',
            message: 'Your Shopify app needs approval for protected customer data access. Please visit your Shopify Partners dashboard to request access.',
            helpUrl: 'https://shopify.dev/docs/apps/launch/protected-customer-data'
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied',
          message: 'Access denied. Please check your app permissions.'
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
        message: 'Unable to connect to Shopify. Please check your credentials and try again.',
        debug: process.env.NODE_ENV === 'development' ? errorText : undefined
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('[Shopify Test] ❌ Error:', error)

    // ✅ NEW: Better error messages for different error types
    let errorMessage = 'An unexpected error occurred while testing the connection.'
    let errorType = 'Test failed'

    if (error.message?.includes('fetch')) {
      errorType = 'Network error'
      errorMessage = 'Unable to reach Shopify. Please check your internet connection and try again.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorType,
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// ✅ NEW: Allow OPTIONS for CORS if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
