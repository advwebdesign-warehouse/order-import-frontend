//file path: src/app/dashboard/integrations/types/integrationTypes.ts

export type IntegrationStatus = 'connected' | 'disconnected' | 'error'
export type IntegrationType = 'shipping' | 'ecommerce' | 'payment' | 'warehouse'
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
  userId?: string
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

export interface ShopifyIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'Shopify'
  config: {
    shopUrl: string
    accessToken: string
    apiKey: string
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

export type Integration = USPSIntegration | UPSIntegration | ShopifyIntegration | WooCommerceIntegration

export interface IntegrationSettings {
  integrations: Integration[]
  lastUpdated: string
  userId?: string
}

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  integrations: [
    {
      id: 'usps',
      name: 'USPS',
      type: 'shipping',
      status: 'disconnected',
      enabled: false,
      description: 'Generate shipping labels, calculate rates, and track packages with USPS',
      icon: '/logos/usps-logo.svg',
      config: {
        consumerKey: '',
        consumerSecret: '',
        environment: 'sandbox',
        apiUrl: 'https://apis-tem.usps.com'
      },
      features: {
        labelGeneration: true,
        rateCalculation: true,
        addressValidation: true,
        tracking: true
      }
    },
    {
      id: 'ups',
      name: 'UPS',
      type: 'shipping',
      status: 'disconnected',
      enabled: false,
      description: 'Generate shipping labels, calculate rates, and track packages with UPS',
      icon: '/logos/ups-logo.svg',
      config: {
        accountNumber: '',
        environment: 'sandbox',
        apiUrl: 'https://wwwcie.ups.com'
      },
      features: {
        labelGeneration: true,
        rateCalculation: true,
        addressValidation: true,
        tracking: true,
        pickupScheduling: true
      }
    }
  ],
  lastUpdated: new Date().toISOString()
}
