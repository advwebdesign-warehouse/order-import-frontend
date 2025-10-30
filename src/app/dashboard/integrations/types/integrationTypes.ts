//file path: src/app/dashboard/integrations/types/integrationTypes.ts

// ✅ Import WarehouseConfig from store types
import { WarehouseConfig } from '../../stores/utils/storeTypes'

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
  accountId?: string
  storeId?: string
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
  storeId: string  // ✅ Required - which store owns this integration
  config: {
    shopUrl: string
    accessToken: string
  }
  warehouseConfig?: WarehouseConfig  // ✅ NEW: Warehouse assignment
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
  storeId: string  // ✅ Required - which store owns this integration
  config: {
    storeUrl: string
    consumerKey: string
    consumerSecret: string
  }
  warehouseConfig?: WarehouseConfig  // ✅ NEW: Warehouse assignment
}

export interface EtsyIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'Etsy'
  storeId: string
  config: {
    apiKey: string
    sharedSecret: string
    shopId: string
  }
  warehouseConfig?: WarehouseConfig
}

export interface EbayIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'eBay'
  storeId: string
  config: {
    appId: string
    certId: string
    devId: string
    token: string
  }
  warehouseConfig?: WarehouseConfig
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
  accountId?: string
}

// ✅ Keep only USPS by default - most commonly used
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
    }
  ],
  lastUpdated: new Date().toISOString()
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
