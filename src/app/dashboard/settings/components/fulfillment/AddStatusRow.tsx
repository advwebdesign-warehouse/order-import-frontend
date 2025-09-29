//file path: app/dashboard/settings/components/fulfillment/AddStatusRow.tsx
'use client'

import { useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FulfillmentStatus } from '../../types'
import { AVAILABLE_COLORS } from '../../constants'

interface AddStatusRowProps {
  onAdd: (status: Partial<FulfillmentStatus>) => void
  onCancel: () => void
}

export default function AddStatusRow({ onAdd, onCancel }: AddStatusRowProps) {
  const [newStatus, setNewStatus] = useState<Partial<FulfillmentStatus>>({
    label: '',
    color: 'bg-gray-100 text-gray-800',
    needsShipping: true,
    needsPicking: true
  })

  const handleAdd = () => {
    if (!newStatus.label) return
    onAdd(newStatus)
    setNewStatus({
      label: '',
      color: 'bg-gray-100 text-gray-800',
      needsShipping: true,
      needsPicking: true
    })
  }

  return (
    <tr className="bg-yellow-50">
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-5 h-5" /> {/* Placeholder for drag handle */}
          <span className="ml-3 text-gray-500">New</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <input
          type="text"
          placeholder="e.g., Quality Check"
          value={newStatus.label || ''}
          onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          autoFocus
        />
        {newStatus.label && (
          <div className="text-xs text-gray-500 font-mono mt-1">
            Will create: {newStatus.label.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <select
          value={newStatus.color || 'bg-gray-100 text-gray-800'}
          onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {AVAILABLE_COLORS.map(color => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <input
          type="checkbox"
          checked={newStatus.needsShipping || false}
          onChange={(e) => setNewStatus({ ...newStatus, needsShipping: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        <input
          type="checkbox"
          checked={newStatus.needsPicking ?? true}
          onChange={(e) => setNewStatus({ ...newStatus, needsPicking: e.target.checked })}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
          Custom
        </span>
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={handleAdd}
            disabled={!newStatus.label}
            className="text-green-600 hover:text-green-900 disabled:opacity-50"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
