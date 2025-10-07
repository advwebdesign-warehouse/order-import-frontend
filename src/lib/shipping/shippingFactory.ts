//file path: app/lib/shipping/shippingFactory.ts

import { USPSService } from '../usps/uspsService'
import { USPSTrackingService } from '../usps/trackingService'
import { getUserUSPSCredentials } from '../storage/integrationStorage'

export type ShippingCarrier = 'USPS' | 'UPS' | 'FedEx' | 'DHL'

/**
 * Factory to create shipping service instances based on carrier
 */
export class ShippingServiceFactory {
  /**
   * Get shipping service for a specific carrier and user
   */
  static getService(carrier: ShippingCarrier, userId?: string): any {
    switch (carrier) {
      case 'USPS':
        const uspsCredentials = getUserUSPSCredentials(userId)
        if (!uspsCredentials) {
          throw new Error('USPS integration not configured for this user')
        }
        return new USPSService(uspsCredentials.userId, uspsCredentials.apiUrl)

      case 'UPS':
        // Future: return new UPSService(...)
        throw new Error('UPS integration coming soon')

      case 'FedEx':
        // Future: return new FedExService(...)
        throw new Error('FedEx integration coming soon')

      case 'DHL':
        // Future: return new DHLService(...)
        throw new Error('DHL integration coming soon')

      default:
        throw new Error(`Unsupported carrier: ${carrier}`)
    }
  }

  /**
   * Get tracking service for a specific carrier
   */
  static getTrackingService(carrier: ShippingCarrier, userId?: string): any {
    switch (carrier) {
      case 'USPS':
        const uspsCredentials = getUserUSPSCredentials(userId)
        if (!uspsCredentials) {
          throw new Error('USPS integration not configured for this user')
        }
        return new USPSTrackingService(uspsCredentials.userId, uspsCredentials.apiUrl)

      case 'UPS':
        // Future: return new UPSTrackingService(...)
        throw new Error('UPS tracking coming soon')

      case 'FedEx':
        // Future: return new FedExTrackingService(...)
        throw new Error('FedEx tracking coming soon')

      case 'DHL':
        // Future: return new DHLTrackingService(...)
        throw new Error('DHL tracking coming soon')

      default:
        throw new Error(`Unsupported carrier: ${carrier}`)
    }
  }

  /**
   * Get all available carriers for a user
   */
  static getAvailableCarriers(userId?: string): ShippingCarrier[] {
    const carriers: ShippingCarrier[] = []

    // Check USPS
    const uspsCredentials = getUserUSPSCredentials(userId)
    if (uspsCredentials?.userId) {
      carriers.push('USPS')
    }

    // Future: Check other carriers
    // if (getUPSCredentials(userId)) carriers.push('UPS')
    // if (getFedExCredentials(userId)) carriers.push('FedEx')

    return carriers
  }
}
