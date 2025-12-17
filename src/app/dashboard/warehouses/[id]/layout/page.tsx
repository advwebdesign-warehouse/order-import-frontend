//file path: app/dashboard/warehouses/[id]/layout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  BuildingOffice2Icon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useWarehouses } from '../../context/WarehouseContext'
import { Zone, Aisle, Shelf, Bin, WarehouseLayout } from '../../utils/warehouseTypes'

// Import the new components
import ZoneManager from './components/ZoneManager'
import ZoneFormModal, { ZoneFormData } from './components/ZoneFormModal'
import AisleFormModal, { AisleFormData } from './components/AisleFormModal'
import BinFormModal, { BinFormData } from './components/BinFormModal'
import ZoneDetailMapModal from './components/ZoneDetailMapModal'
import VisualLayoutMap from './components/VisualLayoutMap'
import LayoutStatsComponent from './components/LayoutStats'
import AisleManager from './components/AisleManager'
import { DEFAULT_LOCATION_FORMAT } from './utils/layoutConstants'

export default function WarehouseLayoutPage() {
  const params = useParams()
  const router = useRouter() // For redirecting
  const warehouseId = params.id as string
  const { warehouses, updateWarehouse } = useWarehouses()
  const warehouse = warehouses.find(w => w.id === warehouseId)

  const [activeTab, setActiveTab] = useState<'visual' | 'zones' | 'aisles' | 'settings'>('zones')

  // Zone state
  const [zones, setZones] = useState<Zone[]>(() => {
    if (warehouse?.layout?.zones) {
      return warehouse.layout.zones
    }
    return []
  })

  // Visual layout positions state with better initialization
  const [zonePositions, setZonePositions] = useState<{[key: string]: {x: number, y: number}}>(() => {
    if (warehouse?.layout?.zonePositions) {
      return warehouse.layout.zonePositions
    }
    // Default positions in a grid for any existing zones
    const positions: {[key: string]: {x: number, y: number}} = {}
    const currentZones = warehouse?.layout?.zones || []
    currentZones.forEach((zone, index) => {
      positions[zone.id] = {
        x: (index % 3) * 250 + 50,
        y: Math.floor(index / 3) * 200 + 50
      }
    })
    return positions
  })

  // Zone dimensions state -
  const [zoneDimensions, setZoneDimensions] = useState<{[key: string]: {width: number, height: number}}>(() => {
    if (warehouse?.layout?.zoneDimensions) {
      return warehouse.layout.zoneDimensions
    }
    // Default dimensions for any existing zones
    const dimensions: {[key: string]: {width: number, height: number}} = {}
    const currentZones = warehouse?.layout?.zones || []
    currentZones.forEach((zone) => {
      dimensions[zone.id] = {
        width: 200,
        height: 140
      }
    })
    return dimensions
  })

  // Modal states
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showAisleModal, setShowAisleModal] = useState(false)
  const [showBinModal, setShowBinModal] = useState(false)
  const [showZoneDetailMap, setShowZoneDetailMap] = useState<string | null>(null)

  // Editing states
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [editingAisle, setEditingAisle] = useState<Aisle | null>(null)
  const [editingBin, setEditingBin] = useState<Bin | null>(null)

  // Selected items for context
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [selectedAisle, setSelectedAisle] = useState<Aisle | null>(null)
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null)
  const [selectedZoneInMap, setSelectedZoneInMap] = useState<string | null>(null)

  // Load zones, positions, and dimensions from warehouse when warehouse data changes
  useEffect(() => {
    if (warehouse?.layout?.zones) {
      setZones(warehouse.layout.zones)

      // Update positions if they exist in warehouse data
      if (warehouse.layout.zonePositions) {
        setZonePositions(warehouse.layout.zonePositions)
      } else {
        // Generate default positions for existing zones
        const positions: {[key: string]: {x: number, y: number}} = {}
        warehouse.layout.zones.forEach((zone, index) => {
          positions[zone.id] = {
            x: (index % 3) * 250 + 50,
            y: Math.floor(index / 3) * 200 + 50
          }
        })
        setZonePositions(positions)
      }

      // Update dimensions if they exist in warehouse data -
      if (warehouse.layout.zoneDimensions) {
        setZoneDimensions(warehouse.layout.zoneDimensions)
      } else {
        // Generate default dimensions for existing zones
        const dimensions: {[key: string]: {width: number, height: number}} = {}
        warehouse.layout.zones.forEach((zone) => {
          dimensions[zone.id] = {
            width: 200,
            height: 140
          }
        })
        setZoneDimensions(dimensions)
        // Save the default dimensions - use zonePositions state instead of undefined positions
        persistZones(warehouse.layout.zones, warehouse.layout.zonePositions || zonePositions, dimensions)
      }
    } else if (warehouse) {
      setZones([])
      setZonePositions({})
      setZoneDimensions({})
    }
  }, [warehouse])

  // Zone position handlers
  const handleZonePositionsChange = (positions: {[key: string]: {x: number, y: number}}) => {
    // Update local state for live feedback during dragging
    setZonePositions(positions)
  }

  const handleZonePositionsUpdate = async (positions: {[key: string]: {x: number, y: number}}) => {
    // Persist positions to database when dragging completes
    setZonePositions(positions)
    await persistZones(zones, positions, zoneDimensions)
  }

  // Zone dimensions handlers -
  const handleZoneDimensionsChange = (dimensions: {[key: string]: {width: number, height: number}}) => {
    // Update local state for live feedback during resizing
    setZoneDimensions(dimensions)
  }

  const handleZoneDimensionsUpdate = async (dimensions: {[key: string]: {width: number, height: number}}) => {
    // Persist dimensions to database when resizing completes
    setZoneDimensions(dimensions)
    await persistZones(zones, zonePositions, dimensions)
  }

  // Function to persist zones to warehouse - UPDATED to include dimensions
  const persistZones = async (
    updatedZones: Zone[],
    updatedPositions?: {[key: string]: {x: number, y: number}},
    updatedDimensions?: {[key: string]: {width: number, height: number}}
  ) => {
    if (!warehouse) return

    try {
      const updatedLayout: WarehouseLayout = warehouse.layout || {
        zones: [],
        defaultLocationFormat: DEFAULT_LOCATION_FORMAT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      updatedLayout.zones = updatedZones
      updatedLayout.zonePositions = updatedPositions || zonePositions
      updatedLayout.zoneDimensions = updatedDimensions || zoneDimensions
      updatedLayout.updatedAt = new Date().toISOString()

      await updateWarehouse(warehouseId, {
        layout: updatedLayout
      })
    } catch (error) {
      console.error('Error persisting zones:', error)
      alert('Failed to save changes. Please try again.')
    }
  }

  const tabs = [
    {
      id: 'zones',
      name: 'Zone Management',
      icon: BuildingOffice2Icon,
      description: 'Manage warehouse zones, aisles, and bins'
    },
    {
      id: 'visual',
      name: 'Layout View',
      icon: Squares2X2Icon,
      description: 'Visual representation of warehouse layout'
    },
    {
      id: 'aisles',
      name: 'Aisle Overview',
      icon: ClipboardDocumentListIcon,
      description: 'View all aisles across zones'
    },
    {
      id: 'settings',
      name: 'Layout Settings',
      icon: ChartBarIcon,
      description: 'Configure location formats and preferences'
    }
  ]

  // Zone handlers
  const handleCreateZone = () => {
    setEditingZone(null)
    setShowZoneModal(true)
  }

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone)
    setShowZoneModal(true)
  }

  const handleSubmitZone = async (formData: ZoneFormData) => {
    let updatedZones: Zone[]

    if (editingZone) {
      const updatedZone: Zone = {
        ...editingZone,
        ...formData,
        updatedAt: new Date().toISOString()
      }
      updatedZones = zones.map(zone => zone.id === editingZone.id ? updatedZone : zone)
    } else {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        ...formData,
        aisles: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      updatedZones = [...zones, newZone]

      // Add default position and dimensions for new zone
      const newPosition = {
        x: (updatedZones.length - 1) % 3 * 250 + 50,
        y: Math.floor((updatedZones.length - 1) / 3) * 200 + 50
      }
      const updatedPositions = {
        ...zonePositions,
        [newZone.id]: newPosition
      }
      const updatedDimensions = {
        ...zoneDimensions,
        [newZone.id]: { width: 200, height: 140 } // Default dimensions for new zone
      }
      setZonePositions(updatedPositions)
      setZoneDimensions(updatedDimensions)
      await persistZones(updatedZones, updatedPositions, updatedDimensions)
      return
    }

    setZones(updatedZones)
    await persistZones(updatedZones)
  }

  const handleDeleteZone = async (zone: Zone) => {
    if (!confirm(`Are you sure you want to delete zone "${zone.name}"? This will also delete all aisles within it.`)) {
      return
    }

    const updatedZones = zones.filter(z => z.id !== zone.id)
    // Remove the zone's position and dimensions
    const updatedPositions = { ...zonePositions }
    delete updatedPositions[zone.id]
    const updatedDimensions = { ...zoneDimensions }
    delete updatedDimensions[zone.id]

    setZones(updatedZones)
    setZonePositions(updatedPositions)
    setZoneDimensions(updatedDimensions)
    await persistZones(updatedZones, updatedPositions, updatedDimensions)
  }

  // Aisle handlers
  const handleCreateAisle = (zone: Zone) => {
    setSelectedZone(zone)
    setEditingAisle(null)
    setShowAisleModal(true)
  }

  const handleEditAisle = (zone: Zone, aisle: Aisle) => {
    setSelectedZone(zone)
    setEditingAisle(aisle)
    setShowAisleModal(true)
  }

  const handleSubmitAisle = async (formData: AisleFormData) => {
    if (!selectedZone) return

    let updatedAisle: Aisle

    if (editingAisle) {
      updatedAisle = {
        ...editingAisle,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        maxHeight: formData.maxHeight,
        width: formData.width,
        length: formData.length,
        unit: formData.unit,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Create shelves based on shelfCount
      const newShelves = Array.from({ length: formData.shelfCount }, (_, i) => ({
        id: `shelf-${Date.now()}-${i}`,
        name: `Shelf ${i + 1}`,
        code: `S${(i + 1).toString().padStart(2, '0')}`,
        level: i + 1,
        bins: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      updatedAisle = {
        id: `aisle-${Date.now()}`,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        shelves: newShelves,
        maxHeight: formData.maxHeight,
        width: formData.width,
        length: formData.length,
        unit: formData.unit,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    const updatedZones = zones.map(z => {
      if (z.id === selectedZone.id) {
        const updatedAisles = editingAisle
          ? z.aisles.map(a => a.id === editingAisle.id ? updatedAisle : a)
          : [...z.aisles, updatedAisle]

        return {
          ...z,
          aisles: updatedAisles,
          updatedAt: new Date().toISOString()
        }
      }
      return z
    })

    setZones(updatedZones)
    await persistZones(updatedZones)
  }

  const handleDeleteAisle = async (zone: Zone, aisle: Aisle) => {
    if (!confirm(`Are you sure you want to delete aisle "${aisle.name}"?`)) {
      return
    }

    const updatedZones = zones.map(z => {
      if (z.id === zone.id) {
        return {
          ...z,
          aisles: z.aisles.filter(a => a.id !== aisle.id),
          updatedAt: new Date().toISOString()
        }
      }
      return z
    })

    setZones(updatedZones)
    await persistZones(updatedZones)
  }

  // Bin handlers
  const handleCreateBin = (zone: Zone, aisle: Aisle, shelf: Shelf) => {
    setSelectedZone(zone)
    setSelectedAisle(aisle)
    setSelectedShelf(shelf)
    setEditingBin(null)
    setShowBinModal(true)
  }

  const handleEditBin = (zone: Zone, aisle: Aisle, shelf: Shelf, bin: Bin) => {
    setSelectedZone(zone)
    setSelectedAisle(aisle)
    setSelectedShelf(shelf)
    setEditingBin(bin)
    setShowBinModal(true)
  }

  const handleSubmitBin = async (formData: BinFormData) => {
    if (!selectedZone || !selectedAisle || !selectedShelf) return

    let updatedBin: Bin

    if (editingBin) {
      updatedBin = {
        ...editingBin,
        name: formData.name,
        code: formData.code,
        position: formData.position,
        capacity: formData.capacity,
        updatedAt: new Date().toISOString()
      }
    } else {
      updatedBin = {
        id: `bin-${Date.now()}`,
        name: formData.name,
        code: formData.code,
        position: formData.position,
        capacity: formData.capacity,
        currentStock: 0,
        isActive: true,
        reserved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }

    const updatedZones = zones.map(z => {
      if (z.id === selectedZone.id) {
        const updatedAisles = z.aisles.map(a => {
          if (a.id === selectedAisle.id) {
            const updatedShelves = a.shelves.map(s => {
              if (s.id === selectedShelf.id) {
                const updatedBins = editingBin
                  ? s.bins.map(b => b.id === editingBin.id ? updatedBin : b)
                  : [...s.bins, updatedBin].sort((a, b) => a.position - b.position)

                return {
                  ...s,
                  bins: updatedBins,
                  updatedAt: new Date().toISOString()
                }
              }
              return s
            })

            return {
              ...a,
              shelves: updatedShelves,
              updatedAt: new Date().toISOString()
            }
          }
          return a
        })

        return {
          ...z,
          aisles: updatedAisles,
          updatedAt: new Date().toISOString()
        }
      }
      return z
    })

    setZones(updatedZones)
    await persistZones(updatedZones)
  }

  const handleDeleteBin = async (zone: Zone, aisle: Aisle, shelf: Shelf, bin: Bin) => {
    if (!confirm(`Are you sure you want to delete bin "${bin.name}"?`)) {
      return
    }

    const updatedZones = zones.map(z => {
      if (z.id === zone.id) {
        const updatedAisles = z.aisles.map(a => {
          if (a.id === aisle.id) {
            const updatedShelves = a.shelves.map(s => {
              if (s.id === shelf.id) {
                return {
                  ...s,
                  bins: s.bins.filter(b => b.id !== bin.id),
                  updatedAt: new Date().toISOString()
                }
              }
              return s
            })

            return {
              ...a,
              shelves: updatedShelves,
              updatedAt: new Date().toISOString()
            }
          }
          return a
        })

        return {
          ...z,
          aisles: updatedAisles,
          updatedAt: new Date().toISOString()
        }
      }
      return z
    })

    setZones(updatedZones)
    await persistZones(updatedZones)
  }

  // Calculate layout statistics
  const layoutStats = {
    totalZones: zones.length,
    totalAisles: zones.reduce((sum, zone) => sum + zone.aisles.length, 0),
    totalShelves: zones.reduce((sum, zone) =>
      sum + zone.aisles.reduce((aisleSum, aisle) =>
        aisleSum + (aisle.shelves?.length || 0), 0), 0),
    totalBins: zones.reduce((sum, zone) =>
      sum + zone.aisles.reduce((aisleSum, aisle) =>
        aisleSum + (aisle.shelves?.reduce((shelfSum, shelf) =>
          shelfSum + (shelf.bins?.length || 0), 0) || 0), 0), 0),
    occupiedBins: zones.reduce((sum, zone) =>
      sum + zone.aisles.reduce((aisleSum, aisle) =>
        aisleSum + (aisle.shelves?.reduce((shelfSum, shelf) =>
          shelfSum + (shelf.bins?.filter(b => b.currentStock && b.currentStock > 0).length || 0), 0) || 0), 0), 0),
    emptyBins: 0, // Will be calculated
    utilizationRate: 0 // Will be calculated
  }
  layoutStats.emptyBins = layoutStats.totalBins - layoutStats.occupiedBins
  layoutStats.utilizationRate = layoutStats.totalBins > 0 ? Math.round((layoutStats.occupiedBins / layoutStats.totalBins) * 100) : 0

  if (!warehouse) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warehouse...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{warehouse.name} - Layout Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure zones, aisles, shelves, and bins for optimal warehouse organization
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateZone}
              className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
            >
              <PlusIcon className="h-4 w-4" />
              {zones.length === 0 ? 'Setup Layout' : 'Add Zone'}
            </button>
          </div>
        </div>

        {/* Layout Stats Summary */}
        {zones.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <dt className="text-sm font-medium text-blue-600">Total Zones</dt>
              <dd className="text-2xl font-bold text-blue-900">{layoutStats.totalZones}</dd>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <dt className="text-sm font-medium text-green-600">Total Aisles</dt>
              <dd className="text-2xl font-bold text-green-900">{layoutStats.totalAisles}</dd>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <dt className="text-sm font-medium text-yellow-600">Total Shelves</dt>
              <dd className="text-2xl font-bold text-yellow-900">{layoutStats.totalShelves}</dd>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <dt className="text-sm font-medium text-purple-600">Storage Bins</dt>
              <dd className="text-2xl font-bold text-purple-900">{layoutStats.totalBins}</dd>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'zones' && (
          <ZoneManager
            zones={zones}
            onCreateZone={handleCreateZone}
            onEditZone={handleEditZone}
            onDeleteZone={handleDeleteZone}
            onCreateAisle={handleCreateAisle}
            onEditAisle={handleEditAisle}
            onDeleteAisle={handleDeleteAisle}
            onCreateBin={handleCreateBin}
            onEditBin={handleEditBin}
            onDeleteBin={handleDeleteBin}
          />
        )}

        {activeTab === 'visual' && (
          <VisualLayoutMap
            zones={zones}
            zonePositions={zonePositions}
            zoneDimensions={zoneDimensions}
            selectedZoneId={selectedZoneInMap}
            onZonePositionsChange={handleZonePositionsChange}
            onZonePositionsUpdate={handleZonePositionsUpdate}
            onZoneDimensionsChange={handleZoneDimensionsChange}
            onZoneDimensionsUpdate={handleZoneDimensionsUpdate}
            onZoneSelect={setSelectedZoneInMap}
            onEditZone={handleEditZone}
            onManageAisles={(zone) => {
              setActiveTab('zones')
              // Add logic to expand zone in ZoneManager if needed
            }}
            onShowDetailMap={setShowZoneDetailMap}
          />
        )}

        {activeTab === 'aisles' && (
          <AisleManager
            zones={zones}
            selectedZone={null}
            onCreateAisle={async (zoneId, aisleData) => {
              const zone = zones.find(z => z.id === zoneId)
              if (zone) {
                setSelectedZone(zone)
                await handleSubmitAisle(aisleData as AisleFormData)
              }
            }}
            onUpdateAisle={async (zoneId, aisleId, updates) => {
              const zone = zones.find(z => z.id === zoneId)
              const aisle = zone?.aisles.find(a => a.id === aisleId)
              if (zone && aisle) {
                setSelectedZone(zone)
                setEditingAisle(aisle)
                await handleSubmitAisle(updates as AisleFormData)
              }
            }}
            onDeleteAisle={async (zoneId, aisleId) => {
              const zone = zones.find(z => z.id === zoneId)
              const aisle = zone?.aisles.find(a => a.id === aisleId)
              if (zone && aisle) {
                await handleDeleteAisle(zone, aisle)
              }
            }}
          />
        )}

        {activeTab === 'settings' && (
          <LayoutStatsComponent
            stats={layoutStats}
            zones={zones}
          />
        )}
      </div>

      {/* Modals */}
      <ZoneFormModal
        show={showZoneModal}
        editingZone={editingZone}
        zones={zones}
        onClose={() => {
          setShowZoneModal(false)
          setEditingZone(null)
        }}
        onSubmit={handleSubmitZone}
      />

      <AisleFormModal
        show={showAisleModal}
        editingAisle={editingAisle}
        selectedZone={selectedZone}
        onClose={() => {
          setShowAisleModal(false)
          setEditingAisle(null)
          setSelectedZone(null)
        }}
        onSubmit={handleSubmitAisle}
      />

      <BinFormModal
        show={showBinModal}
        editingBin={editingBin}
        selectedZone={selectedZone}
        selectedAisle={selectedAisle}
        selectedShelf={selectedShelf}
        onClose={() => {
          setShowBinModal(false)
          setEditingBin(null)
          setSelectedZone(null)
          setSelectedAisle(null)
          setSelectedShelf(null)
        }}
        onSubmit={handleSubmitBin}
      />

      <ZoneDetailMapModal
        show={!!showZoneDetailMap}
        zone={zones.find(z => z.id === showZoneDetailMap) || null}
        onClose={() => setShowZoneDetailMap(null)}
      />
    </div>
  )
}
