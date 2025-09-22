//file path: app/dashboard/warehouses/[id]/layout/components/VisualLayoutMap.tsx
'use client'

import { useState } from 'react'
import { MapIcon } from '@heroicons/react/24/outline'
import { Zone } from '../../../utils/warehouseTypes'
import { getZoneTypeInfo } from '../utils/layoutConstants'

interface VisualLayoutMapProps {
  zones: Zone[]
  zonePositions: {[key: string]: {x: number, y: number}}
  selectedZoneId: string | null
  onZonePositionsChange: (positions: {[key: string]: {x: number, y: number}}) => void
  onZonePositionsUpdate: (positions: {[key: string]: {x: number, y: number}}) => void
  onZoneSelect: (zoneId: string | null) => void
  onEditZone: (zone: Zone) => void
  onManageAisles: (zone: Zone) => void
  onShowDetailMap: (zoneId: string) => void
}

export default function VisualLayoutMap({
  zones,
  zonePositions,
  selectedZoneId,
  onZonePositionsChange,
  onZonePositionsUpdate,
  onZoneSelect,
  onEditZone,
  onManageAisles,
  onShowDetailMap
}: VisualLayoutMapProps) {
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})

  const handleResetLayout = () => {
    const newPositions: {[key: string]: {x: number, y: number}} = {}
    zones.forEach((zone, index) => {
      newPositions[zone.id] = {
        x: (index % 3) * 250 + 50,
        y: Math.floor(index / 3) * 200 + 50
      }
    })
    onZonePositionsChange(newPositions)
    onZonePositionsUpdate(newPositions)
  }

  if (zones.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Warehouse Layout Map</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create zones to see them visualized on the warehouse map
          </p>
        </div>
        <div className="p-12 text-center">
          <MapIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Zones Created</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create zones to see them on the warehouse map
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Warehouse Layout Map</h3>
            <p className="text-sm text-gray-600 mt-1">
              Drag zones to arrange your warehouse layout. Click a zone to see details.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetLayout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Reset Layout
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Map Canvas */}
        <div
          className="relative bg-gray-50 overflow-hidden"
          style={{ height: '600px' }}
          onMouseMove={(e) => {
            if (isDragging) {
              const rect = e.currentTarget.getBoundingClientRect()
              const newX = e.clientX - rect.left - dragOffset.x
              const newY = e.clientY - rect.top - dragOffset.y

              // Keep within bounds
              const boundedX = Math.max(0, Math.min(newX, rect.width - 200))
              const boundedY = Math.max(0, Math.min(newY, rect.height - 140))

              // Only update positions in state, don't persist yet
              onZonePositionsChange({
                ...zonePositions,
                [isDragging]: { x: boundedX, y: boundedY }
              })
            }
          }}
          onMouseUp={() => {
            if (isDragging) {
              // Persist the final positions when dragging ends
              onZonePositionsUpdate({
                ...zonePositions,
                [isDragging]: zonePositions[isDragging]
              })
              setIsDragging(null)
            }
          }}
          onMouseLeave={() => {
            if (isDragging) {
              // Persist the final positions when leaving the area
              onZonePositionsUpdate({
                ...zonePositions,
                [isDragging]: zonePositions[isDragging]
              })
              setIsDragging(null)
            }
          }}
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(to right, #6B7280 1px, transparent 1px),
                linear-gradient(to bottom, #6B7280 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Zone Cards */}
          {zones.map((zone) => {
            const position = zonePositions[zone.id] || { x: 50, y: 50 }
            const typeInfo = getZoneTypeInfo(zone.type)
            const TypeIcon = typeInfo.icon
            const totalBins = zone.aisles.reduce((sum, aisle) =>
              sum + (aisle.shelves?.reduce((shelfSum, shelf) =>
                shelfSum + (shelf.bins?.length || 0), 0) || 0), 0)
            const occupiedBins = zone.aisles.reduce((sum, aisle) =>
              sum + (aisle.shelves?.reduce((shelfSum, shelf) =>
                shelfSum + (shelf.bins?.filter(b => b.currentStock && b.currentStock > 0).length || 0), 0) || 0), 0)

            return (
              <div
                key={zone.id}
                className={`absolute transition-shadow group ${
                  isDragging === zone.id ? 'cursor-grabbing z-50 shadow-2xl' : 'cursor-grab hover:shadow-xl'
                } ${
                  selectedZoneId === zone.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                }`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: '200px'
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  })
                  setIsDragging(zone.id)
                  onZoneSelect(zone.id)
                }}
                onClick={(e) => {
                  if (e.detail === 1 && !isDragging) {
                    onZoneSelect(zone.id === selectedZoneId ? null : zone.id)
                  }
                }}
              >
                <div
                  className="bg-white rounded-lg shadow-md overflow-hidden border-2"
                  style={{ borderColor: zone.color }}
                >
                  {/* Zone Header */}
                  <div
                    className="px-3 py-2 flex items-center space-x-2"
                    style={{ backgroundColor: `${zone.color}15` }}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: zone.color, color: 'white' }}
                    >
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {zone.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {zone.code} • {typeInfo.label}
                      </p>
                    </div>
                  </div>

                  {/* Zone Stats */}
                  <div className="px-3 py-2 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Aisles:</span>
                        <span className="ml-1 font-medium text-gray-900">{zone.aisles.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bins:</span>
                        <span className="ml-1 font-medium text-gray-900">{totalBins}</span>
                      </div>
                    </div>

                    {/* Utilization Bar */}
                    {totalBins > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Utilization</span>
                          <span>{Math.round((occupiedBins / totalBins) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${(occupiedBins / totalBins) * 100}%`,
                              backgroundColor: zone.color
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions - Show on Hover */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditZone(zone)
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                      >
                        Edit Zone
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onManageAisles(zone)
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                      >
                        Manage Aisles
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onShowDetailMap(zone.id)
                        }}
                        className="col-span-2 text-xs text-green-600 hover:text-green-500 font-medium py-1 bg-green-50 rounded"
                      >
                        View Detail Map →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Zone Types</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Array.from(new Set(zones.map(z => z.type))).map((type) => {
              const typeInfo = getZoneTypeInfo(type)
              const Icon = typeInfo.icon
              return (
                <div key={type} className="flex items-center space-x-1">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{ backgroundColor: typeInfo.color, color: 'white' }}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <span className="text-gray-600">{typeInfo.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Zone Details */}
        {selectedZoneId && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-4 w-64">
            {(() => {
              const zone = zones.find(z => z.id === selectedZoneId)
              if (!zone) return null

              const totalShelves = zone.aisles.reduce((sum, aisle) => sum + (aisle.shelves?.length || 0), 0)
              const totalBins = zone.aisles.reduce((sum, aisle) =>
                sum + (aisle.shelves?.reduce((shelfSum, shelf) =>
                  shelfSum + (shelf.bins?.length || 0), 0) || 0), 0)

              return (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2">{zone.name}</h4>
                  {zone.description && (
                    <p className="text-sm text-gray-600 mb-3">{zone.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Code:</span>
                      <span className="font-medium">{zone.code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Aisles:</span>
                      <span className="font-medium">{zone.aisles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Shelves:</span>
                      <span className="font-medium">{totalShelves}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Bins:</span>
                      <span className="font-medium">{totalBins}</span>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
