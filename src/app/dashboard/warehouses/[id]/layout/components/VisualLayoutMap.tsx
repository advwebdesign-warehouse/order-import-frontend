//file path: app/dashboard/warehouses/[id]/layout/components/VisualLayoutMap.tsx
'use client'

import { useState } from 'react'
import { MapIcon, Squares2X2Icon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline'
import { Zone } from '../../../utils/warehouseTypes'
import { getZoneTypeInfo } from '../utils/layoutConstants'

interface VisualLayoutMapProps {
  zones: Zone[]
  zonePositions: {[key: string]: {x: number, y: number}}
  zoneDimensions?: {[key: string]: {width: number, height: number}} // New prop for dimensions
  selectedZoneId: string | null
  onZonePositionsChange: (positions: {[key: string]: {x: number, y: number}}) => void
  onZonePositionsUpdate: (positions: {[key: string]: {x: number, y: number}}) => void
  onZoneDimensionsChange?: (dimensions: {[key: string]: {width: number, height: number}}) => void // New callback
  onZoneDimensionsUpdate?: (dimensions: {[key: string]: {width: number, height: number}}) => void // New callback
  onZoneSelect: (zoneId: string | null) => void
  onEditZone: (zone: Zone) => void
  onManageAisles: (zone: Zone) => void
  onShowDetailMap: (zoneId: string) => void
}

// Grid configuration
const GRID_SIZE = 10 // Grid cell size in pixels (finer grid)
const DEFAULT_ZONE_WIDTH = 200
const DEFAULT_ZONE_HEIGHT = 140
const MIN_ZONE_WIDTH = 150
const MIN_ZONE_HEIGHT = 120

type DragMode = 'move' | 'resize-n' | 'resize-s' | 'resize-e' | 'resize-w' | 'resize-ne' | 'resize-nw' | 'resize-se' | 'resize-sw' | null

export default function VisualLayoutMap({
  zones,
  zonePositions,
  zoneDimensions = {},
  selectedZoneId,
  onZonePositionsChange,
  onZonePositionsUpdate,
  onZoneDimensionsChange,
  onZoneDimensionsUpdate,
  onZoneSelect,
  onEditZone,
  onManageAisles,
  onShowDetailMap
}: VisualLayoutMapProps) {
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0})
  const [initialDimensions, setInitialDimensions] = useState({width: 0, height: 0})
  const [initialPosition, setInitialPosition] = useState({x: 0, y: 0})
  const [snapToGrid, setSnapToGrid] = useState(true) // Default to magnetized/snapped

  // Get zone dimensions with fallback to defaults
  const getZoneDimensions = (zoneId: string) => {
    return zoneDimensions[zoneId] || { width: DEFAULT_ZONE_WIDTH, height: DEFAULT_ZONE_HEIGHT }
  }

  // Function to snap coordinates to grid
  const snapToGridPosition = (x: number, y: number) => {
    if (!snapToGrid) {
      return { x, y }
    }

    // Snap to nearest grid point
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE

    return { x: snappedX, y: snappedY }
  }

  // Function to check if two zones would overlap
  const checkCollision = (
    zoneId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean => {
    for (const zone of zones) {
      if (zone.id === zoneId) continue // Skip self

      const otherPos = zonePositions[zone.id] || { x: 50, y: 50 }
      const otherDim = getZoneDimensions(zone.id)

      // Check if rectangles overlap
      if (!(x >= otherPos.x + otherDim.width ||
            x + width <= otherPos.x ||
            y >= otherPos.y + otherDim.height ||
            y + height <= otherPos.y)) {
        return true // Collision detected
      }
    }
    return false
  }

  // Function to get maximum dimensions for a zone at a given position
  const getMaxDimensions = (
    zoneId: string,
    x: number,
    y: number,
    canvasWidth: number,
    canvasHeight: number
  ): { maxWidth: number, maxHeight: number } => {
    let maxWidth = canvasWidth - x
    let maxHeight = canvasHeight - y

    // Check constraints from other zones
    for (const zone of zones) {
      if (zone.id === zoneId) continue

      const otherPos = zonePositions[zone.id] || { x: 50, y: 50 }
      const otherDim = getZoneDimensions(zone.id)

      // If the other zone is to the right and at the same vertical level
      if (otherPos.x > x && otherPos.y < y + maxHeight && otherPos.y + otherDim.height > y) {
        maxWidth = Math.min(maxWidth, otherPos.x - x)
      }

      // If the other zone is below and at the same horizontal level
      if (otherPos.y > y && otherPos.x < x + maxWidth && otherPos.x + otherDim.width > x) {
        maxHeight = Math.min(maxHeight, otherPos.y - y)
      }
    }

    return { maxWidth, maxHeight }
  }

  // Function to snap dimensions to grid with boundary checking
  const snapToGridDimensions = (
    width: number,
    height: number,
    zoneId?: string,
    position?: { x: number, y: number },
    canvasSize?: { width: number, height: number }
  ) => {
    if (!snapToGrid) {
      return {
        width: Math.max(MIN_ZONE_WIDTH, width),
        height: Math.max(MIN_ZONE_HEIGHT, height)
      }
    }

    const snappedWidth = Math.round(width / GRID_SIZE) * GRID_SIZE
    const snappedHeight = Math.round(height / GRID_SIZE) * GRID_SIZE

    let finalWidth = Math.max(MIN_ZONE_WIDTH, snappedWidth)
    let finalHeight = Math.max(MIN_ZONE_HEIGHT, snappedHeight)

    // Apply canvas and collision constraints if provided
    if (zoneId && position && canvasSize) {
      const { maxWidth, maxHeight } = getMaxDimensions(
        zoneId,
        position.x,
        position.y,
        canvasSize.width,
        canvasSize.height
      )

      finalWidth = Math.min(finalWidth, maxWidth)
      finalHeight = Math.min(finalHeight, maxHeight)
    }

    return {
      width: finalWidth,
      height: finalHeight
    }
  }

  const handleResetLayout = () => {
    const newPositions: {[key: string]: {x: number, y: number}} = {}
    const newDimensions: {[key: string]: {width: number, height: number}} = {}

    zones.forEach((zone, index) => {
      const baseX = (index % 3) * 250 + 50
      const baseY = Math.floor(index / 3) * 200 + 50

      // Apply grid snapping to reset positions if enabled
      const position = snapToGridPosition(baseX, baseY)
      newPositions[zone.id] = position

      // Reset to default dimensions
      newDimensions[zone.id] = { width: DEFAULT_ZONE_WIDTH, height: DEFAULT_ZONE_HEIGHT }
    })

    onZonePositionsChange(newPositions)
    onZonePositionsUpdate(newPositions)

    if (onZoneDimensionsChange) {
      onZoneDimensionsChange(newDimensions)
    }
    if (onZoneDimensionsUpdate) {
      onZoneDimensionsUpdate(newDimensions)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, zoneId: string, mode: DragMode) => {
    e.stopPropagation()
    e.preventDefault()

    const position = zonePositions[zoneId] || { x: 50, y: 50 }
    const dimensions = getZoneDimensions(zoneId)

    if (mode === 'move') {
      const rect = e.currentTarget.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    } else {
      // For resize, store the initial mouse position
      setDragOffset({
        x: e.clientX,
        y: e.clientY
      })
      setInitialDimensions(dimensions)
      setInitialPosition(position)
    }

    setDragMode(mode)
    setDraggingZoneId(zoneId)
    onZoneSelect(zoneId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingZoneId || !dragMode) return

    const rect = e.currentTarget.getBoundingClientRect()
    const position = zonePositions[draggingZoneId] || { x: 50, y: 50 }
    const dimensions = getZoneDimensions(draggingZoneId)
    const canvasSize = { width: rect.width, height: rect.height }

    if (dragMode === 'move') {
      let newX = e.clientX - rect.left - dragOffset.x
      let newY = e.clientY - rect.top - dragOffset.y

      // Apply grid snapping if enabled
      const snappedPosition = snapToGridPosition(newX, newY)
      newX = snappedPosition.x
      newY = snappedPosition.y

      // Keep within bounds
      const boundedX = Math.max(0, Math.min(newX, canvasSize.width - dimensions.width))
      const boundedY = Math.max(0, Math.min(newY, canvasSize.height - dimensions.height))

      // Check for collisions
      if (!checkCollision(draggingZoneId, boundedX, boundedY, dimensions.width, dimensions.height)) {
        onZonePositionsChange({
          ...zonePositions,
          [draggingZoneId]: { x: boundedX, y: boundedY }
        })
      }
    } else if (dragMode.startsWith('resize-')) {
      const deltaX = e.clientX - dragOffset.x
      const deltaY = e.clientY - dragOffset.y

      let newWidth = initialDimensions.width
      let newHeight = initialDimensions.height
      let newX = position.x
      let newY = position.y

      switch (dragMode) {
        case 'resize-n': // North (top)
          newHeight = initialDimensions.height - deltaY
          newY = initialPosition.y + deltaY
          break
        case 'resize-s': // South (bottom)
          newHeight = initialDimensions.height + deltaY
          break
        case 'resize-e': // East (right)
          newWidth = initialDimensions.width + deltaX
          break
        case 'resize-w': // West (left)
          newWidth = initialDimensions.width - deltaX
          newX = initialPosition.x + deltaX
          break
        case 'resize-ne': // Northeast (top-right)
          newWidth = initialDimensions.width + deltaX
          newHeight = initialDimensions.height - deltaY
          newY = initialPosition.y + deltaY
          break
        case 'resize-nw': // Northwest (top-left)
          newWidth = initialDimensions.width - deltaX
          newHeight = initialDimensions.height - deltaY
          newX = initialPosition.x + deltaX
          newY = initialPosition.y + deltaY
          break
        case 'resize-se': // Southeast (bottom-right)
          newWidth = initialDimensions.width + deltaX
          newHeight = initialDimensions.height + deltaY
          break
        case 'resize-sw': // Southwest (bottom-left)
          newWidth = initialDimensions.width - deltaX
          newHeight = initialDimensions.height + deltaY
          newX = initialPosition.x + deltaX
          break
      }

      // Apply grid snapping to position
      const snappedPos = snapToGridPosition(newX, newY)

      // Keep position within bounds
      newX = Math.max(0, Math.min(snappedPos.x, canvasSize.width - MIN_ZONE_WIDTH))
      newY = Math.max(0, Math.min(snappedPos.y, canvasSize.height - MIN_ZONE_HEIGHT))

      // Apply grid snapping to dimensions with collision checking
      const snappedDims = snapToGridDimensions(
        newWidth,
        newHeight,
        draggingZoneId,
        { x: newX, y: newY },
        canvasSize
      )

      // Check if the new dimensions would cause collision
      if (!checkCollision(draggingZoneId, newX, newY, snappedDims.width, snappedDims.height)) {
        // Update dimensions
        if (onZoneDimensionsChange) {
          onZoneDimensionsChange({
            ...zoneDimensions,
            [draggingZoneId]: snappedDims
          })
        }

        // Update position if resizing from left or top
        if (dragMode.includes('w') || dragMode.includes('n')) {
          onZonePositionsChange({
            ...zonePositions,
            [draggingZoneId]: { x: newX, y: newY }
          })
        }
      }
    }
  }

  const handleMouseUp = () => {
    if (draggingZoneId) {
      if (dragMode === 'move') {
        // Persist the final positions when dragging ends
        onZonePositionsUpdate({
          ...zonePositions,
          [draggingZoneId]: zonePositions[draggingZoneId]
        })
      } else if (dragMode?.startsWith('resize-')) {
        // Persist the final dimensions
        if (onZoneDimensionsUpdate) {
          onZoneDimensionsUpdate({
            ...zoneDimensions,
            [draggingZoneId]: getZoneDimensions(draggingZoneId)
          })
        }
        // Also persist position if it changed
        onZonePositionsUpdate({
          ...zonePositions,
          [draggingZoneId]: zonePositions[draggingZoneId]
        })
      }
    }

    setDragMode(null)
    setDraggingZoneId(null)
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
              Drag zones to arrange, resize from corners. Click a zone to see details.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Grid Snap Toggle */}
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium transition-colors ${
                snapToGrid
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
              title={snapToGrid ? 'Grid snapping enabled' : 'Grid snapping disabled'}
            >
              {snapToGrid ? (
                <>
                  <LockClosedIcon className="h-4 w-4 mr-1.5" />
                  <span>Grid: On</span>
                </>
              ) : (
                <>
                  <LockOpenIcon className="h-4 w-4 mr-1.5" />
                  <span>Grid: Off</span>
                </>
              )}
            </button>

            <button
              onClick={handleResetLayout}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Squares2X2Icon className="h-4 w-4 mr-1.5" />
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
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid Background - More visible */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(156, 163, 175, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(156, 163, 175, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
            }}
          />

          {/* Stronger grid lines at major intervals (every 5 cells for 10px grid) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(107, 114, 128, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(107, 114, 128, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`
            }}
          />

          {/* Grid snap indicator when dragging */}
          {draggingZoneId && snapToGrid && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-medium shadow-lg z-50">
              {dragMode === 'move' ? 'Snapping to grid' : 'Resizing with grid snap'}
            </div>
          )}

          {/* Zone Cards */}
          {zones.map((zone) => {
            const position = zonePositions[zone.id] || { x: 50, y: 50 }
            const dimensions = getZoneDimensions(zone.id)
            const typeInfo = getZoneTypeInfo(zone.type)
            const TypeIcon = typeInfo.icon
            const isStorageZone = zone.type === 'storage'
            const isSelected = selectedZoneId === zone.id
            const isDragging = draggingZoneId === zone.id

            // Only calculate these for storage zones
            const totalBins = isStorageZone
              ? zone.aisles.reduce((sum, aisle) =>
                  sum + (aisle.shelves?.reduce((shelfSum, shelf) =>
                    shelfSum + (shelf.bins?.length || 0), 0) || 0), 0)
              : 0
            const occupiedBins = isStorageZone
              ? zone.aisles.reduce((sum, aisle) =>
                  sum + (aisle.shelves?.reduce((shelfSum, shelf) =>
                    shelfSum + (shelf.bins?.filter(b => b.currentStock && b.currentStock > 0).length || 0), 0) || 0), 0)
              : 0

            return (
              <div
                key={zone.id}
                className={`absolute transition-all group ${
                  isDragging
                    ? 'z-50 shadow-2xl'
                    : 'hover:shadow-xl'
                } ${
                  isSelected ? 'ring-2 ring-offset-2 ring-indigo-500 z-40' : ''
                }`}
                style={{
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                  transition: isDragging ? 'none' : 'box-shadow 0.15s ease-in-out, transform 0.15s ease-in-out'
                }}
              >
                {/* Resize Handles - Invisible borders that show resize cursor */}
                {isSelected && (
                  <>
                    {/* Top edge */}
                    <div
                      className="absolute top-0 left-2 right-2 h-1 cursor-n-resize hover:bg-indigo-500 hover:opacity-30"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-n')}
                    />
                    {/* Bottom edge */}
                    <div
                      className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize hover:bg-indigo-500 hover:opacity-30"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-s')}
                    />
                    {/* Left edge */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize hover:bg-indigo-500 hover:opacity-30"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-w')}
                    />
                    {/* Right edge */}
                    <div
                      className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize hover:bg-indigo-500 hover:opacity-30"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-e')}
                    />
                    {/* Top-left corner */}
                    <div
                      className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize hover:bg-indigo-500 hover:opacity-40"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-nw')}
                    />
                    {/* Top-right corner */}
                    <div
                      className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize hover:bg-indigo-500 hover:opacity-40"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-ne')}
                    />
                    {/* Bottom-left corner */}
                    <div
                      className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize hover:bg-indigo-500 hover:opacity-40"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-sw')}
                    />
                    {/* Bottom-right corner */}
                    <div
                      className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize hover:bg-indigo-500 hover:opacity-40"
                      onMouseDown={(e) => handleMouseDown(e, zone.id, 'resize-se')}
                    />
                  </>
                )}

                <div
                  className={`bg-white rounded-lg shadow-md overflow-hidden border-2 h-full flex flex-col ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{ borderColor: zone.color }}
                  onMouseDown={(e) => {
                    // Only trigger move if not clicking on resize handles
                    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.zone-content')) {
                      handleMouseDown(e, zone.id, 'move')
                    }
                  }}
                  onClick={(e) => {
                    if (e.detail === 1 && !dragMode) {
                      onZoneSelect(zone.id === selectedZoneId ? null : zone.id)
                    }
                  }}
                >
                  {/* Zone Header */}
                  <div
                    className="px-3 py-2 flex items-center space-x-2 zone-content"
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

                  {/* Zone Stats - Flexible height */}
                  <div className="px-3 py-2 border-t border-gray-100 flex-1 flex flex-col justify-between zone-content">
                    {isStorageZone ? (
                      <>
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

                        {/* Utilization Bar - Only for storage zones */}
                        {totalBins > 0 && dimensions.height > 150 && (
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
                      </>
                    ) : (
                      // For non-storage zones, show different information
                      <div className="text-xs">
                        <div className="text-gray-500">
                          Type: <span className="font-medium text-gray-900 capitalize">
                            {zone.type.replace('_', ' ')}
                          </span>
                        </div>
                        {zone.description && dimensions.height > 130 && (
                          <div className="text-gray-500 mt-1 truncate">
                            {zone.description}
                          </div>
                        )}
                        {/* Could add zone-specific stats here in the future */}
                        {dimensions.height > 150 && (
                          <>
                            {zone.type === 'shipping' && (
                              <div className="mt-1 text-gray-500">Status: Active</div>
                            )}
                            {zone.type === 'receiving' && (
                              <div className="mt-1 text-gray-500">Status: Active</div>
                            )}
                            {zone.type === 'quality_control' && (
                              <div className="mt-1 text-gray-500">Inspection Ready</div>
                            )}
                            {zone.type === 'returns' && (
                              <div className="mt-1 text-gray-500">Processing Active</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions - Show on Hover - Always show essential actions */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity zone-content">
                    <div className={`grid ${dimensions.height > 160 ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditZone(zone)
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                      >
                        Edit Zone
                      </button>
                      {isStorageZone && dimensions.height > 160 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onManageAisles(zone)
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Manage Aisles
                        </button>
                      )}
                      {dimensions.height > 160 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onShowDetailMap(zone.id)
                          }}
                          className={`${isStorageZone ? 'col-span-2' : ''} text-xs text-green-600 hover:text-green-500 font-medium py-1 bg-green-50 rounded`}
                        >
                          View Detail Map →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Improved Legend - Grouped by type with actual colors */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Warehouse Zones</h4>
          <div className="space-y-2">
            {Array.from(new Set(zones.map(z => z.type))).map((type) => {
              const typeInfo = getZoneTypeInfo(type)
              const Icon = typeInfo.icon
              const zonesOfType = zones.filter(z => z.type === type)

              return (
                <div key={type} className="border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                  {/* Zone Type Header */}
                  <div className="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                    <Icon className="h-3 w-3" />
                    <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                    <span className="text-gray-400">({zonesOfType.length})</span>
                  </div>
                  {/* Individual Zones */}
                  <div className="space-y-0.5 ml-4">
                    {zonesOfType.map(zone => (
                      <div key={zone.id} className="flex items-center space-x-1.5">
                        <div
                          className="w-3 h-3 rounded border border-gray-300"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-xs text-gray-700">{zone.name}</span>
                        <span className="text-xs text-gray-400">({zone.code})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Optional: Show total count if there are many zones */}
          {zones.length > 6 && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center">
              Total: {zones.length} zones
            </div>
          )}
        </div>

        {/* Selected Zone Details */}
        {selectedZoneId && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-4 w-64">
            {(() => {
              const zone = zones.find(z => z.id === selectedZoneId)
              if (!zone) return null

              const dimensions = getZoneDimensions(zone.id)
              const isStorageZone = zone.type === 'storage'
              const totalShelves = isStorageZone
                ? zone.aisles.reduce((sum, aisle) => sum + (aisle.shelves?.length || 0), 0)
                : 0
              const totalBins = isStorageZone
                ? zone.aisles.reduce((sum, aisle) =>
                    sum + (aisle.shelves?.reduce((shelfSum, shelf) =>
                      shelfSum + (shelf.bins?.length || 0), 0) || 0), 0)
                : 0

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
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{zone.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-medium">{dimensions.width} × {dimensions.height}px</span>
                    </div>
                    {isStorageZone && (
                      <>
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
                      </>
                    )}
                    {!isStorageZone && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          {zone.type === 'shipping' && 'Outbound processing area'}
                          {zone.type === 'receiving' && 'Inbound processing area'}
                          {zone.type === 'quality_control' && 'Quality inspection area'}
                          {zone.type === 'returns' && 'Returns processing area'}
                          {zone.type === 'staging' && 'Temporary holding area'}
                        </p>
                      </div>
                    )}
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
