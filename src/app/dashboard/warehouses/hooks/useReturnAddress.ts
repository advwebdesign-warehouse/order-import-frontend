//file path: app/dashboard/warehouses/hooks/useReturnAddress.ts

import { Warehouse, WarehouseAddress } from '../utils/warehouseTypes'
import { replaceAddressVariables, AddressVariables } from '../utils/addressVariables'
import { Order } from '../../orders/utils/orderTypes' // ✅ Import instead of duplicate

/**
 * Get the return address for a warehouse, with variables replaced
 */
export function getReturnAddressForOrder(
  warehouse: Warehouse,
  order?: Order
): WarehouseAddress & { displayName: string } {
  // Determine which address to use
  const baseAddress = warehouse.useDifferentReturnAddress && warehouse.returnAddress
    ? warehouse.returnAddress
    : warehouse.address

  // If no order or no template variables, return as-is
  if (!order || !baseAddress.name || !baseAddress.name.includes('[')) {
    return {
      ...baseAddress,
      displayName: baseAddress.name || warehouse.name
    }
  }

  // ✅ UPDATED: Replace variables with order data (removed shopName)
  const variables: AddressVariables = {
    shop: order.storeName || 'Unknown Store',
    warehouse: warehouse.name,
    code: warehouse.code,
    platform: order.platform
  }

  const displayName = replaceAddressVariables(baseAddress.name, variables)

  return {
    ...baseAddress,
    name: displayName, // Updated with replaced variables
    displayName
  }
}

/**
 * Hook to get return address for an order
 */
export function useReturnAddress(warehouse: Warehouse, order?: Order) {
  return getReturnAddressForOrder(warehouse, order)
}
