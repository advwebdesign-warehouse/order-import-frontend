//file path: src/lib/integrations/integrationFactory.ts

import { BaseIntegrationService, EcommerceIntegrationService, ShippingIntegrationService, IntegrationConfig } from './base/baseIntegration'
import { ShopifyIntegration } from './ecommerce/shopifyIntegration'
import { USPSIntegration } from './shipping/uspsIntegration'
import { UPSIntegration } from './shipping/upsIntegration'
// ✅ COMMENTED OUT: WooCommerce not yet implemented
// import { WooCommerceIntegration } from './ecommerce/woocommerceIntegration'

/**
 * Integration Constructor Type
 */
type IntegrationConstructor = new (config: IntegrationConfig) => BaseIntegrationService

/**
 * Integration Registry
 * Maps integration names to their implementation classes
 */
class IntegrationRegistry {
  private static instance: IntegrationRegistry
  private registry: Map<string, IntegrationConstructor>

  private constructor() {
    this.registry = new Map()
    this.registerDefaultIntegrations()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry()
    }
    return IntegrationRegistry.instance
  }

  /**
   * Register default integrations
   */
  private registerDefaultIntegrations() {
    // E-commerce Integrations
    this.register('Shopify', ShopifyIntegration)
    // ✅ COMMENTED OUT: WooCommerce not yet implemented
    // this.register('WooCommerce', WooCommerceIntegration)

    // Shipping Integrations
    // ✅ NOW ACTIVE: USPS and UPS integrations implemented
    this.register('USPS', USPSIntegration)
    this.register('UPS', UPSIntegration)
    // this.register('FedEx', FedExIntegration) // TODO: Implement
    // this.register('DHL', DHLIntegration)     // TODO: Implement

    console.log('[IntegrationRegistry] Registered integrations:', Array.from(this.registry.keys()))
  }

  /**
   * Register a new integration
   * @param name - Integration name (e.g., 'Shopify', 'WooCommerce')
   * @param constructor - Integration class constructor
   */
  register(name: string, constructor: IntegrationConstructor) {
    this.registry.set(name.toLowerCase(), constructor)
    console.log(`[IntegrationRegistry] Registered: ${name}`)
  }

  /**
   * Check if integration is registered
   */
  has(name: string): boolean {
    return this.registry.has(name.toLowerCase())
  }

  /**
   * Get integration constructor
   */
  get(name: string): IntegrationConstructor | undefined {
    return this.registry.get(name.toLowerCase())
  }

  /**
   * Get all registered integration names
   */
  getAllNames(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Unregister an integration (useful for testing)
   */
  unregister(name: string) {
    this.registry.delete(name.toLowerCase())
  }
}

/**
 * Integration Factory
 * Creates integration instances based on configuration
 */
export class IntegrationFactory {
  private static registry = IntegrationRegistry.getInstance()

  /**
   * Create an integration instance
   * @param integrationData - Integration data from storage
   * @returns Integration instance or null if not supported
   */
  static create(integrationData: any): BaseIntegrationService  | null {
    const name = integrationData.name

    if (!this.registry.has(name)) {
      console.warn(`[IntegrationFactory] Integration not registered: ${name}`)
      return null
    }

    const Constructor = this.registry.get(name)!

    // Build config from integration data
    const config: IntegrationConfig = {
      id: integrationData.id,
      name: integrationData.name,
      type: integrationData.type,
      storeId: integrationData.storeId,
      accountId: integrationData.accountId || 'default',
      config: integrationData.config || {}
    }

    try {
      const instance = new Constructor(config)
      console.log(`[IntegrationFactory] Created ${name} integration instance`)
      return instance
    } catch (error) {
      console.error(`[IntegrationFactory] Failed to create ${name} integration:`, error)
      return null
    }
  }

  /**
   * Create multiple integration instances
   * @param integrations - Array of integration data
   * @returns Array of integration instances
   */
  static createMany(integrations: any[]): BaseIntegrationService[] {
    return integrations
      .map(integration => this.create(integration))
      .filter((instance): instance is BaseIntegrationService => instance !== null)
  }

  /**
   * Register a new integration type
   * This allows dynamically adding new integrations at runtime
   */
  static register(name: string, constructor: IntegrationConstructor) {
    this.registry.register(name, constructor)
  }

  /**
   * Check if integration type is supported
   */
  static isSupported(name: string): boolean {
    return this.registry.has(name)
  }

  /**
   * Get all supported integration names
   */
  static getSupportedIntegrations(): string[] {
    return this.registry.getAllNames()
  }

  /**
   * Filter integrations by type
   */
  static filterByType(
    integrations: BaseIntegrationService[],
    type: 'ecommerce' | 'shipping' | 'other'
  ): BaseIntegrationService[] {
    return integrations.filter(integration => integration.getType() === type)
  }

  /**
   * Get all e-commerce integrations
   */
  static getEcommerceIntegrations(integrations: BaseIntegrationService[]): EcommerceIntegrationService[] {
    return integrations.filter(
      (integration): integration is EcommerceIntegrationService  =>
        integration instanceof EcommerceIntegrationService
    )
  }

  /**
   * Get all shipping integrations
   */
  static getShippingIntegrations(integrations: BaseIntegrationService[]): ShippingIntegrationService[] {
    return integrations.filter(
      (integration): integration is ShippingIntegrationService  =>
        integration instanceof ShippingIntegrationService
    )
  }
}

/**
 * Export singleton registry for advanced usage
 */
export { IntegrationRegistry }
