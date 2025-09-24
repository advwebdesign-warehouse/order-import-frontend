//file path: app/dashboard/settings/page.tsx
'use client'

import { useState } from 'react'
import {
  Cog6ToothIcon,
  TableCellsIcon,
  EyeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  BellIcon,
  BoltIcon,
  CheckIcon,
  CubeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { UserSettings, DEFAULT_USER_SETTINGS, PAGINATION_OPTIONS, CURRENCY_OPTIONS } from '../shared/utils/settingsTypes'
import { useSettings } from '../shared/hooks/useSettings'

const SETTINGS_TABS = [
  { id: 'pagination', name: 'Pagination', icon: TableCellsIcon },
  { id: 'display', name: 'Display', icon: EyeIcon },
  { id: 'inventory', name: 'Inventory', icon: CubeIcon },
  { id: 'table', name: 'Table', icon: Cog6ToothIcon },
  { id: 'filters', name: 'Filters', icon: FunnelIcon },
  { id: 'export', name: 'Export', icon: ArrowDownTrayIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon },
  { id: 'performance', name: 'Performance', icon: BoltIcon }
]

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState('pagination')
  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  const handleSettingChange = (section: keyof UserSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    }
    updateSettings(newSettings)
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    // Settings are already saved via useSettings hook
    setHasChanges(false)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handleResetSection = (section: keyof UserSettings) => {
    const newSettings = {
      ...settings,
      [section]: DEFAULT_USER_SETTINGS[section]
    }
    updateSettings(newSettings)
    setHasChanges(true)
  }

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetSettings()
      setHasChanges(false)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure your preferences for orders, products, and general application behavior.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          {hasChanges && (
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </button>
          )}
          <button
            onClick={handleResetAll}
            className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Interface */}
      <div className="mt-8">
        <div className="sm:hidden">
          {/* Mobile dropdown */}
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            {SETTINGS_TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block">
          {/* Desktop tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium`}
                  >
                    <Icon className={`${
                      activeTab === tab.id
                        ? 'text-indigo-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    } -ml-0.5 mr-2 h-5 w-5`} />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {/* Inventory Tab - UPDATED */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Stock Management</h3>
                <div className="space-y-4 mt-4">
                  {/* Enable Stock Management - DISABLED with Coming Soon */}
                  <label className="flex items-start opacity-60 cursor-not-allowed">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled={true}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1 cursor-not-allowed"
                    />
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Enable stock management</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <ClockIcon className="h-3 w-3" />
                          Coming Soon
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">Show stock status and quantity columns in products table</div>
                    </div>
                  </label>

                  {/* Other inventory settings - all disabled when stock management is disabled */}
                  <div className="ml-7 space-y-4 border-l-2 border-gray-200 pl-4 opacity-50">
                    <label className="flex items-center cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={settings.inventory.trackQuantity}
                        disabled={true}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-500">Track product quantities</span>
                    </label>

                    <label className="flex items-center cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={settings.inventory.showStockWarnings}
                        disabled={true}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-500">Show low stock warnings</span>
                    </label>

                    <label className="flex items-center cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={settings.inventory.enableBackorders}
                        disabled={true}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-500">Allow backorders when out of stock</span>
                    </label>

                    <label className="flex items-center cursor-not-allowed">
                      <input
                        type="checkbox"
                        checked={settings.inventory.autoUpdateStock}
                        disabled={true}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed"
                      />
                      <span className="ml-2 text-sm text-gray-500">Automatically update stock when orders are placed</span>
                    </label>

                    <div className="cursor-not-allowed">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Low stock threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={settings.inventory.lowStockThreshold}
                        disabled={true}
                        className="block w-32 rounded-md border-0 py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 cursor-not-allowed bg-gray-50 sm:text-sm sm:leading-6"
                      />
                      <p className="mt-1 text-xs text-gray-400">Products with quantity at or below this number will show low stock warnings</p>
                    </div>
                  </div>

                  {/* Info message about stock management */}
                  <div className="rounded-md bg-blue-50 p-4 mt-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <CubeIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Stock Management Coming Soon</h4>
                        <p className="mt-1 text-sm text-blue-700">
                          Advanced inventory tracking, warehouse layouts, and stock management features are currently under development and will be available in a future update.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination Tab */}
          {activeTab === 'pagination' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Pagination Settings</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Orders per page</label>
                    <select
                      value={settings.pagination.ordersPerPage}
                      onChange={(e) => handleSettingChange('pagination', 'ordersPerPage', parseInt(e.target.value))}
                      className="mt-1 block w-32 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                      {PAGINATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Products per page</label>
                    <select
                      value={settings.pagination.productsPerPage}
                      onChange={(e) => handleSettingChange('pagination', 'productsPerPage', parseInt(e.target.value))}
                      className="mt-1 block w-32 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                      {PAGINATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.pagination.showPaginationInfo}
                      onChange={(e) => handleSettingChange('pagination', 'showPaginationInfo', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show pagination info</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.pagination.showJumpToPage}
                      onChange={(e) => handleSettingChange('pagination', 'showJumpToPage', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show jump to page</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Add other tab content sections here as needed */}
          {activeTab === 'display' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-lg font-medium text-gray-900">Display Settings</h3>
              <p className="text-sm text-gray-600">Configure how dates, times, and currency are displayed.</p>
            </div>
          )}

          {activeTab === 'table' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-lg font-medium text-gray-900">Table Settings</h3>
              <p className="text-sm text-gray-600">Customize table behavior and appearance.</p>
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-lg font-medium text-gray-900">Filter Settings</h3>
              <p className="text-sm text-gray-600">Configure filter behavior and defaults.</p>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-lg font-medium text-gray-900">Export Settings</h3>
              <p className="text-sm text-gray-600">Set default export formats and options.</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
              <p className="text-sm text-gray-600">Control how and when you receive notifications.</p>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-lg font-medium text-gray-900">Performance Settings</h3>
              <p className="text-sm text-gray-600">Optimize application performance and loading.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
