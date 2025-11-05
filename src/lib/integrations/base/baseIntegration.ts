//file path: src/lib/integrations/base/baseIntegration.ts

/**
 * Base Integration Interface
 * All integrations (Shopify, WooCommerce, Etsy, etc.) must implement this interface
 */

export interface IntegrationConfig {
  id: string
  name: string
  type: 'ecommerce' | 'shipping' | 'other'
  storeId: string
  accountId: string
  config: Record<string, any>
}

export interface SyncResult {
  success: boolean
  count: number
  error?: string
  data?: any
}

export interface TestConnectionResult {
  success: boolean
  message?: string
  error?: string
  details?: any
}

/**
 * Base Integration Class
 * Provides common functionality for all integrations
 */
export abstract class BaseIntegration {
  protected config: IntegrationConfig

  constructor(config: IntegrationConfig) {
    this.config = config
  }

  /**
   * Test connection to the integration
   * Must be implemented by each integration
   */
  abstract testConnection(): Promise<TestConnectionResult>

  /**
   * Sync products from the integration
   * Must be implemented by ecommerce integrations
   */
  abstract syncProducts(): Promise<SyncResult>

  /**
   * Sync orders from the integration
   * Must be implemented by ecommerce integrations
   */
  abstract syncOrders(): Promise<SyncResult>

  /**
   * Get integration name
   */
  getName(): string {
    return this.config.name
  }

  /**
   * Get integration type
   */
  getType(): string {
    return this.config.type
  }

  /**
   * Get store ID
   */
  getStoreId(): string {
    return this.config.storeId
  }

  /**
   * Check if integration supports feature
   */
  abstract supportsFeature(feature: string): boolean

  /**
   * Get supported features
   */
  abstract getSupportedFeatures(): string[]
}

/**
 * Ecommerce Integration Base Class
 * Specific base for e-commerce platforms
 */
export abstract class EcommerceIntegration extends BaseIntegration {
  /**
   * Sync all data (products + orders)
   */
  async syncAll(): Promise<{
    success: boolean
    productsCount: number
    ordersCount: number
    errors: string[]
  }> {
    const errors: string[] = []

    // Sync products
    const productsResult = await this.syncProducts()
    if (!productsResult.success && productsResult.error) {
      errors.push(`Products: ${productsResult.error}`)
    }

    // Sync orders
    const ordersResult = await this.syncOrders()
    if (!ordersResult.success && ordersResult.error) {
      errors.push(`Orders: ${ordersResult.error}`)
    }

    return {
      success: errors.length === 0,
      productsCount: productsResult.count,
      ordersCount: ordersResult.count,
      errors
    }
  }

  /**
   * Common e-commerce features
   */
  getSupportedFeatures(): string[] {
    return ['productSync', 'orderSync', 'inventorySync']
  }

  supportsFeature(feature: string): boolean {
    return this.getSupportedFeatures().includes(feature)
  }
}

/**
 * Shipping Integration Base Class
 * Specific base for shipping carriers
 */
export abstract class ShippingIntegration extends BaseIntegration {
  /**
   * Generate shipping label
   */
  abstract createLabel(shipment: any): Promise<any>

  /**
   * Get shipping rates
   */
  abstract getRates(shipment: any): Promise<any>

  /**
   * Track package
   */
  abstract trackPackage(trackingNumber: string): Promise<any>

  /**
   * Sync products and orders are not applicable for shipping integrations
   */
  async syncProducts(): Promise<SyncResult> {
    throw new Error(`${this.getName()} is a shipping integration and does not support product sync`)
  }

  async syncOrders(): Promise<SyncResult> {
    throw new Error(`${this.getName()} is a shipping integration and does not support order sync`)
  }

  /**
   * Common shipping features
   */
  getSupportedFeatures(): string[] {
    return ['labelGeneration', 'rateCalculation', 'tracking']
  }

  supportsFeature(feature: string): boolean {
    return this.getSupportedFeatures().includes(feature)
  }
}
