//file path: src/lib/shipping/shippingFactory.ts

import { IntegrationAPI } from '@/lib/api/integrationApi'

export type ShippingCarrier = 'USPS' | 'UPS' | 'FedEx' | 'DHL'

/**
 * Factory to get shipping carrier information and credentials
 * ✅ UPDATED: Now uses backend API instead of localStorage
 */
export class ShippingServiceFactory {
  /**
   * Get shipping credentials for a specific carrier
   * Returns null if carrier is not configured
   * ✅ Now fetches from backend integrations API
   */
   static async getCarrierCredentials(carrier: ShippingCarrier): Promise<any> {
     try {
       // Map carrier name to integration type
       const integrationType = this.getIntegrationType(carrier)

       // Get integrations of this type from backend
       const integrations = await IntegrationAPI.getAccountIntegrations({
         type: integrationType
       })

       // Find the first active, connected integration for this carrier
       const integration = integrations.find((int: any) =>
         int.status === 'connected' &&
         int.enabled !== false
       )

       if (!integration) {
         throw new Error(`${carrier} integration not configured or not connected`)
       }

       // Return the credentials from integration config
       return this.extractCredentials(carrier, integration)

     } catch (error) {
       console.error(`[Shipping Factory] Error getting ${carrier} credentials:`, error)
       throw error
     }
   }

   /**
    * Get all available carriers for the current account
    * ✅ Now checks backend integrations instead of localStorage
    */
  static async getAvailableCarriers(): Promise<ShippingCarrier[]> {
    const carriers: ShippingCarrier[] = []

    try {
      // Get all shipping integrations
      const integrations = await IntegrationAPI.getAccountIntegrations({
        type: 'shipping'
      })

      // Check each carrier
      for (const integration of integrations) {
        if (integration.status !== 'connected' || integration.enabled === false) {
          continue
        }

        const carrier = this.getCarrierFromIntegration(integration)
        if (carrier && !carriers.includes(carrier)) {
          carriers.push(carrier)
        }
      }

      console.log('[Shipping Factory] Available carriers:', carriers)
      return carriers

    } catch (error) {
      console.error('[Shipping Factory] Error getting available carriers:', error)
      return []
    }
  }

  /**
   * Check if a specific carrier is available
   */
  static async isCarrierAvailable(carrier: ShippingCarrier): Promise<boolean> {
    try {
      await this.getCarrierCredentials(carrier)
      return true
    } catch (error) {
      return false
    }
  }

/**
 * Get integration by carrier
 * ✅ NEW: Get the full integration object for a carrier
 */
static async getCarrierIntegration(carrier: ShippingCarrier): Promise<any> {
  try {
    const integrationType = this.getIntegrationType(carrier)

    const integrations = await IntegrationAPI.getAccountIntegrations({
      type: integrationType
    })

    const integration = integrations.find((int: any) =>
      int.status === 'connected' &&
      int.enabled !== false
    )

    if (!integration) {
      throw new Error(`${carrier} integration not found`)
    }

    return integration

  } catch (error) {
    console.error(`[Shipping Factory] Error getting ${carrier} integration:`, error)
    throw error
  }
}

// ============================================================================
// HELPER METHODS
// ============================================================================

/**
 * Map carrier to integration type
 */
private static getIntegrationType(carrier: ShippingCarrier): string {
  switch (carrier) {
    case 'UPS':
      return 'shipping' // or 'ups' if you use specific types
    case 'USPS':
      return 'shipping' // or 'usps' if you use specific types
    case 'FedEx':
      return 'shipping' // or 'fedex' if you use specific types
    case 'DHL':
      return 'shipping' // or 'dhl' if you use specific types
    default:
      return 'shipping'
  }
}

/**
 * Get carrier name from integration
 */
private static getCarrierFromIntegration(integration: any): ShippingCarrier | null {
  // Check integration name or config for carrier type
  const name = integration.name?.toUpperCase() || ''
  const configCarrier = integration.config?.carrier?.toUpperCase() || ''

  if (name.includes('UPS') || configCarrier === 'UPS') {
    return 'UPS'
  }
  if (name.includes('USPS') || configCarrier === 'USPS') {
    return 'USPS'
  }
  if (name.includes('FEDEX') || configCarrier === 'FEDEX') {
    return 'FedEx'
  }
  if (name.includes('DHL') || configCarrier === 'DHL') {
    return 'DHL'
  }

  return null
}

/**
 * Extract credentials from integration config
 */
private static extractCredentials(carrier: ShippingCarrier, integration: any): any {
  const config = integration.config || {}

  switch (carrier) {
    case 'UPS':
      return {
        accountNumber: config.accountNumber,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        accessToken: config.accessToken,
        ...config
      }

    case 'USPS':
      return {
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        userId: config.userId,
        ...config
      }

    case 'FedEx':
      return {
        accountNumber: config.accountNumber,
        key: config.key,
        password: config.password,
        meterNumber: config.meterNumber,
        ...config
      }

    case 'DHL':
      return {
        accountNumber: config.accountNumber,
        siteId: config.siteId,
        password: config.password,
        ...config
      }

    default:
      return config
  }
}

/**
 * Validate carrier credentials
 * ✅ NEW: Check if credentials are complete
 */
static validateCredentials(carrier: ShippingCarrier, credentials: any): boolean {
  switch (carrier) {
    case 'UPS':
      return !!(
        credentials.accountNumber &&
        credentials.clientId &&
        credentials.clientSecret
      )

    case 'USPS':
      return !!(
        credentials.consumerKey &&
        credentials.consumerSecret
      )

    case 'FedEx':
      return !!(
        credentials.accountNumber &&
        credentials.key &&
        credentials.password &&
        credentials.meterNumber
      )

    case 'DHL':
      return !!(
        credentials.accountNumber &&
        credentials.siteId &&
        credentials.password
      )

    default:
      return false
  }
}

/**
 * Get carrier display name
 * ✅ NEW: Get formatted carrier name
 */
static getCarrierDisplayName(carrier: ShippingCarrier): string {
  switch (carrier) {
    case 'UPS':
      return 'UPS'
    case 'USPS':
      return 'USPS'
    case 'FedEx':
      return 'FedEx'
    case 'DHL':
      return 'DHL Express'
    default:
      return carrier
  }
}

  /**
   * Get carrier status
   * ✅ NEW: Check if carrier is configured and ready
   */
  static async getCarrierStatus(carrier: ShippingCarrier): Promise<{
    available: boolean
    connected: boolean
    enabled: boolean
    error?: string
  }> {
    try {
      const integration = await this.getCarrierIntegration(carrier)
      const credentials = this.extractCredentials(carrier, integration)
      const hasValidCredentials = this.validateCredentials(carrier, credentials)

      return {
        available: true,
        connected: integration.status === 'connected',
        enabled: integration.enabled !== false,
        error: !hasValidCredentials ? 'Invalid or incomplete credentials' : undefined
      }
    } catch (error) {
      return {
        available: false,
        connected: false,
        enabled: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
