//file path: app/dashboard/shipping/components/ServicesTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { CarrierService } from '../utils/shippingTypes'
import { TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import Notification from '../../shared/components/Notification'
import { useNotification } from '../../shared/hooks/useNotification'
import { getEnabledShippingCarriers, getUserUSPSCredentials } from '@/lib/storage/integrationStorage'
import { useWarehouses } from '../../warehouses/hooks/useWarehouses'

interface ServicesTabProps {
  selectedWarehouseId: string
}

export default function ServicesTab({ selectedWarehouseId }: ServicesTabProps) {
  const [services, setServices] = useState<CarrierService[]>([])
  const [filteredServices, setFilteredServices] = useState<CarrierService[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState<'all' | 'USPS' | 'UPS' | 'FedEx'>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'domestic' | 'international'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([])
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(true)

  const { notification, showSuccess, showError, closeNotification } = useNotification()

  // Get all warehouses for syncing to multiple warehouses
  const { warehouses } = useWarehouses()

  // Get the localStorage key for specific warehouse
  const getStorageKey = (warehouseId: string) => {
    return `shipping_services_${warehouseId}`
  }

  // Get enabled carriers
  useEffect(() => {
    const carriers = getEnabledShippingCarriers()
    setEnabledCarriers(carriers)
    setIsLoadingCarriers(false)
  }, [])

  // Load services from localStorage (warehouse-specific) - NO DEFAULT INITIALIZATION
  useEffect(() => {
    if (isLoadingCarriers || enabledCarriers.length === 0) return

    if (selectedWarehouseId === '') {
      // "All Warehouses" view - merge services from all warehouses
      loadAllWarehousesServices()
    } else {
      // Specific warehouse - load only that warehouse's services
      loadWarehouseServices(selectedWarehouseId)
    }
  }, [enabledCarriers, isLoadingCarriers, selectedWarehouseId, warehouses])

  const loadWarehouseServices = (warehouseId: string) => {
    const storageKey = getStorageKey(warehouseId)
    const savedServices = localStorage.getItem(storageKey)

    if (savedServices) {
      const parsed = JSON.parse(savedServices)
      // Filter services to only show those for enabled carriers
      const filtered = parsed.filter((service: CarrierService) => {
        return enabledCarriers.some(carrier => carrier === service.carrier.toUpperCase())
      })
      setServices(filtered)
    } else {
      // No services found - user needs to sync from API
      console.log(`[ServicesTab] No services found for warehouse ${warehouseId}. User must sync from API.`)
      setServices([])
    }
  }

  const loadAllWarehousesServices = () => {
    // Merge services from all warehouses
    const serviceMap = new Map<string, CarrierService>()
    let hasAnyServices = false

    warehouses.forEach(warehouse => {
      const storageKey = getStorageKey(warehouse.id)
      const savedServices = localStorage.getItem(storageKey)

      if (savedServices) {
        hasAnyServices = true
        const parsed = JSON.parse(savedServices) as CarrierService[]

        parsed.forEach(service => {
          // Use a unique key based on carrier and service code
          const serviceKey = `${service.carrier}-${service.serviceCode}`

          if (!serviceMap.has(serviceKey)) {
            serviceMap.set(serviceKey, service)
          }
        })
      }
    })

    if (!hasAnyServices) {
      console.log(`[ServicesTab] No services found in any warehouse. User must sync from API.`)
      setServices([])
      return
    }

    const merged = Array.from(serviceMap.values())

    // Filter services to only show those for enabled carriers
    const filtered = merged.filter((service: CarrierService) => {
      return enabledCarriers.some(carrier => carrier === service.carrier.toUpperCase())
    })

    setServices(filtered)
  }

  // Get service state across all warehouses
  const getServiceStateAcrossWarehouses = (service: CarrierService) => {
    const states: { warehouseId: string; warehouseName: string; isActive: boolean }[] = []

    warehouses.forEach(warehouse => {
      const storageKey = getStorageKey(warehouse.id)
      const savedServices = localStorage.getItem(storageKey)

      if (savedServices) {
        const warehouseServices: CarrierService[] = JSON.parse(savedServices)
        const matchingService = warehouseServices.find(s =>
          s.carrier === service.carrier && s.serviceCode === service.serviceCode
        )

        if (matchingService) {
          states.push({
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            isActive: matchingService.isActive
          })
        }
      }
    })

    return states
  }

  // Filter services
  useEffect(() => {
    let filtered = services

    // Carrier filter
    if (selectedCarrier !== 'all') {
      filtered = filtered.filter(service => service.carrier === selectedCarrier)
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(service =>
        service.serviceType === selectedType || service.serviceType === 'both'
      )
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(service => {
        const nameMatch = service.displayName.toLowerCase().includes(searchLower)
        const descMatch = service.description?.toLowerCase().includes(searchLower)
        const carrierMatch = service.carrier.toLowerCase().includes(searchLower)
        return nameMatch || descMatch || carrierMatch
      })
    }

    // ✅ Simple alphabetical sort
    filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))

    setFilteredServices(filtered)
  }, [services, selectedCarrier, selectedType, searchTerm])

  const handleToggleActive = (id: string) => {
    const service = services.find(s => s.id === id)
    if (!service) return

    if (selectedWarehouseId === '') {
      // All Warehouses View - toggle in all warehouses
      const serviceKey = `${service.carrier}-${service.serviceCode}`

      // Check current state across all warehouses
      let anyEnabled = false
      warehouses.forEach(warehouse => {
        const storageKey = getStorageKey(warehouse.id)
        const savedServices = localStorage.getItem(storageKey)
        if (savedServices) {
          const warehouseServices: CarrierService[] = JSON.parse(savedServices)
          const matchingService = warehouseServices.find(s =>
            s.carrier === service.carrier && s.serviceCode === service.serviceCode
          )
          if (matchingService?.isActive) {
            anyEnabled = true
          }
        }
      })

      // Toggle to opposite state in all warehouses
      const newState = !anyEnabled
      warehouses.forEach(warehouse => {
        toggleServiceInWarehouse(warehouse.id, service, newState)
      })
      loadAllWarehousesServices()
    } else {
      // Single warehouse - normal toggle
      toggleServiceInWarehouse(selectedWarehouseId, service)
      loadWarehouseServices(selectedWarehouseId)
    }
  }

  const toggleServiceInWarehouse = (warehouseId: string, targetService: CarrierService, forceState?: boolean) => {
    const storageKey = getStorageKey(warehouseId)
    const savedServices = localStorage.getItem(storageKey)
    const warehouseServices: CarrierService[] = savedServices ? JSON.parse(savedServices) : []

    const updatedServices = warehouseServices.map(service => {
      const isMatch = service.carrier === targetService.carrier &&
                      service.serviceCode === targetService.serviceCode

      if (isMatch) {
        const newState = forceState !== undefined ? forceState : !service.isActive
        console.log(`[Toggle] Warehouse ${warehouseId}: ${service.displayName} → ${newState}`)
        return { ...service, isActive: newState }
      }

      return service
    })

    localStorage.setItem(storageKey, JSON.stringify(updatedServices))
    console.log(`[Toggle] Updated service in warehouse ${warehouseId}`)
  }

  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'USPS': return 'bg-blue-100 text-blue-800'
      case 'UPS': return 'bg-amber-100 text-amber-800'
      case 'FedEx': return 'bg-purple-100 text-purple-800'
      case 'DHL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filterOptions = [
    { value: 'all', label: 'All Carriers' },
    ...enabledCarriers.map(carrier => ({
      value: carrier,
      label: carrier
    }))
  ]

  // Show loading state while carriers are being loaded
  if (isLoadingCarriers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shipping carriers...</p>
        </div>
      </div>
    )
  }

  if (enabledCarriers.length === 0) {
    return (
      <div className="space-y-6">
        <Notification
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={closeNotification}
        />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipping Integrations Found</h3>
          <p className="text-gray-600 mb-4">
            You need to enable a shipping integration before managing services
          </p>
          <a href="/dashboard/integrations"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Integrations
          </a>
        </div>
      </div>
    )
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
          <TruckIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {selectedWarehouseId
                ? 'Carrier Services for This Warehouse'
                : 'Carrier Services - All Warehouses'}
            </h4>
            <p className="text-sm text-blue-700">
              {selectedWarehouseId ? (
                <>
                  Each warehouse has its own services loaded from carrier APIs. Changes here only affect <strong>this warehouse</strong>.
                </>
              ) : (
                <>
                  Changes made here will affect <strong>all warehouses</strong>.
                  Services sync automatically when you save your integration settings.
                </>
              )}
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
              placeholder="Search services..."
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
          <div className="flex gap-2">
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value as any)}
              className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="all">All Types</option>
              <option value="domestic">Domestic Only</option>
              <option value="international">International Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {

          return (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-sm border-2 border-gray-200 transition-all"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TruckIcon className="h-6 w-6 text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCarrierColor(service.carrier)}`}>
                      {service.carrier}
                    </span>
                    {service.estimatedDays && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {service.estimatedDays}
                      </span>
                    )}
                  </div>
                </div>

                {/* Service Name */}
                <h3 className="font-semibold text-gray-900 mb-2">{service.displayName}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  {service.features.trackingIncluded ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-gray-700">Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {service.features.signatureAvailable ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-gray-700">Signature</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {service.features.insuranceAvailable ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-gray-700">Insurance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {service.features.saturdayDelivery ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-gray-700">Saturday</span>
                </div>
              </div>

              {/* Restrictions */}
              {service.restrictions && service.restrictions.maxWeight && (
                <div className="text-sm text-gray-600 mb-3">
                  <span className="text-gray-500">Max Weight:</span>{' '}
                  <span className="font-medium">{service.restrictions.maxWeight} lbs</span>
                </div>
              )}

              {/* Availability & Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">
                    {service.serviceType === 'both' ? 'Domestic & International' :
                     service.serviceType === 'domestic' ? 'Domestic Only' : 'International Only'}
                  </span>

                  {/* All Warehouses View - Show status text */}
                  {selectedWarehouseId === '' && (() => {
                    const states = getServiceStateAcrossWarehouses(service)
                    const enabledCount = states.filter(s => s.isActive).length
                    const totalCount = states.length
                    const allEnabled = enabledCount === totalCount
                    const allDisabled = enabledCount === 0

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
                        const states = getServiceStateAcrossWarehouses(service)
                        const enabledCount = states.filter(s => s.isActive).length
                        return enabledCount > 0
                      }
                      return service.isActive
                    })()}
                    onChange={() => handleToggleActive(service.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>
          </div>
        )
      })}
    </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          {services.length === 0 ? (
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Services Found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {searchTerm
                  ? 'No services match your search. Try clearing the search filter.'
                  : 'Services will sync automatically when you save your USPS integration settings'}
              </p>
            </>
          ) : (
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
