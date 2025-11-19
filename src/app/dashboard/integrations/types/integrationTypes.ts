//file path: src/app/dashboard/integrations/types/integrationTypes.ts

export type IntegrationStatus = 'connected' | 'disconnected' | 'error'
export type IntegrationType = 'shipping' | 'ecommerce'
export type Environment = 'sandbox' | 'production'

export interface BaseIntegration {
  id: string
  name: string
  type: IntegrationType
  status: IntegrationStatus
  enabled: boolean
  description: string
  icon?: string
  connectedAt?: string
  lastSyncAt?: string
  lastUpdated?: string
  accountId: string
  storeId: string //required
}

export interface USPSIntegration extends BaseIntegration {
  type: 'shipping'
  name: 'USPS'
  config: {
    consumerKey: string
    consumerSecret: string
    environment: Environment
    apiUrl: string
    accessToken?: string
    tokenExpiry?: string
  }
  features: {
    labelGeneration: boolean
    rateCalculation: boolean
    addressValidation: boolean
    tracking: boolean
  }
}

export interface UPSIntegration extends BaseIntegration {
  type: 'shipping'
  name: 'UPS'
  config: {
    accountNumber: string
    accessToken?: string
    refreshToken?: string
    tokenExpiry?: string
    environment: Environment
    apiUrl: string
  }
  features: {
    labelGeneration: boolean
    rateCalculation: boolean
    addressValidation: boolean
    tracking: boolean
    pickupScheduling: boolean
  }
}

// Ecommerce Integrations (with store and warehouse config)
export interface ShopifyIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'Shopify'
  config: {
    storeUrl: string
    accessToken: string
  }
  features: {
    orderSync: boolean
    productSync: boolean
    inventorySync: boolean
    fulfillmentSync: boolean
  }
}

export interface WooCommerceIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'WooCommerce'
  config: {
    storeUrl: string
    consumerKey: string
    consumerSecret: string
  }
}

export interface EtsyIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'Etsy'
  config: {
    apiKey: string
    sharedSecret: string
  }
}

export interface EbayIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'eBay'
  config: {
    appId: string
    certId: string
    devId: string
    token: string
  }
}

export type Integration =
  | USPSIntegration
  | UPSIntegration
  | ShopifyIntegration
  | WooCommerceIntegration
  | EtsyIntegration
  | EbayIntegration

export interface IntegrationSettings {
  integrations: Integration[]
  lastUpdated: string
  accountId: string // ✅ Required
}

// Helper type guards
export function isEcommerceIntegration(
  integration: Integration
): integration is ShopifyIntegration | WooCommerceIntegration | EtsyIntegration | EbayIntegration {
  return integration.type === 'ecommerce'
}

export function isShippingIntegration(
  integration: Integration
): integration is USPSIntegration | UPSIntegration {
  return integration.type === 'shipping'
}
