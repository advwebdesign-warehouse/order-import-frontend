//file path: src/app/api/shopify/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, shop } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // TODO: Replace with your actual authentication logic
    // This is a placeholder - you should:
    // 1. Query your database for the user
    // 2. Verify password hash
    // 3. Generate session token/JWT

    // For now, using localStorage simulation
    const storedUsers = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('users') || '[]')
      : []

    const user = storedUsers.find((u: any) => u.email === email)

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // If shop is provided, link it to the user's account
    if (shop) {
      // TODO: Add shop to user's linked shops in database
      console.log(`[Shopify Auth] Linking shop ${shop} to user ${user.id}`)

      // Create/update Shopify integration for this shop
      const integrations = JSON.parse(localStorage.getItem(`orderSync_integrations_${user.accountId}`) || '{"integrations":[]}')

      // Check if Shopify integration exists for this shop
      const existingShopify = integrations.integrations.find(
        (i: any) => i.name === 'Shopify' && i.config?.shopUrl === shop
      )

      if (!existingShopify) {
        // Create new Shopify integration
        const newIntegration = {
          id: `shopify-${user.accountId}-${Date.now()}`,
          name: 'Shopify',
          type: 'ecommerce',
          status: 'pending', // Will be 'connected' after OAuth
          enabled: true,
          storeId: user.defaultStoreId || user.accountId,
          description: 'Sync orders, products, and inventory with your Shopify store',
          icon: '/logos/shopify-logo.svg',
          config: {
            shopUrl: shop,
            // OAuth will add accessToken later
          },
          features: {
            orderSync: true,
            productSync: true,
            inventorySync: true,
            fulfillmentSync: true,
          },
          connectedAt: new Date().toISOString()
        }

        integrations.integrations.push(newIntegration)
        localStorage.setItem(`orderSync_integrations_${user.accountId}`, JSON.stringify(integrations))
      }
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      account: {
        id: user.accountId,
        companyName: user.companyName
      },
      message: 'Login successful'
    })

  } catch (error) {
    console.error('[Shopify Auth] Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
