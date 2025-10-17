//file path: src/lib/shipping/shippingFactory.ts

import { UPSService } from '../ups/upsService'
import { getUserUPSCredentials } from '../storage/integrationStorage'

export type ShippingCarrier = 'USPS' | 'UPS' | 'FedEx' | 'DHL'

/**
 * Factory to create shipping service instances based on carrier
 * Note: USPS has its own separate implementation and doesn't use this factory
 */
export class ShippingServiceFactory {
  /**
   * Get shipping service for a specific carrier and user
   */
  static getService(carrier: ShippingCarrier, userId?: string): any {
    switch (carrier) {
      case 'UPS':
        const upsCredentials = getUserUPSCredentials(userId)
        if (!upsCredentials) {
          throw new Error('UPS integration not configured for this user')
        }

        // Get client credentials from environment variables
        const clientId = process.env.NEXT_PUBLIC_UPS_CLIENT_ID
        const clientSecret = process.env.UPS_CLIENT_SECRET

        if (!clientId || !clientSecret) {
          throw new Error('UPS API credentials not configured in environment variables')
        }

        return new UPSService(
          clientId,
          clientSecret,
          upsCredentials.accountNumber,
          upsCredentials.environment || 'production'
        )

      case 'USPS':
        throw new Error('USPS uses its own separate implementation (USPSServiceV2)')

      case 'FedEx':
        throw new Error('FedEx integration coming soon')

      case 'DHL':
        throw new Error('DHL integration coming soon')

      default:
        throw new Error(`Unsupported carrier: ${carrier}`)
    }
  }

  /**
   * Get all available carriers for a user
   */
  static getAvailableCarriers(userId?: string): ShippingCarrier[] {
    const carriers: ShippingCarrier[] = []

    // Check UPS
    const upsCredentials = getUserUPSCredentials(userId)
    if (upsCredentials?.accountNumber) {
      carriers.push('UPS')
    }

    // Note: USPS availability is checked separately through its own service

    return carriers
  }
}
