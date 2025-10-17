//file path: app/dashboard/orders/components/CreateShippingLabel.tsx

'use client'

import { useReturnAddress } from '../../warehouses/hooks/useReturnAddress'

interface CreateShippingLabelProps {
  order: any
  warehouses: any[]
}

/**
 * TODO: Implement CreateShippingLabel component
 * This component will handle creating shipping labels for orders
 */
export default function CreateShippingLabel({ order, warehouses }: CreateShippingLabelProps) {
  // Find the warehouse for this order
  const warehouse = warehouses.find(w => w.id === order.warehouseId)

  // Get the appropriate return address
  const returnAddress = useReturnAddress(warehouse, order)

  // TODO: Implement the actual shipping label creation UI
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium mb-2">Create Shipping Label</h3>
      <p className="text-sm text-gray-600">
        Shipping label creation coming soon...
      </p>

      {/* Debug info - remove in production */}
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
        <p>Return Address: {returnAddress.displayName}</p>
        <p>Address: {returnAddress.address1}, {returnAddress.city}</p>
      </div>
    </div>
  )
}
