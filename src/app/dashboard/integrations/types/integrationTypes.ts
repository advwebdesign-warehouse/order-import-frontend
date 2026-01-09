//file path: src/app/dashboard/integrations/types/integrationTypes.ts

import { US_STATES, US_REGIONS } from '@/app/dashboard/shared/utils/usStates'
import type { USState, USRegion } from '@/app/dashboard/shared/utils/usStates'


export type IntegrationStatus = 'connected' | 'disconnected' | 'error'
export type IntegrationType = 'shipping' | 'ecommerce'
export type Environment = 'sandbox' | 'production'
export type WarehouseRoutingMode = 'simple' | 'advanced'

// ============================================================================
// INVENTORY SYNC CONFIGURATION
// ============================================================================

/**
 * Product import mode - how products are initially imported from e-commerce platform
 */
export type ProductImportMode = 'products_only' | 'with_quantities'

/**
 * Sync direction - how quantities are synchronized between warehouses and platform
 */
export type SyncDirection = 'one_way_from' | 'one_way_to' | 'two_way' | 'manual'

// ============================================================================
// ⭐ NEW: Product Sync Destinations Configuration
// ============================================================================

/**
 * Product sync modes determine which warehouses receive synced products
 */
export type ProductSyncMode =
  | 'all_routing_warehouses'  // Sync to all warehouses in routing config
  | 'primary_only'            // Only sync to primary warehouse (default)
  | 'specific_warehouses'     // User-selected warehouses

/**
  * Configuration for product sync destinations
  * Stored in integration.config.productSyncConfig
  */
export interface ProductSyncConfig {
  mode: ProductSyncMode
  // Only used when mode === 'specific_warehouses'
  selectedWarehouseIds?: string[]
}

/**
 * Default product sync config
 */
export const DEFAULT_PRODUCT_SYNC_CONFIG: ProductSyncConfig = {
  mode: 'primary_only',
  selectedWarehouseIds: undefined
}

/**
 * E-commerce inventory synchronization configuration
 */
export interface EcommerceInventoryConfig {
  // Product Import Settings
  productImport: {
    mode: ProductImportMode
    primaryWarehouseId?: string  // Only used when mode === 'with_quantities'
  }

  // Stock Synchronization Settings
  managesInventory: boolean  // Enable/disable inventory management
  syncDirection: SyncDirection  // Direction of quantity sync
}

// ============================================================================
// WAREHOUSE CONFIGURATION FOR INTEGRATIONS
// ============================================================================

/**
 * Region assignment for advanced routing
 */
export interface AssignedRegion {
  country: string
  countryCode: string
  states: string[]  // State codes (e.g., ['CA', 'NY'])
}

/**
 * Warehouse assignment with priority and regions
 */
export interface WarehouseAssignment {
  id: string
  warehouseId: string
  warehouseName: string  // Cached for display
  priority: number  // Lower number = higher priority
  regions: AssignedRegion[]
  isActive: boolean
}

/**
 * E-commerce warehouse configuration (flexible routing)
 */
export interface EcommerceWarehouseConfig {
  mode: WarehouseRoutingMode

  // Simple Mode: Primary + Fallback
  primaryWarehouseId?: string
  fallbackWarehouseId?: string

  // Advanced Mode: Region-based routing
  enableRegionRouting: boolean
  assignments: WarehouseAssignment[]
}

// ============================================================================
// BASE INTEGRATION
// ============================================================================

export interface BaseIntegration {
  id: string
  name: string
  type: IntegrationType
  provider: string
  status: IntegrationStatus
  enabled: boolean
  description: string
  icon?: string
  connectedAt?: string
  lastSyncAt?: string
  lastUpdated?: string
  accountId: string
  storeId: string
}

// ============================================================================
// SHIPPING INTEGRATIONS (Simple: Single Warehouse)
// ============================================================================

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
  // ✅ Simple warehouse assignment for shipping
  warehouseId?: string  // Single warehouse for label generation
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
  // ✅ Simple warehouse assignment for shipping
  warehouseId?: string  // Single warehouse for label generation
}

// ============================================================================
// E-COMMERCE INTEGRATIONS (Flexible: Simple or Advanced Routing)
// ============================================================================

export interface ShopifyIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'Shopify'
  config: {
    storeUrl: string
    accessToken: string
    // Product import configuration stored in config
    productImport?: {
      mode: ProductImportMode
      primaryWarehouseId?: string
    }
    // ⭐ NEW: Product sync destinations
    productSyncConfig?: ProductSyncConfig
  }
  features: {
    orderSync: boolean
    productSync: boolean
    inventorySync: boolean
    fulfillmentSync: boolean
  }
  // ✅ Flexible warehouse routing for e-commerce orders
  routingConfig?: EcommerceWarehouseConfig

  // ✅ Inventory management fields (stored at root level in DB)
  managesInventory?: boolean
  inventorySync?: boolean
  syncDirection?: SyncDirection
  syncFrequency?: string
}

export interface WooCommerceIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'WooCommerce'
  config: {
    storeUrl: string
    consumerKey: string
    consumerSecret: string
    // Product import configuration stored in config
    productImport?: {
      mode: ProductImportMode
      primaryWarehouseId?: string
    }
    // ⭐ NEW: Product sync destinations
    productSyncConfig?: ProductSyncConfig
  }
  // ✅ Flexible warehouse routing for e-commerce orders
  routingConfig?: EcommerceWarehouseConfig

  // ✅ Inventory management fields (stored at root level in DB)
  managesInventory?: boolean
  inventorySync?: boolean
  syncDirection?: SyncDirection
  syncFrequency?: string
}

