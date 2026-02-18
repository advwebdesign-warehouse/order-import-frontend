//file path: app/dashboard/products/components/MoveToWarehouseModal.tsx

'use client'

import { useState, useMemo } from 'react'
import { Product } from '../utils/productTypes'

interface Warehouse {
  id: string
  name: string
  code?: string
  status?: string
}

interface EcommerceIntegration {
  id: string
  name: string
  routingConfig?: {
    mode: 'simple' | 'advanced'
    primaryWarehouseId?: string
    fallbackWarehouseId?: string
    assignments?: Array<{
      warehouseId: string
      isActive: boolean
    }>
  }
}

interface MoveToWarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (destinationWarehouseId: string) => void
  productsToMove: Product[]
  sourceWarehouseId: string
  sourceWarehouseName: string
  warehouses: Warehouse[]
  ecommerceIntegrations: EcommerceIntegration[]
  isMoving: boolean
}

export default function MoveToWarehouseModal({
  isOpen,
  onClose,
  onConfirm,
  productsToMove,
  sourceWarehouseId,
  sourceWarehouseName,
  warehouses,
  ecommerceIntegrations,
  isMoving
}: MoveToWarehouseModalProps) {
  const [selectedDestination, setSelectedDestination] = useState('')

  // ✅ Get all warehouse IDs linked to integrations that are associated with the selected products
  const eligibleWarehouses = useMemo(() => {
    // Collect integration IDs from the products being moved
    const productIntegrationIds = new Set(
      productsToMove
        .map(p => p.integrationId)
        .filter(Boolean)
    )

    // Collect all warehouse IDs linked to those integrations via routingConfig
    const linkedWarehouseIds = new Set<string>()

    ecommerceIntegrations.forEach(integration => {
      // Only consider integrations that our products belong to
      if (!productIntegrationIds.has(integration.id)) return

      const rc = integration.routingConfig
      if (!rc) return

      if (rc.primaryWarehouseId) linkedWarehouseIds.add(rc.primaryWarehouseId)
      if (rc.fallbackWarehouseId) linkedWarehouseIds.add(rc.fallbackWarehouseId)

      if (rc.mode === 'advanced' && rc.assignments) {
        rc.assignments.forEach(a => {
          if (a.isActive) linkedWarehouseIds.add(a.warehouseId)
        })
      }
    })

    // Filter warehouses: must be linked AND not be the source warehouse
    return warehouses.filter(w =>
      linkedWarehouseIds.has(w.id) && w.id !== sourceWarehouseId
    )
  }, [productsToMove, ecommerceIntegrations, warehouses, sourceWarehouseId])

  // Reset selection when modal opens/closes
  if (!isOpen) return null

  const handleConfirm = () => {
    if (!selectedDestination) return
    onConfirm(selectedDestination)
  }

  const selectedDestinationWarehouse = warehouses.find(w => w.id === selectedDestination)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={!isMoving ? onClose : undefined}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="sm:flex sm:items-start">
            {/* Icon */}
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>

            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-lg font-semibold leading-6 text-gray-900">
                Move to Warehouse
              </h3>

              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Move {productsToMove.length} product{productsToMove.length > 1 ? 's' : ''} from{' '}
                  <strong>{sourceWarehouseName}</strong> to another warehouse.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Inventory will be transferred. Products will be removed from the source warehouse.
                </p>
              </div>

              {/* Product list preview (up to 5) */}
              {productsToMove.length > 0 && (
                <div className="mt-3 bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 mb-1">Products:</p>
                  {productsToMove.slice(0, 5).map(product => (
                    <div key={product.id} className="text-xs text-gray-700 truncate">
                      • {product.name} <span className="text-gray-400">({product.sku})</span>
                    </div>
                  ))}
                  {productsToMove.length > 5 && (
                    <p className="text-xs text-gray-400 mt-1">
                      ...and {productsToMove.length - 5} more
                    </p>
                  )}
                </div>
              )}

              {/* Destination warehouse selector */}
              <div className="mt-4">
                <label htmlFor="destination-warehouse" className="block text-sm font-medium text-gray-700">
                  Destination Warehouse
                </label>
                {eligibleWarehouses.length > 0 ? (
                  <select
                    id="destination-warehouse"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    disabled={isMoving}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a warehouse...</option>
                    {eligibleWarehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.code ? `(${warehouse.code})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="mt-1 rounded-md bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-xs text-yellow-700">
                      No other warehouses are linked to the integration(s) for these products.
                      Configure warehouse routing in your integration settings to enable moving products.
                    </p>
                  </div>
                )}
              </div>

              {/* Info about what happens */}
              {selectedDestination && (
                <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-700">
                    <strong>What happens:</strong> Inventory for {productsToMove.length} product{productsToMove.length > 1 ? 's' : ''} will
                    be moved from <strong>{sourceWarehouseName}</strong> to{' '}
                    <strong>{selectedDestinationWarehouse?.name}</strong>.
                    Existing inventory at the destination will have the moved quantity added to it.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDestination || isMoving}
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMoving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Moving...
                </>
              ) : (
                'Move Products'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isMoving}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
