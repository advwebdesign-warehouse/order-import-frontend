// app/dashboard/shared/components/WarehouseSelector.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, ArchiveBoxIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

interface Warehouse {
  id: string
  name: string
  code: string
  isDefault: boolean
  status: 'active' | 'inactive'
  productCount?: number
}

interface WarehouseSelectorProps {
  warehouses: Warehouse[]
  selectedWarehouseId: string
  onWarehouseChange: (warehouseId: string) => void
  showProductCount?: boolean
  className?: string
  disabled?: boolean
}

export default function WarehouseSelector({
  warehouses,
  selectedWarehouseId,
  onWarehouseChange,
  showProductCount = true,
  className = '',
  disabled = false
}: WarehouseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Get active warehouses only
  const activeWarehouses = warehouses.filter(w => w.status === 'active')

  // Find selected warehouse
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId)

  // If no warehouse is selected or selected warehouse doesn't exist, show "All Warehouses"
  const displayText = selectedWarehouse
    ? selectedWarehouse.name
    : selectedWarehouseId === ''
    ? 'All Warehouses'
    : 'Select Warehouse'

  const handleWarehouseSelect = (warehouseId: string) => {
    onWarehouseChange(warehouseId)
    setIsOpen(false)
  }

  if (activeWarehouses.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No warehouses available
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative w-full cursor-pointer rounded-md border-0 bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center">
          <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <span className="block truncate">
            {displayText}
            {selectedWarehouse?.isDefault && (
              <StarIcon className="inline h-4 w-4 text-yellow-500 ml-1" />
            )}
          </span>
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {/* All Warehouses Option */}
          <div
            onClick={() => handleWarehouseSelect('')}
            className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 ${
              selectedWarehouseId === '' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center">
              <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-medium">All Warehouses</span>
                <span className="block text-xs text-gray-500">
                  View products from all warehouses
                </span>
              </div>
            </div>
            {selectedWarehouseId === '' && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>

          {/* Individual Warehouses */}
          {activeWarehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              onClick={() => handleWarehouseSelect(warehouse.id)}
              className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 ${
                selectedWarehouseId === warehouse.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <BuildingOffice2Icon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="block font-medium truncate">{warehouse.name}</span>
                    {warehouse.isDefault && (
                      <StarIcon className="h-4 w-4 text-yellow-500 ml-1 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="font-mono">{warehouse.code}</span>
                    {showProductCount && warehouse.productCount !== undefined && (
                      <span className="ml-2">
                        {warehouse.productCount} product{warehouse.productCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {selectedWarehouseId === warehouse.id && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
