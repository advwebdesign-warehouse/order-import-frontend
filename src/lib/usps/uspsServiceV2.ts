//file path: src/lib/usps/uspsServiceV2.ts

// Shared token cache across all instances
interface TokenCache {
  accessToken: string
  tokenExpiry: Date
  consumerKey: string // To identify which credentials this token belongs to
}

const tokenCache = new Map<string, TokenCache>()

export interface USPSAddress {
  firstName: string
  lastName: string
  streetAddress: string
  secondaryAddress?: string
  city: string
  state: string
  ZIPCode: string
  ZIPPlus4?: string
}

export interface USPSShipment {
  fromAddress: USPSAddress
  toAddress: USPSAddress
  weight: number // in ounces
  length?: number
  width?: number
  height?: number
  mailClass: 'USPS_GROUND_ADVANTAGE' | 'PRIORITY_MAIL' | 'PRIORITY_MAIL_EXPRESS' | 'FIRST-CLASS_PACKAGE_SERVICE' | 'PARCEL_SELECT' | 'MEDIA_MAIL' | 'LIBRARY_MAIL' | 'USPS_RETAIL_GROUND'
  packageType?: 'PACKAGE' | 'FLAT_RATE_ENVELOPE' | 'FLAT_RATE_BOX' | 'LETTER'
  extraServices?: string[]
}

export interface USPSLabel {
  trackingNumber: string
  labelImage: string // Base64
  postage: number
  deliveryDate?: string
}

export interface USPSRate {
  mailClass: string
  zone: string
  rate: number
  deliveryDays?: string
  deliveryDate?: string
}

export interface USPSTrackingInfo {
  trackingNumber: string
  status: string
  statusCategory: string
  statusSummary: string
  expectedDeliveryDate?: string
  events: Array<{
    eventType: string
    eventTimestamp: string
    eventCity?: string
    eventState?: string
    eventZIP?: string
    eventCountry?: string
  }>
}

export class USPSServiceV2 {
  private consumerKey: string
  private consumerSecret: string
  private environment: 'sandbox' | 'production'
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(consumerKey: string, consumerSecret: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.consumerKey = consumerKey
    this.consumerSecret = consumerSecret
    this.environment = environment

    // CORRECTED: Use official USPS API URLs
    this.baseUrl = environment === 'production'
      ? 'https://apis.usps.com'
      : 'https://apis-tem.usps.com' // TEM = Test Environment
  }

