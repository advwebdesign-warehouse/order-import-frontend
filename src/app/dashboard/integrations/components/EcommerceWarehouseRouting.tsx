//file path: app/dashboard/integrations/components/EcommerceWarehouseRouting.tsx

'use client'

import { useState, useEffect } from 'react'
import { RadioGroup } from '@headlessui/react'
import {
  BuildingOffice2Icon,
  InformationCircleIcon,
  MapIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { EcommerceWarehouseConfig, WarehouseRoutingMode } from '../types/integrationTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import WarehouseSelector from './WarehouseSelector'
import AdvancedWarehouseRouting from './AdvancedWarehouseRouting'

interface EcommerceWarehouseRoutingProps {
  warehouseConfig: EcommerceWarehouseConfig | undefined
  warehouses: Warehouse[]
  onChange: (config: EcommerceWarehouseConfig) => void
}

const ROUTING_MODES: { id: WarehouseRoutingMode; name: string; description: string; icon: any }[] = [
  {
    id: 'simple',
    name: 'Simple Routing',
    description: 'Use a primary warehouse with optional fallback',
    icon: BuildingOffice2Icon
  },
  {
    id: 'advanced',
    name: 'Advanced Routing',
    description: 'Route orders based on customer location (region/state)',
    icon: MapIcon
  }
]

export default function EcommerceWarehouseRouting({
  warehouseConfig,
  warehouses,
  onChange
}: EcommerceWarehouseRoutingProps) {
  const [config, setConfig] = useState<EcommerceWarehouseConfig>(
    warehouseConfig || {
      mode: 'simple',
      primaryWarehouseId: warehouses[0]?.id || '',
      fallbackWarehouseId: undefined,
      enableRegionRouting: false,
      assignments: []
    }
  )

  // Sync changes to parent
  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  const handleModeChange = (mode: WarehouseRoutingMode) => {
    setConfig(prev => ({
      ...prev,
      mode,
      enableRegionRouting: mode === 'advanced'
    }))
  }

  const handlePrimaryWarehouseChange = (warehouseId: string) => {
    setConfig(prev => ({
      ...prev,
      primaryWarehouseId: warehouseId
    }))
  }

  const handleFallbackWarehouseChange = (warehouseId: string) => {
    setConfig(prev => ({
      ...prev,
      fallbackWarehouseId: warehouseId || undefined
    }))
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-500" />
          Warehouse Routing
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure how orders from this integration are routed to your warehouses
        </p>
      </div>

      {/* Mode Selector */}
      <RadioGroup value={config.mode} onChange={handleModeChange}>
        <RadioGroup.Label className="text-sm font-medium text-gray-700 mb-3 block">
          Routing Mode
        </RadioGroup.Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROUTING_MODES.map((mode) => (
            <RadioGroup.Option
              key={mode.id}
              value={mode.id}
              className={({ checked, active }) =>
                `${checked ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-300'}
                ${active ? 'ring-2 ring-offset-2 ring-indigo-600' : ''}
                relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none`
              }
            >
              {({ checked }) => (
                <>
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="flex items-center">
                        <mode.icon className={`h-5 w-5 mr-2 ${checked ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <RadioGroup.Label as="span" className="block text-sm font-medium text-gray-900">
                          {mode.name}
                        </RadioGroup.Label>
                      </span>
                      <RadioGroup.Description as="span" className="mt-1 flex items-center text-xs text-gray-500">
                        {mode.description}
                      </RadioGroup.Description>
                    </span>
                  </span>
                  {checked && (
                    <div className="absolute -top-2 -right-2">
                      <div className="h-6 w-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>

      {/* Warehouse Configuration Based on Mode */}
      {config.mode === 'simple' ? (
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              Simple routing sends all orders to your primary warehouse. Configure a fallback warehouse for when the primary is unavailable.
            </p>
          </div>

          {/* Primary Warehouse */}
          <WarehouseSelector
            warehouses={warehouses}
            selectedWarehouseId={config.primaryWarehouseId}
            onWarehouseChange={handlePrimaryWarehouseChange}
            label="Primary Warehouse"
            helpText="All orders will be routed to this warehouse"
            required
          />

          {/* Fallback Warehouse */}
          <WarehouseSelector
            warehouses={warehouses.filter(w => w.id !== config.primaryWarehouseId)}
            selectedWarehouseId={config.fallbackWarehouseId}
            onWarehouseChange={handleFallbackWarehouseChange}
            label="Fallback Warehouse (Optional)"
            helpText="Used when primary warehouse cannot fulfill the order"
          />
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-start mb-4">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600">
              Advanced routing automatically routes orders to the nearest warehouse based on customer location. Assign states/regions to each warehouse.
            </p>
          </div>

          <AdvancedWarehouseRouting
            config={config}
            warehouses={warehouses}
            onChange={(updatedConfig) => setConfig(updatedConfig)}
          />
        </div>
      )}

      {/* No Warehouses Warning */}
      {warehouses.length === 0 && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Warehouses Available</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please create at least one warehouse before configuring routing. Warehouses are required to fulfill orders from this integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
