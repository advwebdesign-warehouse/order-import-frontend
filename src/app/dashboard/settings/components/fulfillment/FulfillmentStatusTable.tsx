//file path: app/dashboard/settings/components/fulfillment/FulfillmentStatusTable.tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import StatusRow from './StatusRow'
import AddStatusRow from './AddStatusRow'
import { FulfillmentStatus } from '../../types'

interface FulfillmentStatusTableProps {
  statuses: FulfillmentStatus[]
  isAddingNew: boolean
  onStatusesChange: (statuses: FulfillmentStatus[]) => void
  onCancelAdd: () => void
  isSaving?: boolean
}

export default function FulfillmentStatusTable({
  statuses,
  isAddingNew,
  onStatusesChange,
  onCancelAdd,
  isSaving = false
}: FulfillmentStatusTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddStatus = (newStatus: Partial<FulfillmentStatus>) => {
    if (!newStatus.label) return

    // Use a stable ID generation approach
    const newId = `status-${statuses.length + 1}-${newStatus.label.toLowerCase().replace(/\s+/g, '-')}`
    const maxSortOrder = Math.max(...statuses.map(s => s.sortOrder), 0)

    const statusToAdd: FulfillmentStatus = {
      id: newId,
      value: newStatus.label.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      label: newStatus.label!,
      color: newStatus.color!,
      needsShipping: newStatus.needsShipping!,
      needsPicking: newStatus.needsPicking ?? true,
      isSystem: false,
      sortOrder: maxSortOrder + 1
    }

    onStatusesChange([...statuses, statusToAdd])
    onCancelAdd()
  }

  const handleUpdateStatus = (updatedStatus: FulfillmentStatus) => {
    const newStatuses = statuses.map(s =>
      s.id === updatedStatus.id ? updatedStatus : s
    )
    onStatusesChange(newStatuses)
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = statuses.findIndex((s) => s.id === active.id)
      const newIndex = statuses.findIndex((s) => s.id === over.id)

      const newStatuses = arrayMove(statuses, oldIndex, newIndex)

      // Update sort orders
      const updatedStatuses = newStatuses.map((status, index) => ({
        ...status,
        sortOrder: index + 1
      }))

      // Call the same handler for all changes
      onStatusesChange(updatedStatuses)
    }
  }

  const sortedStatuses = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-8 flow-root relative">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg relative">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      <span className="sr-only">Order</span>
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
                      Needs Picking
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
                  <SortableContext
                    items={sortedStatuses.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedStatuses.map((status, index) => (
                      <StatusRow
                        key={status.id}
                        status={status}
                        index={index}
                        isEditing={editingId === status.id}
                        onEdit={() => setEditingId(status.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onSave={handleUpdateStatus}
                        onDelete={handleDeleteStatus}
                      />
                    ))}
                  </SortableContext>

                  {isAddingNew && (
                    <AddStatusRow
                      onAdd={handleAddStatus}
                      onCancel={onCancelAdd}
                    />
                  )}
                </tbody>
              </table>

              {/* Saving indicator overlay */}
              {isSaving && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-lg">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving changes...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  )
}
