//file path: app/dashboard/integrations/components/WarehouseSelector.tsx

'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, BuildingOffice2Icon } from '@heroicons/react/20/solid'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface Warehouse {
  id: string
  name: string
  code?: string
  city?: string
  state?: string
  address?: {
    city: string
    state: string
  }
}

interface WarehouseSelectorProps {
  warehouses: Warehouse[]
  selectedWarehouseId?: string
  onWarehouseChange: (warehouseId: string) => void
  label?: string
  helpText?: string
  required?: boolean
  error?: string
  disabled?: boolean
  className?: string
}

export default function WarehouseSelector({
  warehouses,
  selectedWarehouseId,
  onWarehouseChange,
  label = 'Warehouse',
  helpText,
  required = false,
  error,
  disabled = false,
  className = ''
}: WarehouseSelectorProps) {
  // Find selected warehouse
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId)

  // Empty state
  if (warehouses.length === 0) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                No warehouses available. Please create a warehouse first.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Listbox value={selectedWarehouseId || ''} onChange={onWarehouseChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-pointer rounded-md border-0 bg-white py-2.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ${
              error ? 'ring-red-300 focus:ring-red-500' : 'ring-gray-300 focus:ring-indigo-600'
            } focus:outline-none focus:ring-2 sm:text-sm sm:leading-6 ${
              disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''
            }`}
          >
            <span className="flex items-center">
              <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              <span className="block truncate">
                {selectedWarehouse ? (
                  <>
                    {selectedWarehouse.name}
                    {(selectedWarehouse.city || selectedWarehouse.address?.city) && (
                      <span className="text-gray-500 text-xs ml-2">
                        ({selectedWarehouse.city || selectedWarehouse.address?.city}, {selectedWarehouse.state || selectedWarehouse.address?.state})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500">Select warehouse...</span>
                )}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {warehouses.map((warehouse) => (
                <Listbox.Option
                  key={warehouse.id}
                  value={warehouse.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <BuildingOffice2Icon
                          className={`h-5 w-5 mr-2 flex-shrink-0 ${
                            active ? 'text-white' : 'text-gray-400'
                          }`}
                        />
                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {warehouse.name}
                        </span>
                        {(warehouse.city || warehouse.address?.city) && (
                          <span className={`ml-2 text-xs ${active ? 'text-indigo-200' : 'text-gray-500'}`}>
                            ({warehouse.city || warehouse.address?.city}, {warehouse.state || warehouse.address?.state})
                          </span>
                        )}
                      </div>

                      {selected && (
                        <span
                          className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                            active ? 'text-white' : 'text-indigo-600'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {/* Help Text */}
      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
