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
}
