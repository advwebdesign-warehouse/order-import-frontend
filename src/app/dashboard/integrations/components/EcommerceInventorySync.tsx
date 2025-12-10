//file path: app/dashboard/integrations/components/EcommerceInventorySync.tsx

'use client'

import { useState, useEffect } from 'react'
import { RadioGroup } from '@headlessui/react'
import {
  ArrowPathIcon,
  InformationCircleIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { EcommerceInventoryConfig, ProductImportMode, SyncDirection } from '../types/integrationTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import WarehouseSelector from './WarehouseSelector'

interface EcommerceInventorySyncProps {
  inventoryConfig: EcommerceInventoryConfig | undefined
  warehouses: Warehouse[]
  onChange: (config: EcommerceInventoryConfig) => void
  integrationName?: string // e.g., "Shopify", "WooCommerce"
}

const IMPORT_MODES: { id: ProductImportMode; name: string; description: string; icon: any }[] = [
  {
    id: 'products_only',
    name: 'Products only (no quantities)',
    description: 'All products created with quantity = 0. Set stock manually later.',
    icon: CubeIcon
  },
  {
    id: 'with_quantities',
    name: 'Products with quantities',
    description: 'Import stock levels to your primary warehouse. Other warehouses start at 0.',
    icon: CheckCircleIcon
  }
]

const SYNC_DIRECTIONS: {
  id: SyncDirection
  name: string
  description: string
  recommended?: boolean
}[] = [
  {
    id: 'one_way_from',
    name: 'Platform → Warehouses',
    description: 'Platform is the source of truth. Updates from platform overwrite warehouse stock.'
  },
  {
    id: 'one_way_to',
    name: 'Warehouses → Platform',
    description: 'Your warehouses are the source of truth. Warehouse changes update platform.',
    recommended: true
  },
  {
    id: 'manual',
    name: 'Manual (no automatic sync)',
    description: 'Stock quantities are never automatically synchronized. Full manual control.'
  }
]

export default function EcommerceInventorySync({
  inventoryConfig,
  warehouses,
  onChange,
  integrationName = 'this platform'
}: EcommerceInventorySyncProps) {
  const [config, setConfig] = useState<EcommerceInventoryConfig>(
    inventoryConfig || {
      productImport: {
        mode: 'products_only',
        primaryWarehouseId: warehouses[0]?.id || ''
      },
      managesInventory: false,
      syncDirection: 'one_way_to'
    }
  )

  // Sync changes to parent
  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  const handleImportModeChange = (mode: ProductImportMode) => {
    setConfig(prev => ({
      ...prev,
      productImport: {
        ...prev.productImport,
        mode
      }
    }))
  }

  const handlePrimaryWarehouseChange = (warehouseId: string) => {
    setConfig(prev => ({
      ...prev,
      productImport: {
        ...prev.productImport,
        primaryWarehouseId: warehouseId
      }
    }))
  }

  const handleManagesInventoryToggle = () => {
    setConfig(prev => ({
      ...prev,
      managesInventory: !prev.managesInventory,
      // If disabling, set to manual
      syncDirection: !prev.managesInventory ? prev.syncDirection : 'manual'
    }))
  }

  const handleSyncDirectionChange = (direction: SyncDirection) => {
    setConfig(prev => ({
      ...prev,
      syncDirection: direction
    }))
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <CubeIcon className="h-5 w-5 mr-2 text-gray-500" />
          Product Import & Inventory Sync
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure how products and inventory are synchronized with {integrationName}
        </p>
      </div>

      {/* =============================================================== */}
      {/* SECTION 1: PRODUCT IMPORT SETTINGS */}
      {/* =============================================================== */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Product Import Settings</h4>

        {/* Import Mode Selector */}
        <RadioGroup value={config.productImport.mode} onChange={handleImportModeChange}>
          <RadioGroup.Label className="sr-only">Product Import Mode</RadioGroup.Label>
          <div className="space-y-3">
            {IMPORT_MODES.map((mode) => (
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

        {/* Primary Warehouse Selector (only show if with_quantities) */}
        {config.productImport.mode === 'with_quantities' && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start mb-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                {integrationName} quantities will be imported to your primary warehouse. Other linked warehouses will start at 0.
              </p>
            </div>

            <WarehouseSelector
              warehouses={warehouses}
              selectedWarehouseId={config.productImport.primaryWarehouseId}
              onWarehouseChange={handlePrimaryWarehouseChange}
              label="Import Quantities To"
              helpText="Select the warehouse that will receive the initial stock quantities"
              required
            />
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* SECTION 2: STOCK SYNCHRONIZATION */}
      {/* =============================================================== */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Stock Synchronization</h4>

        {/* Enable Inventory Management Toggle */}
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">Enable inventory management</span>
            <p className="text-xs text-gray-500 mt-1">
              Turn on to sync quantities between warehouses and {integrationName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleManagesInventoryToggle}
            className={`${
              config.managesInventory ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                config.managesInventory ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        {/* Sync Direction Options */}
        {config.managesInventory ? (
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-start mb-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">
                Choose how stock quantities are synchronized. This affects what happens when you click "Sync {integrationName}".
              </p>
            </div>

            <RadioGroup value={config.syncDirection} onChange={handleSyncDirectionChange}>
              <RadioGroup.Label className="text-sm font-medium text-gray-700 mb-2 block">
                Sync Direction
              </RadioGroup.Label>
              <div className="space-y-3">
                {SYNC_DIRECTIONS.map((direction) => (
                  <RadioGroup.Option
                    key={direction.id}
                    value={direction.id}
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
                              <ArrowPathIcon className={`h-5 w-5 mr-2 ${checked ? 'text-indigo-600' : 'text-gray-400'}`} />
                              <RadioGroup.Label as="span" className="block text-sm font-medium text-gray-900">
                                {direction.name}
                              </RadioGroup.Label>
                              {direction.recommended && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Recommended
                                </span>
                              )}
                            </span>
                            <RadioGroup.Description as="span" className="mt-1 flex items-center text-xs text-gray-500">
                              {direction.description}
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

            {/* Info Note */}
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> Stock synchronization happens when you click "Sync {integrationName}" or when webhooks are enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
            <div className="flex items-start">
              <XCircleIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
              <p>
                Inventory management is disabled. Products will be imported but quantities won't sync automatically.
              </p>
            </div>
          </div>
        )}
      </div>

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
                  Please create at least one warehouse before configuring inventory. Warehouses are required to manage product stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
