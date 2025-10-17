//file path: app/dashboard/shipping/components/PresetsTab.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShippingPreset, CarrierService } from '../utils/shippingTypes'
import {
  RocketLaunchIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowsUpDownIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import AddPresetModal from './AddPresetModal'
import Notification from '../../shared/components/Notification'
import { useNotification } from '../../shared/hooks/useNotification'
import { useWarehouses } from '../../warehouses/hooks/useWarehouses'

// ✅ ADD DND-KIT IMPORTS
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PresetsTabProps {
  selectedWarehouseId: string
}

// ✅ SORTABLE PRESET CARD COMPONENT
function SortablePresetCard({
  preset,
  index,
  selectedWarehouseId,
  availableServices,
  getDisabledServices,
  getWarehouseName,
  getPresetStateAcrossWarehouses,
  handleToggleActive,
  setEditingPreset,
  setShowAddModal,
  handleDeletePreset,
}: {
  preset: ShippingPreset
  index: number
  selectedWarehouseId: string
  availableServices: Record<string, any[]>
  getDisabledServices: (preset: ShippingPreset) => { carrier: string; services: string[] }[]
  getWarehouseName: (warehouseId: string) => string
  getPresetStateAcrossWarehouses: (preset: ShippingPreset) => { warehouseId: string; warehouseName: string; isActive: boolean }[]
  handleToggleActive: (id: string) => void
  setEditingPreset: (preset: ShippingPreset) => void
  setShowAddModal: (show: boolean) => void
  handleDeletePreset: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: preset.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  const disabledServicesWarning = getDisabledServices(preset)
  const hasDisabledServices = disabledServicesWarning.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        preset.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="p-5">
        {/* Header with Badges and Drag Handle */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
              </svg>
            </div>

            {/* Priority Badge */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              preset.priority === 1 ? 'bg-red-100 text-red-800' :
              preset.priority === 2 ? 'bg-orange-100 text-orange-800' :
              preset.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              #{preset.priority}
            </span>

            {/* Warehouse Badge */}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getWarehouseName(preset.warehouse)}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditingPreset(preset)
                setShowAddModal(true)
              }}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Edit preset"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeletePreset(preset.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete preset"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Preset Name */}
        <h3 className="font-semibold text-gray-900 mb-2">{preset.name}</h3>
        {preset.description && (
          <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
        )}

        {/* Warning Banner for Disabled Services */}
        {hasDisabledServices && (
          <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-800">Services Disabled</p>
                <p className="mt-0.5 text-xs text-amber-700">Some services are no longer active</p>
              </div>
            </div>
          </div>
        )}

        {/* Conditions Grid */}
        <div className="space-y-2 mb-4">
          {/* Weight */}
          {preset.conditions.weight && (preset.conditions.weight.min !== undefined || preset.conditions.weight.max !== undefined) && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="text-gray-500">Weight:</span>
              <span className="font-medium">
                {preset.conditions.weight.min || 0} - {preset.conditions.weight.max || '∞'} {preset.conditions.weight.unit}
              </span>
            </div>
          )}

          {/* Order Value */}
          {preset.conditions.orderValue && (preset.conditions.orderValue.min !== undefined || preset.conditions.orderValue.max !== undefined) && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-500">Value:</span>
              <span className="font-medium">
                ${preset.conditions.orderValue.min || 0} - ${preset.conditions.orderValue.max || '∞'}
              </span>
            </div>
          )}

          {/* Destination */}
          {preset.conditions.destination && preset.conditions.destination.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-500">Destination:</span>
              <span className="font-medium capitalize">
                {preset.conditions.destination.join(', ')}
              </span>
            </div>
          )}

          {/* Box Strategy */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-gray-500">Box:</span>
            <span className="font-medium capitalize">
              {preset.boxRules.strategy.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Carrier Services Section */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-500 mb-2">CARRIERS & SERVICES</div>
          <div className="space-y-2">
            {preset.carrierPreferences.map((pref, idx) => {
              const carrierServices = pref.services.map(service => {
                const activeServices = availableServices[pref.carrier] || []
                const isDisabled = !activeServices.some((s: any) => s.displayName === service)
                return { name: service, isDisabled }
              })

              return (
                <div key={idx} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pref.carrier === 'USPS' ? 'bg-blue-100 text-blue-800' :
                      pref.carrier === 'UPS' ? 'bg-amber-100 text-amber-800' :
                      pref.carrier === 'FedEx' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pref.carrier}
                    </span>
                  </div>
                  {carrierServices.length > 0 ? (
                    <div className="pl-2 text-xs text-gray-600 space-y-0.5">
                      {carrierServices.map((service, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1.5">
                          {service.isDisabled ? (
                            <XCircleIcon className="h-3 w-3 text-red-500 flex-shrink-0" />
                          ) : (
                            <CheckCircleIcon className="h-3 w-3 text-green-600 flex-shrink-0" />
                          )}
                          <span className={service.isDisabled ? 'text-red-600 line-through' : ''}>
                            {service.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-2 text-xs italic text-gray-400">No services selected</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Options Grid */}
        {(preset.options.signatureRequired || preset.options.insurance || preset.options.saturdayDelivery) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {preset.options.signatureRequired && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Signature</span>
              </div>
            )}
            {preset.options.insurance && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Insurance</span>
              </div>
            )}
            {preset.options.saturdayDelivery && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-gray-700">Saturday</span>
              </div>
            )}
          </div>
        )}

        {/* Footer with Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">
              {preset.isActive ? 'Active' : 'Inactive'}
            </span>

            {/* All Warehouses View - Show status text */}
            {selectedWarehouseId === '' && (() => {
              const states = getPresetStateAcrossWarehouses(preset)
              const enabledCount = states.filter(s => s.isActive).length
              const totalCount = states.length
              const allEnabled = enabledCount === totalCount
              const allDisabled = enabledCount === 0

              // ✅ If preset only exists in one warehouse, show that warehouse name
              if (totalCount === 1) {
                const warehouseName = states[0].warehouseName
                return (
                  <span className={`text-xs font-medium mt-0.5 ${
                    states[0].isActive ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {states[0].isActive ? `Enabled in ${warehouseName}` : `Disabled in ${warehouseName}`}
                  </span>
                )
              }

              // ✅ For presets in multiple warehouses - simplified text
              return (
                <span className={`text-xs font-medium mt-0.5 ${
                  allEnabled ? 'text-green-600' :
                  allDisabled ? 'text-gray-500' :
                  'text-amber-600'
                }`}>
                  {allEnabled && 'Enabled in all'}
                  {allDisabled && 'Disabled in all'}
                  {!allEnabled && !allDisabled && `Enabled in ${enabledCount}/${totalCount} warehouses`}
                </span>
              )
            })()}
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={(() => {
                if (selectedWarehouseId === '') {
                  const states = getPresetStateAcrossWarehouses(preset)
                  const enabledCount = states.filter(s => s.isActive).length
                  return enabledCount > 0
                }
                return preset.isActive
              })()}
              onChange={() => handleToggleActive(preset.id)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}

export default function PresetsTab({ selectedWarehouseId }: PresetsTabProps) {
  const [presets, setPresets] = useState<ShippingPreset[]>([])
  const [filteredPresets, setFilteredPresets] = useState<ShippingPreset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPreset, setEditingPreset] = useState<ShippingPreset | null>(null)
  const [availableServices, setAvailableServices] = useState<Record<string, any[]>>({})
  const [activePreset, setActivePreset] = useState<ShippingPreset | null>(null)

  const { notification, showSuccess, showError, closeNotification } = useNotification()
  const { warehouses } = useWarehouses()

  // Get the localStorage key for specific warehouse
  const getStorageKey = (warehouseId: string) => {
    return `shipping_presets_${warehouseId}`
  }

  // Load available services to check for disabled ones
  useEffect(() => {
    const servicesMap: Record<string, any[]> = {}

    if (selectedWarehouseId === '') {
      // "All Warehouses" mode - merge services from all warehouses
      const allServicesMap = new Map<string, any>()

      warehouses.forEach(warehouse => {
        const storageKey = `shipping_services_${warehouse.id}`
        const savedServices = localStorage.getItem(storageKey)

        if (savedServices) {
          const warehouseServices = JSON.parse(savedServices)
          warehouseServices.forEach((service: any) => {
            // Only include active services
            if (service.isActive) {
              const serviceKey = `${service.carrier}-${service.serviceCode}`
              if (!allServicesMap.has(serviceKey)) {
                allServicesMap.set(serviceKey, service)
              }
            }
          })
        }
      })

      // Group by carrier
      allServicesMap.forEach((service) => {
        if (!servicesMap[service.carrier]) {
          servicesMap[service.carrier] = []
        }
        servicesMap[service.carrier].push(service)
      })
    } else {
      // Specific warehouse - load from that warehouse only
      const storageKey = `shipping_services_${selectedWarehouseId}`
      const savedServices = localStorage.getItem(storageKey)

      if (savedServices) {
        const allServices = JSON.parse(savedServices)

        // Group by carrier
        allServices.forEach((service: any) => {
          if (!servicesMap[service.carrier]) {
            servicesMap[service.carrier] = []
          }
          // Only include active services
          if (service.isActive) {
            servicesMap[service.carrier].push(service)
          }
        })
      }
    }

    setAvailableServices(servicesMap)
  }, [selectedWarehouseId, warehouses])

  // Check if a preset has disabled services
  const getDisabledServices = (preset: ShippingPreset): { carrier: string; services: string[] }[] => {
    const warnings: { carrier: string; services: string[] }[] = []

    preset.carrierPreferences?.forEach(pref => {
      const activeServices = availableServices[pref.carrier] || []
      const activeServiceNames = activeServices.map((s: any) => s.displayName)

      const disabledServices = pref.services.filter(
        serviceName => !activeServiceNames.includes(serviceName)
      )

      if (disabledServices.length > 0) {
        warnings.push({
          carrier: pref.carrier,
          services: disabledServices
        })
      }
    })

    return warnings
  }

  // Load presets from localStorage
  useEffect(() => {
    if (selectedWarehouseId === '') {
      // "All Warehouses" view - merge presets from all warehouses
      loadAllWarehousesPresets()
    } else {
      // Specific warehouse - load only that warehouse's presets
      loadWarehousePresets(selectedWarehouseId)
    }
  }, [selectedWarehouseId, warehouses])

  const loadWarehousePresets = (warehouseId: string) => {
    const storageKey = getStorageKey(warehouseId)
    const savedPresets = localStorage.getItem(storageKey)

    if (savedPresets) {
      const parsed = JSON.parse(savedPresets)
      setPresets(parsed)
    } else {
      setPresets([])
    }
  }

  const loadAllWarehousesPresets = () => {
    const presetMap = new Map<string, ShippingPreset>()

    warehouses.forEach(warehouse => {
      const storageKey = getStorageKey(warehouse.id)
      const savedPresets = localStorage.getItem(storageKey)

      if (savedPresets) {
        const parsed = JSON.parse(savedPresets) as ShippingPreset[]
        parsed.forEach(preset => {
          // Use preset ID as key to avoid duplicates
          if (!presetMap.has(preset.id)) {
            presetMap.set(preset.id, preset)
          }
        })
      }
    })

    const merged = Array.from(presetMap.values())
    setPresets(merged)
  }

  // Get preset state across all warehouses
  const getPresetStateAcrossWarehouses = (preset: ShippingPreset) => {
    const states: { warehouseId: string; warehouseName: string; isActive: boolean }[] = []

    warehouses.forEach(warehouse => {
      const storageKey = getStorageKey(warehouse.id)
      const savedPresets = localStorage.getItem(storageKey)

      if (savedPresets) {
        const warehousePresets: ShippingPreset[] = JSON.parse(savedPresets)
        const matchingPreset = warehousePresets.find(p => p.id === preset.id)

        if (matchingPreset) {
          states.push({
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            isActive: matchingPreset.isActive
          })
        }
      }
    })

    return states
  }

  // Filter presets
  useEffect(() => {
    let filtered = presets

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(preset => {
        const nameMatch = preset.name.toLowerCase().includes(searchLower)
        const descMatch = preset.description?.toLowerCase().includes(searchLower)
        return nameMatch || descMatch
      })
    }

    // Sort by priority (1 = highest)
    filtered.sort((a, b) => a.priority - b.priority)

    setFilteredPresets(filtered)
  }, [presets, searchTerm])

  const handleSavePreset = (presetData: Partial<ShippingPreset>) => {
    if (editingPreset) {
      // Editing existing preset
      if (selectedWarehouseId === '') {
        // Update in all warehouses
        warehouses.forEach(warehouse => {
          updatePresetInWarehouse(warehouse.id, editingPreset.id, presetData)
        })
        showSuccess('Preset Updated', `${presetData.name} has been updated in all warehouses.`)
      } else {
        // Update only in current warehouse
        updatePresetInWarehouse(selectedWarehouseId, editingPreset.id, presetData)
        showSuccess('Preset Updated', `${presetData.name} has been updated.`)
      }
    } else {
      // Creating new preset - calculate next priority
      const maxPriority = presets.length > 0
        ? Math.max(...presets.map(p => p.priority || 0))
        : 0

      const newPreset: ShippingPreset = {
        ...presetData as ShippingPreset,
        id: `preset-${Date.now()}`,
        priority: maxPriority + 1, // ✅ Assign next priority
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedWarehouseId === '') {
        // Add to all warehouses
        warehouses.forEach(warehouse => {
          addPresetToWarehouse(warehouse.id, newPreset)
        })
        showSuccess('Preset Created', `${presetData.name} has been created in all warehouses.`)
      } else {
        // Add to current warehouse only
        addPresetToWarehouse(selectedWarehouseId, newPreset)
        showSuccess('Preset Created', `${presetData.name} has been created.`)
      }
    }

    setShowAddModal(false)
    setEditingPreset(null)

    // Reload presets
    if (selectedWarehouseId === '') {
      loadAllWarehousesPresets()
    } else {
      loadWarehousePresets(selectedWarehouseId)
    }
  }

  const updatePresetInWarehouse = (warehouseId: string, presetId: string, presetData: Partial<ShippingPreset>) => {
    const storageKey = getStorageKey(warehouseId)
    const savedPresets = localStorage.getItem(storageKey)
    const presets: ShippingPreset[] = savedPresets ? JSON.parse(savedPresets) : []

    const updatedPresets = presets.map(preset =>
      preset.id === presetId
        ? { ...preset, ...presetData, updatedAt: new Date().toISOString() }
        : preset
    )

    localStorage.setItem(storageKey, JSON.stringify(updatedPresets))
  }

  const addPresetToWarehouse = (warehouseId: string, preset: ShippingPreset) => {
    const storageKey = getStorageKey(warehouseId)
    const savedPresets = localStorage.getItem(storageKey)
    const presets: ShippingPreset[] = savedPresets ? JSON.parse(savedPresets) : []

    presets.push(preset)
    localStorage.setItem(storageKey, JSON.stringify(presets))
  }

  const handleDeletePreset = (id: string) => {
    const presetToDelete = presets.find(preset => preset.id === id)
    if (!presetToDelete) return

    if (selectedWarehouseId === '') {
      // Delete from all warehouses
      warehouses.forEach(warehouse => {
        deletePresetFromWarehouse(warehouse.id, id)
      })
      showSuccess('Preset Deleted', `${presetToDelete.name} has been deleted from all warehouses.`)
      loadAllWarehousesPresets()
    } else {
      // Delete from current warehouse only
      deletePresetFromWarehouse(selectedWarehouseId, id)
      showSuccess('Preset Deleted', `${presetToDelete.name} has been deleted.`)
      loadWarehousePresets(selectedWarehouseId)
    }
  }

  const deletePresetFromWarehouse = (warehouseId: string, presetId: string) => {
    const storageKey = getStorageKey(warehouseId)
    const savedPresets = localStorage.getItem(storageKey)
    if (!savedPresets) return

    const presets: ShippingPreset[] = JSON.parse(savedPresets)
    const updatedPresets = presets.filter(preset => preset.id !== presetId)
    localStorage.setItem(storageKey, JSON.stringify(updatedPresets))
  }

  const handleToggleActive = (id: string) => {
    const preset = presets.find(p => p.id === id)
    if (!preset) return

    if (selectedWarehouseId === '') {
      // All Warehouses View - check current state across all warehouses
      const states = getPresetStateAcrossWarehouses(preset)
      const enabledCount = states.filter(s => s.isActive).length
      const anyEnabled = enabledCount > 0

      // Toggle to opposite state in all warehouses
      const newState = !anyEnabled

      warehouses.forEach(warehouse => {
        togglePresetInWarehouse(warehouse.id, id, newState)
      })

      loadAllWarehousesPresets()
    } else {
      // Toggle in current warehouse only
      togglePresetInWarehouse(selectedWarehouseId, id)
      loadWarehousePresets(selectedWarehouseId)
    }
  }

  const togglePresetInWarehouse = (warehouseId: string, presetId: string, forceState?: boolean) => {
    const storageKey = getStorageKey(warehouseId)
    const savedPresets = localStorage.getItem(storageKey)
    const presets: ShippingPreset[] = savedPresets ? JSON.parse(savedPresets) : []

    const updatedPresets = presets.map(preset =>
      preset.id === presetId
        ? {
            ...preset,
            isActive: forceState !== undefined ? forceState : !preset.isActive,
            updatedAt: new Date().toISOString()
          }
        : preset
    )

    localStorage.setItem(storageKey, JSON.stringify(updatedPresets))
    console.log(`[Toggle] Updated preset in warehouse ${warehouseId}`)
  }

  const getWarehouseName = (warehouseId: string) => {
    if (warehouseId === 'all') return 'All Warehouses'
    const warehouse = warehouses.find(w => w.id === warehouseId)
    return warehouse?.name || 'Unknown'
  }

  // ✅ DND-KIT SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ✅ DND-KIT DRAG START HANDLER - Wrapped in useCallback
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const preset = filteredPresets.find(p => p.id === active.id)
    setActivePreset(preset || null)
  }, [filteredPresets])

  // ✅ DND-KIT DRAG END HANDLER - Wrapped in useCallback
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    setActivePreset(null)

    if (over && active.id !== over.id) {
      const oldIndex = filteredPresets.findIndex(p => p.id === active.id)
      const newIndex = filteredPresets.findIndex(p => p.id === over.id)

      // Reorder the presets array
      const reordered = arrayMove(filteredPresets, oldIndex, newIndex)

      // Update priorities based on new order
      const updatedPresets = reordered.map((preset, index) => ({
        ...preset,
        priority: index + 1,
        updatedAt: new Date().toISOString()
      }))

      // Save to localStorage
      if (selectedWarehouseId === '') {
        // Update in all warehouses
        warehouses.forEach(warehouse => {
          updatePresetsOrderInWarehouse(warehouse.id, updatedPresets)
        })
        loadAllWarehousesPresets()
      } else {
        // Update in current warehouse
        updatePresetsOrderInWarehouse(selectedWarehouseId, updatedPresets)
        loadWarehousePresets(selectedWarehouseId)
      }

      showSuccess('Order Updated', 'Preset order has been updated.')
    }
  }, [filteredPresets, selectedWarehouseId, warehouses, showSuccess])



  const updatePresetsOrderInWarehouse = (warehouseId: string, updatedPresets: ShippingPreset[]) => {
    const storageKey = getStorageKey(warehouseId)
    const savedPresets = localStorage.getItem(storageKey)

    if (!savedPresets) return

    const allPresets: ShippingPreset[] = JSON.parse(savedPresets)

    // Update priorities for the presets we reordered
    const presetMap = new Map(updatedPresets.map(p => [p.id, p.priority]))

    const updated = allPresets.map(preset => {
      const newPriority = presetMap.get(preset.id)
      if (newPriority !== undefined) {
        return { ...preset, priority: newPriority, updatedAt: new Date().toISOString() }
      }
      return preset
    })

    localStorage.setItem(storageKey, JSON.stringify(updated))
  }

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
      />

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <RocketLaunchIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {selectedWarehouseId
                ? 'Shipping Presets for This Warehouse'
                : 'Shipping Presets - All Warehouses'}
            </h4>
            <p className="text-sm text-blue-700">
              Create automated shipping rules that select carriers, services, and boxes based on weight,
              destination, and order value. Presets are evaluated by priority order.
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search presets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setEditingPreset(null)
              setShowAddModal(true)
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Preset
          </button>
        </div>
      </div>

      {/* Presets Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredPresets.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset, index) => (
              <SortablePresetCard
                key={preset.id}
                preset={preset}
                index={index}
                selectedWarehouseId={selectedWarehouseId}
                availableServices={availableServices}
                getDisabledServices={getDisabledServices}
                getWarehouseName={getWarehouseName}
                getPresetStateAcrossWarehouses={getPresetStateAcrossWarehouses}
                handleToggleActive={handleToggleActive}
                setEditingPreset={setEditingPreset}
                setShowAddModal={setShowAddModal}
                handleDeletePreset={handleDeletePreset}
              />
            ))}
          </div>
        </SortableContext>

        {/* ✅ ADD DRAG OVERLAY - This creates the floating effect */}
          <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activePreset ? (
              <div className="bg-white rounded-lg shadow-2xl border-2 border-indigo-500 opacity-90 transform rotate-3 scale-105">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activePreset.priority === 1 ? 'bg-red-100 text-red-800' :
                      activePreset.priority === 2 ? 'bg-orange-100 text-orange-800' :
                      activePreset.priority === 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      #{activePreset.priority}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getWarehouseName(activePreset.warehouse)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{activePreset.name}</h3>
                  {activePreset.description && (
                    <p className="text-sm text-gray-600 mt-1">{activePreset.description}</p>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-12">
          <RocketLaunchIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Presets Found</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">
            {searchTerm
              ? 'No presets match your search. Try adjusting your search.'
              : 'Get started by creating your first shipping preset'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => {
                setEditingPreset(null)
                setShowAddModal(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create Your First Preset
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddPresetModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingPreset(null)
        }}
        onSave={handleSavePreset}
        preset={editingPreset}
        selectedWarehouseId={selectedWarehouseId}
        allWarehouses={warehouses}
      />
    </div>
  )
}
