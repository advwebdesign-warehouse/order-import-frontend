//file path: app/dashboard/settings/components/tabs/FulfillmentTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import FulfillmentStatusTable from '../fulfillment/FulfillmentStatusTable'
import { FulfillmentStatus } from '../../types'
import { DEFAULT_FULFILLMENT_STATUSES } from '../../constants'

interface FulfillmentTabProps {
  onChanges: (hasChanges: boolean) => void
}

export default function FulfillmentTab({ onChanges }: FulfillmentTabProps) {
  const [statuses, setStatuses] = useState<FulfillmentStatus[]>([])
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Load fulfillment statuses from localStorage on mount
  useEffect(() => {
    const savedStatuses = localStorage.getItem('fulfillmentStatuses')
    if (savedStatuses) {
      setStatuses(JSON.parse(savedStatuses))
    } else {
      setStatuses(DEFAULT_FULFILLMENT_STATUSES)
    }
  }, [])

  const handleStatusesChange = (newStatuses: FulfillmentStatus[]) => {
    setStatuses(newStatuses)
    onChanges(true)
  }

  const handleSave = () => {
    localStorage.setItem('fulfillmentStatuses', JSON.stringify(statuses))
    onChanges(false)
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset fulfillment statuses to defaults?')) {
      setStatuses(DEFAULT_FULFILLMENT_STATUSES)
      onChanges(true)
    }
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h3 className="text-lg font-medium text-gray-900">Fulfillment Status Configuration</h3>
          <p className="mt-2 text-sm text-gray-700">
            Define fulfillment statuses and configure which ones indicate orders that need shipping.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3 flex">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
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
        onSave={handleSave}
      />

      {/* Help text */}
      <div className="mt-8 rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Understanding Fulfillment Statuses</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Needs Shipping:</strong> Enable this for statuses that indicate an order still needs to be shipped</li>
                <li><strong>System Statuses:</strong> Cannot be deleted but can be renamed and reconfigured</li>
                <li><strong>Custom Statuses:</strong> Can be added, edited, or removed as needed</li>
                <li>The order of statuses represents the typical fulfillment workflow</li>
                <li>Changes apply to the "Orders to Ship" count on the orders page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
