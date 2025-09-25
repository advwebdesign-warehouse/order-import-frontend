//file path: app/dashboard/settings/components/fulfillment/FulfillmentStatusTable.tsx
'use client'

import { useState } from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import StatusRow from './StatusRow'
import AddStatusRow from './AddStatusRow'
import { FulfillmentStatus } from '../../types'

interface FulfillmentStatusTableProps {
  statuses: FulfillmentStatus[]
  isAddingNew: boolean
  onStatusesChange: (statuses: FulfillmentStatus[]) => void
  onCancelAdd: () => void
  onSave: () => void
}

export default function FulfillmentStatusTable({
  statuses,
  isAddingNew,
  onStatusesChange,
  onCancelAdd,
  onSave
}: FulfillmentStatusTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAddStatus = (newStatus: Partial<FulfillmentStatus>) => {
    if (!newStatus.label) return

    const newId = Date.now().toString()
    const maxSortOrder = Math.max(...statuses.map(s => s.sortOrder), 0)

    const statusToAdd: FulfillmentStatus = {
      id: newId,
      value: newStatus.label.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      label: newStatus.label!,
      color: newStatus.color!,
      needsShipping: newStatus.needsShipping!,
      isSystem: false,
      sortOrder: maxSortOrder + 1
    }

    onStatusesChange([...statuses, statusToAdd])
    onCancelAdd()
  }

  const handleUpdateStatus = (updatedStatus: FulfillmentStatus) => {
    onStatusesChange(statuses.map(s =>
      s.id === updatedStatus.id ? updatedStatus : s
    ))
    setEditingId(null)
  }

  const handleDeleteStatus = (id: string) => {
    const status = statuses.find(s => s.id === id)
    if (status?.isSystem) {
      alert('System statuses cannot be deleted')
      return
    }

    if (confirm('Are you sure you want to delete this status?')) {
      onStatusesChange(statuses.filter(s => s.id !== id))
    }
  }

  const handleMoveStatus = (id: string, direction: 'up' | 'down') => {
    const index = statuses.findIndex(s => s.id === id)
    if (index === -1) return

    const newStatuses = [...statuses]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= statuses.length) return

    // Swap sort orders with explicit type casting
    const tempSortOrder: number = newStatuses[index].sortOrder
    newStatuses[index] = {
      ...newStatuses[index],
      sortOrder: newStatuses[newIndex].sortOrder
    }
    newStatuses[newIndex] = {
      ...newStatuses[newIndex],
      sortOrder: tempSortOrder
    }

    // Swap positions in array
    const tempStatus = newStatuses[index]
    newStatuses[index] = newStatuses[newIndex]
    newStatuses[newIndex] = tempStatus

    onStatusesChange(newStatuses)
  }

  const sortedStatuses = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Order
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Label
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Color
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Needs Shipping
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Type
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedStatuses.map((status, index) => (
                  <StatusRow
                    key={status.id}
                    status={status}
                    index={index}
                    isEditing={editingId === status.id}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedStatuses.length - 1}
                    onEdit={() => setEditingId(status.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={handleUpdateStatus}
                    onDelete={handleDeleteStatus}
                    onMove={handleMoveStatus}
                  />
                ))}

                {isAddingNew && (
                  <AddStatusRow
                    onAdd={handleAddStatus}
                    onCancel={onCancelAdd}
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
