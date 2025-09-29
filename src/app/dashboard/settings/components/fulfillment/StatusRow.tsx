//file path: app/dashboard/settings/components/fulfillment/StatusRow.tsx
'use client'

import { useState } from 'react'
import {
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FulfillmentStatus } from '../../types'
import { AVAILABLE_COLORS } from '../../constants'

interface StatusRowProps {
  status: FulfillmentStatus
  index: number
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (status: FulfillmentStatus) => void
  onDelete: (id: string) => void
}

export default function StatusRow({
  status,
  index,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete
}: StatusRowProps) {
  const [editingStatus, setEditingStatus] = useState<FulfillmentStatus>(status)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    if (!editingStatus.label) return
    onSave({
      ...editingStatus,
      value: editingStatus.label.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    })
  }

  const handleStartEdit = () => {
    setEditingStatus(status)
    onEdit()
  }

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <div className="flex items-center">
          <button
            type="button"
            className="cursor-move text-gray-400 hover:text-gray-600"
            {...attributes}
            {...listeners}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <span className="ml-3 text-gray-500">{index + 1}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
        {isEditing ? (
          <input
            type="text"
            value={editingStatus.label}
            onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="e.g., Ready to Ship"
          />
        ) : (
          <div>
            <div className="font-medium">{status.label}</div>
            <div className="text-xs text-gray-500 font-mono">{status.value}</div>
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm">
        {isEditing ? (
          <select
            value={editingStatus.color}
            onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {AVAILABLE_COLORS.map(color => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        ) : (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {isEditing ? (
          <input
            type="checkbox"
            checked={editingStatus.needsShipping}
            onChange={(e) => setEditingStatus({ ...editingStatus, needsShipping: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        ) : (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            status.needsShipping
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {status.needsShipping ? 'Yes' : 'No'}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        {isEditing ? (
          <input
            type="checkbox"
            checked={editingStatus.needsPicking ?? true}
            onChange={(e) => setEditingStatus({ ...editingStatus, needsPicking: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        ) : (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            status.needsPicking
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {status.needsPicking ? 'Yes' : 'No'}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
          status.isSystem
            ? 'bg-purple-100 text-purple-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {status.isSystem ? 'System' : 'Custom'}
        </span>
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        {isEditing ? (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-900"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onCancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={handleStartEdit}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            {!status.isSystem && (
              <button
                onClick={() => onDelete(status.id)}
                className="text-red-600 hover:text-red-900"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  )
}
