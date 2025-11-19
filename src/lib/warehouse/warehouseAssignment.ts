//file path: src/lib/warehouse/warehouseAssignment.ts

import { Store, WarehouseAssignment } from '@/app/dashboard/stores/utils/storeTypes'
import { Order } from '@/app/dashboard/orders/utils/orderTypes'
import { storeApi } from '@/app/services/storeApi'

/**
 * Normalize state code to 2-letter uppercase format
 * Handles various inputs like "California", "CA", "ca"
 */
function normalizeStateCode(state: string): string {
  if (!state) return ''

  // If already 2 letters, just uppercase
  if (state.length === 2) {
    return state.toUpperCase()
  }

  // State name to code mapping
  const STATE_CODES: Record<string, string> = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
    'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
    'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
    'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
    'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
    'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI', 'WYOMING': 'WY'
  }

  return STATE_CODES[state.toUpperCase()] || state.toUpperCase()
}

/**
 * Find the best warehouse for an order based on shipping address and store configuration
 *
 * Logic:
 * 1. If region routing is disabled, use default warehouse
 * 2. If region routing is enabled:
 *    a. Find warehouses assigned to the shipping state (sorted by priority)
 *    b. If multiple warehouses match, use highest priority (lowest number)
 *    c. If no warehouse matches the state, fall back to default warehouse
 *
 * @param shippingState - The state/province code from the shipping address
 * @param shippingCountryCode - The country code from the shipping address
 * @param store - The store configuration with warehouse assignments
 * @returns The warehouse ID to assign, or undefined if no warehouse configured
 */
export function findBestWarehouse(
  shippingState: string,
  shippingCountryCode: string,
  store: Store
): string | undefined {
  // No warehouse configuration
  if (!store.warehouseConfig) {
    console.warn(`[Warehouse Assignment] No warehouse config for store: ${store.storeName}`)
    return undefined
  }

  const { defaultWarehouseId, enableRegionRouting, assignments } = store.warehouseConfig

  // Region routing is disabled - use default warehouse
  if (!enableRegionRouting || !assignments || assignments.length === 0) {
    console.log(`[Warehouse Assignment] Region routing disabled, using default: ${defaultWarehouseId}`)
    return defaultWarehouseId
  }

  // Normalize the shipping state code
  const normalizedState = normalizeStateCode(shippingState)

  if (!normalizedState) {
    console.warn(`[Warehouse Assignment] No shipping state provided, using default: ${defaultWarehouseId}`)
    return defaultWarehouseId
  }

  console.log(`[Warehouse Assignment] Looking for warehouse for state: ${normalizedState}, country: ${shippingCountryCode}`)

  // Find all warehouses that serve this state and country
  const matchingWarehouses = assignments
    .filter(assignment => {
      if (!assignment.isActive) return false

      // Check if this warehouse serves the country and state
      return assignment.regions.some(region => {
        const matchesCountry = region.countryCode === shippingCountryCode
        const matchesState = region.states.includes(normalizedState)

        return matchesCountry && matchesState
      })
    })
    .sort((a, b) => a.priority - b.priority) // Sort by priority (lower number = higher priority)

  if (matchingWarehouses.length > 0) {
    const selectedWarehouse = matchingWarehouses[0]
    console.log(`[Warehouse Assignment] ✅ Found warehouse: ${selectedWarehouse.warehouseName} (Priority: ${selectedWarehouse.priority})`)
    return selectedWarehouse.warehouseId
  }

  // No warehouse found for this region - use default
  console.log(`[Warehouse Assignment] No warehouse found for ${normalizedState}, ${shippingCountryCode} - using default: ${defaultWarehouseId}`)
  return defaultWarehouseId
}

/**
 * ✅ Assign warehouse to an order based on shipping address
 *
 * Account security: API automatically scopes to authenticated user's account via JWT token.
 * Backend ensures one account cannot access another account's stores.
 *
 * @param order - The order to assign warehouse to
 * @param storeId - The store ID (to fetch store configuration)
 * @returns The order with warehouseId assigned
 */
export async function assignWarehouseToOrder(
  order: Order,
  storeId: string
): Promise<Order> {
  console.log(`[Warehouse Assignment] Assigning warehouse for order ${order.id}`)
  console.log(`[Warehouse Assignment] Store ID: ${storeId}`)

  try {
    // ✅ Fetch store configuration from API instead of localStorage
    const store = await storeApi.getStoreById(storeId)

    if (!store) {
      console.error(`[Warehouse Assignment] ❌ Store not found: ${storeId}`)
      console.warn(`[Warehouse Assignment] ⚠️ Order ${order.id} will have no warehouse assigned`)
      return order
    }

    console.log(`[Warehouse Assignment] ✅ Found store: ${store.storeName}`)

    // Extract shipping info from order
    const shippingState = order.shippingProvince || order.shippingAddress1?.split(',')[1]?.trim() || ''
    const shippingCountryCode = order.shippingCountryCode || 'US'

    console.log(`[Warehouse Assignment] Shipping address: ${shippingState}, ${shippingCountryCode}`)

    // Find best warehouse
    const warehouseId = findBestWarehouse(shippingState, shippingCountryCode, store)

    if (warehouseId) {
      console.log(`[Warehouse Assignment] ✅ Assigned warehouse: ${warehouseId} to order ${order.id}`)
    } else {
      console.warn(`[Warehouse Assignment] ⚠️ No warehouse assigned to order ${order.id}`)
    }

    // Assign warehouse to order
    return {
      ...order,
      warehouseId
    }
  } catch (error) {
    console.error(`[Warehouse Assignment] ❌ Error fetching store or assigning warehouse:`, error)
    console.warn(`[Warehouse Assignment] ⚠️ Order ${order.id} will have no warehouse assigned`)
    return order
  }
}

/**
 * ✅ UPDATED: Batch assign warehouses to multiple orders
 * Now async and uses API instead of localStorage
 *
 * @param orders - Array of orders to assign warehouses to
 * @param storeId - The store ID
 * @returns Array of orders with warehouses assigned
 */
export async function assignWarehousesToOrders(
  orders: Order[],
  storeId: string
): Promise<Order[]> {
  console.log(`[Warehouse Assignment] Batch assigning warehouses for ${orders.length} orders`)

  // Process all orders in parallel for better performance
  const ordersWithWarehouses = await Promise.all(
    orders.map(order => assignWarehouseToOrder(order, storeId))
  )

  return ordersWithWarehouses
}

/**
 * ✅ Re-assign warehouse to existing order (useful when warehouse config changes)
 *
 * Account security: API automatically scopes to authenticated user's account via JWT token.
 *
 * @param order - The order to re-assign
 * @returns The order with updated warehouseId
 */
export async function reassignOrderWarehouse(
  order: Order
): Promise<Order> {
  if (!order.storeId) {
    console.error('[Warehouse Assignment] Order has no storeId')
    return order
  }

  return assignWarehouseToOrder(order, order.storeId)
}
