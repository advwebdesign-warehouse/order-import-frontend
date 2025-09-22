//file path: app/dashboard/warehouses/[id]/layout/components/ZoneManager.tsx
'use client'

import { useState } from 'react'
import {
  PlusIcon,
  BuildingOffice2Icon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  RectangleStackIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { Zone, Aisle, Shelf, Bin } from '../../../utils/warehouseTypes'
import { getZoneTypeInfo } from '../utils/layoutConstants'

interface ZoneManagerProps {
  zones: Zone[]
  onCreateZone: () => void
  onEditZone: (zone: Zone) => void
  onDeleteZone: (zone: Zone) => void
  onCreateAisle: (zone: Zone) => void
  onEditAisle: (zone: Zone, aisle: Aisle) => void
  onDeleteAisle: (zone: Zone, aisle: Aisle) => void
  onCreateBin: (zone: Zone, aisle: Aisle, shelf: Shelf) => void
  onEditBin: (zone: Zone, aisle: Aisle, shelf: Shelf, bin: Bin) => void
  onDeleteBin: (zone: Zone, aisle: Aisle, shelf: Shelf, bin: Bin) => void
}

export default function ZoneManager({
  zones,
  onCreateZone,
  onEditZone,
  onDeleteZone,
  onCreateAisle,
  onEditAisle,
  onDeleteAisle,
  onCreateBin,
  onEditBin,
  onDeleteBin
}: ZoneManagerProps) {
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set())
  const [expandedAisles, setExpandedAisles] = useState<Set<string>>(new Set())
  const [showShelfBins, setShowShelfBins] = useState<Set<string>>(new Set())

  const handleToggleZone = (zone: Zone) => {
    const newExpanded = new Set(expandedZones)
    if (newExpanded.has(zone.id)) {
      newExpanded.delete(zone.id)
    } else {
      newExpanded.add(zone.id)
    }
    setExpandedZones(newExpanded)
  }

  const handleToggleAisle = (aisle: Aisle) => {
    const newExpanded = new Set(expandedAisles)
    if (newExpanded.has(aisle.id)) {
      newExpanded.delete(aisle.id)
    } else {
      newExpanded.add(aisle.id)
    }
    setExpandedAisles(newExpanded)
  }

  const handleToggleShelfBins = (shelf: Shelf) => {
    const newShowBins = new Set(showShelfBins)
    if (newShowBins.has(shelf.id)) {
      newShowBins.delete(shelf.id)
    } else {
      newShowBins.add(shelf.id)
    }
    setShowShelfBins(newShowBins)
  }

  const generateLocationCode = (zone: Zone, aisle: Aisle, shelf: Shelf, bin: Bin) => {
    return `${zone.code}-${aisle.code}-${shelf.code}-${bin.code}`
  }

  if (zones.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center">
          <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Zone Management</h3>
          <p className="mt-1 text-sm text-gray-500 mb-6">
            Create and manage warehouse zones for organizing different areas
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-medium text-blue-900">Storage Zones</h4>
              <p className="text-sm text-blue-700 mt-1">Main inventory areas with organized aisles and shelves</p>
            </div>
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-medium text-green-900">Receiving Zones</h4>
              <p className="text-sm text-green-700 mt-1">Areas for incoming shipments and inspection</p>
            </div>
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="font-medium text-yellow-900">Shipping Zones</h4>
              <p className="text-sm text-yellow-700 mt-1">Outbound preparation and loading areas</p>
            </div>
          </div>

          <button
            onClick={onCreateZone}
            className="mt-6 inline-flex items-center gap-x-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
          >
            <PlusIcon className="h-4 w-4" />
            Create Your First Zone
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Zone Management</h2>
          <p className="text-sm text-gray-600">Configure warehouse zones and manage aisles within each zone</p>
        </div>
        <button
          onClick={onCreateZone}
          className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
        >
          <PlusIcon className="h-4 w-4" />
          Create Zone
        </button>
      </div>

      {/* Zones with Aisle Management */}
      <div className="space-y-4">
        {zones.map((zone) => {
          const typeInfo = getZoneTypeInfo(zone.type)
          const TypeIcon = typeInfo.icon
          const isZoneExpanded = expandedZones.has(zone.id)

          return (
            <div key={zone.id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Zone Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                    >
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                      <p className="text-sm text-gray-500">Code: {zone.code} | Type: {typeInfo.label}</p>
                      {zone.description && (
                        <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleZone(zone)}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      <RectangleStackIcon className="h-4 w-4 mr-1" />
                      {zone.aisles.length} Aisle{zone.aisles.length !== 1 ? 's' : ''}
                      {isZoneExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      )}
                    </button>
                    <button
                      onClick={() => onEditZone(zone)}
                      className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit zone"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteZone(zone)}
                      className="rounded p-2 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      title="Delete zone"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Aisle List (Expandable) */}
              {isZoneExpanded && (
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Aisles in {zone.name}</h4>
                    <button
                      onClick={() => onCreateAisle(zone)}
                      className="inline-flex items-center gap-x-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add Aisle
                    </button>
                  </div>

                  {zone.aisles.length > 0 ? (
                    <div className="space-y-3">
                      {zone.aisles.map((aisle) => {
                        const isAisleExpanded = expandedAisles.has(aisle.id)

                        return (
                          <div key={aisle.id} className="bg-white rounded-lg border border-gray-200">
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                                    <RectangleStackIcon className="h-5 w-5 text-gray-600" />
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {aisle.name} ({aisle.code})
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {aisle.shelves?.length || 0} shelves •
                                      {aisle.width}×{aisle.length} {aisle.unit} •
                                      Max height: {aisle.maxHeight} {aisle.unit}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleToggleAisle(aisle)}
                                    className="text-xs text-indigo-600 hover:text-indigo-500"
                                  >
                                    {isAisleExpanded ? 'Hide' : 'Show'} Shelves
                                  </button>
                                  <button
                                    onClick={() => onEditAisle(zone, aisle)}
                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    title="Edit aisle"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteAisle(zone, aisle)}
                                    className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                                    title="Delete aisle"
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Shelves and Bins */}
                              {isAisleExpanded && aisle.shelves && aisle.shelves.length > 0 && (
                                <div className="mt-4 pl-11 space-y-2">
                                  {aisle.shelves.map((shelf) => {
                                    const isShelfExpanded = showShelfBins.has(shelf.id)

                                    return (
                                      <div key={shelf.id} className="border border-gray-200 rounded-md bg-gray-50">
                                        <div className="px-3 py-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                              <TableCellsIcon className="h-4 w-4 text-gray-500" />
                                              <span className="text-xs font-medium text-gray-700">
                                                {shelf.name} ({shelf.code}) - Level {shelf.level}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {shelf.bins.length} bin{shelf.bins.length !== 1 ? 's' : ''}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                              <button
                                                onClick={() => handleToggleShelfBins(shelf)}
                                                className="text-xs text-indigo-600 hover:text-indigo-500"
                                              >
                                                {isShelfExpanded ? 'Hide' : 'Show'} Bins
                                              </button>
                                              <button
                                                onClick={() => onCreateBin(zone, aisle, shelf)}
                                                className="rounded px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                                              >
                                                <PlusIcon className="h-3 w-3 inline" /> Add Bin
                                              </button>
                                            </div>
                                          </div>

                                          {/* Bins List */}
                                          {isShelfExpanded && (
                                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                                              {shelf.bins.length > 0 ? (
                                                shelf.bins.map((bin) => (
                                                  <div
                                                    key={bin.id}
                                                    className="flex items-center justify-between bg-white rounded px-2 py-1 border border-gray-200"
                                                  >
                                                    <div>
                                                      <div className="text-xs font-medium text-gray-900">
                                                        {bin.name}
                                                      </div>
                                                      <div className="text-xs text-gray-500">
                                                        {generateLocationCode(zone, aisle, shelf, bin)}
                                                      </div>
                                                      {bin.capacity && (
                                                        <div className="text-xs text-gray-400">
                                                          Cap: {bin.capacity}
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                      <button
                                                        onClick={() => onEditBin(zone, aisle, shelf, bin)}
                                                        className="text-gray-400 hover:text-gray-600"
                                                        title="Edit bin"
                                                      >
                                                        <PencilIcon className="h-3 w-3" />
                                                      </button>
                                                      <button
                                                        onClick={() => onDeleteBin(zone, aisle, shelf, bin)}
                                                        className="text-gray-400 hover:text-red-600"
                                                        title="Delete bin"
                                                      >
                                                        <TrashIcon className="h-3 w-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))
                                              ) : (
                                                <div className="col-span-full text-center py-2 text-xs text-gray-500">
                                                  No bins configured
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
                      <RectangleStackIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No aisles configured yet</p>
                      <button
                        onClick={() => onCreateAisle(zone)}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Add your first aisle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
