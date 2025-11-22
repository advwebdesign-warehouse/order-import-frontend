//file path: src/app/api/shopify/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'

/**
 * Shopify Registration Route
 * ✅ CONVERTED: Now uses backend API instead of localStorage
 */
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

    // ✅ UPDATED: Call backend API to create account
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyName,
        email,
        password,
        shop // Optional: Shopify shop domain
      }),
      credentials: 'include', // Important for httpOnly cookies
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Registration failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Return success response with user and account data
    return NextResponse.json({
      success: true,
      user: data.user,
      account: data.account,
      store: data.store,
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