  /**
   * Get OAuth access token using official USPS format
   */
   private async getAccessToken(): Promise<string> {
       const cacheKey = `${this.environment}_${this.consumerKey}`

       // Check shared cache first
       const cached = tokenCache.get(cacheKey)
       if (cached && new Date() < cached.tokenExpiry) {
         console.log('[USPS] Using cached token from shared cache')
         console.log('[USPS] Token expires at:', cached.tokenExpiry.toISOString())
         return cached.accessToken
       }

       console.log('[USPS] Requesting new OAuth token...')
       console.log('[USPS] Environment:', this.environment)
       console.log('[USPS] Base URL:', this.baseUrl)

       const tokenUrl = `${this.baseUrl}/oauth2/v3/token`

       try {
         console.log('[USPS] Token URL:', tokenUrl)

         const response = await fetch(tokenUrl, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             client_id: this.consumerKey,
             client_secret: this.consumerSecret,
             grant_type: 'client_credentials'
           })
         })

         console.log('[USPS] Token response status:', response.status)

         if (!response.ok) {
           const errorText = await response.text()
           console.error('[USPS] Token error response:', errorText)
           throw new Error(`USPS OAuth error (${response.status}): ${errorText}`)
         }

         const data = await response.json()
         console.log('[USPS] ✅ Token obtained successfully!')
         console.log('[USPS] Token expires in:', data.expires_in, 'seconds')

         const accessToken = data.access_token
         const expiresIn = data.expires_in || 3600

         // Set expiry 10 minutes before actual expiry for safety
         const tokenExpiry = new Date(Date.now() + (expiresIn - 600) * 1000)

         console.log('[USPS] Token will expire at:', tokenExpiry.toISOString())
         console.log('[USPS] Storing token in shared cache')

         // Store in shared cache for reuse across requests
         tokenCache.set(cacheKey, {
           accessToken,
           tokenExpiry,
           consumerKey: this.consumerKey
         })

         return accessToken
       } catch (error) {
         console.error('[USPS] OAuth token error:', error)
         throw error
       }
     }

     /**
        * Make authenticated API request
        */
       private async makeRequest(endpoint: string, method: string = 'POST', body?: any): Promise<any> {
         const token = await this.getAccessToken()

         const options: RequestInit = {
           method,
           headers: {
             'Authorization': `Bearer ${token}`,
             'Content-Type': 'application/json',
             'Accept': 'application/json'
           }
         }

         // Only add body for POST/PUT/PATCH requests
         if (body && method !== 'GET') {
           options.body = JSON.stringify(body)
         }

         const url = `${this.baseUrl}${endpoint}`
         console.log('[USPS] API Request:', method, endpoint)

         const response = await fetch(url, options)

         console.log('[USPS] API Response status:', response.status)

         if (!response.ok) {
           const error = await response.text()
           console.error('[USPS] API error:', error)
           throw new Error(`USPS API error: ${response.status} - ${error}`)
         }

         return await response.json()
       }

  /**
   * Test connection - simple address validation
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[USPS] Testing connection...')

      // Just try to get a token as the simplest test
      await this.getAccessToken()

      console.log('[USPS] Connection test successful')
      return true
    } catch (error) {
      console.error('[USPS] Connection test failed:', error)
      throw error
    }
  }

  /**
     * Validate address using GET method with query parameters
     */
    async validateAddress(address: Partial<USPSAddress>): Promise<USPSAddress> {
      // Build query parameters
      const params = new URLSearchParams({
        streetAddress: address.streetAddress || '',
        secondaryAddress: address.secondaryAddress || '',
        city: address.city || '',
        state: address.state || '',
        ZIPCode: address.ZIPCode || '',
        ZIPPlus4: address.ZIPPlus4 || ''
      })

      // Remove empty parameters
      for (const [key, value] of Array.from(params.entries())) {
        if (!value) {
          params.delete(key)
        }
      }

      const endpoint = `/addresses/v3/address?${params.toString()}`

      console.log('[USPS] Validating address with GET:', endpoint)

      const response = await this.makeRequest(endpoint, 'GET')

      return {
        firstName: address.firstName || '',
        lastName: address.lastName || '',
        streetAddress: response.address.streetAddress,
        secondaryAddress: response.address.secondaryAddress || '',
        city: response.address.city,
        state: response.address.state,
        ZIPCode: response.address.ZIPCode5 || response.address.ZIPCode,
        ZIPPlus4: response.address.ZIPPlus4 || ''
      }
    }

  /**
   * Get shipping rates
   */
  async getRates(shipment: USPSShipment): Promise<USPSRate[]> {
    const response = await this.makeRequest('/prices/v3/base-rates/search', 'POST', {
      originZIPCode: shipment.fromAddress.ZIPCode,
      destinationZIPCode: shipment.toAddress.ZIPCode,
      weight: shipment.weight,
      length: shipment.length || 0,
      width: shipment.width || 0,
      height: shipment.height || 0,
      mailClass: shipment.mailClass,
      processingCategory: 'MACHINABLE',
      destinationEntryFacilityType: 'NONE',
      rateIndicator: 'DR',
      priceType: 'RETAIL'
    })

    return response.rates?.map((rate: any) => ({
      mailClass: rate.mailClass,
      zone: rate.zone,
      rate: parseFloat(rate.price),
      deliveryDays: rate.deliveryDays,
      deliveryDate: rate.deliveryDate
    })) || []
  }

  /**
   * Create shipping label
   */
  async createLabel(shipment: USPSShipment): Promise<USPSLabel> {
    const response = await this.makeRequest('/labels/v3/label', 'POST', {
      imageInfo: {
        imageType: 'PDF',
        labelType: 'SHIPPING_LABEL'
      },
      fromAddress: {
        firstName: shipment.fromAddress.firstName,
        lastName: shipment.fromAddress.lastName,
        streetAddress: shipment.fromAddress.streetAddress,
        secondaryAddress: shipment.fromAddress.secondaryAddress,
        city: shipment.fromAddress.city,
        state: shipment.fromAddress.state,
        ZIPCode: shipment.fromAddress.ZIPCode,
        ZIPPlus4: shipment.fromAddress.ZIPPlus4
      },
      toAddress: {
        firstName: shipment.toAddress.firstName,
        lastName: shipment.toAddress.lastName,
        streetAddress: shipment.toAddress.streetAddress,
        secondaryAddress: shipment.toAddress.secondaryAddress,
        city: shipment.toAddress.city,
        state: shipment.toAddress.state,
        ZIPCode: shipment.toAddress.ZIPCode,
        ZIPPlus4: shipment.toAddress.ZIPPlus4
      },
      weight: shipment.weight,
      length: shipment.length || 0,
      width: shipment.width || 0,
      height: shipment.height || 0,
      mailClass: shipment.mailClass,
      processingCategory: 'MACHINABLE',
      rateIndicator: 'DR',
      destinationEntryFacilityType: 'NONE',
      extraServices: shipment.extraServices || []
    })

    return {
      trackingNumber: response.trackingNumber,
      labelImage: response.labelImage,
      postage: parseFloat(response.postage),
      deliveryDate: response.deliveryDate
    }
  }

  /**
   * Track package
   */
  async trackPackage(trackingNumber: string): Promise<USPSTrackingInfo> {
    const response = await this.makeRequest(`/tracking/v3/tracking/${trackingNumber}`, 'GET')

    return {
      trackingNumber: response.trackingNumber,
      status: response.status,
      statusCategory: response.statusCategory,
      statusSummary: response.statusSummary,
      expectedDeliveryDate: response.expectedDeliveryDate,
      events: response.events?.map((event: any) => ({
        eventType: event.eventType,
        eventTimestamp: event.eventTimestamp,
        eventCity: event.eventCity,
        eventState: event.eventState,
        eventZIP: event.eventZIP,
        eventCountry: event.eventCountry
      })) || []
    }
  }
}
