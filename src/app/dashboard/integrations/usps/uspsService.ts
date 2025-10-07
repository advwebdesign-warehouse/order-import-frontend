//file path: app/lib/usps/uspsService.ts

import { parseStringPromise, Builder } from 'xml2js'

export interface USPSAddress {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  zip4?: string
}

export interface USPSShipment {
  fromAddress: USPSAddress
  toAddress: USPSAddress
  weightOz: number
  weightLbs: number
  serviceType: 'PRIORITY' | 'EXPRESS' | 'FIRST_CLASS' | 'PARCEL_SELECT' | 'MEDIA_MAIL'
  container: 'VARIABLE' | 'FLAT_RATE_ENVELOPE' | 'FLAT_RATE_BOX' | 'RECTANGULAR' | 'NONRECTANGULAR'
  size: 'REGULAR' | 'LARGE'
  width?: number
  length?: number
  height?: number
  mailType?: 'PACKAGE' | 'LETTER' | 'FLAT'
  value?: number // Insurance value
}

export interface USPSLabel {
  trackingNumber: string
  labelImage: string // Base64 encoded
  postage: number
  shipDate: string
  serviceType: string
  deliveryDate?: string
}

export interface USPSRate {
  serviceType: string
  serviceName: string
  rate: number
  deliveryDays?: string
  commitmentDate?: string
}

export class USPSService {
  private userId: string
  private apiUrl: string

  constructor(userId?: string, apiUrl?: string) {
    // Use provided credentials or fall back to environment variables
    if (userId && apiUrl) {
      this.userId = userId
      this.apiUrl = apiUrl
    } else {
      this.userId = process.env.USPS_USER_ID || ''
      this.apiUrl = process.env.USPS_API_URL || 'https://secure.shippingapis.com/ShippingAPI.dll'
    }

    if (!this.userId) {
      console.warn('USPS_USER_ID not configured')
    }
  }

  /**
   * Validate address with USPS
   */
  async validateAddress(address: Partial<USPSAddress>): Promise<USPSAddress> {
    const xml = new Builder().buildObject({
      AddressValidateRequest: {
        $: { USERID: this.userId },
        Address: {
          $: { ID: '0' },
          Address1: address.address2 || '',
          Address2: address.address1 || '',
          City: address.city || '',
          State: address.state || '',
          Zip5: address.zip?.substring(0, 5) || '',
          Zip4: address.zip4 || ''
        }
      }
    })

    const response = await this.makeRequest('Verify', xml)
    const result = await parseStringPromise(response)

    if (result.AddressValidateResponse?.Address?.[0]?.Error) {
      throw new Error(result.AddressValidateResponse.Address[0].Error[0].Description[0])
    }

    const validatedAddress = result.AddressValidateResponse.Address[0]
    return {
      firstName: address.firstName || '',
      lastName: address.lastName || '',
      address1: validatedAddress.Address2?.[0] || '',
      address2: validatedAddress.Address1?.[0] || '',
      city: validatedAddress.City[0],
      state: validatedAddress.State[0],
      zip: validatedAddress.Zip5[0],
      zip4: validatedAddress.Zip4?.[0]
    }
  }

  /**
   * Get shipping rates for different services
   */
  async getRates(shipment: USPSShipment): Promise<USPSRate[]> {
    const xml = new Builder().buildObject({
      RateV4Request: {
        $: { USERID: this.userId },
        Package: {
          $: { ID: '0' },
          Service: 'ALL',
          ZipOrigination: shipment.fromAddress.zip.substring(0, 5),
          ZipDestination: shipment.toAddress.zip.substring(0, 5),
          Pounds: shipment.weightLbs,
          Ounces: shipment.weightOz,
          Container: shipment.container,
          Size: shipment.size,
          Width: shipment.width || 0,
          Length: shipment.length || 0,
          Height: shipment.height || 0,
          Machinable: 'true'
        }
      }
    })

    const response = await this.makeRequest('RateV4', xml)
    const result = await parseStringPromise(response)

    if (result.RateV4Response?.Package?.[0]?.Error) {
      throw new Error(result.RateV4Response.Package[0].Error[0].Description[0])
    }

    const postage = result.RateV4Response.Package[0].Postage || []
    return postage.map((p: any) => ({
      serviceType: p.$.CLASSID,
      serviceName: p.MailService[0],
      rate: parseFloat(p.Rate[0]),
      deliveryDays: p.CommitmentName?.[0],
      commitmentDate: p.CommitmentDate?.[0]
    }))
  }

