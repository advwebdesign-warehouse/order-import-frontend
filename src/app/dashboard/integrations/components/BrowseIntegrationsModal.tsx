//file path: src/app/dashboard/integrations/components/BrowseIntegrationsModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface AvailableIntegration {
  id: string
  name: string
  description: string
  category: 'shipping' | 'ecommerce' | 'other'
  logo: string
  features: string[]
  comingSoon?: boolean
}

const AVAILABLE_INTEGRATIONS: AvailableIntegration[] = [
  {
    id: 'usps',
    name: 'USPS',
    description: 'Generate shipping labels, calculate rates, and track packages with USPS',
    category: 'shipping',
    logo: '/logos/usps-logo.svg',
    features: ['Label Generation', 'Rate Calculation', 'Address Validation', 'Tracking']
  },
  {
    id: 'ups',
    name: 'UPS',
    description: 'Generate shipping labels, calculate rates, and track packages with UPS',
    category: 'shipping',
    logo: '/logos/ups-logo.svg',
    features: ['Label Generation', 'Rate Calculation', 'Address Validation', 'Tracking']
  },
  {
    id: 'fedex',
    name: 'FedEx',
    description: 'Generate shipping labels, calculate rates, and track packages with FedEx',
    category: 'shipping',
    logo: '/logos/fedex-logo.svg',
    features: ['Label Generation', 'Rate Calculation', 'Address Validation', 'Tracking'],
    comingSoon: true
  },
  {
    id: 'dhl',
    name: 'DHL',
    description: 'International shipping with DHL Express',
    category: 'shipping',
    logo: '/logos/dhl-logo.svg',
    features: ['Label Generation', 'Rate Calculation', 'International Shipping', 'Tracking'],
    comingSoon: true
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Sync orders and inventory with your Shopify store',
    category: 'ecommerce',
    logo: '/logos/shopify-logo.svg',
    features: ['Order Sync', 'Inventory Sync', 'Customer Data', 'Product Sync'],
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Connect your WooCommerce store for seamless order management',
    category: 'ecommerce',
    logo: '/logos/woocommerce-logo.svg',
    features: ['Order Sync', 'Inventory Sync', 'Customer Data', 'Product Sync'],
    comingSoon: true
  },
  {
    id: 'ebay',
    name: 'eBay',
    description: 'Sync eBay listings and orders',
    category: 'ecommerce',
    logo: '/logos/ebay-logo.svg',
    features: ['Order Sync', 'Listing Management', 'Inventory Updates'],
    comingSoon: true
  },
  {
    id: 'walmart',
    name: 'Walmart',
    description: 'Integrate with Walmart Marketplace for order and inventory management',
    category: 'ecommerce',
    logo: '/logos/walmart-logo.svg',
    features: ['Order Management', 'Inventory Sync', 'Marketplace Integration', 'Fulfillment'],
    comingSoon: true
  }
]

interface BrowseIntegrationsModalProps {
  isOpen: boolean
  onClose: () => void
  onAddIntegration: (integrationId: string) => void // Parent should auto-open config modal after this
  existingIntegrationIds: string[]
  selectedStoreId?: string
}

export default function BrowseIntegrationsModal({
  isOpen,
  onClose,
  onAddIntegration,
  existingIntegrationIds,
  selectedStoreId
}: BrowseIntegrationsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(integration => {
    if (existingIntegrationIds.includes(integration.id)) return false

    if (searchQuery && !integration.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !integration.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    if (selectedCategory !== 'all' && integration.category !== selectedCategory) {
      return false
    }

    return true
  })

  const handleAdd = (integrationId: string) => {
    const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === integrationId)
    if (integration?.comingSoon) {
      alert('This integration is coming soon!')
      return
    }

    if (!selectedStoreId) {
      alert('Please select a store first before adding an integration.')
      return
    }

    // ✅ Call parent to handle integration addition
    // The parent should automatically open the config modal for this integration
    onAddIntegration(integrationId)
    onClose()
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mb-4">
                      Browse Integrations
                    </Dialog.Title>

                    {selectedStoreId && (
                      <p className="text-sm text-gray-600 mb-4">
                        Adding integrations for the currently selected store
                      </p>
                    )}

                    {/* Search and Filter */}
                    <div className="mb-6 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search integrations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                      </div>

                      {/* Category Filter */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedCategory('all')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                            selectedCategory === 'all'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setSelectedCategory('shipping')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                            selectedCategory === 'shipping'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Shipping & Logistics
                        </button>
                        <button
                          onClick={() => setSelectedCategory('ecommerce')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                            selectedCategory === 'ecommerce'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          E-commerce
                        </button>
                      </div>
                    </div>

                    {/* Integration Grid - ✅ Simplified Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                      {filteredIntegrations.map((integration) => (
                        <button
                          key={integration.id}
                          onClick={() => handleAdd(integration.id)}
                          disabled={integration.comingSoon}
                          className={`relative rounded-lg border bg-white p-6 text-left transition-all ${
                            integration.comingSoon
                              ? 'border-gray-200 cursor-not-allowed opacity-60'
                              : 'border-gray-300 hover:border-indigo-500 hover:shadow-lg cursor-pointer'
                          }`}
                        >
                          {/* Coming Soon Badge */}
                          {integration.comingSoon && (
                            <div className="absolute top-3 right-3">
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Coming Soon
                              </span>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex flex-col items-center text-center">
                            {/* Logo */}
                            <div className="w-16 h-16 relative mb-4">
                              <Image
                                src={integration.logo}
                                alt={`${integration.name} logo`}
                                fill
                                className="object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>

                            {/* Name */}
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {integration.name}
                            </h4>

                            {/* Description */}
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {integration.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {filteredIntegrations.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-sm text-gray-500">No integrations found</p>
                      </div>
                    )}
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