export interface EtsyIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'Etsy'
  config: {
    apiKey: string
    sharedSecret: string
    // Product import configuration stored in config
    productImport?: {
      mode: ProductImportMode
      primaryWarehouseId?: string
    }
    // ⭐ NEW: Product sync destinations
    productSyncConfig?: ProductSyncConfig
  }
  // ✅ Flexible warehouse routing for e-commerce orders
  routingConfig?: EcommerceWarehouseConfig

  // ✅ Inventory management fields (stored at root level in DB)
  managesInventory?: boolean
  inventorySync?: boolean
  syncDirection?: SyncDirection
  syncFrequency?: string
}

export interface EbayIntegration extends BaseIntegration {
  type: 'ecommerce'
  name: 'eBay'
  config: {
    appId: string
    certId: string
    devId: string
    token: string
    // Product import configuration stored in config
    productImport?: {
      mode: ProductImportMode
      primaryWarehouseId?: string
    }
    // ⭐ NEW: Product sync destinations
    productSyncConfig?: ProductSyncConfig
  }
  // ✅ Flexible warehouse routing for e-commerce orders
  routingConfig?: EcommerceWarehouseConfig

  // ✅ Inventory management fields (stored at root level in DB)
  managesInventory?: boolean
  inventorySync?: boolean
  syncDirection?: SyncDirection
  syncFrequency?: string
}

// ============================================================================
// UNION TYPE & SETTINGS
// ============================================================================

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
  accountId: string
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract inventory config from an e-commerce integration
 * Combines config.productImport with root-level inventory fields
 */
export function getInventoryConfig(
  integration: ShopifyIntegration | WooCommerceIntegration | EtsyIntegration | EbayIntegration
): EcommerceInventoryConfig {
  return {
    productImport: integration.config.productImport || {
      mode: 'products_only',
      primaryWarehouseId: undefined
    },
    managesInventory: integration.managesInventory || false,
    syncDirection: integration.syncDirection || 'manual'
  }
}

/**
 * Update an integration with new inventory config
 * Splits config into config.productImport and root-level fields
 */
export function setInventoryConfig<T extends ShopifyIntegration | WooCommerceIntegration | EtsyIntegration | EbayIntegration>(
  integration: T,
  inventoryConfig: EcommerceInventoryConfig
): T {
  return {
    ...integration,
    config: {
      ...integration.config,
      productImport: inventoryConfig.productImport
    },
    managesInventory: inventoryConfig.managesInventory,
    syncDirection: inventoryConfig.syncDirection
  }
}

/**
 * ⭐ NEW: Get target warehouses for product sync based on configuration
 * Used by backend to determine which warehouses should receive synced products
 */
export function getProductSyncTargetWarehouses(
  productSyncConfig: ProductSyncConfig | undefined,
  warehouseConfig: EcommerceWarehouseConfig | undefined
): string[] {
  const targetWarehouses: string[] = []

  // Fallback if no configs provided
  if (!warehouseConfig) {
    return []
  }

  if (!productSyncConfig) {
    // Default to primary warehouse only
    if (warehouseConfig.primaryWarehouseId) {
      return [warehouseConfig.primaryWarehouseId]
    }
    return []
  }

  const mode = productSyncConfig.mode || 'primary_only'

  switch (mode) {
    case 'all_routing_warehouses':
      // Include primary warehouse
      if (warehouseConfig.primaryWarehouseId) {
        targetWarehouses.push(warehouseConfig.primaryWarehouseId)
      }
      // Include fallback warehouse
      if (warehouseConfig.fallbackWarehouseId &&
          !targetWarehouses.includes(warehouseConfig.fallbackWarehouseId)) {
        targetWarehouses.push(warehouseConfig.fallbackWarehouseId)
      }
      // Include all warehouses from advanced assignments
      if (warehouseConfig.mode === 'advanced' && warehouseConfig.assignments) {
        warehouseConfig.assignments.forEach(assignment => {
          if (assignment.isActive && !targetWarehouses.includes(assignment.warehouseId)) {
            targetWarehouses.push(assignment.warehouseId)
          }
        })
      }
      break

    case 'specific_warehouses':
      // Use user-selected warehouses
      if (productSyncConfig.selectedWarehouseIds && productSyncConfig.selectedWarehouseIds.length > 0) {
        return productSyncConfig.selectedWarehouseIds
      }
      // Fallback to primary if no selection
      if (warehouseConfig.primaryWarehouseId) {
        return [warehouseConfig.primaryWarehouseId]
      }
      break

    case 'primary_only':
    default:
      // Only primary warehouse
      if (warehouseConfig.primaryWarehouseId) {
        return [warehouseConfig.primaryWarehouseId]
      }
      break
  }

  return targetWarehouses
}

// ============================================================================
// RE-EXPORT US GEOGRAPHY DATA FOR CONVENIENCE
// ============================================================================

// Re-export constants from shared utils for backward compatibility
export { US_STATES, US_REGIONS } from '@/app/dashboard/shared/utils/usStates'

// Re-export types from shared utils for backward compatibility
export type { USState, USRegion } from '@/app/dashboard/shared/utils/usStates'
