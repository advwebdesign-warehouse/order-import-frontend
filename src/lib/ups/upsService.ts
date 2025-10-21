//file path: src/lib/ups/upsService.ts

export interface UPSAddress {
  name: string
  attentionName?: string
  addressLine1: string
  addressLine2?: string
  addressLine3?: string
  city: string
  stateProvinceCode: string
  postalCode: string
  countryCode: string
  phone?: string
  email?: string
}

export interface UPSPackage {
  weight: number
  weightUnit: 'LBS' | 'KGS'
  length?: number
  width?: number
  height?: number
  dimensionUnit?: 'IN' | 'CM'
  packaging?: string
}

export interface UPSShipment {
  fromAddress: UPSAddress
  toAddress: UPSAddress
  packages: UPSPackage[]
  service: string
  description?: string
}

export interface UPSOAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export class UPSService {
  private platformClientId: string
  private platformClientSecret: string
  private accountNumber: string
  private environment: 'sandbox' | 'production'
  private baseUrl: string
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(
    accountNumber: string,
    accessToken?: string,
    refreshToken?: string,
    environment: 'sandbox' | 'production' = 'sandbox'
  ) {
    // Platform credentials from environment
    this.platformClientId = process.env.UPS_CLIENT_ID || ''
    this.platformClientSecret = process.env.UPS_CLIENT_SECRET || ''

    this.accountNumber = accountNumber
    this.accessToken = accessToken || null
    this.refreshToken = refreshToken || null
    this.environment = environment

    this.baseUrl = environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com'
  }

