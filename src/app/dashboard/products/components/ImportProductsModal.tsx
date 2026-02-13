//file path: app/dashboard/products/components/ImportProductsModal.tsx

'use client'

import { Fragment, useState, useCallback, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  BuildingOffice2Icon,
  CheckIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { type Integration, isEcommerceIntegration } from '@/app/dashboard/integrations/types/integrationTypes'
import type { Warehouse } from '@/app/dashboard/warehouses/utils/warehouseTypes'
import { IntegrationAPI, type ShopifyLocation } from '@/lib/api/integrationApi'

interface ImportProductsModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (integrationId: string, options: ImportOptions) => Promise<void>
  ecommerceIntegrations: Integration[]
  warehouses: Warehouse[]
  isImporting: boolean
}

export interface ImportOptions {
  warehouseDestination: 'primary' | 'all_routing' | 'specific'
  selectedWarehouseIds?: string[]
  updateExisting: boolean
  sourceLocationId?: string
}

// Helper function to get integration display name
// All e-commerce integrations now have storeUrl in config
function getIntegrationDisplayName(integration: Integration): string {
  if (!isEcommerceIntegration(integration)) {
    return integration.name
  }

  // All e-commerce integrations have storeUrl
  return `${integration.name} - ${integration.config.storeUrl}`
}

