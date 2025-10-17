//file path: lib/usps/uspsServiceV2.ts

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

  /**
   * Get available USPS services
   * Returns list of services that can be used for shipping
   * This represents what would come from the USPS API
   */
  async getAvailableServices(): Promise<any[]> {
    console.log('[USPS] Getting available services from API...')

    // In a real implementation, this would call the USPS API
    // For now, we return the standard USPS services that are available through their API
    const services = [
      {
        carrier: 'USPS',
        serviceCode: 'PRIORITY_MAIL',
        serviceName: 'Priority Mail',
        displayName: 'USPS Priority Mail',
        description: '1-3 business days',
        serviceType: 'domestic',
        estimatedDays: '1-3 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: true,
          insuranceAvailable: true,
          saturdayDelivery: true,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 108,
            width: 108,
            height: 108
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'PRIORITY_MAIL_FLAT_RATE',
        serviceName: 'Priority Mail Flat Rate',
        displayName: 'USPS Priority Mail Flat Rate',
        description: '1-3 business days (flat rate boxes/envelopes)',
        serviceType: 'domestic',
        estimatedDays: '1-3 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: true,
          insuranceAvailable: true,
          saturdayDelivery: true,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 108,
            width: 108,
            height: 108
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'PRIORITY_MAIL_EXPRESS',
        serviceName: 'Priority Mail Express',
        displayName: 'USPS Priority Mail Express',
        description: 'Overnight to 2-day guarantee',
        serviceType: 'domestic',
        estimatedDays: 'Overnight to 2-day',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: true,
          insuranceAvailable: true,
          saturdayDelivery: true,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 108,
            width: 108,
            height: 108
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'PRIORITY_MAIL_EXPRESS_FLAT_RATE',
        serviceName: 'Priority Mail Express Flat Rate',
        displayName: 'USPS Priority Mail Express Flat Rate',
        description: 'Overnight to 2-day (flat rate envelopes)',
        serviceType: 'domestic',
        estimatedDays: 'Overnight to 2-day',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: true,
          insuranceAvailable: true,
          saturdayDelivery: true,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 108,
            width: 108,
            height: 108
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'USPS_GROUND_ADVANTAGE',
        serviceName: 'Ground Advantage',
        displayName: 'USPS Ground Advantage',
        description: '2-5 business days',
        serviceType: 'domestic',
        estimatedDays: '2-5 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: false,
          insuranceAvailable: true,
          saturdayDelivery: false,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 130,
            width: 130,
            height: 130
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'FIRST-CLASS_PACKAGE_SERVICE',
        serviceName: 'First-Class Package Service',
        displayName: 'USPS First-Class Package',
        description: '1-5 business days',
        serviceType: 'domestic',
        estimatedDays: '1-5 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: false,
          insuranceAvailable: false,
          saturdayDelivery: false,
          maxInsuranceValue: 0
        },
        restrictions: {
          maxWeight: 15.999,
          maxDimensions: {
            length: 22,
            width: 18,
            height: 15
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'MEDIA_MAIL',
        serviceName: 'Media Mail',
        displayName: 'USPS Media Mail',
        description: '2-8 business days (books, media only)',
        serviceType: 'domestic',
        estimatedDays: '2-8 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: false,
          insuranceAvailable: true,
          saturdayDelivery: false,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 108,
            width: 108,
            height: 108
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'LIBRARY_MAIL',
        serviceName: 'Library Mail',
        displayName: 'USPS Library Mail',
        description: '2-9 business days',
        serviceType: 'domestic',
        estimatedDays: '2-9 business days',
        isActive: true,
        features: {
          trackingIncluded: false,
          signatureAvailable: false,
          insuranceAvailable: false,
          saturdayDelivery: false,
          maxInsuranceValue: 0
        },
        restrictions: {
          maxWeight: 70
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'PARCEL_SELECT',
        serviceName: 'Parcel Select Ground',
        displayName: 'USPS Parcel Select Ground',
        description: '2-8 business days',
        serviceType: 'domestic',
        estimatedDays: '2-8 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: false,
          insuranceAvailable: true,
          saturdayDelivery: false,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 130,
            width: 130,
            height: 130
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'PRIORITY_MAIL_INTERNATIONAL',
        serviceName: 'Priority Mail International',
        displayName: 'USPS Priority Mail International',
        description: '6-10 business days',
        serviceType: 'international',
        estimatedDays: '6-10 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: true,
          insuranceAvailable: true,
          saturdayDelivery: false,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 79,
            width: 79,
            height: 79
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'PRIORITY_MAIL_EXPRESS_INTERNATIONAL',
        serviceName: 'Priority Mail Express International',
        displayName: 'USPS Priority Mail Express International',
        description: '3-5 business days',
        serviceType: 'international',
        estimatedDays: '3-5 business days',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: true,
          insuranceAvailable: true,
          saturdayDelivery: false,
          maxInsuranceValue: 5000
        },
        restrictions: {
          maxWeight: 70,
          maxDimensions: {
            length: 79,
            width: 79,
            height: 79
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'FIRST_CLASS_PACKAGE_INTERNATIONAL',
        serviceName: 'First-Class Package International Service',
        displayName: 'USPS First-Class Package International',
        description: 'Varies by destination',
        serviceType: 'international',
        estimatedDays: 'Varies by destination',
        isActive: true,
        features: {
          trackingIncluded: true,
          signatureAvailable: false,
          insuranceAvailable: false,
          saturdayDelivery: false,
          maxInsuranceValue: 0
        },
        restrictions: {
          maxWeight: 4,
          maxDimensions: {
            length: 24,
            width: 12,
            height: 12
          }
        }
      },
      {
        carrier: 'USPS',
        serviceCode: 'FIRST_CLASS_MAIL_INTERNATIONAL',
        serviceName: 'First-Class Mail International',
        displayName: 'USPS First-Class Mail International',
        description: 'Letters and flats only',
        serviceType: 'international',
        estimatedDays: 'Varies by destination',
        isActive: true,
        features: {
          trackingIncluded: false,
          signatureAvailable: false,
          insuranceAvailable: false,
          saturdayDelivery: false,
          maxInsuranceValue: 0
        },
        restrictions: {
          maxWeight: 4
        }
      }
    ]

    console.log(`[USPS] Retrieved ${services.length} services from API`)
    return services
  }

  /**
   * Get available USPS containers by testing rates API
   * Tests different package types to see which ones are available
   */
  async getAvailableContainers(originZip: string = '10001', destZip: string = '90210'): Promise<any[]> {
    const testPackageTypes = [
      { code: 'PACKAGE', name: 'Your Own Box (Package)' },
      { code: 'FLAT_RATE_ENVELOPE', name: 'USPS Flat Rate Envelope' },
      { code: 'FLAT_RATE_BOX', name: 'USPS Flat Rate Box' },
      { code: 'LETTER', name: 'Letter' }
    ]

    const mailClasses = [
      'PRIORITY_MAIL',
      'PRIORITY_MAIL_EXPRESS',
      'USPS_GROUND_ADVANTAGE',
      'FIRST-CLASS_PACKAGE_SERVICE'
    ]

    const availableContainers: any[] = []

    console.log('[USPS] Testing available containers...')

    // Test each mail class with different package types
    for (const mailClass of mailClasses) {
      for (const packageType of testPackageTypes) {
        try {
          const shipment: USPSShipment = {
            fromAddress: {
              firstName: 'Test',
              lastName: 'Sender',
              streetAddress: '123 Test St',
              city: 'New York',
              state: 'NY',
              ZIPCode: originZip
            },
            toAddress: {
              firstName: 'Test',
              lastName: 'Recipient',
              streetAddress: '456 Test Ave',
              city: 'Los Angeles',
              state: 'CA',
              ZIPCode: destZip
            },
            weight: 16, // 1 lb = 16 oz
            length: 10,
            width: 8,
            height: 6,
            mailClass: mailClass as any,
            packageType: packageType.code as any
          }

          const rates = await this.getRates(shipment)

          if (rates && rates.length > 0) {
            // This package type is available
            const exists = availableContainers.find(
              c => c.code === packageType.code && c.mailClass === mailClass
            )

            if (!exists) {
              availableContainers.push({
                code: packageType.code,
                name: `${packageType.name} - ${mailClass.replace(/_/g, ' ')}`,
                mailClass: mailClass,
                packageType: packageType.code,
                available: true,
                rates: rates
              })
              console.log(`[USPS] ✓ Available: ${packageType.code} with ${mailClass}`)
            }
          }
        } catch (error) {
          // Container not available for this service - skip
          console.log(`[USPS] ✗ Not available: ${packageType.code} with ${mailClass}`)
        }
      }
    }

    console.log(`[USPS] Found ${availableContainers.length} available container/service combinations`)
    return availableContainers
  }

  /**
   * Get standard USPS container specifications
   * Based on official USPS packaging specifications
   */
  getContainerSpecifications(): any[] {
    return [
      {
        code: 'FLAT_RATE_ENVELOPE',
        name: 'USPS Priority Mail Flat Rate Envelope',
        dimensions: { length: 12.5, width: 9.5, height: 0.75, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0.1, unit: 'lbs' },
        description: 'Standard flat rate envelope - up to 70 lbs',
        flatRate: true,
        flatRatePrice: 9.65, // 2024 pricing
        availableFor: 'both' as const,
        mailClass: 'PRIORITY_MAIL',
        packageType: 'FLAT_RATE_ENVELOPE'
      },
      {
        code: 'PADDED_FLAT_RATE_ENVELOPE',
        name: 'USPS Padded Flat Rate Envelope',
        dimensions: { length: 12.5, width: 9.5, height: 1, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0.2, unit: 'lbs' },
        description: 'Padded flat rate envelope - up to 70 lbs',
        flatRate: true,
        flatRatePrice: 10.40,
        availableFor: 'both' as const,
        mailClass: 'PRIORITY_MAIL',
        packageType: 'FLAT_RATE_ENVELOPE'
      },
      {
        code: 'SMALL_FLAT_RATE_BOX',
        name: 'USPS Small Flat Rate Box',
        dimensions: { length: 8.625, width: 5.375, height: 1.625, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0.3, unit: 'lbs' },
        description: 'Small flat rate box - up to 70 lbs',
        flatRate: true,
        flatRatePrice: 10.40,
        availableFor: 'both' as const,
        mailClass: 'PRIORITY_MAIL',
        packageType: 'FLAT_RATE_BOX'
      },
      {
        code: 'MEDIUM_FLAT_RATE_BOX',
        name: 'USPS Medium Flat Rate Box',
        dimensions: { length: 11.25, width: 8.75, height: 6, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0.5, unit: 'lbs' },
        description: 'Medium flat rate box (top loading) - up to 70 lbs',
        flatRate: true,
        flatRatePrice: 17.05,
        availableFor: 'both' as const,
        mailClass: 'PRIORITY_MAIL',
        packageType: 'FLAT_RATE_BOX'
      },
      {
        code: 'LARGE_FLAT_RATE_BOX',
        name: 'USPS Large Flat Rate Box',
        dimensions: { length: 12.25, width: 12.25, height: 6, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0.6, unit: 'lbs' },
        description: 'Large flat rate box - up to 70 lbs',
        flatRate: true,
        flatRatePrice: 22.80,
        availableFor: 'both' as const,
        mailClass: 'PRIORITY_MAIL',
        packageType: 'FLAT_RATE_BOX'
      },
      {
        code: 'PACKAGE_VARIABLE',
        name: 'Your Own Box (Variable)',
        dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0, unit: 'lbs' },
        description: 'Use your own packaging - dimensions required',
        flatRate: false,
        availableFor: 'both' as const,
        mailClass: 'PRIORITY_MAIL',
        packageType: 'PACKAGE'
      },
      {
        code: 'PACKAGE_GROUND',
        name: 'Your Own Box (Ground Advantage)',
        dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
        weight: { maxWeight: 70, tareWeight: 0, unit: 'lbs' },
        description: 'Use your own packaging with Ground Advantage',
        flatRate: false,
        availableFor: 'domestic' as const,
        mailClass: 'USPS_GROUND_ADVANTAGE',
        packageType: 'PACKAGE'
      },
      {
        code: 'LETTER',
        name: 'Letter',
        dimensions: { length: 11.5, width: 6.125, height: 0.25, unit: 'in' },
        weight: { maxWeight: 3.5, tareWeight: 0.01, unit: 'lbs' },
        description: 'Standard letter size',
        flatRate: false,
        availableFor: 'domestic' as const,
        mailClass: 'FIRST-CLASS_PACKAGE_SERVICE',
        packageType: 'LETTER'
      }
    ]
  }

}
