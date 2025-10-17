//file path: app/dashboard/shipping/components/AddPresetModal.tsx

'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ShippingPreset, CarrierPreference, CarrierService } from '../utils/shippingTypes'
import { getEnabledShippingCarriers } from '@/lib/storage/integrationStorage'

interface AddPresetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (preset: Partial<ShippingPreset>) => void
  preset: ShippingPreset | null
  selectedWarehouseId: string
  allWarehouses: any[]
}

export default function AddPresetModal({
  isOpen,
  onClose,
  onSave,
  preset,
  selectedWarehouseId,
  allWarehouses
}: AddPresetModalProps) {
  const [formData, setFormData] = useState<Partial<ShippingPreset>>({
    name: '',
    description: '',
    warehouse: selectedWarehouseId || 'all',
    isActive: true,
    priority: 1,
    carrierPreferences: [],
    boxRules: {
      strategy: 'smallest_fit'
    },
    conditions: {
      weight: { unit: 'lbs' },
      orderValue: { currency: 'USD' },
      destination: []
    },
    options: {}
  })

  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([])
  const [availableServices, setAvailableServices] = useState<Record<string, CarrierService[]>>({})
  const [disabledServicesWarning, setDisabledServicesWarning] = useState<{
    carrier: string
    services: string[]
  }[]>([])

  // Load enabled carriers
  useEffect(() => {
    const carriers = getEnabledShippingCarriers()
    setEnabledCarriers(carriers)
  }, [])

  // Load available services for all enabled carriers - ONLY ACTIVE SERVICES
  useEffect(() => {
    if (enabledCarriers.length === 0) return

    const servicesMap: Record<string, CarrierService[]> = {}

    enabledCarriers.forEach(carrier => {
      if (selectedWarehouseId === '') {
        // "All Warehouses" mode - merge services from all warehouses
        const serviceMap = new Map<string, CarrierService>()

        allWarehouses.forEach(warehouse => {
          const storageKey = `shipping_services_${warehouse.id}`
          const savedServices = localStorage.getItem(storageKey)

          if (savedServices) {
            const warehouseServices: CarrierService[] = JSON.parse(savedServices)
            warehouseServices.forEach(service => {
              // Only active services for this carrier
              if (service.carrier.toUpperCase() === carrier.toUpperCase() && service.isActive) {
                const serviceKey = `${service.carrier}-${service.serviceCode}`
                if (!serviceMap.has(serviceKey)) {
                  serviceMap.set(serviceKey, service)
                }
              }
            })
          }
        })

        servicesMap[carrier] = Array.from(serviceMap.values())
      } else {
        // Specific warehouse - load from that warehouse only
        const storageKey = `shipping_services_${selectedWarehouseId}`
        const savedServices = localStorage.getItem(storageKey)

        if (savedServices) {
          const allServices: CarrierService[] = JSON.parse(savedServices)
          // Filter to only show ACTIVE services for this carrier
          const carrierServices = allServices.filter(
            service => service.carrier.toUpperCase() === carrier.toUpperCase() &&
                      service.isActive === true
          )
          servicesMap[carrier] = carrierServices
        } else {
          servicesMap[carrier] = []
        }
      }
    })

    setAvailableServices(servicesMap)
  }, [enabledCarriers, selectedWarehouseId, allWarehouses])

  // Re-check for disabled services when available services change
  useEffect(() => {
    // Only check if we're editing a preset AND we have loaded services
    if (isOpen && preset && Object.keys(availableServices).length > 0) {
      console.log('[AddPresetModal] Checking for disabled services...')
      console.log('[AddPresetModal] Available services:', availableServices)
      console.log('[AddPresetModal] Preset preferences:', preset.carrierPreferences)
      checkForDisabledServices(preset)
    }
  }, [availableServices, preset, isOpen])

  // Reset form when modal opens/closes or preset changes
  useEffect(() => {
    if (isOpen) {
      if (preset) {
        setFormData(preset)
        // Don't check for disabled services here - availableServices might not be loaded yet
      } else {
        setFormData({
          name: '',
          description: '',
          warehouse: selectedWarehouseId || 'all',
          isActive: true,
          priority: 1,
          carrierPreferences: [],
          boxRules: {
            strategy: 'smallest_fit'
          },
          conditions: {
            weight: { unit: 'lbs' },
            orderValue: { currency: 'USD' },
            destination: []
          },
          options: {}
        })
        setDisabledServicesWarning([])
      }
    } else {
      // Reset warnings when modal closes
      setDisabledServicesWarning([])
    }
  }, [isOpen, preset, selectedWarehouseId])

  // Check if preset contains services that are now disabled
  const checkForDisabledServices = (preset: ShippingPreset) => {
    const warnings: { carrier: string; services: string[] }[] = []

    console.log('[checkForDisabledServices] Starting check...')

    preset.carrierPreferences?.forEach(pref => {
      const activeServices = availableServices[pref.carrier] || []
      const activeServiceNames = activeServices.map(s => s.displayName)

      console.log(`[checkForDisabledServices] Carrier: ${pref.carrier}`)
      console.log(`[checkForDisabledServices] Preset services:`, pref.services)
      console.log(`[checkForDisabledServices] Active services:`, activeServiceNames)

      const disabledServices = pref.services.filter(
        serviceName => !activeServiceNames.includes(serviceName)
      )

      console.log(`[checkForDisabledServices] Disabled services found:`, disabledServices)

      if (disabledServices.length > 0) {
        warnings.push({
          carrier: pref.carrier,
          services: disabledServices
        })
      }
    })

    console.log('[checkForDisabledServices] Total warnings:', warnings)
    setDisabledServicesWarning(warnings)

    if (warnings.length > 0) {
      console.log('⚠️ [WARNING] Disabled services detected in preset!')
    }
  }

  // Remove all disabled services from the preset
  const removeDisabledServices = () => {
    const updatedPreferences = formData.carrierPreferences?.map(pref => {
      const activeServices = availableServices[pref.carrier] || []
      const activeServiceNames = activeServices.map(s => s.displayName)

      return {
        ...pref,
        services: pref.services.filter(serviceName =>
          activeServiceNames.includes(serviceName)
        )
      }
    })

    setFormData({
      ...formData,
      carrierPreferences: updatedPreferences
    })

    setDisabledServicesWarning([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that each carrier has at least one service selected
    const emptyCarriers = formData.carrierPreferences?.filter(
      pref => pref.services.length === 0
    )

    if (emptyCarriers && emptyCarriers.length > 0) {
      alert(`Please select at least one service for: ${emptyCarriers.map(c => c.carrier).join(', ')}`)
      return
    }

    onSave(formData)
  }

  const addCarrierPreference = () => {
    if (enabledCarriers.length === 0) {
      alert('No carriers enabled. Please enable carriers in Integrations first.')
      return
    }

    const newPref: CarrierPreference = {
      carrier: enabledCarriers[0] as any,
      services: [],
      order: (formData.carrierPreferences?.length || 0) + 1
    }
    setFormData({
      ...formData,
      carrierPreferences: [...(formData.carrierPreferences || []), newPref]
    })
  }

  const removeCarrierPreference = (index: number) => {
    const updated = formData.carrierPreferences?.filter((_, i) => i !== index) || []
    setFormData({ ...formData, carrierPreferences: updated })
  }

  const updateCarrierPreference = (index: number, field: keyof CarrierPreference, value: any) => {
    const updated = [...(formData.carrierPreferences || [])]
    updated[index] = { ...updated[index], [field]: value }

    // If carrier changed, clear services
    if (field === 'carrier') {
      updated[index].services = []
    }

    setFormData({ ...formData, carrierPreferences: updated })
  }

  const toggleService = (carrierIndex: number, serviceName: string) => {
    const updated = [...(formData.carrierPreferences || [])]
    const currentServices = updated[carrierIndex].services || []

    if (currentServices.includes(serviceName)) {
      // Remove service
      updated[carrierIndex].services = currentServices.filter(s => s !== serviceName)
    } else {
      // Add service
      updated[carrierIndex].services = [...currentServices, serviceName]
    }

    setFormData({ ...formData, carrierPreferences: updated })
  }

  // Filter services based on destination selection
  const getFilteredServicesForDestination = (carrier: string): CarrierService[] => {
    const allServices = availableServices[carrier] || []
    const destinations = formData.conditions?.destination || []

    // If no destination selected, show all services
    if (destinations.length === 0) {
      return allServices
    }

    // Filter services based on selected destinations
    return allServices.filter(service => {
      // Service supports both - always include
      if (service.serviceType === 'both') {
        return true
      }

      // Check if service type matches any selected destination
      if (destinations.includes('domestic') && service.serviceType === 'domestic') {
        return true
      }

      if (destinations.includes('international') && service.serviceType === 'international') {
        return true
      }

      return false
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {preset ? 'Edit Shipping Preset' : 'Create Shipping Preset'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preset Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Express Orders"
                  />
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="What is this preset for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse
                </label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {selectedWarehouseId === ''
                        ? 'All Warehouses'
                        : allWarehouses.find(w => w.id === selectedWarehouseId)?.name || 'Current Warehouse'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedWarehouseId === ''
                        ? 'This preset will be created in all warehouses'
                        : 'This preset will be created in this warehouse only'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* DISABLED SERVICES WARNING BANNER          */}
            {/* Appears here when editing a preset with   */}
            {/* services that are now disabled            */}
            {/* ========================================== */}
            {disabledServicesWarning.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-400 p-4 rounded-lg shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-bold text-amber-800 mb-1">
                      ⚠️ Warning: Disabled Services Detected
                    </h3>
                    <div className="text-sm text-amber-700 space-y-2">
                      {disabledServicesWarning.map((warning, idx) => (
                        <div key={idx} className="bg-white bg-opacity-50 p-2 rounded border border-amber-300">
                          <span className="font-semibold">{warning.carrier}:</span>{' '}
                          {warning.services.map((service, sIdx) => (
                            <span key={sIdx} className="font-mono">
                              "{service}"{sIdx < warning.services.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                          {' '}
                          {warning.services.length === 1 ? 'is' : 'are'} currently disabled.
                        </div>
                      ))}
                      <p className="mt-2 italic">
                        💡 These services won't be used when this preset is applied.
                        Update your selections below or enable these services in the Carrier Services tab.
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={removeDisabledServices}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors gap-2 shadow-sm"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove All Disabled Services
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Conditions (When to use this preset)
              </h3>

              {/* Weight */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={!!formData.conditions?.weight?.max}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        weight: e.target.checked
                          ? { min: 0, max: 70, unit: 'lbs' }
                          : { unit: 'lbs' }
                      }
                    })}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Weight Range</span>
                </label>
                {formData.conditions?.weight?.max !== undefined && (
                  <div className="grid grid-cols-3 gap-2 ml-6">
                    <input
                      type="number"
                      placeholder="Min"
                      min="0"
                      step="0.01"
                      value={formData.conditions.weight.min ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          weight: {
                            ...(formData.conditions?.weight || { unit: 'lbs' }),
                            min: e.target.value === '' ? 0 : parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      min="0"
                      step="0.01"
                      value={formData.conditions.weight.max || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          weight: {
                            ...(formData.conditions?.weight || { unit: 'lbs' }),
                            max: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={formData.conditions.weight.unit}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          weight: {
                            ...(formData.conditions?.weight || { unit: 'lbs' }),
                            unit: e.target.value as any
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="lbs">lbs</option>
                      <option value="kg">kg</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Order Value */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={!!formData.conditions?.orderValue?.max}
                    onChange={(e) => setFormData({
                      ...formData,
                      conditions: {
                        ...formData.conditions,
                        orderValue: e.target.checked
                          ? { min: 0, max: 1000, currency: 'USD' }
                          : { currency: 'USD' }
                      }
                    })}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Order Value Range</span>
                </label>
                {formData.conditions?.orderValue?.max !== undefined && (
                  <div className="grid grid-cols-3 gap-2 ml-6">
                    <input
                      type="number"
                      placeholder="Min $"
                      min="0"
                      step="0.01"
                      value={formData.conditions.orderValue.min ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          orderValue: {
                            ...(formData.conditions?.orderValue || { currency: 'USD' }),
                            min: e.target.value === '' ? 0 : parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max $"
                      min="0"
                      step="0.01"
                      value={formData.conditions.orderValue.max || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          orderValue: {
                            ...(formData.conditions?.orderValue || { currency: 'USD' }),
                            max: parseFloat(e.target.value)
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={formData.conditions.orderValue.currency}
                      onChange={(e) => setFormData({
                        ...formData,
                        conditions: {
                          ...formData.conditions,
                          orderValue: {
                            ...(formData.conditions?.orderValue || { currency: 'USD' }),
                            currency: e.target.value as any
                          }
                        }
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Type
                </label>
                <div className="flex gap-4 ml-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.conditions?.destination?.includes('domestic')}
                      onChange={(e) => {
                        const current = formData.conditions?.destination || []
                        setFormData({
                          ...formData,
                          conditions: {
                            ...formData.conditions,
                            destination: e.target.checked
                              ? [...current, 'domestic']
                              : current.filter(d => d !== 'domestic')
                          }
                        })
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Domestic</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.conditions?.destination?.includes('international')}
                      onChange={(e) => {
                        const current = formData.conditions?.destination || []
                        setFormData({
                          ...formData,
                          conditions: {
                            ...formData.conditions,
                            destination: e.target.checked
                              ? [...current, 'international']
                              : current.filter(d => d !== 'international')
                          }
                        })
                      }}
                      className="rounded text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">International</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Carrier Preferences Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Carrier Preferences (Try in order)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Only active services are shown. Enable services in the Carrier Services tab.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCarrierPreference}
                  disabled={enabledCarriers.length === 0}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Carrier
                </button>
              </div>

              {enabledCarriers.length === 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  No carriers enabled. Please enable carriers in the Integrations page first.
                </div>
              )}

              {formData.carrierPreferences && formData.carrierPreferences.length > 0 ? (
                <div className="space-y-3">
                  {formData.carrierPreferences.map((pref, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-medium text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <select
                            value={pref.carrier}
                            onChange={(e) => updateCarrierPreference(index, 'carrier', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            {enabledCarriers.map(carrier => (
                              <option key={carrier} value={carrier}>
                                {carrier}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCarrierPreference(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Service Selection */}
                      <div className="ml-11">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Services (select one or more):
                        </label>
                        {(() => {
                          const filteredServices = getFilteredServicesForDestination(pref.carrier)

                          if (filteredServices.length > 0) {
                            return (
                              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                {filteredServices.map(service => (
                                  <label key={service.id} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={pref.services.includes(service.displayName)}
                                      onChange={() => toggleService(index, service.displayName)}
                                      className="rounded text-indigo-600"
                                    />
                                    <span className="text-sm text-gray-700">{service.displayName}</span>
                                    {service.estimatedDays && (
                                      <span className="text-xs text-gray-500">({service.estimatedDays})</span>
                                    )}
                                    {/* Show service type badge */}
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      service.serviceType === 'both' ? 'bg-purple-100 text-purple-700' :
                                      service.serviceType === 'domestic' ? 'bg-blue-100 text-blue-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {service.serviceType === 'both' ? 'Both' :
                                       service.serviceType === 'domestic' ? 'Domestic' : 'Intl'}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )
                          } else if (formData.conditions?.destination && formData.conditions.destination.length > 0) {
                            // Show message if no services match the destination filter
                            return (
                              <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-amber-800 font-medium">No services available for selected destinations</p>
                                <p className="text-amber-700 text-xs mt-1">
                                  No active {pref.carrier} services support{' '}
                                  {formData.conditions.destination.join(' and ')} shipping.
                                  Try selecting different destinations or enable compatible services in Carrier Services.
                                </p>
                              </div>
                            )
                          } else {
                            return (
                              <p className="text-sm text-gray-500 italic">
                                No active services found for {pref.carrier}. Please enable services in the Carrier Services tab.
                              </p>
                            )
                          }
                        })()}
                        {pref.services.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Selected services:</p>
                            <div className="flex flex-wrap gap-2">
                              {pref.services.map((serviceName, sIdx) => {
                                const isDisabled = !availableServices[pref.carrier]?.some(
                                  s => s.displayName === serviceName
                                )
                                return (
                                  <span
                                    key={sIdx}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                      isDisabled
                                        ? 'bg-red-100 text-red-700 border border-red-300'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {serviceName}
                                    {isDisabled && (
                                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </span>
                                )
                              })}
                            </div>
                            {pref.services.some(serviceName =>
                              !availableServices[pref.carrier]?.some(s => s.displayName === serviceName)
                            ) && (
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ Red services are currently disabled
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No carriers added. Click "Add Carrier" to start.
                </p>
              )}
            </div>

            {/* Box Selection Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Box Selection</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selection Strategy
                </label>
                <select
                  value={formData.boxRules?.strategy}
                  onChange={(e) => setFormData({
                    ...formData,
                    boxRules: {
                      ...formData.boxRules,
                      strategy: e.target.value as any
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="smallest_fit">Smallest Fit (Most Cost-Effective)</option>
                  <option value="preferred_boxes">Preferred Boxes Only</option>
                  <option value="weight_based">Weight-Based Selection</option>
                  <option value="cheapest">Cheapest Option</option>
                </select>
              </div>
            </div>

            {/* Options Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Shipping Options</h3>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!formData.options?.signatureRequired}
                    onChange={(e) => setFormData({
                      ...formData,
                      options: {
                        ...formData.options,
                        signatureRequired: e.target.checked
                      }
                    })}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Require Signature</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!formData.options?.insurance}
                    onChange={(e) => setFormData({
                      ...formData,
                      options: {
                        ...formData.options,
                        insurance: e.target.checked
                      }
                    })}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Include Insurance</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!formData.options?.saturdayDelivery}
                    onChange={(e) => setFormData({
                      ...formData,
                      options: {
                        ...formData.options,
                        saturdayDelivery: e.target.checked
                      }
                    })}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Saturday Delivery</span>
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {preset ? 'Update Preset' : 'Create Preset'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
