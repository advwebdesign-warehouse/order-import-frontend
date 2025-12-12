//file path: src/app/dashboard/integrations/components/EcommerceInventorySync.tsx

'use client'

import { useState, useEffect } from 'react'
import {
  ArrowPathIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  SyncDirection,
  Integration,
  isEcommerceIntegration
} from '../types/integrationTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'

interface EcommerceInventorySyncProps {
  // Sync configuration
  inventorySyncEnabled: boolean
  syncDirection: SyncDirection
  onInventorySyncChange: (enabled: boolean) => void
  onSyncDirectionChange: (direction: SyncDirection) => void

  // Display info
  integrationName: string // e.g., "Shopify", "WooCommerce"
  primaryWarehouseId?: string
  warehouses: Warehouse[]

  // Conflict detection - use actual Integration union type
  allIntegrations?: Integration[]
  currentIntegrationId?: string
}

export default function EcommerceInventorySync({
  inventorySyncEnabled,
  syncDirection,
  onInventorySyncChange,
  onSyncDirectionChange,
  integrationName,
  primaryWarehouseId,
  warehouses,
  allIntegrations = [],
  currentIntegrationId
}: EcommerceInventorySyncProps) {
  // Get warehouse name for dynamic labels
  const getWarehouseName = () => {
    if (!primaryWarehouseId) return 'Warehouse'
    const warehouse = warehouses.find(w => w.id === primaryWarehouseId)
    return warehouse?.name || 'Warehouse'
  }

  // Sync conflict detection
  const [syncConflictWarning, setSyncConflictWarning] = useState<string | null>(null)

  useEffect(() => {
    if (syncDirection === 'one_way_from' && inventorySyncEnabled) {
      // Filter for e-commerce integrations only, then check for conflicts
      const conflictingIntegrations = allIntegrations
        .filter(isEcommerceIntegration) // Use type guard from integrationTypes
        .filter(integration =>
          integration.id !== currentIntegrationId && // Not the current integration
          integration.inventorySync === true && // Has inventory sync enabled
          integration.syncDirection === 'one_way_from' // Syncing FROM platform TO warehouses
        )

      if (conflictingIntegrations.length > 0) {
        const names = conflictingIntegrations.map(i => i.name).join(', ')
        setSyncConflictWarning(
          `⚠️ Warning: ${names} ${conflictingIntegrations.length === 1 ? 'is' : 'are'} also syncing products FROM platform TO warehouses. ` +
          `This may cause sync loops and inventory conflicts. Only one e-commerce platform ` +
          `should sync products FROM platform TO warehouses at a time.`
        )
      } else {
        setSyncConflictWarning(null)
      }
    } else {
      setSyncConflictWarning(null)
    }
  }, [syncDirection, inventorySyncEnabled, allIntegrations, currentIntegrationId])

  const warehouseName = getWarehouseName()

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 flex items-center">
          <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500" />
          Product & Inventory Sync
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Configure how products and inventory are synchronized with {integrationName}
        </p>
      </div>

      {/* ⭐ SYNC DIRECTION - ALWAYS VISIBLE */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Sync Direction
        </label>

        {/* ⭐ Sync Conflict Warning */}
        {syncConflictWarning && (
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  {syncConflictWarning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Platform → Warehouses */}
        <button
          type="button"
          onClick={() => onSyncDirectionChange('one_way_from')}
          disabled={!inventorySyncEnabled}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            !inventorySyncEnabled
              ? 'opacity-50 cursor-not-allowed bg-gray-50'
              : syncDirection === 'one_way_from'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                syncDirection === 'one_way_from' && inventorySyncEnabled
                  ? 'border-indigo-600'
                  : 'border-gray-300'
              }`}>
                {syncDirection === 'one_way_from' && inventorySyncEnabled && (
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                )}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  syncDirection === 'one_way_from' && inventorySyncEnabled
                    ? 'text-gray-900'
                    : 'text-gray-700'
                }`}>
                  {/* ⭐ DYNAMIC NAMES */}
                  {integrationName} → {warehouseName}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Platform is the source of truth. Updates from platform overwrite warehouse stock.
              </p>
            </div>
          </div>
        </button>

        {/* Warehouses → Platform */}
        <button
          type="button"
          onClick={() => onSyncDirectionChange('one_way_to')}
          disabled={!inventorySyncEnabled}
          className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
            !inventorySyncEnabled
              ? 'opacity-50 cursor-not-allowed bg-gray-50'
              : syncDirection === 'one_way_to'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                syncDirection === 'one_way_to' && inventorySyncEnabled
                  ? 'border-indigo-600'
                  : 'border-gray-300'
              }`}>
                {syncDirection === 'one_way_to' && inventorySyncEnabled && (
                  <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                )}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  syncDirection === 'one_way_to' && inventorySyncEnabled
                    ? 'text-gray-900'
                    : 'text-gray-700'
                }`}>
                  {/* ⭐ DYNAMIC NAMES */}
                  {warehouseName} → {integrationName}
                </p>
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Recommended
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your warehouses are the source of truth. Warehouse changes update platform.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* ⭐ Enable Inventory Management Toggle */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">Enable inventory management</span>
            <p className="text-xs text-gray-500 mt-1">
              Turn on to sync quantities between warehouses and {integrationName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onInventorySyncChange(!inventorySyncEnabled)}
            className={`${
              inventorySyncEnabled ? 'bg-indigo-600' : 'bg-gray-200'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          >
            <span
              className={`${
                inventorySyncEnabled ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      </div>

      {/* Info Note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Stock synchronization happens when you click "Sync {integrationName}" or when webhooks are enabled.
              {inventorySyncEnabled ? '' : ' Enable inventory management to sync quantities.'}
            </p>
          </div>
        </div>
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
