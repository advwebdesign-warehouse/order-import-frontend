//app/dashboard/warehouses/[id]/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWarehouses } from '../../context/WarehouseContext'
import { AVAILABLE_ORDER_STATUSES, OrderStatusSettings, DEFAULT_ORDER_STATUS_SETTINGS } from '../../utils/warehouseTypes'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function WarehouseSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const warehouseId = params.id as string
  const { warehouses, updateWarehouseOrderSettings, loading } = useWarehouses()
  const warehouse = warehouses.find(w => w.id === warehouseId)

  // Local state for form data
  const [orderSettings, setOrderSettings] = useState<OrderStatusSettings>(DEFAULT_ORDER_STATUS_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Initialize form data when warehouse loads
  useEffect(() => {
    if (warehouse?.settings?.orderStatusSettings) {
      setOrderSettings(warehouse.settings.orderStatusSettings)
    }
  }, [warehouse])

  // Track changes
  useEffect(() => {
    if (warehouse?.settings?.orderStatusSettings) {
      const hasChanges = JSON.stringify(orderSettings) !== JSON.stringify(warehouse.settings.orderStatusSettings)
      setHasChanges(hasChanges)
    }
  }, [orderSettings, warehouse?.settings?.orderStatusSettings])

  const handleStatusToggle = (status: string, category: 'toShipStatuses' | 'excludedStatuses' | 'completedStatuses') => {
    setOrderSettings(prev => {
      const currentStatuses = prev[category]
      const isCurrentlySelected = currentStatuses.includes(status)

      let newStatuses: string[]
      if (isCurrentlySelected) {
        newStatuses = currentStatuses.filter(s => s !== status)
      } else {
        newStatuses = [...currentStatuses, status]
      }

      return {
        ...prev,
        [category]: newStatuses
      }
    })
  }

  const handleDisplayTextChange = (value: string) => {
    setOrderSettings(prev => ({
      ...prev,
      displayText: value
    }))
  }

  const handleIncludeCompletedChange = (value: boolean) => {
    setOrderSettings(prev => ({
      ...prev,
      includeCompleted: value
    }))
  }

  const handleSave = async () => {
    if (!hasChanges) return

    try {
      setSaving(true)
      await updateWarehouseOrderSettings(warehouseId, orderSettings)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (warehouse?.settings?.orderStatusSettings) {
      setOrderSettings(warehouse.settings.orderStatusSettings)
    }
  }

  const handleResetToDefaults = () => {
    setOrderSettings(DEFAULT_ORDER_STATUS_SETTINGS)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Warehouse not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The warehouse you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    )
  }

  const StatusCheckbox = ({
    status,
    category,
    label
  }: {
    status: string
    category: 'toShipStatuses' | 'excludedStatuses' | 'completedStatuses'
    label: string
  }) => {
    const isChecked = orderSettings[category].includes(status)

    return (
      <label className="flex items-center space-x-3 py-2 hover:bg-gray-50 rounded px-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => handleStatusToggle(status, category)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-900">{status}</span>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </label>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            {warehouse.name} Settings
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure order status categorization and display preferences for this warehouse.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-x-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
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

      {/* Settings Content */}
      <div className="mt-8 space-y-8">
        {/* Display Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Display Settings</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Count Display Text
              </label>
              <input
                type="text"
                value={orderSettings.displayText}
                onChange={(e) => handleDisplayTextChange(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="e.g., orders to ship, pending shipments, awaiting fulfillment"
              />
              <p className="mt-1 text-xs text-gray-500">
                This text will appear in the order count display (e.g., "5 {orderSettings.displayText}")
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={orderSettings.includeCompleted}
                  onChange={(e) => handleIncludeCompletedChange(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-900">Include completed orders in count</span>
              </label>
              <p className="ml-7 text-xs text-gray-500">
                When enabled, completed orders will be included in the count display
              </p>
            </div>
          </div>
        </div>

        {/* Order Status Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders to Ship */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-green-700">
              Orders to Ship
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Orders with these statuses will be counted in the main display
            </p>
            <div className="space-y-1">
              {AVAILABLE_ORDER_STATUSES.map(status => (
                <StatusCheckbox
                  key={`toShip-${status}`}
                  status={status}
                  category="toShipStatuses"
                  label="Count in main display"
                />
              ))}
            </div>
          </div>

          {/* Excluded Orders */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-red-700">
              Excluded Orders
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Orders with these statuses will be excluded from all counts
            </p>
            <div className="space-y-1">
              {AVAILABLE_ORDER_STATUSES.map(status => (
                <StatusCheckbox
                  key={`excluded-${status}`}
                  status={status}
                  category="excludedStatuses"
                  label="Exclude from all counts"
                />
              ))}
            </div>
          </div>

          {/* Completed Orders */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-blue-700">
              Completed Orders
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Orders with these statuses are considered completed
            </p>
            <div className="space-y-1">
              {AVAILABLE_ORDER_STATUSES.map(status => (
                <StatusCheckbox
                  key={`completed-${status}`}
                  status={status}
                  category="completedStatuses"
                  label="Mark as completed"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Reset to Defaults */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Reset to Default Settings</h4>
              <p className="text-sm text-gray-500">
                Restore the original default configuration for order status categorization
              </p>
            </div>
            <button
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-x-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
          <p className="text-sm text-blue-700">
            With current settings, orders will be displayed as:
            <span className="font-semibold"> "X {orderSettings.displayText}"</span>
          </p>
          <div className="mt-2 text-xs text-blue-600">
            <div>• Orders to ship: {orderSettings.toShipStatuses.join(', ')}</div>
            <div>• Excluded: {orderSettings.excludedStatuses.join(', ') || 'None'}</div>
            <div>• Completed: {orderSettings.completedStatuses.join(', ')}</div>
            <div>• Include completed in count: {orderSettings.includeCompleted ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
