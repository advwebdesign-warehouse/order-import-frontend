//file path: app/dashboard/warehouses/[id]/layout/components/AisleManager.tsx
'use client'

import { useState } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { Zone, Aisle, Shelf, Bin } from '../../../utils/warehouseTypes'

interface AisleManagerProps {
  zones: Zone[]
  selectedZone: Zone | null
  onCreateAisle: (zoneId: string, aisle: Partial<Aisle>) => Promise<void>
  onUpdateAisle: (zoneId: string, aisleId: string, updates: Partial<Aisle>) => Promise<void>
  onDeleteAisle: (zoneId: string, aisleId: string) => Promise<void>
}

interface AisleFormData {
  name: string
  code: string
  description: string
  maxHeight?: number
  width?: number
  length?: number
  unit: 'feet' | 'meters'
}

export default function AisleManager({
  zones,
  selectedZone,
  onCreateAisle,
  onUpdateAisle,
  onDeleteAisle
}: AisleManagerProps) {
  // Filter to only show storage zones since only they have aisles
  const storageZones = zones.filter(zone => zone.type === 'storage')

  const [currentZone, setCurrentZone] = useState<Zone | null>(
    selectedZone && selectedZone.type === 'storage' ? selectedZone : storageZones[0] || null
  )
  const [expandedAisles, setExpandedAisles] = useState<Set<string>>(new Set())
  const [showAisleModal, setShowAisleModal] = useState(false)
  const [editingAisle, setEditingAisle] = useState<Aisle | null>(null)
  const [aisleFormData, setAisleFormData] = useState<AisleFormData>({
    name: '',
    code: '',
    description: '',
    maxHeight: undefined,
    width: undefined,
    length: undefined,
    unit: 'feet'
  })

  const resetAisleForm = () => {
    setAisleFormData({
      name: '',
      code: '',
      description: '',
      maxHeight: undefined,
      width: undefined,
      length: undefined,
      unit: 'feet'
    })
  }

  const handleZoneSelect = (zone: Zone) => {
    setCurrentZone(zone)
  }

  const toggleAisleExpansion = (aisleId: string) => {
    const newExpanded = new Set(expandedAisles)
    if (newExpanded.has(aisleId)) {
      newExpanded.delete(aisleId)
    } else {
      newExpanded.add(aisleId)
    }
    setExpandedAisles(newExpanded)
  }

  const handleCreateAisle = () => {
    if (!currentZone) return
    setEditingAisle(null)
    resetAisleForm()
    setShowAisleModal(true)
  }

  const handleEditAisle = (aisle: Aisle) => {
    setEditingAisle(aisle)
    setAisleFormData({
      name: aisle.name,
      code: aisle.code,
      description: aisle.description || '',
      maxHeight: aisle.maxHeight,
      width: aisle.width,
      length: aisle.length,
      unit: aisle.unit || 'feet'
    })
    setShowAisleModal(true)
  }

  const handleSubmitAisle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentZone) return

    try {
      if (editingAisle) {
        await onUpdateAisle(currentZone.id, editingAisle.id, aisleFormData)
      } else {
        await onCreateAisle(currentZone.id, aisleFormData)
      }
      setShowAisleModal(false)
      resetAisleForm()
    } catch (error) {
      console.error('Error saving aisle:', error)
    }
  }

  const handleDeleteAisle = async (aisle: Aisle) => {
    if (!currentZone) return

    const totalShelvesAndBins = aisle.shelves.reduce((sum, shelf) => sum + shelf.bins.length, 0) + aisle.shelves.length

    if (totalShelvesAndBins > 0) {
      if (!confirm(`Aisle "${aisle.name}" contains ${aisle.shelves.length} shelves and ${totalShelvesAndBins - aisle.shelves.length} bins. Deleting this aisle will also delete all its contents. Are you sure?`)) {
        return
      }
    } else if (!confirm(`Are you sure you want to delete aisle "${aisle.name}"?`)) {
      return
    }

    try {
      await onDeleteAisle(currentZone.id, aisle.id)
    } catch (error) {
      console.error('Error deleting aisle:', error)
    }
  }

  const renderBinStatus = (bin: Bin) => {
    const isOccupied = (bin.currentStock || 0) > 0
    const isReserved = bin.reserved
    const capacity = bin.capacity || 0
    const currentStock = bin.currentStock || 0
    const utilizationPercent = capacity > 0 ? Math.round((currentStock / capacity) * 100) : 0

    let statusClass = 'bg-green-100 text-green-800'
    let statusText = 'Empty'

    if (isReserved) {
      statusClass = 'bg-yellow-100 text-yellow-800'
      statusText = 'Reserved'
    } else if (utilizationPercent >= 90) {
      statusClass = 'bg-red-100 text-red-800'
      statusText = 'Full'
    } else if (utilizationPercent > 0) {
      statusClass = 'bg-blue-100 text-blue-800'
      statusText = `${utilizationPercent}%`
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
        {statusText}
      </span>
    )
  }

  // If no storage zones exist
  if (storageZones.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900">No Storage Zones</h3>
        <p className="mt-1 text-sm text-gray-500">
          Create a storage zone first to manage aisles, shelves, and bins.
        </p>
        <p className="mt-3 text-xs text-gray-400">
          Only storage zones can have aisles. Other zone types (shipping, receiving, etc.) don't require aisle management.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Aisle Management</h2>
          <p className="text-sm text-gray-600">Configure aisles, shelves, and bins within storage zones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Zone Selector - Storage Zones Only */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Storage Zones</h3>
            <div className="space-y-2">
              {storageZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentZone?.id === zone.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-300'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="font-medium">{zone.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{zone.aisles.length} aisles</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aisle Details */}
        <div className="lg:col-span-3">
          {currentZone ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: currentZone.color }}
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentZone.name} - {currentZone.code}
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      Storage Zone
                    </span>
                  </div>
                  <button
                    onClick={handleCreateAisle}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Aisle
                  </button>
                </div>
                {currentZone.description && (
                  <p className="mt-2 text-sm text-gray-600">{currentZone.description}</p>
                )}
              </div>

              {currentZone.aisles.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {currentZone.aisles.map((aisle) => {
                    const isExpanded = expandedAisles.has(aisle.id)
                    const totalShelves = aisle.shelves.length
                    const totalBins = aisle.shelves.reduce((sum, shelf) => sum + shelf.bins.length, 0)

                    return (
                      <div key={aisle.id} className="hover:bg-gray-50">
                        <div className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => toggleAisleExpansion(aisle.id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronRightIcon className="h-5 w-5" />
                                )}
                              </button>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {aisle.name} - {aisle.code}
                                </h4>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-xs text-gray-500">
                                    <RectangleStackIcon className="inline h-3 w-3 mr-1" />
                                    {totalShelves} shelves
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    <ArchiveBoxIcon className="inline h-3 w-3 mr-1" />
                                    {totalBins} bins
                                  </span>
                                  {aisle.maxHeight && (
                                    <span className="text-xs text-gray-500">
                                      Height: {aisle.maxHeight} {aisle.unit || 'ft'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditAisle(aisle)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAisle(aisle)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded && aisle.shelves.length > 0 && (
                          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              {aisle.shelves.map((shelf) => (
                                <div key={shelf.id} className="bg-white rounded-md border border-gray-200 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-gray-900">
                                      {shelf.name} - {shelf.code} (Level {shelf.level})
                                    </div>
                                    <span className="text-xs text-gray-500">{shelf.bins.length} bins</span>
                                  </div>
                                  {shelf.bins.length > 0 && (
                                    <div className="grid grid-cols-6 gap-2">
                                      {shelf.bins.map((bin) => (
                                        <div
                                          key={bin.id}
                                          className="border border-gray-200 rounded p-2 text-center hover:shadow-sm"
                                        >
                                          <div className="flex items-center justify-center">
                                            <ArchiveBoxIcon className="h-3 w-3 text-gray-400" />
                                          </div>
                                          <div className="text-xs font-medium text-gray-900">{bin.code}</div>
                                          <div className="mt-1">{renderBinStatus(bin)}</div>
                                          {bin.capacity && (
                                            <div className="text-xs text-gray-500 mt-1">
                                              {bin.currentStock || 0}/{bin.capacity}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {isExpanded && aisle.shelves.length === 0 && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50 text-center text-sm text-gray-500">
                            No shelves configured for this aisle
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No aisles configured</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first aisle to this zone.
                  </p>
                  <button
                    onClick={handleCreateAisle}
                    className="mt-4 inline-flex items-center gap-x-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add First Aisle
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Select a storage zone</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a storage zone from the list to manage its aisles
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Aisle Form Modal */}
      {showAisleModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAisle ? 'Edit Aisle' : 'Create New Aisle'}
            </h3>
            <form onSubmit={handleSubmitAisle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Aisle Name</label>
                <input
                  type="text"
                  required
                  value={aisleFormData.name}
                  onChange={(e) => setAisleFormData({ ...aisleFormData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., Aisle A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Aisle Code</label>
                <input
                  type="text"
                  required
                  value={aisleFormData.code}
                  onChange={(e) => setAisleFormData({ ...aisleFormData, code: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g., A01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={aisleFormData.description}
                  onChange={(e) => setAisleFormData({ ...aisleFormData, description: e.target.value })}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Height</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={aisleFormData.maxHeight || ''}
                    onChange={(e) => setAisleFormData({ ...aisleFormData, maxHeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <select
                    value={aisleFormData.unit}
                    onChange={(e) => setAisleFormData({ ...aisleFormData, unit: e.target.value as 'feet' | 'meters' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="feet">Feet</option>
                    <option value="meters">Meters</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAisleModal(false)
                    resetAisleForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {editingAisle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