  /**
   * Create shipping label
   */
  async createLabel(shipment: USPSShipment, orderId: string): Promise<USPSLabel> {
    const shipDate = new Date().toISOString().split('T')[0]

    const xml = new Builder().buildObject({
      eVSRequest: {
        $: { USERID: this.userId },
        Option: '',
        Revision: '2',
        ImageParameters: {
          ImageParameter: 'PDF' // or '4X6LABEL', 'SEPARATE PAGE'
        },
        FromName: `${shipment.fromAddress.firstName} ${shipment.fromAddress.lastName}`,
        FromFirm: '',
        FromAddress1: shipment.fromAddress.address2 || '',
        FromAddress2: shipment.fromAddress.address1,
        FromCity: shipment.fromAddress.city,
        FromState: shipment.fromAddress.state,
        FromZip5: shipment.fromAddress.zip.substring(0, 5),
        FromZip4: shipment.fromAddress.zip4 || '',
        ToName: `${shipment.toAddress.firstName} ${shipment.toAddress.lastName}`,
        ToFirm: '',
        ToAddress1: shipment.toAddress.address2 || '',
        ToAddress2: shipment.toAddress.address1,
        ToCity: shipment.toAddress.city,
        ToState: shipment.toAddress.state,
        ToZip5: shipment.toAddress.zip.substring(0, 5),
        ToZip4: shipment.toAddress.zip4 || '',
        WeightInOunces: (shipment.weightLbs * 16) + shipment.weightOz,
        ServiceType: shipment.serviceType,
        Container: shipment.container,
        Width: shipment.width || 0,
        Length: shipment.length || 0,
        Height: shipment.height || 0,
        Machinable: 'true',
        ProcessingCategory: 'NON-MACHINABLE',
        PriceOptions: 'TRUE',
        InsuredAmount: shipment.value || 0,
        ReferenceNumber: orderId,
        ShipDate: shipDate
      }
    })

    const response = await this.makeRequest('eVS', xml)
    const result = await parseStringPromise(response)

    if (result.eVSResponse?.Error) {
      throw new Error(result.eVSResponse.Error[0].Description[0])
    }

    return {
      trackingNumber: result.eVSResponse.BarcodeNumber[0],
      labelImage: result.eVSResponse.LabelImage[0], // Base64 PDF
      postage: parseFloat(result.eVSResponse.Postage[0]),
      shipDate: shipDate,
      serviceType: shipment.serviceType,
      deliveryDate: result.eVSResponse.ExpectedDeliveryDate?.[0]
    }
  }

  /**
   * Track package
   */
  async trackPackage(trackingNumber: string): Promise<any> {
    const xml = new Builder().buildObject({
      TrackFieldRequest: {
        $: { USERID: this.userId },
        TrackID: {
          $: { ID: trackingNumber }
        }
      }
    })

    const response = await this.makeRequest('TrackV2', xml)
    const result = await parseStringPromise(response)

    if (result.TrackResponse?.TrackInfo?.[0]?.Error) {
      throw new Error(result.TrackResponse.TrackInfo[0].Error[0].Description[0])
    }

    return result.TrackResponse.TrackInfo[0]
  }

  /**
   * Make HTTP request to USPS API
   */
  private async makeRequest(api: string, xml: string): Promise<string> {
    const url = `${this.apiUrl}?API=${api}&XML=${encodeURIComponent(xml)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/xml'
      }
    })

    if (!response.ok) {
      throw new Error(`USPS API error: ${response.statusText}`)
    }

    return await response.text()
  }
}

// Helper function to get USPS service with user credentials from localStorage
export async function getUSPSServiceFromStorage(): Promise<USPSService> {
  if (typeof window !== 'undefined') {
    // Client-side: get from localStorage
    try {
      const integrations = localStorage.getItem('orderSync_integrations')
      if (integrations) {
        const parsed = JSON.parse(integrations)
        const uspsIntegration = parsed.integrations?.find((i: any) => i.id === 'usps')
        if (uspsIntegration?.config?.userId) {
          return new USPSService(
            uspsIntegration.config.userId,
            uspsIntegration.config.apiUrl
          )
        }
      }
    } catch (error) {
      console.error('Error loading USPS config from localStorage:', error)
    }
  }

  // Fallback to environment variables
  return new USPSService()
}

// Default instance using environment variables (for backward compatibility)
export const uspsService = new USPSService()
