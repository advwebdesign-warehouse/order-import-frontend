//file path: src/app/dashboard/integrations/utils/storeWarehouseUtils.ts

import { Store } from '@/app/dashboard/stores/utils/storeTypes'
import { getStoreById } from '@/app/dashboard/stores/utils/storeStorage'

/**
 * Check if a store has at least one warehouse assigned
 * Now checks for actual warehouse assignments, not just defaultWarehouseId
 */
export function storeHasWarehouses(store: Store | null): boolean {
  if (!store) return false

  // Check if warehouse config exists
  if (!store.warehouseConfig) return false

  // Check if warehouses are actually assigned
  if (store.warehouseConfig.assignments &&
      store.warehouseConfig.assignments.length > 0) {
    return true
  }

  // No warehouses found
  return false
}

/**
 * Check if a store has region-based routing configured
 */
export function storeHasRegionRouting(store: Store | null): boolean {
  if (!store || !store.warehouseConfig) return false

  return (
    store.warehouseConfig.enableRegionRouting &&
    store.warehouseConfig.assignments &&
    store.warehouseConfig.assignments.length > 0
  )
}

/**
 * Get store by ID and check if it has warehouses
 */
export function checkStoreWarehouseById(
  storeId: string,
  accountId?: string
): {
  store: Store | null
  hasWarehouses: boolean
  hasRegionRouting: boolean
} {
  const store = getStoreById(storeId, accountId)

  return {
    store,
    hasWarehouses: storeHasWarehouses(store),
    hasRegionRouting: storeHasRegionRouting(store)
  }
}

/**
 * Get warehouse configuration summary for display
 */
export function getWarehouseConfigSummary(store: Store | null): string {
  if (!store || !store.warehouseConfig) {
    return 'No warehouses configured'
  }

  const { defaultWarehouseId, enableRegionRouting, assignments } = store.warehouseConfig

  if (!enableRegionRouting || !assignments || assignments.length === 0) {
    return `Default warehouse only`
  }

  const assignedWarehouses = assignments.length
  const totalStates = assignments.reduce(
    (sum, a) => sum + a.regions.reduce((s, r) => s + r.states.length, 0),
    0
  )

  return `${assignedWarehouses} warehouse${assignedWarehouses !== 1 ? 's' : ''}, ${totalStates} state${totalStates !== 1 ? 's' : ''} assigned`
}
