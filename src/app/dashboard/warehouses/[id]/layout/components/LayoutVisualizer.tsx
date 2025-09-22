//file path: app/dashboard/warehouses/[id]/layout/components/LayoutVisualizer.tsx
'use client'

import { useState } from 'react'
import { Zone, WarehouseLayout, Warehouse } from '../../../utils/warehouseTypes'
import { BuildingOffice2Icon, MapIcon } from '@heroicons/react/24/outline'

interface LayoutVisualizerProps {
  layout: WarehouseLayout | null
  warehouse: Warehouse
  onZoneSelect?: (zone: Zone) => void
}

export default function LayoutVisualizer({ layout, warehouse, onZoneSelect }: LayoutVisualizerProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'flow'>('grid')

  const handleZoneClick = (zone: Zone) => {
    setSelectedZoneId(zone.id)
    onZoneSelect?.(zone)
  }

  if (!layout || layout.zones.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No Layout to Display</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure zones and aisles to see the visual layout of your warehouse.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Layout Visualization</h2>
          <p className="text-sm text-gray-600">Visual representation of {warehouse.name} layout</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'grid'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'flow'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Flow View
          </button>
        </div>
      </div>

      {/* Layout Canvas */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 min-h-96">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {layout.zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => handleZoneClick(zone)}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedZoneId === zone.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedZoneId === zone.id ? undefined : `${zone.color}10`,
                    borderColor: selectedZoneId === zone.id ? undefined : zone.color
                  }}
                >
                  {/* Zone Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded mr-2"
                        style={{ backgroundColor: zone.color }}
                      />
                      <h3 className="text-sm font-semibold text-gray-900">{zone.name}</h3>
                    </div>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {zone.code}
                    </span>
                  </div>

                  {/* Zone Stats */}
                  <div className="space-y-1 mb-3">
                    <div className="text-xs text-gray-600">
                      {zone.aisles.length} aisle{zone.aisles.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-600">
                      {zone.aisles.reduce((sum, aisle) => sum + aisle.shelves.length, 0)} shelves
                    </div>
                    <div className="text-xs text-gray-600">
                      {zone.aisles.reduce((sum, aisle) =>
                        sum + aisle.shelves.reduce((shelfSum, shelf) => shelfSum + shelf.bins.length, 0), 0
                      )} bins
                    </div>
                  </div>

                  {/* Aisles Visualization */}
                  <div className="space-y-1">
                    {zone.aisles.slice(0, 3).map((aisle) => (
                      <div
                        key={aisle.id}
                        className="h-2 bg-white rounded-sm border border-gray-200 opacity-70"
                        title={`${aisle.name} - ${aisle.shelves.length} shelves`}
                      />
                    ))}
                    {zone.aisles.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{zone.aisles.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Zone Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${zone.color}20`,
                        color: zone.color
                      }}
                    >
                      {zone.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Flow View */
            <div className="relative">
              {/* Simple Flow Layout */}
              <div className="flex flex-wrap gap-6 items-start justify-center">
                {layout.zones.map((zone, index) => (
                  <div key={zone.id} className="relative">
                    {/* Connection Line */}
                    {index > 0 && (
                      <div className="absolute -left-3 top-1/2 w-6 h-0.5 bg-gray-300 transform -translate-y-1/2" />
                    )}

                    <div
                      onClick={() => handleZoneClick(zone)}
                      className={`relative rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg min-w-48 ${
                        selectedZoneId === zone.id
                          ? 'border-2 border-indigo-500 bg-indigo-50'
                          : 'border-2 border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      style={{
                        backgroundColor: selectedZoneId === zone.id ? undefined : `${zone.color}05`,
                        borderColor: selectedZoneId === zone.id ? undefined : `${zone.color}40`
                      }}
                    >
                      {/* Zone Icon and Title */}
                      <div className="text-center mb-4">
                        <div
                          className="w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center"
                          style={{ backgroundColor: `${zone.color}20` }}
                        >
                          <BuildingOffice2Icon
                            className="h-6 w-6"
                            style={{ color: zone.color }}
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                        <p className="text-xs text-gray-500">{zone.code}</p>
                      </div>

                      {/* Zone Details */}
                      <div className="space-y-2 text-center">
                        <div className="text-sm text-gray-600">
                          {zone.aisles.length} Aisles
                        </div>
                        <div className="text-xs text-gray-500">
                          {zone.aisles.reduce((sum, aisle) => sum + aisle.shelves.length, 0)} Shelves
                        </div>
                        <div className="text-xs text-gray-500">
                          {zone.aisles.reduce((sum, aisle) =>
                            sum + aisle.shelves.reduce((shelfSum, shelf) => shelfSum + shelf.bins.length, 0), 0
                          )} Bins
                        </div>
                      </div>

                      {/* Zone Type */}
                      <div className="mt-3 text-center">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${zone.color}15`,
                            color: zone.color
                          }}
                        >
                          {zone.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone Details Panel */}
      {selectedZoneId && (
        <div className="bg-white shadow rounded-lg p-6">
          {(() => {
            const selectedZone = layout.zones.find(z => z.id === selectedZoneId)
            if (!selectedZone) return null

            return (
              <div>
                <div className="flex items-center mb-4">
                  <div
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: selectedZone.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">{selectedZone.name}</h3>
                  <span className="ml-2 text-sm text-gray-500">({selectedZone.code})</span>
                </div>

                {selectedZone.description && (
                  <p className="text-sm text-gray-600 mb-4">{selectedZone.description}</p>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{selectedZone.aisles.length}</div>
                    <div className="text-sm text-gray-500">Aisles</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedZone.aisles.reduce((sum, aisle) => sum + aisle.shelves.length, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Shelves</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedZone.aisles.reduce((sum, aisle) =>
                        sum + aisle.shelves.reduce((shelfSum, shelf) => shelfSum + shelf.bins.length, 0), 0
                      )}
                    </div>
                    <div className="text-sm text-gray-500">Bins</div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
