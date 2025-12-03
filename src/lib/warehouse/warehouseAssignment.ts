//file path: src/lib/warehouse/warehouseAssignment.ts

import { EcommerceWarehouseConfig, WarehouseAssignment } from '@/app/dashboard/integrations/types/integrationTypes'
import { Order } from '@/app/dashboard/orders/utils/orderTypes'

/**
 * ✅ CORRECTED ARCHITECTURE
 *
 * Warehouse routing is configured on INTEGRATIONS, not stores.
 * This utility accepts warehouse configuration directly from integrations.
 *
 * Typical usage:
 * 1. Order comes from Shopify webhook
 * 2. Get Shopify integration config (has warehouseConfig)
 * 3. Call findBestWarehouse() with integration's warehouseConfig
 * 4. Assign warehouse to order
 */

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
 * Find the best warehouse for an order based on shipping address and integration configuration
 *
 * Logic:
 * 1. If no warehouse config or mode is simple:
 *    - Use primaryWarehouseId if order meets criteria
 *    - Fall back to fallbackWarehouseId
 * 2. If mode is advanced with region routing:
 *    a. Find warehouses assigned to the shipping state (sorted by priority)
 *    b. If multiple warehouses match, use highest priority (lowest number)
 *    c. If no warehouse matches the state, fall back to primary warehouse
 *
 * @param shippingState - The state/province code from the shipping address
 * @param shippingCountryCode - The country code from the shipping address
 * @param warehouseConfig - The warehouse configuration from the integration
 * @param integrationName - Name of integration (for logging)
 * @returns The warehouse ID to assign, or undefined if no warehouse configured
 */
export function findBestWarehouse(
  shippingState: string,
  shippingCountryCode: string,
  warehouseConfig?: EcommerceWarehouseConfig,
  integrationName: string = 'Unknown'
): string | undefined {
  // No warehouse configuration
  if (!warehouseConfig) {
    console.warn(`[Warehouse Assignment] No warehouse config for integration: ${integrationName}`)
    return undefined
  }

  const { mode, primaryWarehouseId, fallbackWarehouseId, enableRegionRouting, assignments } = warehouseConfig

  // Simple mode or region routing is disabled
  if (mode === 'simple' || !enableRegionRouting || !assignments || assignments.length === 0) {
    console.log(`[Warehouse Assignment] Simple mode or no region routing - using primary: ${primaryWarehouseId}`)
    return primaryWarehouseId || fallbackWarehouseId
  }

  // Advanced mode with region routing
  // Normalize the shipping state code
  const normalizedState = normalizeStateCode(shippingState)

  if (!normalizedState) {
    console.warn(`[Warehouse Assignment] No shipping state provided, using primary: ${primaryWarehouseId}`)
    return primaryWarehouseId || fallbackWarehouseId
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

  // No warehouse found for this region - use primary or fallback
  console.log(`[Warehouse Assignment] No warehouse found for ${normalizedState}, ${shippingCountryCode} - using primary: ${primaryWarehouseId}`)
  return primaryWarehouseId || fallbackWarehouseId
}

/**
 * ✅ Assign warehouse to an order based on shipping address and integration config
 *
 * This function should be called from integration webhooks (Shopify, WooCommerce, etc.)
 * with the integration's warehouse configuration.
 *
 * @param order - The order to assign warehouse to
 * @param warehouseConfig - The warehouse configuration from the integration
 * @param integrationName - Name of the integration (for logging)
 * @returns The order with warehouseId assigned
 */
export function assignWarehouseToOrder(
  order: Order,
  warehouseConfig?: EcommerceWarehouseConfig,
  integrationName: string = 'Unknown'
): Order {
  console.log(`[Warehouse Assignment] Assigning warehouse for order ${order.id}`)
  console.log(`[Warehouse Assignment] Integration: ${integrationName}`)

  if (!warehouseConfig) {
    console.warn(`[Warehouse Assignment] ⚠️ No warehouse config provided for ${integrationName}`)
    console.warn(`[Warehouse Assignment] ⚠️ Order ${order.id} will have no warehouse assigned`)
    return order
  }

  // Extract shipping info from order
  const shippingState = order.shippingProvince || order.shippingAddress1?.split(',')[1]?.trim() || ''
  const shippingCountryCode = order.shippingCountryCode || 'US'

  console.log(`[Warehouse Assignment] Shipping address: ${shippingState}, ${shippingCountryCode}`)

  // Find best warehouse
  const warehouseId = findBestWarehouse(
    shippingState,
    shippingCountryCode,
    warehouseConfig,
    integrationName
  )

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
}

/**
 * ✅ Batch assign warehouses to multiple orders
 *
 * @param orders - Array of orders to assign warehouses to
 * @param warehouseConfig - The warehouse configuration from the integration
 * @param integrationName - Name of the integration (for logging)
 * @returns Array of orders with warehouses assigned
 */
export function assignWarehousesToOrders(
  orders: Order[],
  warehouseConfig?: EcommerceWarehouseConfig,
  integrationName: string = 'Unknown'
): Order[] {
  console.log(`[Warehouse Assignment] Batch assigning warehouses for ${orders.length} orders`)

  return orders.map(order => assignWarehouseToOrder(order, warehouseConfig, integrationName))
}

/**
 * ✅ Re-assign warehouse to existing order
 * Useful when warehouse config changes or order shipping address is updated
 *
 * @param order - The order to re-assign
 * @param warehouseConfig - The updated warehouse configuration
 * @param integrationName - Name of the integration (for logging)
 * @returns The order with updated warehouseId
 */
export function reassignOrderWarehouse(
  order: Order,
  warehouseConfig?: EcommerceWarehouseConfig,
  integrationName: string = 'Unknown'
): Order {
  return assignWarehouseToOrder(order, warehouseConfig, integrationName)
}

/**
 * ✅ Helper: Get warehouse config from integration
 * Use this in your webhook handlers to extract the config before calling assignment functions
 *
 * Example usage in Shopify webhook:
 * ```typescript
 * const shopifyIntegration = await getShopifyIntegration(storeId)
 * const warehouseConfig = getWarehouseConfigFromIntegration(shopifyIntegration)
 * const orderWithWarehouse = assignWarehouseToOrder(order, warehouseConfig, 'Shopify')
 * ```
 */
export function getWarehouseConfigFromIntegration(integration: any): EcommerceWarehouseConfig | undefined {
  if (!integration) return undefined

  // E-commerce integrations have warehouseConfig
  if (integration.type === 'ecommerce') {
    return integration.warehouseConfig
  }

  // Shipping integrations use single warehouse
  if (integration.type === 'shipping' && integration.warehouseId) {
    // Convert shipping integration's single warehouse to simple mode config
    return {
      mode: 'simple',
      primaryWarehouseId: integration.warehouseId,
      enableRegionRouting: false,
      assignments: []
    }
  }

  return undefined
}
