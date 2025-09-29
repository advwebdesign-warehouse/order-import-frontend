//file path: app/dashboard/settings/components/tabs/FulfillmentTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import FulfillmentStatusTable from '../fulfillment/FulfillmentStatusTable'
import { FulfillmentStatus } from '../../types'
import { DEFAULT_FULFILLMENT_STATUSES } from '../../constants'

interface FulfillmentTabProps {
  onChanges?: (hasChanges: boolean) => void
}

export default function FulfillmentTab({ onChanges }: FulfillmentTabProps) {
  const [statuses, setStatuses] = useState<FulfillmentStatus[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Now waits until after hydration completes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStatuses()
      if (onChanges) {
        onChanges(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const loadStatuses = () => {
    const savedStatuses = localStorage.getItem('fulfillmentStatuses')
    if (savedStatuses) {
      try {
        const parsed = JSON.parse(savedStatuses)
        // Migrate old data if needsPicking field doesn't exist
        const migratedStatuses = parsed.map((status: any) => ({
          ...status,
          needsPicking: status.needsPicking !== undefined
            ? status.needsPicking
            : ['PENDING', 'ASSIGNED', 'PROCESSING'].includes(status.value)
        }))
        setStatuses(migratedStatuses)
      } catch (error) {
        console.error('Error loading fulfillment statuses:', error)
        setStatuses(DEFAULT_FULFILLMENT_STATUSES)
      }
    } else {
      setStatuses(DEFAULT_FULFILLMENT_STATUSES)
    }
  }

  const saveStatuses = async (newStatuses: FulfillmentStatus[]) => {
    setIsSaving(true)

    try {
      // Save to localStorage immediately
      localStorage.setItem('fulfillmentStatuses', JSON.stringify(newStatuses))
      console.log('Saved to localStorage:', newStatuses)

      // In production, replace with your API call:
      // await fetch('/api/account/fulfillment-statuses', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ statuses: newStatuses })
      // })

      // Simulate network delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300))

      setLastSaved(new Date())

      // Tell parent there are no unsaved changes
      if (onChanges) {
        onChanges(false)
      }
    } catch (error) {
      console.error('Error saving fulfillment statuses:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Single handler for all changes - always auto-saves
  const handleStatusesChange = (newStatuses: FulfillmentStatus[]) => {
    setStatuses(newStatuses)
    // Auto-save on every change
    saveStatuses(newStatuses)
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset fulfillment statuses to defaults?')) {
      handleStatusesChange(DEFAULT_FULFILLMENT_STATUSES)
    }
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h3 className="text-lg font-medium text-gray-900">Fulfillment Status Configuration</h3>
          <p className="mt-2 text-sm text-gray-700">
            Define fulfillment statuses and configure which ones indicate orders that need shipping and picking.
          </p>
          {lastSaved && (
            <p className="mt-1 text-xs text-gray-500">
              Auto-saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3 flex items-center">
          {isSaving && (
            <div className="flex items-center text-sm text-gray-500">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </div>
          )}
          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={isSaving}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            disabled={isSaving}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Status
          </button>
        </div>
      </div>

      <FulfillmentStatusTable
        statuses={statuses}
        isAddingNew={isAddingNew}
        onStatusesChange={handleStatusesChange}
        onCancelAdd={() => setIsAddingNew(false)}
        isSaving={isSaving}
      />

      {/* Help text */}
      <div className="mt-8 rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Understanding Fulfillment Statuses</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Needs Shipping:</strong> Enable this for statuses that indicate an order still needs to be shipped</li>
                <li><strong>Needs Picking:</strong> Enable this for statuses that indicate an order still needs items to be picked from the warehouse</li>
                <li><strong>System Statuses:</strong> Cannot be deleted but can be renamed and reconfigured</li>
                <li><strong>Custom Statuses:</strong> Can be added, edited, or removed as needed</li>
                <li><strong>Auto-Save:</strong> All changes are saved automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
