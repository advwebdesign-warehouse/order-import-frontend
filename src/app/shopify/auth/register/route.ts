//file path: src/app/api/shopify/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import type { Integration, ShopifyIntegration } from '@/app/dashboard/integrations/types/integrationTypes'

export async function POST(request: NextRequest) {
  try {
    const { companyName, email, password, shop } = await request.json()

    // Validate input
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // TODO: Replace with your actual user creation logic
    // This is a placeholder - you should:
    // 1. Hash the password (never store plain text!)
    // 2. Store in your database
    // 3. Generate session token/JWT
    // 4. Send welcome email

    // For now, using localStorage simulation
    const storedUsers = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('users') || '[]')
      : []

    // Check if user already exists
    if (storedUsers.find((u: any) => u.email === email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const accountId = `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newUser = {
      id: userId,
      accountId: accountId,
      email: email,
      companyName: companyName,
      password: password, // TODO: Hash this in production!
      createdAt: new Date().toISOString(),
      role: 'admin',
      defaultStoreId: accountId // Use accountId as default store
    }

    storedUsers.push(newUser)
    localStorage.setItem('users', JSON.stringify(storedUsers))

    // Create default account settings
    const accountSettings = {
      accountId: accountId,
      companyName: companyName,
      integrations: [] as Integration[],
      createdAt: new Date().toISOString()
    }

    localStorage.setItem(`orderSync_integrations_${accountId}`, JSON.stringify(accountSettings))

    // Create default store
    const defaultStore = {
      id: accountId,
      storeName: companyName,
      companyName: companyName,
      email: email,
      phone: '',
      address: {
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      },
      createdAt: new Date().toISOString(),
      isDefault: true
    }

    const stores = JSON.parse(localStorage.getItem('stores') || '[]')
    stores.push(defaultStore)
    localStorage.setItem('stores', JSON.stringify(stores))

    // If shop is provided, create Shopify integration
    if (shop) {
      console.log(`[Shopify Auth] Registering with shop ${shop}`)

      const newIntegration: ShopifyIntegration = {
        id: `shopify-${accountId}-${Date.now()}`,
        name: 'Shopify',
        type: 'ecommerce',
        status: 'disconnected', // Will be 'connected' after OAuth completes
        enabled: true,
        storeId: accountId,
        description: 'Sync orders, products, and inventory with your Shopify store',
        icon: '/logos/shopify-logo.svg',
        config: {
          storeUrl: shop,
          accessToken: '', // Will be set after OAuth
        },
        features: {
          orderSync: true,
          productSync: true,
          inventorySync: true,
          fulfillmentSync: true,
        },
        connectedAt: new Date().toISOString()
      }

      accountSettings.integrations.push(newIntegration)
      localStorage.setItem(`orderSync_integrations_${accountId}`, JSON.stringify(accountSettings))
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      account: {
        id: accountId,
        companyName: companyName
      },
      message: 'Account created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('[Shopify Auth] Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    )
  }
}
