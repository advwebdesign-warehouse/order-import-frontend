//file path: app/dashboard/shipping/components/ServicesTab.tsx

'use client'

/**
 * ServicesTab - Manages shipping services with API-BASED storage
 *
 * Architecture v2 (API-BASED):
 * - All services stored in database via API
 * - No localStorage for service data
 * - Each warehouse has independent services
 * - Services synced from carrier APIs (USPS, UPS, FedEx)
 * - Uses IntegrationAPI wrapper for all API calls
 */

import { useState, useEffect } from 'react'
import { CarrierService } from '../utils/shippingTypes'
import { TruckIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import Notification from '../../shared/components/Notification'
import { useNotification } from '../../shared/hooks/useNotification'
import { useWarehouses } from '../../warehouses/hooks/useWarehouses'
import { IntegrationAPI } from '@/lib/api/integrationApi'
import { ShippingAPI } from '@/lib/api/shippingApi'

interface ServicesTabProps {
  selectedWarehouseId: string
  accountId: string
}

export default function ServicesTab({ selectedWarehouseId, accountId }: ServicesTabProps) {
  const [services, setServices] = useState<CarrierService[]>([])
  const [filteredServices, setFilteredServices] = useState<CarrierService[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState<'all' | 'USPS' | 'UPS' | 'FedEx'>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'domestic' | 'international'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([])
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [integrations, setIntegrations] = useState<any[]>([])

  // Track warehouse states for each service (for "All Warehouses" view)
  const [serviceWarehouseStates, setServiceWarehouseStates] = useState<Map<string, { warehouseId: string; warehouseName: string; isActive: boolean }[]>>(new Map())

  const { notification, showSuccess, showError, closeNotification } = useNotification()
  const { warehouses } = useWarehouses()

  // Get enabled carriers from API
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        setIsLoadingCarriers(true)

        // Use IntegrationAPI instead of fetch
        const integrations = await IntegrationAPI.getAccountIntegrations({ type: 'shipping' })
        setIntegrations(integrations)

        const carriers = integrations
          .filter((i: any) => i.type === 'shipping' && i.status === 'connected' && i.enabled)
          .map((i: any) => i.name)

        setEnabledCarriers(carriers)
      } catch (error) {
        console.error('[ServicesTab] Error fetching integrations:', error)
        setEnabledCarriers([])
      } finally {
        setIsLoadingCarriers(false)
      }
    }

    if (accountId) {
      fetchIntegrations()
    }
  }, [accountId])

  // Load services from API
  useEffect(() => {
    if (isLoadingCarriers || enabledCarriers.length === 0) return

    if (selectedWarehouseId === '') {
      loadAllWarehousesServices()
    } else {
      loadWarehouseServices(selectedWarehouseId)
    }
  }, [enabledCarriers, isLoadingCarriers, selectedWarehouseId, warehouses])

  const loadWarehouseServices = async (warehouseId: string) => {
    const servicesFromAPI: CarrierService[] = await IntegrationAPI.getWarehouseServices(warehouseId)

      const filtered = servicesFromAPI.filter((service: CarrierService) => {
        return enabledCarriers.some(carrier => carrier === service.carrier.toUpperCase())
      })

      setServices(filtered)

      if (filtered.length === 0) {
        console.log(`[ServicesTab] No services found for warehouse ${warehouseId}. User must sync from API.`)
      }
    }

  const loadAllWarehousesServices = async () => {
    const serviceMap = new Map<string, CarrierService>()
    let hasAnyServices = false

    for (const warehouse of warehouses) {
      const warehouseServices: CarrierService[] = await IntegrationAPI.getWarehouseServices(warehouse.id)

      if (warehouseServices.length > 0) {
        hasAnyServices = true

        warehouseServices.forEach(service => {
          const serviceKey = `${service.carrier}-${service.serviceCode}`
          if (!serviceMap.has(serviceKey)) {
            serviceMap.set(serviceKey, service)
          }
        })
      }
    }

    if (!hasAnyServices) {
      console.log(`[ServicesTab] No services found in any warehouse. User must sync from API.`)
      setServices([])
      return
    }

    const merged = Array.from(serviceMap.values())
    const filtered = merged.filter((service: CarrierService) => {
      return enabledCarriers.some(carrier => carrier === service.carrier.toUpperCase())
    })

    setServices(filtered)

    // Compute warehouse states for each service (for "All Warehouses" view)
    const statesMap = new Map<string, { warehouseId: string; warehouseName: string; isActive: boolean }[]>()

    for (const service of filtered) {
      const states: { warehouseId: string; warehouseName: string; isActive: boolean }[] = []

      for (const warehouse of warehouses) {
        const warehouseServices: CarrierService[] = await IntegrationAPI.getWarehouseServices(warehouse.id)

        const matchingService = warehouseServices.find((s: CarrierService) =>
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

      statesMap.set(service.id, states)
    }

    setServiceWarehouseStates(statesMap)
  }

  // Sync services from carrier APIs
  const handleSyncFromAPI = async () => {
    setSyncing(true)
    try {
      const allCredentials: any = {}

      if (enabledCarriers.includes('USPS')) {
        const uspsIntegration = integrations.find((i: any) => i.name === 'USPS')
        if (uspsIntegration && uspsIntegration.config) {
          allCredentials.usps = {
            consumerKey: uspsIntegration.config.consumerKey,
            consumerSecret: uspsIntegration.config.consumerSecret,
            accessToken: uspsIntegration.config.accessToken,
            environment: uspsIntegration.config.environment || 'sandbox'
          }
        } else {
          showError('USPS Credentials Missing', 'Please configure USPS in Integrations.')
          setSyncing(false)
          return
        }
      }

      if (enabledCarriers.includes('UPS')) {
        const upsIntegration = integrations.find((i: any) => i.name === 'UPS')
        if (upsIntegration && upsIntegration.config) {
          allCredentials.ups = {
            accountNumber: upsIntegration.config.accountNumber,
            accessToken: upsIntegration.config.accessToken,
            refreshToken: upsIntegration.config.refreshToken,
            environment: upsIntegration.config.environment || 'sandbox'
          }
        } else {
          showError('UPS Credentials Missing', 'Please configure UPS in Integrations.')
          setSyncing(false)
          return
        }
      }

      console.log('[ServicesTab] Starting sync...')

      // Use ShippingAPI instead of fetch
      const data = await ShippingAPI.syncServicesFromCarriers({
        carriers: enabledCarriers,
        credentials: allCredentials
      })

      const apiServices = data.services || []

      console.log('[ServicesTab] Sync response:', apiServices.length, 'services')

      if (selectedWarehouseId === '') {
        for (const warehouse of warehouses) {
          await syncWarehouseServices(warehouse.id, apiServices)
        }
      } else {
        await syncWarehouseServices(selectedWarehouseId, apiServices)
      }

      showSuccess(
        'Sync Successful',
        `Synced ${apiServices.length} services`
      )

      setTimeout(() => {
        if (selectedWarehouseId === '') {
          loadAllWarehousesServices()
        } else {
          loadWarehouseServices(selectedWarehouseId)
        }
        setSyncing(false)
      }, 100)
    } catch (error: any) {
      console.error('[ServicesTab] Sync error:', error)
      showError('Sync Failed', 'Failed to sync services. Check console for details.')
      setSyncing(false)
    }
  }

  const syncWarehouseServices = async (warehouseId: string, apiServices: any[]) => {
    const existingServices = await IntegrationAPI.getWarehouseServices(warehouseId)

    const mergedServices = smartMergeServices(existingServices, apiServices)
    await IntegrationAPI.saveWarehouseServices(warehouseId, mergedServices)

    console.log(`[ServicesTab] Synced ${mergedServices.length} services to warehouse ${warehouseId}`)
  }

  const smartMergeServices = (existingServices: CarrierService[], apiServices: any[]): CarrierService[] => {
    const merged: CarrierService[] = []

    apiServices.forEach(apiService => {
      const existing = existingServices.find((service: CarrierService) =>
        service.carrier === apiService.carrier &&
        service.serviceCode === apiService.serviceCode
      )

      if (existing) {
        merged.push({
          ...apiService,
          id: existing.id,
          isActive: existing.isActive,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString()
        })
      } else {
        merged.push(apiService)
      }
    })

    const existingCarrierServices = existingServices.filter((service: CarrierService) =>
      !merged.some(m => m.carrier === service.carrier && m.serviceCode === service.serviceCode)
    )

    existingCarrierServices.forEach(service => {
      merged.push(service)
    })

    return merged
  }

  // Filter services
  useEffect(() => {
    let filtered = services

    if (selectedCarrier !== 'all') {
      filtered = filtered.filter(service => service.carrier === selectedCarrier)
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((service: CarrierService) =>
        service.serviceType === selectedType || service.serviceType === 'both'
      )
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((service: CarrierService) => {
        const nameMatch = service.displayName.toLowerCase().includes(searchLower)
        const descMatch = service.description?.toLowerCase().includes(searchLower)
        const carrierMatch = service.carrier.toLowerCase().includes(searchLower)
        return nameMatch || descMatch || carrierMatch
      })
    }

    // Simple alphabetical sort
    filtered.sort((a, b) => a.displayName.localeCompare(b.displayName))

    setFilteredServices(filtered)
  }, [services, selectedCarrier, selectedType, searchTerm])

  const handleToggleActive = async (id: string) => {
    const service = services.find((s: CarrierService) => s.id === id)
    if (!service) return

    if (selectedWarehouseId === '') {
      const  anyEnabled = false
      for (const warehouse of warehouses) {
        const warehouseServices: CarrierService[] = await IntegrationAPI.getWarehouseServices(warehouse.id)

        const matchingService = warehouseServices.find((s: CarrierService) =>
          s.carrier === service.carrier && s.serviceCode === service.serviceCode
        )
        if (matchingService?.isActive) {
          break
        }
      }

      // Toggle to opposite state in all warehouses
      const newState = !anyEnabled
      for (const warehouse of warehouses) {
        await toggleServiceInWarehouse(warehouse.id, service, newState)
      }
      await loadAllWarehousesServices()
    } else {
      await toggleServiceInWarehouse(selectedWarehouseId, service)
      await loadWarehouseServices(selectedWarehouseId)
    }
  }

  const toggleServiceInWarehouse = async (warehouseId: string, targetService: CarrierService, forceState?: boolean) => {
    const warehouseServices = await IntegrationAPI.getWarehouseServices(warehouseId)

    const updatedServices = warehouseServices.map((service: CarrierService) => {
      const isMatch = service.carrier === targetService.carrier &&
                      service.serviceCode === targetService.serviceCode

      if (isMatch) {
        const newState = forceState !== undefined ? forceState : !service.isActive
        console.log(`[Toggle] Warehouse ${warehouseId}: ${service.displayName} → ${newState}`)
        return { ...service, isActive: newState }
      }

      return service
    })

    await IntegrationAPI.saveWarehouseServices(warehouseId, updatedServices)
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
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Info Banner with Sync Button - Matching BoxesTab Design */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <TruckIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Carrier Services - {selectedWarehouseId ? 'This Warehouse' : 'All Warehouses'}
            </h4>
            <p className="text-sm text-blue-700">
              Changes made here will affect <strong>{selectedWarehouseId ? 'this warehouse' : 'all warehouses'}</strong>.
              Services are loaded from carrier APIs to ensure accurate shipping options.
            </p>
            {/* Sync button in banner - shown only when no services and no search */}
            {services.length === 0 && !searchTerm && (
              <button
                onClick={handleSyncFromAPI}
                disabled={syncing}
                className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              <svg
                className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
                {syncing ? 'Syncing...' : 'Sync from API'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
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

      {/* Services Grid or Empty State */}
      {services.length === 0 ? (
        // Empty State - Matching BoxesTab Design EXACTLY
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Services Found</h3>
          <p className="mt-1 text-sm text-gray-500 mb-4">
            {searchTerm
              ? 'No services match your search. Try clearing the search filter.'
              : 'Sync with carrier APIs to load available packaging options'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleSyncFromAPI}
              disabled={syncing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <svg
              className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
              {syncing ? 'Syncing from API...' : 'Sync from API to Load Services'}
            </button>
          )}
        </div>
      ) : filteredServices.length === 0 ? (
        // No Results from Filter
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search'
              : 'Try adjusting your filter'}
          </p>
        </div>
      ) : (
        // Services Grid
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
                        const states = serviceWarehouseStates.get(service.id) || []
                        const enabledCount = states.filter((s: { warehouseId: string; warehouseName: string; isActive: boolean }) => s.isActive).length
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
                            const states = serviceWarehouseStates.get(service.id) || []
                            const enabledCount = states.filter((s: { warehouseId: string; warehouseName: string; isActive: boolean }) => s.isActive).length
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
      )}
    </div>
  )
}
