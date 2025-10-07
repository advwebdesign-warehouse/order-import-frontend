//file path: app/api/integrations/usps/test/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Builder } from 'xml2js'

export async function POST(request: NextRequest) {
  try {
    const { userId, apiUrl } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Test with a simple address verification request
    const xml = new Builder().buildObject({
      AddressValidateRequest: {
        $: { USERID: userId },
        Address: {
          $: { ID: '0' },
          Address1: '',
          Address2: '123 Main St',
          City: 'New York',
          State: 'NY',
          Zip5: '10001',
          Zip4: ''
        }
      }
    })

    const testUrl = `${apiUrl}?API=Verify&XML=${encodeURIComponent(xml)}`

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml'
      }
    })

    const responseText = await response.text()

    // Check if response contains error
    if (responseText.includes('<Error>')) {
      return NextResponse.json(
        { error: 'Invalid credentials or API error' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful'
    })
  } catch (error: any) {
    console.error('USPS test error:', error)
    return NextResponse.json(
      { error: error.message || 'Connection failed' },
      { status: 500 }
    )
  }
}
