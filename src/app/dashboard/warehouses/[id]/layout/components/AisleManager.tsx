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
  const [currentZone, setCurrentZone] = useState<Zone | null>(selectedZone)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Aisle Management</h2>
          <p className="text-sm text-gray-600">Configure aisles, shelves, and bins within zones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Zone Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Zone</h3>
            <div className="space-y-2">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    currentZone?.id === zone.id
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded mr-2 flex-shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{zone.name}</div>
                      <div className="text-xs text-gray-500">{zone.aisles.length} aisles</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Aisle Content */}
        <div className="lg:col-span-3">
          {currentZone ? (
            <div className="space-y-4">
              {/* Zone Header */}
              <div className="bg-white shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-3"
                      style={{ backgroundColor: currentZone.color }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{currentZone.name}</h3>
                      <p className="text-sm text-gray-500">Code: {currentZone.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateAisle}
                    className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Aisle
                  </button>
                </div>
              </div>

              {/* Aisles List */}
              {currentZone.aisles.length > 0 ? (
                <div className="space-y-4">
                  {currentZone.aisles.map((aisle) => {
                    const isExpanded = expandedAisles.has(aisle.id)
                    const totalBins = aisle.shelves.reduce((sum, shelf) => sum + shelf.bins.length, 0)
                    const occupiedBins = aisle.shelves.reduce(
                      (sum, shelf) => sum + shelf.bins.filter(bin => (bin.currentStock || 0) > 0).length,
                      0
                    )

                    return (
                      <div key={aisle.id} className="bg-white shadow rounded-lg">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleAisleExpansion(aisle.id)}
                                className="mr-2 p-1 rounded hover:bg-gray-100"
                              >
                                {isExpanded ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                              <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{aisle.name}</h4>
                                <p className="text-xs text-gray-500">Code: {aisle.code}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-xs text-gray-500">
                                {aisle.shelves.length} shelves, {totalBins} bins
                                {totalBins > 0 && (
                                  <span className="ml-1">
                                    ({occupiedBins}/{totalBins} occupied)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEditAisle(aisle)}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                  title="Edit aisle"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAisle(aisle)}
                                  className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                  title="Delete aisle"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {aisle.description && (
                            <p className="mt-2 text-sm text-gray-600">{aisle.description}</p>
                          )}

                          {(aisle.maxHeight || aisle.width || aisle.length) && (
                            <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                              {aisle.maxHeight && (
                                <span>Height: {aisle.maxHeight} {aisle.unit}</span>
                              )}
                              {aisle.width && (
                                <span>Width: {aisle.width} {aisle.unit}</span>
                              )}
                              {aisle.length && (
                                <span>Length: {aisle.length} {aisle.unit}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Shelves and Bins */}
                        {isExpanded && aisle.shelves.length > 0 && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <div className="space-y-3">
                              {aisle.shelves.map((shelf) => (
                                <div key={shelf.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <RectangleStackIcon className="h-4 w-4 text-gray-400 mr-2" />
                                      <span className="text-sm font-medium text-gray-900">
                                        {shelf.name} (Level {shelf.level})
                                      </span>
                                      <span className="ml-2 text-xs text-gray-500">
                                        Code: {shelf.code}
                                      </span>
                                    </div>
                                    {shelf.maxWeight && (
                                      <span className="text-xs text-gray-500">
                                        Max: {shelf.maxWeight} {shelf.weightUnit}
                                      </span>
                                    )}
                                  </div>

                                  {shelf.bins.length > 0 && (
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                      {shelf.bins.map((bin) => (
                                        <div
                                          key={bin.id}
                                          className="bg-gray-50 border border-gray-200 rounded p-2 text-center hover:bg-gray-100 transition-colors"
                                        >
                                          <div className="flex items-center justify-center mb-1">
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
                <div className="bg-white shadow rounded-lg p-8 text-center">
                  <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No aisles configured</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by adding your first aisle to this zone.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={handleCreateAisle}
                      className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add First Aisle
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Select a zone</h3>
              <p className="mt-1 text-sm text-gray-500">Choose a zone from the left panel to manage its aisles.</p>
            </div>
          )}
        </div>
      </div>

      {/* Aisle Form Modal */}
      {showAisleModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handleSubmitAisle}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingAisle ? 'Edit Aisle' : 'Create New Aisle'}
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label htmlFor="aisle-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Aisle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="aisle-name"
                    required
                    value={aisleFormData.name}
                    onChange={(e) => setAisleFormData({ ...aisleFormData, name: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., Aisle 01"
                  />
                </div>

                <div>
                  <label htmlFor="aisle-code" className="block text-sm font-medium text-gray-700 mb-1">
                    Aisle Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="aisle-code"
                    required
                    maxLength={5}
                    value={aisleFormData.code}
                    onChange={(e) => setAisleFormData({ ...aisleFormData, code: e.target.value.toUpperCase() })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="e.g., 01, A1"
                  />
                </div>

                <div>
                  <label htmlFor="aisle-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="aisle-description"
                    rows={2}
                    value={aisleFormData.description}
                    onChange={(e) => setAisleFormData({ ...aisleFormData, description: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Optional description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="aisle-height" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Height
                    </label>
                    <input
                      type="number"
                      id="aisle-height"
                      min="0"
                      step="0.1"
                      value={aisleFormData.maxHeight || ''}
                      onChange={(e) => setAisleFormData({ ...aisleFormData, maxHeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="aisle-unit" className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      id="aisle-unit"
                      value={aisleFormData.unit}
                      onChange={(e) => setAisleFormData({ ...aisleFormData, unit: e.target.value as 'feet' | 'meters' })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="feet">Feet</option>
                      <option value="meters">Meters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAisleModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-500"
                >
                  {editingAisle ? 'Update Aisle' : 'Create Aisle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
