//file path: app/dashboard/shipping/page.tsx

'use client'

import { useState } from 'react'
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

export default function ShippingPage() {
  const [selectedTab, setSelectedTab] = useState(0)

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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <BoxesTab />
            </Tab.Panel>
            <Tab.Panel>
              <ServicesTab />
            </Tab.Panel>
            <Tab.Panel>
              <PresetsTab />
            </Tab.Panel>
            <Tab.Panel>
              <AddressesTab />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}
