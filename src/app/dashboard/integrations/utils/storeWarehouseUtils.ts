//file path: src/app/dashboard/integrations/utils/storeWarehouseUtils.ts

import { Store } from '@/app/dashboard/stores/utils/storeTypes'
import { storeApi } from '@/app/services/storeApi'

/**
 * ✅ CORRECTED ARCHITECTURE
 *
 * Warehouses are ACCOUNT-LEVEL resources, not store-specific.
 * Store objects do NOT have warehouseConfig.
 *
 * Warehouse configurations are on INTEGRATIONS:
 * - Shipping integrations: warehouseId (single warehouse)
 * - E-commerce integrations: warehouseConfig (simple or advanced routing)
 */

/**
 * Check if account has any warehouses available
 * (Warehouses are account-level, not store-specific)
 */
export async function checkAccountHasWarehouses(): Promise<boolean> {
  try {
    // TODO: Replace with actual warehouse API call
    // For now, return true (assume warehouses exist)
    // const warehouses = await warehouseApi.getWarehouses()
    // return warehouses.length > 0

    return true // Default to true until warehouse API is implemented
  } catch (error) {
    console.error('[checkAccountHasWarehouses] Error:', error)
    return false
  }
}

/**
 * ✅ UPDATED: Get store by ID and return basic info
 *
 * Note: Stores do NOT have warehouse configurations.
 * Use integration APIs to check warehouse routing for specific integrations.
 */
export async function checkStoreWarehouseById(
  storeId: string
): Promise<{
  store: Store | null
  hasWarehouses: boolean
  hasRegionRouting: boolean
}> {
  try {
    // Fetch store from API
    const store = await storeApi.getStoreById(storeId)

    // Check if account has warehouses (account-level check)
    const hasWarehouses = await checkAccountHasWarehouses()

    return {
      store,
      hasWarehouses,
      hasRegionRouting: false // Region routing is on integrations, not stores
    }
  } catch (error) {
    console.error('[checkStoreWarehouseById] Error fetching store:', error)
    return {
      store: null,
      hasWarehouses: false,
      hasRegionRouting: false
    }
  }
}

/**
 * Check if an integration has warehouse configuration
 * (Helper for checking integration-level warehouse setup)
 */
export function integrationHasWarehouseConfig(integration: any): boolean {
  if (!integration) return false

  // Shipping integrations: Check for warehouseId
  if (integration.type === 'shipping') {
    return !!integration.warehouseId
  }

  // E-commerce integrations: Check for warehouseConfig
  if (integration.type === 'ecommerce') {
    return !!integration.warehouseConfig
  }

  return false
}

/**
 * Check if an integration has region-based routing
 * (Only applicable to e-commerce integrations with advanced mode)
 */
export function integrationHasRegionRouting(integration: any): boolean {
  if (!integration || integration.type !== 'ecommerce') return false

  const config = integration.warehouseConfig
  if (!config) return false

  return (
    config.mode === 'advanced' &&
    config.enableRegionRouting &&
    config.assignments &&
    config.assignments.length > 0
  )
}

/**
 * Get warehouse configuration summary for an integration
 */
export function getIntegrationWarehouseSummary(integration: any): string {
  if (!integration) {
    return 'No configuration'
  }

  // Shipping integrations
  if (integration.type === 'shipping') {
    return integration.warehouseId
      ? 'Single warehouse configured'
      : 'No warehouse selected'
  }

  // E-commerce integrations
  if (integration.type === 'ecommerce') {
    const config = integration.warehouseConfig

    if (!config) {
      return 'No warehouse routing configured'
    }

    if (config.mode === 'simple') {
      const parts = []
      if (config.primaryWarehouseId) parts.push('Primary warehouse')
      if (config.fallbackWarehouseId) parts.push('fallback')
      return parts.length > 0 ? parts.join(' + ') : 'No warehouses selected'
    }

    if (config.mode === 'advanced') {
      const assignedWarehouses = config.assignments?.length || 0
      const totalStates = config.assignments?.reduce(
        (sum: number, a: any) => sum + a.regions.reduce((s: number, r: any) => s + r.states.length, 0),
        0
      ) || 0

      if (assignedWarehouses === 0) {
        return 'Advanced mode (no assignments)'
      }

      return `${assignedWarehouses} warehouse${assignedWarehouses !== 1 ? 's' : ''}, ${totalStates} state${totalStates !== 1 ? 's' : ''} assigned`
    }
  }

  return 'Unknown configuration'
}