  /**
   * Generate OAuth authorization URL for user to connect their UPS account
   */
  static getAuthorizationUrl(state?: string): string {
    const clientId = process.env.UPS_CLIENT_ID
    const redirectUri = process.env.UPS_REDIRECT_URI || 'https://orders-warehouse.adv.design/api/auth/ups/callback'
    const environment = process.env.UPS_ENVIRONMENT || 'sandbox'

    const baseUrl = environment === 'production'
      ? 'https://www.ups.com'
      : 'https://wwwcie.ups.com'

    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read write',
      state: state || 'ups_auth'
    })

    return `${baseUrl}/security/v1/oauth/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string, redirectUri: string): Promise<UPSOAuthTokens> {
    const clientId = process.env.UPS_CLIENT_ID!
    const clientSecret = process.env.UPS_CLIENT_SECRET!
    const environment = process.env.UPS_ENVIRONMENT || 'sandbox'

    const baseUrl = environment === 'production'
      ? 'https://onlinetools.ups.com'
      : 'https://wwwcie.ups.com'

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(`${baseUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`UPS token exchange failed: ${error}`)
    }

    return await response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<UPSOAuthTokens> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const credentials = Buffer.from(
      `${this.platformClientId}:${this.platformClientSecret}`
    ).toString('base64')

    const response = await fetch(`${this.baseUrl}/security/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }).toString()
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`UPS token refresh failed: ${error}`)
    }

    const tokens: UPSOAuthTokens = await response.json()

    // Update stored tokens
    this.accessToken = tokens.access_token
    this.refreshToken = tokens.refresh_token
    this.tokenExpiry = new Date(Date.now() + (tokens.expires_in - 300) * 1000)

    return tokens
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<string> {
    // If token exists and hasn't expired, use it
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken
    }

    // If we have a refresh token, use it to get new access token
    if (this.refreshToken) {
      console.log('[UPS] Refreshing access token...')
      const tokens = await this.refreshAccessToken()
      return tokens.access_token
    }

    throw new Error('No valid UPS access token available. User needs to re-authorize.')
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const token = await this.ensureValidToken()

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log('[UPS] API Request:', method, url)

    const response = await fetch(url, options)
    console.log('[UPS] API Response status:', response.status)

    if (!response.ok) {
      const error = await response.text()
      console.error('[UPS] API error:', error)
      throw new Error(`UPS API error: ${response.status} - ${error}`)
    }

    return await response.json()
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[UPS] Testing connection...')
      await this.ensureValidToken()
      console.log('[UPS] Connection test successful')
      return true
    } catch (error) {
      console.error('[UPS] Connection test failed:', error)
      throw error
    }
  }

  /**
   * Get shipping rates
   */
  async getRates(shipment: UPSShipment): Promise<any> {
    const requestBody = {
      RateRequest: {
        Request: {
          SubVersion: '1801',
          TransactionReference: {
            CustomerContext: 'Rating'
          }
        },
        Shipment: {
          Shipper: {
            Name: shipment.fromAddress.name,
            ShipperNumber: this.accountNumber,
            Address: {
              AddressLine: [shipment.fromAddress.addressLine1],
              City: shipment.fromAddress.city,
              StateProvinceCode: shipment.fromAddress.stateProvinceCode,
              PostalCode: shipment.fromAddress.postalCode,
              CountryCode: shipment.fromAddress.countryCode
            }
          },
          ShipTo: {
            Name: shipment.toAddress.name,
            Address: {
              AddressLine: [shipment.toAddress.addressLine1],
              City: shipment.toAddress.city,
              StateProvinceCode: shipment.toAddress.stateProvinceCode,
              PostalCode: shipment.toAddress.postalCode,
              CountryCode: shipment.toAddress.countryCode
            }
          },
          Service: {
            Code: shipment.service
          },
          Package: shipment.packages.map(pkg => ({
            PackagingType: {
              Code: pkg.packaging || '02'
            },
            Dimensions: pkg.length ? {
              UnitOfMeasurement: {
                Code: pkg.dimensionUnit || 'IN'
              },
              Length: pkg.length.toString(),
              Width: pkg.width!.toString(),
              Height: pkg.height!.toString()
            } : undefined,
            PackageWeight: {
              UnitOfMeasurement: {
                Code: pkg.weightUnit
              },
              Weight: pkg.weight.toString()
            }
          }))
        }
      }
    }

    return await this.makeRequest('/api/rating/v1/Rate', 'POST', requestBody)
  }

  /**
   * Track package
   */
  async trackPackage(trackingNumber: string): Promise<any> {
    const endpoint = `/api/track/v1/details/${trackingNumber}`
    return await this.makeRequest(endpoint, 'GET')
  }

  /**
   * Validate address
   */
  async validateAddress(address: UPSAddress): Promise<any> {
    const requestBody = {
      XAVRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: 'Address Validation'
          }
        },
        AddressKeyFormat: {
          AddressLine: [address.addressLine1, address.addressLine2].filter(Boolean),
          PoliticalDivision2: address.city,
          PoliticalDivision1: address.stateProvinceCode,
          PostcodePrimaryLow: address.postalCode,
          CountryCode: address.countryCode
        }
      }
    }

    return await this.makeRequest('/api/addressvalidation/v1/1', 'POST', requestBody)
  }

  /**
   * Get available UPS services from API
   * This queries the Rating API to discover which services are available
   */
  async getAvailableServices(): Promise<any[]> {
    console.log('[UPS] Getting available services from API...')

    // Test shipment to discover available services
    const testShipment: UPSShipment = {
      fromAddress: {
        name: 'Test Shipper',
        addressLine1: '123 Test St',
        city: 'New York',
        stateProvinceCode: 'NY',
        postalCode: '10001',
        countryCode: 'US'
      },
      toAddress: {
        name: 'Test Recipient',
        addressLine1: '456 Test Ave',
        city: 'Los Angeles',
        stateProvinceCode: 'CA',
        postalCode: '90001',
        countryCode: 'US'
      },
      packages: [{
        weight: 5,
        weightUnit: 'LBS',
        length: 10,
        width: 8,
        height: 6,
        dimensionUnit: 'IN',
        packaging: '02' // Customer Supplied Package
      }],
      service: '03' // Ground - most basic service
    }

    try {
      // Request "Shop" rates to get all available services
      const requestBody = {
        RateRequest: {
          Request: {
            SubVersion: '1801',
            TransactionReference: {
              CustomerContext: 'Get Available Services'
            }
          },
          Shipment: {
            Shipper: {
              Name: testShipment.fromAddress.name,
              ShipperNumber: this.accountNumber,
              Address: {
                AddressLine: [testShipment.fromAddress.addressLine1],
                City: testShipment.fromAddress.city,
                StateProvinceCode: testShipment.fromAddress.stateProvinceCode,
                PostalCode: testShipment.fromAddress.postalCode,
                CountryCode: testShipment.fromAddress.countryCode
              }
            },
            ShipTo: {
              Name: testShipment.toAddress.name,
              Address: {
                AddressLine: [testShipment.toAddress.addressLine1],
                City: testShipment.toAddress.city,
                StateProvinceCode: testShipment.toAddress.stateProvinceCode,
                PostalCode: testShipment.toAddress.postalCode,
                CountryCode: testShipment.toAddress.countryCode
              }
            },
            Package: testShipment.packages.map(pkg => ({
              PackagingType: {
                Code: pkg.packaging || '02'
              },
              Dimensions: {
                UnitOfMeasurement: { Code: pkg.dimensionUnit || 'IN' },
                Length: pkg.length!.toString(),
                Width: pkg.width!.toString(),
                Height: pkg.height!.toString()
              },
              PackageWeight: {
                UnitOfMeasurement: { Code: pkg.weightUnit },
                Weight: pkg.weight.toString()
              }
            }))
          }
        }
      }

      // Call Rating API with no specific service to get all available services
      const response = await this.makeRequest('/api/rating/v1/Shop', 'POST', requestBody)

      const ratedShipments = response.RateResponse?.RatedShipment || []
      const services = Array.isArray(ratedShipments) ? ratedShipments : [ratedShipments]

      console.log(`[UPS] Found ${services.length} available services from API`)

      // Map UPS API response to our standard format
      return services.map((rated: any) => {
        const serviceCode = rated.Service?.Code || ''
        const serviceName = this.getServiceName(serviceCode)
        const deliveryDays = rated.GuaranteedDelivery?.BusinessDaysInTransit
        const isInternational = this.isInternationalService(serviceCode)

        return {
          carrier: 'UPS',
          serviceCode: serviceCode,
          serviceName: serviceName,
          displayName: `UPS ${serviceName}`,
          description: this.getServiceDescription(serviceCode, deliveryDays),
          serviceType: isInternational ? 'international' : 'domestic',
          estimatedDays: deliveryDays || this.getEstimatedDays(serviceCode),
          isActive: true,
          features: {
            trackingIncluded: true,
            signatureAvailable: true,
            insuranceAvailable: true,
            saturdayDelivery: ['01', '13', '14'].includes(serviceCode), // Only certain services
            maxInsuranceValue: 50000
          },
          restrictions: {
            maxWeight: 150,
            maxDimensions: {
              length: 108,
              width: 108,
              height: 108
            }
          }
        }
      })
    } catch (error) {
      console.error('[UPS] Error getting available services:', error)
      throw error
    }
  }

  /**
   * Get available UPS containers/packaging from API
   * UPS provides standard packaging options that don't need API testing
   */
  async getAvailableContainers(): Promise<any[]> {
    console.log('[UPS] Getting available packaging options...')

    // UPS standard packaging - these are always available
    // Unlike USPS, UPS doesn't require testing each one
    const containers = [
      {
        code: 'UPS_LETTER',
        name: 'UPS Letter',
        dimensions: { length: 12.5, width: 9.5, height: 0.25, unit: 'in' },
        weight: { maxWeight: 0.5, tareWeight: 0.01, unit: 'lbs' },
        description: 'Document envelope',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '01',
        carrierCode: 'UPS_LETTER',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_EXPRESS_BOX_SMALL',
        name: 'UPS Express Box - Small',
        dimensions: { length: 13, width: 11, height: 2, unit: 'in' },
        weight: { maxWeight: 100, tareWeight: 0.5, unit: 'lbs' },
        description: 'Small express box',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '2a',
        carrierCode: 'UPS_EXPRESS_BOX_SMALL',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_EXPRESS_BOX_MEDIUM',
        name: 'UPS Express Box - Medium',
        dimensions: { length: 16, width: 11, height: 3, unit: 'in' },
        weight: { maxWeight: 100, tareWeight: 0.7, unit: 'lbs' },
        description: 'Medium express box',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '2b',
        carrierCode: 'UPS_EXPRESS_BOX_MEDIUM',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_EXPRESS_BOX_LARGE',
        name: 'UPS Express Box - Large',
        dimensions: { length: 18, width: 13, height: 3, unit: 'in' },
        weight: { maxWeight: 100, tareWeight: 1.0, unit: 'lbs' },
        description: 'Large express box',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '2c',
        carrierCode: 'UPS_EXPRESS_BOX_LARGE',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_10KG_BOX',
        name: 'UPS 10KG Box',
        dimensions: { length: 16.5, width: 13.25, height: 10.75, unit: 'in' },
        weight: { maxWeight: 22, tareWeight: 1.5, unit: 'lbs' },
        description: '10KG box for international',
        flatRate: false,
        availableFor: 'international' as const,
        packageType: '21',
        carrierCode: 'UPS_10KG_BOX',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_25KG_BOX',
        name: 'UPS 25KG Box',
        dimensions: { length: 19.375, width: 17.375, height: 13.25, unit: 'in' },
        weight: { maxWeight: 55, tareWeight: 2.5, unit: 'lbs' },
        description: '25KG box for international',
        flatRate: false,
        availableFor: 'international' as const,
        packageType: '22',
        carrierCode: 'UPS_25KG_BOX',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_TUBE',
        name: 'UPS Tube',
        dimensions: { length: 38, width: 6, height: 6, unit: 'in' },
        weight: { maxWeight: 100, tareWeight: 0.5, unit: 'lbs' },
        description: 'Tube packaging',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '03',
        carrierCode: 'UPS_TUBE',
        mailClass: null,
        available: true
      },
      {
        code: 'UPS_PAK',
        name: 'UPS Pak',
        dimensions: { length: 16, width: 12.75, height: 2, unit: 'in' },
        weight: { maxWeight: 100, tareWeight: 0.3, unit: 'lbs' },
        description: 'Padded flat envelope',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '04',
        carrierCode: 'UPS_PAK',
        mailClass: null,
        available: true
      },
      {
        code: 'CUSTOMER_SUPPLIED',
        name: 'Your Own Box',
        dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
        weight: { maxWeight: 150, tareWeight: 0, unit: 'lbs' },
        description: 'Use your own packaging - dimensions required',
        flatRate: false,
        availableFor: 'both' as const,
        packageType: '02',
        carrierCode: 'CUSTOMER_SUPPLIED',
        mailClass: null,
        isEditable: true,
        needsDimensions: true,
        available: true
      }
    ]

    console.log(`[UPS] Retrieved ${containers.length} packaging options`)
    return containers
  }

  /**
   * Helper: Get service name from code
   */
  private getServiceName(code: string): string {
    const serviceNames: Record<string, string> = {
      '01': 'Next Day Air',
      '02': '2nd Day Air',
      '03': 'Ground',
      '07': 'Worldwide Express',
      '08': 'Worldwide Expedited',
      '11': 'Standard',
      '12': '3 Day Select',
      '13': 'Next Day Air Saver',
      '14': 'Next Day Air Early',
      '54': 'Worldwide Express Plus',
      '59': '2nd Day Air A.M.',
      '65': 'Worldwide Saver'
    }
    return serviceNames[code] || `Service ${code}`
  }

  /**
   * Helper: Check if service is international
   */
  private isInternationalService(code: string): boolean {
    return ['07', '08', '11', '54', '65'].includes(code)
  }

  /**
   * Helper: Get service description
   */
  private getServiceDescription(code: string, deliveryDays?: string): string {
    if (deliveryDays) {
      return `${deliveryDays} business days`
    }

    const descriptions: Record<string, string> = {
      '01': 'Next business day delivery',
      '02': 'Second business day delivery',
      '03': '1-5 business days',
      '07': '1-3 business days to major cities worldwide',
      '08': '2-5 business days to international destinations',
      '11': 'Guaranteed day-definite delivery to Canada and Mexico',
      '12': 'Third business day delivery',
      '13': 'Next business day by end of day',
      '14': 'Next business day by 8:00 AM',
      '54': 'Fastest international service',
      '59': 'Second business day by noon',
      '65': 'Next business day to select international destinations'
    }
    return descriptions[code] || 'Delivery time varies'
  }

  /**
   * Helper: Get estimated days for service
   */
  private getEstimatedDays(code: string): string {
    const estimatedDays: Record<string, string> = {
      '01': '1 business day',
      '02': '2 business days',
      '03': '1-5 business days',
      '07': '1-3 business days',
      '08': '2-5 business days',
      '11': 'Varies by destination',
      '12': '3 business days',
      '13': '1 business day',
      '14': '1 business day',
      '54': '1-2 business days',
      '59': '2 business days',
      '65': '1 business day'
    }
    return estimatedDays[code] || 'Varies'
  }
}
