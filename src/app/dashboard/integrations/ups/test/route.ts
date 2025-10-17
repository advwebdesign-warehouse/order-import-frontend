//file path: src/app/api/integrations/ups/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { UPSService } from '@/lib/ups/upsService'

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret, accountNumber, environment } = await request.json()

    console.log('[UPS Test] Starting connection test')
    console.log('[UPS Test] Environment:', environment)

    if (!clientId || !clientSecret || !accountNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing credentials',
          message: 'Client ID, Client Secret, and Account Number are required'
        },
        { status: 400 }
      )
    }

    const upsService = new UPSService(clientId, clientSecret, accountNumber, environment)
    await upsService.testConnection()

    console.log('[UPS Test] ✅ Connection successful!')

    return NextResponse.json({
      success: true,
      message: 'Connection successful! UPS API is accessible.'
    })

  } catch (error: any) {
    console.error('[UPS Test] ❌ Connection failed:', error.message)

    return NextResponse.json(
      {
        success: false,
        error: 'Connection Failed',
        message: error.message || 'Unable to connect to UPS API'
      },
      { status: 200 }
    )
  }
}
