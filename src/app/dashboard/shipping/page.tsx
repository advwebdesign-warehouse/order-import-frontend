//file path: app/dashboard/shipping/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import {
  CubeIcon,
  TruckIcon,
  Cog6ToothIcon,
  MapPinIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import BoxesTab from './components/BoxesTab'
import ServicesTab from './components/ServicesTab'
import PresetsTab from './components/PresetsTab'
import AddressesTab from './components/AddressesTab'

// Warehouse support
import { useWarehouses } from '../warehouses/hooks/useWarehouses'
import WarehouseSelector from '../shared/components/WarehouseSelector'
import { withAuth } from '../shared/components/withAuth'

const tabs = [
  {
    name: 'Boxes & Packaging',
    icon: CubeIcon,
    description: 'Manage custom boxes and carrier packaging'
  },
  {
    name: 'Carrier Services',
    icon: TruckIcon,
    description: 'Configure available shipping services'
  },
  {
    name: 'Shipping Presets',
    icon: DocumentDuplicateIcon,
    description: 'Create shipping templates and rules'
  },
  {
    name: 'Return Addresses',
    icon: MapPinIcon,
    description: 'Manage shipping and return addresses'
  }
]

function ShippingPageContent({ accountId }: { accountId: string }) {
  const [selectedTab, setSelectedTab] = useState(0)

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('warehouse') || ''
    }
    return ''
  })

  const { warehouses, loading: warehousesLoading } = useWarehouses()

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId)

    // ✅ Only update URL (no localStorage)
    const url = new URL(window.location.href)
    if (warehouseId) {
      url.searchParams.set('warehouse', warehouseId)
    } else {
      url.searchParams.delete('warehouse')
    }
    window.history.replaceState({}, '', url.toString())
  }

  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId)
  const warehouseDisplayName = selectedWarehouse
    ? selectedWarehouse.name
    : selectedWarehouseId === ''
    ? 'All Warehouses'
    : 'Unknown Warehouse'

  if (warehousesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipping settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shipping Settings</h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure boxes, services, and shipping preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Cog6ToothIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warehouse Selector */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Warehouse</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedWarehouseId
                    ? `Showing shipping settings for ${warehouseDisplayName}`
                    : 'Showing shipping settings for all warehouses'}
                </p>
              </div>
              <div className="w-64">
                <WarehouseSelector
                  warehouses={warehouses.map(w => ({
                    id: w.id,
                    name: w.name,
                    code: w.code,
                    isDefault: w.isDefault,
                    status: w.status,
                    productCount: w.productCount
                  }))}
                  selectedWarehouseId={selectedWarehouseId}
                  onWarehouseChange={handleWarehouseChange}
                  showProductCount={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm border border-gray-200">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `w-full rounded-lg py-3 px-4 text-sm font-medium leading-5 transition-all
                  ${
                    selected
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </div>
              </Tab>
            ))}
          </Tab.List>

          <div className="mt-2 mb-6 text-center">
            <p className="text-sm text-gray-600">{tabs[selectedTab].description}</p>
          </div>

          <Tab.Panels className="mt-6">
            <Tab.Panel>
            <BoxesTab
              selectedWarehouseId={selectedWarehouseId}
              accountId={accountId}
            />
            </Tab.Panel>
            <Tab.Panel>
              <ServicesTab selectedWarehouseId={selectedWarehouseId}
              accountId={accountId}/>
            </Tab.Panel>
            <Tab.Panel>
              <PresetsTab selectedWarehouseId={selectedWarehouseId}
              accountId={accountId}/>
            </Tab.Panel>
            <Tab.Panel>
              <AddressesTab selectedWarehouseId={selectedWarehouseId}
              accountId={accountId}/>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

// ✅ Export with withAuth HOC - provides automatic loading/error states
export default withAuth(ShippingPageContent, {
  loadingMessage: "Loading shipping settings...",
  errorTitle: "Unable to load shipping settings",
  errorMessage: "Please try refreshing the page or contact support if the issue persists."
})
