//file path: app/dashboard/shipping/components/AddressesTab.tsx

'use client'

import { useWarehouses } from '../../warehouses/hooks/useWarehouses'
import { BuildingOfficeIcon, MapPinIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import ReactCountryFlag from "react-country-flag"

interface AddressesTabProps {
  selectedWarehouseId: string
}

export default function AddressesTab({ selectedWarehouseId }: AddressesTabProps) {
  const { warehouses, loading } = useWarehouses()

  const activeWarehouses = warehouses.filter(w => w.status === 'active')
  const displayWarehouses = selectedWarehouseId
    ? activeWarehouses.filter(w => w.id === selectedWarehouseId)
    : activeWarehouses

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading addresses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">About Return Addresses</h3>
            <p className="text-sm text-blue-700 mt-1">
              Return addresses are managed in the Warehouses section. Each warehouse uses its physical
              address as the return address for shipping labels by default. You can configure a different
              return address when editing a warehouse if needed.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/warehouses'}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Go to Warehouses →
            </button>
          </div>
        </div>
      </div>

      {/* Warehouse Addresses Display */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Current Return Addresses
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          These are the addresses that will be used on shipping labels for returns
        </p>

        {displayWarehouses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No warehouses</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a warehouse to manage return addresses.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayWarehouses.map(warehouse => {
              // Determine which address to show
              const returnAddress = warehouse.useDifferentReturnAddress && warehouse.returnAddress
                ? warehouse.returnAddress
                : warehouse.address

              const isDifferent = warehouse.useDifferentReturnAddress && warehouse.returnAddress

              return (
                <div
                  key={warehouse.id}
                  className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:border-indigo-300 transition-colors"
                >
                  {/* Warehouse Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {warehouse.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">{warehouse.code}</p>
                      {isDifferent && warehouse.returnAddress?.name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Warehouse: {warehouse.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Address Type Badge */}
                  {isDifferent && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        Different Return Address
                      </span>
                    </div>
                  )}

                  {/* Address Details */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-start gap-2">
                      <ReactCountryFlag
                        countryCode={returnAddress.countryCode}
                        svg
                        style={{
                          width: '20px',
                          height: '14px',
                          marginTop: '2px'
                        }}
                        title={returnAddress.countryCode}
                      />
                      <div className="text-gray-700">
                        <p>{returnAddress.address1}</p>
                        {returnAddress.address2 && <p>{returnAddress.address2}</p>}
                        <p>{returnAddress.city}, {returnAddress.state} {returnAddress.zip}</p>
                        <p>{returnAddress.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {warehouse.contactInfo && (warehouse.contactInfo.phone || warehouse.contactInfo.email) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-xs text-gray-600">
                      {warehouse.contactInfo.phone && (
                        <p>📞 {warehouse.contactInfo.phone}</p>
                      )}
                      {warehouse.contactInfo.email && (
                        <p>✉️ {warehouse.contactInfo.email}</p>
                      )}
                    </div>
                  )}

                  {/* Edit Button */}
                  <div className="mt-4">
                    <button
                      onClick={() => window.location.href = `/dashboard/warehouses`}
                      className="w-full px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      Edit in Warehouses
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
