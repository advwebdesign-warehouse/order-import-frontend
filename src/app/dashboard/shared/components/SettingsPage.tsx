// app/dashboard/settings/page.tsx
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
  CheckIcon
} from '@heroicons/react/24/outline'
import { UserSettings, DEFAULT_USER_SETTINGS, PAGINATION_OPTIONS, CURRENCY_OPTIONS } from '../utils/settingsTypes'
import { useSettings } from '../hooks/useSettings'

const SETTINGS_TABS = [
  { id: 'pagination', name: 'Pagination', icon: TableCellsIcon },
  { id: 'display', name: 'Display', icon: EyeIcon },
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

  const renderPaginationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Items Per Page</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Orders per page</label>
            <select
              value={settings.pagination.ordersPerPage}
              onChange={(e) => handleSettingChange('pagination', 'ordersPerPage', parseInt(e.target.value))}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {PAGINATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Products per page</label>
            <select
              value={settings.pagination.productsPerPage}
              onChange={(e) => handleSettingChange('pagination', 'productsPerPage', parseInt(e.target.value))}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {PAGINATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pagination Options</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.pagination.showPaginationInfo}
              onChange={(e) => handleSettingChange('pagination', 'showPaginationInfo', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show pagination information (e.g., "Showing 1-20 of 100")</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.pagination.showJumpToPage}
              onChange={(e) => handleSettingChange('pagination', 'showJumpToPage', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Enable "Jump to page" functionality</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Date & Time Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date format</label>
            <select
              value={settings.display.dateFormat}
              onChange={(e) => handleSettingChange('display', 'dateFormat', e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="US">US Format (MM/DD/YYYY)</option>
              <option value="EU">EU Format (DD/MM/YYYY)</option>
              <option value="ISO">ISO Format (YYYY-MM-DD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time format</label>
            <select
              value={settings.display.timeFormat}
              onChange={(e) => handleSettingChange('display', 'timeFormat', e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="12h">12-hour (3:30 PM)</option>
              <option value="24h">24-hour (15:30)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default currency</label>
            <select
              value={settings.display.currency}
              onChange={(e) => handleSettingChange('display', 'currency', e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {CURRENCY_OPTIONS.map(currency => (
                <option key={currency.value} value={currency.value}>{currency.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency position</label>
            <select
              value={settings.display.currencyPosition}
              onChange={(e) => handleSettingChange('display', 'currencyPosition', e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="before">Before amount ($100.00)</option>
              <option value="after">After amount (100.00 $)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTableSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Table Behavior</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.table.enableColumnReordering}
              onChange={(e) => handleSettingChange('table', 'enableColumnReordering', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Enable column reordering (drag & drop)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.table.saveColumnState}
              onChange={(e) => handleSettingChange('table', 'saveColumnState', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Remember column visibility and order</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.table.stickyHeaders}
              onChange={(e) => handleSettingChange('table', 'stickyHeaders', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Sticky table headers when scrolling</span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Options</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.table.alternateRowColors}
              onChange={(e) => handleSettingChange('table', 'alternateRowColors', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Alternate row colors (zebra striping)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.table.compactMode}
              onChange={(e) => handleSettingChange('table', 'compactMode', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Compact mode (smaller row height)</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.table.showRowNumbers}
              onChange={(e) => handleSettingChange('table', 'showRowNumbers', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show row numbers</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'pagination':
        return renderPaginationSettings()
      case 'display':
        return renderDisplaySettings()
      case 'table':
        return renderTableSettings()
      default:
        return <div className="text-center py-8 text-gray-500">Settings panel for {activeTab} coming soon...</div>
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Settings</h1>
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
        <div className="mt-4 rounded-md bg-green-50 p-4">
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
                    } flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
            <div className="px-4 py-6 sm:p-8">
              {renderCurrentTab()}

              {/* Section Reset Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleResetSection(activeTab as keyof UserSettings)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Reset {SETTINGS_TABS.find(t => t.id === activeTab)?.name} to defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
