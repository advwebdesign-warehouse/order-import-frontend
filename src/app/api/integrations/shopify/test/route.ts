//file path: src/app/api/integrations/shopify/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { ShopifyGraphQLClient } from '@/lib/shopify/shopifyGraphQLClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // ✅ Support both storeUrl for backwards compatibility
    const { storeUrl, accessToken } = body
    const shop = storeUrl

    console.log('[Shopify Test] ========================================')
    console.log('[Shopify Test] Testing connection')
    console.log('[Shopify Test] Request body keys:', Object.keys(body))
    console.log('[Shopify Test] Shop:', shop)
    console.log('[Shopify Test] Shop type:', typeof shop)
    console.log('[Shopify Test] Token present:', !!accessToken)
    console.log('[Shopify Test] ========================================')

    if (!shop || !accessToken) {
      console.error('[Shopify Test] ❌ Missing credentials:', {
        hasShop: !!shop,
        hasStoreUrl: !!storeUrl,
        hasAccessToken: !!accessToken,
        shop: shop,
        bodyKeys: Object.keys(body)
      })
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
    let normalizedShop = shop.trim().toLowerCase()
    normalizedShop = normalizedShop.replace(/^https?:\/\//, '')
    normalizedShop = normalizedShop.replace(/\/$/, '')

    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`
    }

    console.log('[Shopify Test] Normalized shop:', normalizedShop)
    console.log('[Shopify Test] Using GraphQL API 2025-10')

    // Create GraphQL client
    const client = new ShopifyGraphQLClient({
      shop: normalizedShop,
      accessToken: accessToken,
      apiVersion: '2025-10'
    })

    // Test connection using GraphQL
    console.log('[Shopify Test] Calling GraphQL testConnection()...')
    const result = await client.testConnection()

    console.log('[Shopify Test] ✅ Connection successful!')
    console.log('[Shopify Test] Shop name:', result.shop.name)

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${result.shop.name}`,
      details: {
        shopId: result.shop.id,
        shopName: result.shop.name,
        email: result.shop.email,
        currencyCode: result.shop.currencyCode
      }
    })

  } catch (error: any) {
    console.error('[Shopify Test] ❌ Error:', error)
    console.log('[Shopify Test] Error type:', error.constructor.name)
    console.log('[Shopify Test] Error message:', error.message)

    // Parse different error types
    let errorMessage = 'An unexpected error occurred while testing the connection.'
    let errorType = 'Test failed'
    let statusCode = 200 // Return 200 so UI can display error nicely

    // Check for network errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorType = 'Network error'
      errorMessage = 'Unable to reach Shopify. Please check your internet connection and try again.'
    }
    // Check for authentication errors (401)
    else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      errorType = 'Invalid credentials'
      errorMessage = 'Access token is invalid or expired. Please reconnect your Shopify store.'
    }
    // Check for permission errors (403)
    else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      errorType = 'Permission denied'
      errorMessage = 'Access denied. Your app may need additional permissions. Please reinstall the app with proper permissions.'
    }
    // Check for not found errors (404)
    else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      errorType = 'Shop not found'
      errorMessage = 'Shop not found. Please verify the shop URL is correct.'
    }
    // Check for GraphQL errors
    else if (error.message?.includes('GraphQL Error')) {
      errorType = 'GraphQL error'
      errorMessage = error.message.replace('GraphQL Error: ', '')
    }
    // Check for HTTP errors
    else if (error.message?.includes('HTTP Error')) {
      errorType = 'HTTP error'
      errorMessage = error.message
    }
    // Generic error with message
    else if (error.message) {
      errorMessage = error.message
    }

    console.log('[Shopify Test] Returning error:', { errorType, errorMessage })

    return NextResponse.json(
      {
        success: false,
        error: errorType,
        message: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    )
  }
}

// ✅ Allow OPTIONS for CORS if needed
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
