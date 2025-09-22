//file path: app/dashboard/warehouses/[id]/layout/components/ZoneDetailMapModal.tsx
'use client'

import { XMarkIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Zone, Aisle, Shelf, Bin } from '../../../utils/warehouseTypes'
import { getZoneTypeInfo } from '../utils/layoutConstants'

interface ZoneDetailMapModalProps {
  show: boolean
  zone: Zone | null
  onClose: () => void
}

export default function ZoneDetailMapModal({
  show,
  zone,
  onClose
}: ZoneDetailMapModalProps) {
  if (!show || !zone) return null

  const typeInfo = getZoneTypeInfo(zone.type)
  const TypeIcon = typeInfo.icon

  // Create example pick list for demonstration
  const examplePickList = [
    { aisle: 0, shelf: 0, bin: 0, label: '1' },
    { aisle: 0, shelf: 2, bin: 3, label: '2' },
    { aisle: 1, shelf: 1, bin: 2, label: '3' },
    { aisle: 1, shelf: 3, bin: 5, label: '4' }
  ]

  const generateLocationCode = (zone: Zone, aisle: Aisle, shelf: Shelf, bin: Bin) => {
    return `${zone.code}-${aisle.code}-${shelf.code}-${bin.code}`
  }

  const renderBinInMap = (bin: Bin, aisleIndex: number, shelfIndex: number, binIndex: number) => {
    // Check if this bin is in the pick list
    const pickItem = examplePickList.find(
      p => p.aisle === aisleIndex &&
           p.shelf === shelfIndex &&
           p.bin === binIndex
    )

    return (
      <div
        key={bin.id}
        className={`relative h-6 w-full rounded text-xs flex items-center justify-center cursor-pointer hover:opacity-80 ${
          pickItem
            ? 'bg-green-500 text-white font-bold'
            : bin.currentStock && bin.currentStock > 0
            ? 'bg-blue-500'
            : 'bg-gray-300'
        }`}
        title={`${bin.code}: ${generateLocationCode(zone, zone.aisles[aisleIndex], zone.aisles[aisleIndex].shelves[Math.floor(shelfIndex / 2)], bin)}`}
      >
        {pickItem && pickItem.label}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: zone.color, color: 'white' }}
              >
                <TypeIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {zone.name} - Detailed Layout
                </h3>
                <p className="text-sm text-gray-600">
                  Zone {zone.code} • {zone.aisles.length} aisles • {typeInfo.label}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Zone Layout */}
        <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="bg-gray-50 rounded-lg p-6">
            {/* Entry/Exit Points */}
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium">
                  ENTRY
                </div>
                <span className="text-sm text-gray-600">Main entrance</span>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gray-300 rounded"></div>
                  <span>Empty Bin</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Pick Location</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Main exit</span>
                <div className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium">
                  EXIT
                </div>
              </div>
            </div>

            {/* Aisles Layout */}
            <div className="space-y-4">
              {zone.aisles.length > 0 ? (
                zone.aisles.map((aisle, aisleIndex) => (
                  <div key={aisle.id} className="bg-white rounded-lg border-2 border-gray-300 p-4">
                    {/* Aisle Header */}
                    <div className="mb-3 text-center">
                      <h4 className="text-sm font-bold text-gray-900">
                        {aisle.name} ({aisle.code})
                      </h4>
                      <p className="text-xs text-gray-500">
                        {aisle.width} × {aisle.length} {aisle.unit}
                      </p>
                    </div>

                    {/* Shelves on both sides of aisle */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Left Side Shelves */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 text-center mb-1">Left Side</div>
                        {aisle.shelves && aisle.shelves.filter((_, i) => i % 2 === 0).map((shelf, shelfIndex) => (
                          <div key={shelf.id} className="border border-gray-200 rounded p-2 bg-gray-50">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {shelf.name} (Level {shelf.level})
                            </div>
                            <div className="grid grid-cols-8 gap-1">
                              {shelf.bins.length > 0 ? (
                                shelf.bins.slice(0, 8).map((bin, binIndex) =>
                                  renderBinInMap(bin, aisleIndex, shelfIndex * 2, binIndex)
                                )
                              ) : (
                                <div className="col-span-8 text-center text-xs text-gray-400">
                                  No bins
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Aisle Walking Path */}
                      <div className="relative">
                        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
                          <div className="border-t-2 border-dashed border-gray-400"></div>
                          <div className="text-center mt-1">
                            <span className="text-xs text-gray-500 bg-gray-50 px-2">Walking Path</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side Shelves */}
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500 text-center mb-1">Right Side</div>
                        {aisle.shelves && aisle.shelves.filter((_, i) => i % 2 === 1).map((shelf, shelfIndex) => (
                          <div key={shelf.id} className="border border-gray-200 rounded p-2 bg-gray-50">
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {shelf.name} (Level {shelf.level})
                            </div>
                            <div className="grid grid-cols-8 gap-1">
                              {shelf.bins.length > 0 ? (
                                shelf.bins.slice(0, 8).map((bin, binIndex) =>
                                  renderBinInMap(bin, aisleIndex, shelfIndex * 2 + 1, binIndex)
                                )
                              ) : (
                                <div className="col-span-8 text-center text-xs text-gray-400">
                                  No bins
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Path indicator between aisles */}
                    {aisleIndex < zone.aisles.length - 1 && (
                      <div className="mt-4 text-center">
                        <div className="inline-block">
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No aisles configured in this zone</p>
                </div>
              )}
            </div>

            {/* Exit Point */}
            <div className="mt-4 text-center">
              <div className="inline-block">
                <ChevronDownIcon className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Pick Route Summary */}
          {zone.aisles.length > 0 && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Example Pick Route</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Optimized Path:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePickList.map((pick, index) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {pick.label}
                        </div>
                        {index < examplePickList.length - 1 && (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Route Statistics:</div>
                  <div className="mt-1 space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-600">Total Picks:</span>
                      <span className="ml-2 font-medium">{examplePickList.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Est. Distance:</span>
                      <span className="ml-2 font-medium">~120 ft</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Est. Time:</span>
                      <span className="ml-2 font-medium">~5 min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
