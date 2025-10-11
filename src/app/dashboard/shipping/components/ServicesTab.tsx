//file path: app/dashboard/shipping/components/ServicesTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { CarrierService } from '../utils/shippingTypes'
import { USPS_SERVICES, UPS_SERVICES, FEDEX_SERVICES } from '../data/carrierServices'
import { TruckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function ServicesTab() {
  const [services, setServices] = useState<CarrierService[]>([])
  const [selectedCarrier, setSelectedCarrier] = useState<'all' | 'USPS' | 'UPS' | 'FedEx'>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'domestic' | 'international'>('all')

  // Load services from localStorage
  useEffect(() => {
    const savedServices = localStorage.getItem('shipping_services')
    if (savedServices) {
      setServices(JSON.parse(savedServices))
    } else {
      // Initialize with carrier services
      const initialServices: CarrierService[] = [
        ...USPS_SERVICES.map((service, index) => ({
          ...service,
          id: `usps-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        ...UPS_SERVICES.map((service, index) => ({
          ...service,
          id: `ups-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        ...FEDEX_SERVICES.map((service, index) => ({
          ...service,
          id: `fedex-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      ]
      setServices(initialServices)
      localStorage.setItem('shipping_services', JSON.stringify(initialServices))
    }
  }, [])

  const filteredServices = services.filter(service => {
    const carrierMatch = selectedCarrier === 'all' || service.carrier === selectedCarrier
    const typeMatch = selectedType === 'all' || service.serviceType === selectedType || service.serviceType === 'both'
    return carrierMatch && typeMatch
  })

  const handleToggleActive = (id: string) => {
    const updated = services.map(service =>
      service.id === id ? { ...service, isActive: !service.isActive } : service
    )
    setServices(updated)
    localStorage.setItem('shipping_services', JSON.stringify(updated))
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Carrier</label>
            <select
              value={selectedCarrier}
              onChange={(e) => setSelectedCarrier(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Carriers</option>
              <option value="USPS">USPS</option>
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="domestic">Domestic Only</option>
              <option value="international">International Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-lg shadow-sm border-2 p-5 transition-all ${
              service.isActive ? 'border-gray-200' : 'border-gray-200 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <TruckIcon className="h-5 w-5 text-gray-400" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCarrierColor(service.carrier)}`}>
                    {service.carrier}
                  </span>
                  <span className="text-xs text-gray-500">{service.estimatedDays}</span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{service.displayName}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                )}

                {/* Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
                {service.restrictions && (
                  <div className="text-xs text-gray-500">
                    {service.restrictions.maxWeight && (
                      <span>Max: {service.restrictions.maxWeight} lbs</span>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={service.isActive}
                  onChange={() => handleToggleActive(service.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
