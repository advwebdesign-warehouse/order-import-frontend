//file path: src/app/dashboard/integrations/components/EcommerceProductSyncDestinations.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CubeIcon,
  BuildingOffice2Icon,
  InformationCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import {
  EcommerceWarehouseConfig,
  ProductSyncConfig,
  ProductSyncMode
} from '../types/integrationTypes'

interface EcommerceProductSyncDestinationsProps {
  productSyncConfig: ProductSyncConfig
  warehouseConfig: EcommerceWarehouseConfig
  warehouses: Warehouse[]
  integrationName: string
  onChange: (config: ProductSyncConfig) => void
}

const SYNC_MODES: { id: ProductSyncMode; name: string; description: string }[] = [
  {
    id: 'all_routing_warehouses',
    name: 'All Warehouses in Routing',
    description: 'Products sync to all warehouses configured in your routing settings'
  },
  {
    id: 'primary_only',
    name: 'Primary Warehouse Only',
    description: 'Products only sync to the primary warehouse'
  },
  {
    id: 'specific_warehouses',
    name: 'Select Specific Warehouses',
    description: 'Choose exactly which warehouses receive synced products'
  }
]

export default function EcommerceProductSyncDestinations({
  productSyncConfig,
  warehouseConfig,
  warehouses,
  integrationName,
  onChange
}: EcommerceProductSyncDestinationsProps) {
  // Get warehouses from routing config
  const getRoutingWarehouses = useCallback((): string[] => {
    const warehouseIds: string[] = []

    // Always include primary
    if (warehouseConfig.primaryWarehouseId) {
      warehouseIds.push(warehouseConfig.primaryWarehouseId)
    }

    // Include fallback if set
    if (warehouseConfig.fallbackWarehouseId &&
        !warehouseIds.includes(warehouseConfig.fallbackWarehouseId)) {
      warehouseIds.push(warehouseConfig.fallbackWarehouseId)
    }

    // Include all from assignments (advanced mode)
    if (warehouseConfig.mode === 'advanced' && warehouseConfig.assignments) {
      warehouseConfig.assignments.forEach(assignment => {
        if (assignment.isActive && !warehouseIds.includes(assignment.warehouseId)) {
          warehouseIds.push(assignment.warehouseId)
        }
      })
    }

    return warehouseIds
  }, [warehouseConfig])

  // Calculate target warehouses based on mode
  const getTargetWarehouses = useCallback((): string[] => {
    switch (productSyncConfig.mode) {
      case 'all_routing_warehouses':
        return getRoutingWarehouses()
      case 'primary_only':
        return warehouseConfig.primaryWarehouseId ? [warehouseConfig.primaryWarehouseId] : []
      case 'specific_warehouses':
        return productSyncConfig.selectedWarehouseIds || []
      default:
        return warehouseConfig.primaryWarehouseId ? [warehouseConfig.primaryWarehouseId] : []
    }
  }, [productSyncConfig, warehouseConfig, getRoutingWarehouses])

  const handleModeChange = (mode: ProductSyncMode) => {
    const newConfig: ProductSyncConfig = {
      ...productSyncConfig,
      mode,
      // Reset specific warehouses when changing mode
      selectedWarehouseIds: mode === 'specific_warehouses'
        ? productSyncConfig.selectedWarehouseIds || [warehouseConfig.primaryWarehouseId || '']
        : undefined
    }
    onChange(newConfig)
  }

  const handleWarehouseToggle = (warehouseId: string) => {
    const currentSelected = productSyncConfig.selectedWarehouseIds || []
    const isSelected = currentSelected.includes(warehouseId)

    let newSelected: string[]
    if (isSelected) {
      // Don't allow deselecting the last warehouse
      if (currentSelected.length <= 1) return
      newSelected = currentSelected.filter(id => id !== warehouseId)
    } else {
      newSelected = [...currentSelected, warehouseId]
    }

    onChange({
      ...productSyncConfig,
      selectedWarehouseIds: newSelected
    })
  }

  const targetWarehouses = getTargetWarehouses()
  const routingWarehouses = getRoutingWarehouses()

  // Get warehouse display info
  const getWarehouseInfo = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId)
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 flex items-center">
          <CubeIcon className="h-5 w-5 mr-2 text-gray-500" />
          Product Sync Destinations
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Choose which warehouses will receive products imported from {integrationName}
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        {SYNC_MODES.map((mode) => {
          const isSelected = productSyncConfig.mode === mode.id
          const isDisabled = mode.id === 'all_routing_warehouses' && routingWarehouses.length <= 1

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => !isDisabled && handleModeChange(mode.id)}
              disabled={isDisabled}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                  : isSelected
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected && !isDisabled
                      ? 'border-indigo-600'
                      : 'border-gray-300'
                  }`}>
                    {isSelected && !isDisabled && (
                      <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    )}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      isSelected && !isDisabled ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {mode.name}
                    </p>
                    {mode.id === 'all_routing_warehouses' && routingWarehouses.length > 1 && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {mode.description}
                  </p>

                  {/* Show warehouse count for "all routing warehouses" mode */}
                  {mode.id === 'all_routing_warehouses' && (
                    <p className="mt-2 text-xs text-indigo-600">
                      {routingWarehouses.length} warehouse{routingWarehouses.length !== 1 ? 's' : ''} in routing
                      {isDisabled && ' (need at least 2 warehouses)'}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Specific Warehouse Selection */}
      {productSyncConfig.mode === 'specific_warehouses' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Warehouses
          </label>
          <div className="space-y-2">
            {warehouses.map((warehouse) => {
              const isSelected = (productSyncConfig.selectedWarehouseIds || []).includes(warehouse.id)
              const isOnlySelected = isSelected && (productSyncConfig.selectedWarehouseIds || []).length === 1

              return (
                <button
                  key={warehouse.id}
                  type="button"
                  onClick={() => handleWarehouseToggle(warehouse.id)}
                  disabled={isOnlySelected}
                  className={`w-full flex items-center p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${isOnlySelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>
                  <div className="ml-3 flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{warehouse.name}</p>
                    <p className="text-xs text-gray-500">
                      {warehouse.address?.city}, {warehouse.address?.state}
                    </p>
                  </div>
                  {warehouse.id === warehouseConfig.primaryWarehouseId && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Primary
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {(productSyncConfig.selectedWarehouseIds || []).length === 1 && (
            <p className="mt-2 text-xs text-gray-500">
              At least one warehouse must be selected
            </p>
          )}
        </div>
      )}

      {/* Target Warehouses Summary */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <p className="text-sm font-medium text-blue-800">
              Products will sync to {targetWarehouses.length} warehouse{targetWarehouses.length !== 1 ? 's' : ''}:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {targetWarehouses.map(warehouseId => {
                const warehouse = getWarehouseInfo(warehouseId)
                return (
                  <span
                    key={warehouseId}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <BuildingOffice2Icon className="h-3 w-3 mr-1" />
                    {warehouse?.name || 'Unknown'}
                  </span>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Primary warehouse receives Shopify quantities. Other warehouses start at 0.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
