//file path: app/dashboard/warehouses/hooks/useReturnAddress.ts

import { Warehouse, WarehouseAddress } from '../utils/warehouseTypes'
import { replaceAddressVariables, AddressVariables } from '../utils/addressVariables'
import { Order } from '../../orders/utils/orderTypes' // ✅ Import instead of duplicate
import { Store } from '../../stores/utils/storeTypes'
import { getStoreName, getWarehouseName } from '../../orders/utils/warehouseUtils'

/**
 * Get the return address for a warehouse, with variables replaced
 */
export function getReturnAddressForOrder(
  warehouse: Warehouse | undefined,
  order?: Order,
  stores: Store[] = [],
  warehouses: Warehouse[] = []
): WarehouseAddress & { displayName: string } {
  // If no warehouse, return a default/empty address
  if (!warehouse) {
    return {
      name: 'Unknown Warehouse',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      countryCode: '',
      displayName: 'Unknown Warehouse'
    }
  }



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

  // ✅ UPDATED: Use storeId and warehouseId to look up names dynamically
  const storeName = getStoreName(order.storeId, stores)
  const warehouseName = order.warehouseId
    ? getWarehouseName(order.warehouseId, warehouses)
    : warehouse.name

  const variables: AddressVariables = {
    shop: storeName,
    warehouse: warehouseName,
    code: warehouse.code,
    platform: order.platform
  }

  const displayName = replaceAddressVariables(baseAddress.name, variables)

  return {
    ...baseAddress,
    name: displayName,
    displayName
  }
}

/**
 * Hook to get return address for an order
 */
export function useReturnAddress(
  warehouse: Warehouse | undefined,
  order?: Order,
  stores: Store[] = [],
  warehouses: Warehouse[] = []
) {
  return getReturnAddressForOrder(warehouse, order, stores, warehouses)
}