export default function ImportProductsModal({
  isOpen,
  onClose,
  onImport,
  ecommerceIntegrations,
  warehouses,
  isImporting
}: ImportProductsModalProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string>('')
  const [warehouseDestination, setWarehouseDestination] = useState<'primary' | 'all_routing' | 'specific'>('all_routing')
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([])
  const [updateExisting, setUpdateExisting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ Source location state
  const [shopifyLocations, setShopifyLocations] = useState<ShopifyLocation[]>([])
  const [sourceLocationId, setSourceLocationId] = useState<string>('')
  const [loadingLocations, setLoadingLocations] = useState(false)

  // ✅ Fetch Shopify locations when integration is selected
  useEffect(() => {
    if (!selectedIntegration) {
      setShopifyLocations([])
      setSourceLocationId('')
      return
    }

    const integration = ecommerceIntegrations.find(i => i.id === selectedIntegration)
    if (!integration || integration.name !== 'Shopify') {
      setShopifyLocations([])
      setSourceLocationId('')
      return
    }

    const fetchLocations = async () => {
      setLoadingLocations(true)
      try {
        const locations = await IntegrationAPI.getShopifyLocations(selectedIntegration)
        setShopifyLocations(locations)
        // Auto-select first non-app location (typically "Shop location")
        if (locations.length > 0) {
          const defaultLocation = locations.find(loc => !loc.isAppLocation) || locations[0]
          setSourceLocationId(defaultLocation.id)
        }
      } catch (err) {
        console.error('[ImportModal] Failed to fetch Shopify locations:', err)
        setShopifyLocations([])
      } finally {
        setLoadingLocations(false)
      }
    }

    fetchLocations()
  }, [selectedIntegration, ecommerceIntegrations])

  // Get selected integration details
  const integration = ecommerceIntegrations.find(i => i.id === selectedIntegration)
  const primaryWarehouse = integration && isEcommerceIntegration(integration) && integration.routingConfig?.primaryWarehouseId
    ? warehouses.find(w => w.id === integration.routingConfig?.primaryWarehouseId)  // ✅
    : warehouses[0]

  // Get routing warehouses from integration
  const getRoutingWarehouses = useCallback((): string[] => {
    if (!integration || !isEcommerceIntegration(integration) || !integration.routingConfig) return []

    const warehouseIds: string[] = []

    if (integration.routingConfig.primaryWarehouseId) {
      warehouseIds.push(integration.routingConfig.primaryWarehouseId)
    }

    if (integration.routingConfig.fallbackWarehouseId) {
      warehouseIds.push(integration.routingConfig.fallbackWarehouseId)
    }

    if (integration.routingConfig.mode === 'advanced' && integration.routingConfig.assignments) {
      integration.routingConfig.assignments.forEach(assignment => {
        if (assignment.isActive && !warehouseIds.includes(assignment.warehouseId)) {
          warehouseIds.push(assignment.warehouseId)
        }
      })
    }

    return warehouseIds
  }, [integration])

  const routingWarehouses = getRoutingWarehouses()

  // Get target warehouses based on selection
  const getTargetWarehouses = useCallback((): Warehouse[] => {
    switch (warehouseDestination) {
      case 'primary':
        return primaryWarehouse ? [primaryWarehouse] : []
      case 'all_routing':
        return warehouses.filter(w => routingWarehouses.includes(w.id))
      case 'specific':
        return warehouses.filter(w => selectedWarehouseIds.includes(w.id))
      default:
        return []
    }
  }, [warehouseDestination, primaryWarehouse, warehouses, routingWarehouses, selectedWarehouseIds])

  const targetWarehouses = getTargetWarehouses()

  // Handle warehouse toggle for specific selection
  const handleWarehouseToggle = (warehouseId: string) => {
    setSelectedWarehouseIds(prev => {
      if (prev.includes(warehouseId)) {
        // Don't allow deselecting the last warehouse
        if (prev.length <= 1) return prev
        return prev.filter(id => id !== warehouseId)
      } else {
        return [...prev, warehouseId]
      }
    })
  }

  // Handle import
  const handleImport = async () => {
    if (!selectedIntegration) {
      setError('Please select an integration')
      return
    }

    if (targetWarehouses.length === 0) {
      setError('Please select at least one warehouse')
      return
    }

    setError(null)

    try {
      await onImport(selectedIntegration, {
        warehouseDestination,
        selectedWarehouseIds: warehouseDestination === 'specific' ? selectedWarehouseIds : undefined,
        updateExisting,
        sourceLocationId: sourceLocationId || undefined
      })

      // Reset form
      setSelectedIntegration('')
      setWarehouseDestination('primary')
      setSelectedWarehouseIds([])
      setSourceLocationId('')
      setShopifyLocations([])

      onClose()
    } catch (error: any) {
      setError(error.message || 'Import failed')
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                {/* Header */}
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Title */}
                <div className="mb-6">
                  <Dialog.Title className="text-xl font-semibold leading-6 text-gray-900 flex items-center">
                    <ArrowDownTrayIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Import Products
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500">
                    Import products from your e-commerce platforms
                  </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Select Integration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Integration
                    </label>
                    <select
                      value={selectedIntegration}
                      onChange={(e) => setSelectedIntegration(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Choose an integration...</option>
                      {ecommerceIntegrations.map(integration => (
                        <option key={integration.id} value={integration.id}>
                          {getIntegrationDisplayName(integration)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedIntegration && (
                    <>
                    {/* ✅ Source Location - Import From */}
                    {shopifyLocations.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Import from
                        </label>
                        <div className="space-y-3">
                          {shopifyLocations.map((location) => {
                            return (
                              <button
                                key={location.id}
                                type="button"
                                onClick={() => setSourceLocationId(location.id)}
                                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                  sourceLocationId === location.id
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      sourceLocationId === location.id
                                        ? 'border-indigo-600'
                                        : 'border-gray-300'
                                    }`}>
                                      {sourceLocationId === location.id && (
                                        <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-3 flex-1">
                                    <div className="flex items-center gap-2">
                                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                                      <p className="text-sm font-medium text-gray-900">
                                        {location.name}
                                      </p>
                                      {location.isAppLocation && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                          App
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {loadingLocations && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-sm text-gray-500">Loading locations...</span>
                      </div>
                    )}

                      {/* Warehouse Destination */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Destination Warehouses
                        </label>
                        <div className="space-y-3">
                          {/* Primary Warehouse Only */}
                          <button
                            type="button"
                            onClick={() => setWarehouseDestination('primary')}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                              warehouseDestination === 'primary'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  warehouseDestination === 'primary'
                                    ? 'border-indigo-600'
                                    : 'border-gray-300'
                                }`}>
                                  {warehouseDestination === 'primary' && (
                                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Primary Warehouse Only
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Products sync to: {primaryWarehouse?.name || 'No primary warehouse'}
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* All Routing Warehouses */}
                          <button
                            type="button"
                            onClick={() => setWarehouseDestination('all_routing')}
                            disabled={routingWarehouses.length <= 1}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                              routingWarehouses.length <= 1
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                : warehouseDestination === 'all_routing'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  warehouseDestination === 'all_routing' && routingWarehouses.length > 1
                                    ? 'border-indigo-600'
                                    : 'border-gray-300'
                                }`}>
                                  {warehouseDestination === 'all_routing' && routingWarehouses.length > 1 && (
                                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  All Warehouses in Routing
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {routingWarehouses.length} warehouse{routingWarehouses.length !== 1 ? 's' : ''} configured in routing
                                  {routingWarehouses.length <= 1 && ' (need at least 2)'}
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Select Specific Warehouses */}
                          <button
                            type="button"
                            onClick={() => {
                              setWarehouseDestination('specific')
                              if (selectedWarehouseIds.length === 0 && primaryWarehouse) {
                                setSelectedWarehouseIds([primaryWarehouse.id])
                              }
                            }}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                              warehouseDestination === 'specific'
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  warehouseDestination === 'specific'
                                    ? 'border-indigo-600'
                                    : 'border-gray-300'
                                }`}>
                                  {warehouseDestination === 'specific' && (
                                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  Select Specific Warehouses
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Choose exactly which warehouses receive products
                                </p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Specific Warehouse Selection */}
                      {warehouseDestination === 'specific' && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Select Warehouses
                          </label>
                          <div className="space-y-2">
                            {warehouses.map((warehouse) => {
                              const isSelected = selectedWarehouseIds.includes(warehouse.id)
                              const isOnlySelected = isSelected && selectedWarehouseIds.length === 1

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
                                  {warehouse.id === primaryWarehouse?.id && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Primary
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Import Options */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Import Options
                        </label>

                        <div className="flex items-start">
                          <div className="flex h-6 items-center">
                            <input
                              id="update-existing"
                              type="checkbox"
                              checked={updateExisting}
                              onChange={(e) => setUpdateExisting(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                          </div>
                          <div className="ml-3">
                            <label htmlFor="update-existing" className="text-sm font-medium text-gray-700">
                              Update existing products
                            </label>
                            <p className="text-xs text-gray-500">
                              Overwrite product data if already exists
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Target Summary */}
                      {targetWarehouses.length > 0 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-800">
                                Products will import to {targetWarehouses.length} warehouse{targetWarehouses.length !== 1 ? 's' : ''}:
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {targetWarehouses.map(warehouse => (
                                  <span
                                    key={warehouse.id}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    <BuildingOffice2Icon className="h-3 w-3 mr-1" />
                                    {warehouse.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={onClose}
                      disabled={isImporting}
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!selectedIntegration || targetWarehouses.length === 0 || isImporting}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isImporting ? 'Importing...' : 'Import Now'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
