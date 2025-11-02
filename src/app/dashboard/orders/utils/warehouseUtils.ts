//file path: src/app/dashboard/orders/utils/warehouseUtils.ts

import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import { Store } from '../../stores/utils/storeTypes'
import { Order } from './orderTypes'

/**
 * Get warehouse name from warehouse ID
 * Returns current warehouse name, or fallback if not found
 */
export function getWarehouseName(
  warehouseId: string | undefined,
  warehouses: Warehouse[]
): string {
  if (!warehouseId) return '-'

  const warehouse = warehouses.find(w => w.id === warehouseId)
  return warehouse?.name || 'Unknown Warehouse'
}

/**
 * Get store name from store ID
 * Returns current store name, or fallback if not found
 */
export function getStoreName(
  storeId: string | undefined,
  stores: Store[]
): string {
  if (!storeId) return 'Unknown Store'

  const store = stores.find(s => s.id === storeId)
  return store?.storeName || 'Unknown Store'
}

/**
 * Enrich a single order with current warehouse and store names
 * This ensures names are always up-to-date from their respective sources
 */
export function enrichOrderWithNames(
  order: Order,
  warehouses: Warehouse[],
  stores: Store[]
): Order & { warehouseName: string; storeName: string } {
  return {
    ...order,
    warehouseName: getWarehouseName(order.warehouseId, warehouses),
    storeName: getStoreName(order.storeId, stores)
  }
}

/**
 * Enrich multiple orders with current warehouse and store names
 * This ensures all names are always up-to-date
 */
export function enrichOrdersWithNames(
  orders: Order[],
  warehouses: Warehouse[],
  stores: Store[]
): (Order & { warehouseName: string; storeName: string })[] {
  return orders.map(order => enrichOrderWithNames(order, warehouses, stores))
}
