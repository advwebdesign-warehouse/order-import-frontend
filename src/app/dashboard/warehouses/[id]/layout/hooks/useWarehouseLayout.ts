//file path: app/dashboard/warehouses/[id]/layout/hooks/useWarehouseLayout.ts
import { useState, useEffect, useCallback } from 'react'
import {
  WarehouseLayout,
  Zone,
  Aisle,
  Shelf,
  Bin,
  LocationFormat,
  LayoutStats,
  LocationSuggestion,
  StructuredLocation
} from '../../../utils/warehouseTypes'

// Mock data - replace with actual API calls
const createMockLayout = (warehouseId: string): WarehouseLayout | null => {
  // Return null for warehouses without layout
  if (warehouseId === '1') {
    return {
      zones: [
        {
          id: 'zone-1',
          name: 'General Storage',
          code: 'A',
          description: 'Main storage area for regular inventory',
          color: '#3B82F6',
          type: 'storage',
          isActive: true,
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
          aisles: [
            {
              id: 'aisle-1',
              name: 'Aisle 01',
              code: '01',
              description: 'First aisle in general storage',
              maxHeight: 12,
              width: 8,
              length: 50,
              unit: 'feet',
              isActive: true,
              createdAt: '2025-01-01T10:00:00Z',
              updatedAt: '2025-01-01T10:00:00Z',
              shelves: [
                {
                  id: 'shelf-1',
                  name: 'Shelf Level 1',
                  code: '1',
                  level: 1,
                  maxWeight: 500,
                  weightUnit: 'lbs',
                  isActive: true,
                  createdAt: '2025-01-01T10:00:00Z',
                  updatedAt: '2025-01-01T10:00:00Z',
                  bins: [
                    {
                      id: 'bin-1',
                      name: 'Bin A',
                      code: 'A',
                      position: 1,
                      capacity: 50,
                      currentStock: 25,
                      isActive: true,
                      reserved: false,
                      createdAt: '2025-01-01T10:00:00Z',
                      updatedAt: '2025-01-01T10:00:00Z'
                    },
                    {
                      id: 'bin-2',
                      name: 'Bin B',
                      code: 'B',
                      position: 2,
                      capacity: 50,
                      currentStock: 0,
                      isActive: true,
                      reserved: false,
                      createdAt: '2025-01-01T10:00:00Z',
                      updatedAt: '2025-01-01T10:00:00Z'
                    }
                  ]
                },
                {
                  id: 'shelf-2',
                  name: 'Shelf Level 2',
                  code: '2',
                  level: 2,
                  maxWeight: 300,
                  weightUnit: 'lbs',
                  isActive: true,
                  createdAt: '2025-01-01T10:00:00Z',
                  updatedAt: '2025-01-01T10:00:00Z',
                  bins: [
                    {
                      id: 'bin-3',
                      name: 'Bin A',
                      code: 'A',
                      position: 1,
                      capacity: 30,
                      currentStock: 15,
                      isActive: true,
                      reserved: false,
                      createdAt: '2025-01-01T10:00:00Z',
                      updatedAt: '2025-01-01T10:00:00Z'
                    }
                  ]
                }
              ]
            },
            {
              id: 'aisle-2',
              name: 'Aisle 02',
              code: '02',
              description: 'Second aisle in general storage',
              maxHeight: 12,
              width: 8,
              length: 50,
              unit: 'feet',
              isActive: true,
              createdAt: '2025-01-01T10:00:00Z',
              updatedAt: '2025-01-01T10:00:00Z',
              shelves: []
            }
          ]
        },
        {
          id: 'zone-2',
          name: 'Receiving',
          code: 'RCV',
          description: 'Incoming shipment staging area',
          color: '#10B981',
          type: 'receiving',
          isActive: true,
          createdAt: '2025-01-01T10:00:00Z',
          updatedAt: '2025-01-01T10:00:00Z',
          aisles: []
        }
      ],
      defaultLocationFormat: {
        pattern: '{zone}-{aisle}-{shelf}-{bin}',
        separator: '-',
        includeZone: true,
        includeAisle: true,
        includeShelf: true,
        includeBin: true
      },
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2025-01-01T10:00:00Z'
    }
  }

  return null
}

export function useWarehouseLayout(warehouseId: string) {
  const [layout, setLayout] = useState<WarehouseLayout | null>(null)
  const [layoutStats, setLayoutStats] = useState<LayoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate layout statistics
  const calculateStats = useCallback((layout: WarehouseLayout | null): LayoutStats | null => {
    if (!layout) return null

    const totalZones = layout.zones.length
    const totalAisles = layout.zones.reduce((sum, zone) => sum + zone.aisles.length, 0)
    const totalShelves = layout.zones.reduce(
      (sum, zone) => sum + zone.aisles.reduce((aisleSum, aisle) => aisleSum + aisle.shelves.length, 0),
      0
    )
    const totalBins = layout.zones.reduce(
      (sum, zone) => sum + zone.aisles.reduce(
        (aisleSum, aisle) => aisleSum + aisle.shelves.reduce(
          (shelfSum, shelf) => shelfSum + shelf.bins.length,
          0
        ),
        0
      ),
      0
    )
    const occupiedBins = layout.zones.reduce(
      (sum, zone) => sum + zone.aisles.reduce(
        (aisleSum, aisle) => aisleSum + aisle.shelves.reduce(
          (shelfSum, shelf) => shelfSum + shelf.bins.filter(bin => (bin.currentStock || 0) > 0).length,
          0
        ),
        0
      ),
      0
    )
    const emptyBins = totalBins - occupiedBins
    const utilizationRate = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0

    return {
      totalZones,
      totalAisles,
      totalShelves,
      totalBins,
      occupiedBins,
      emptyBins,
      utilizationRate
    }
  }, [])

  // Load layout data
  useEffect(() => {
    const loadLayout = async () => {
      try {
        setLoading(true)
        // Mock API call - replace with actual API
        await new Promise(resolve => setTimeout(resolve, 500))

        const mockLayout = createMockLayout(warehouseId)
        setLayout(mockLayout)
        setLayoutStats(calculateStats(mockLayout))
        setError(null)
      } catch (err) {
        setError('Failed to load warehouse layout')
        console.error('Error loading layout:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLayout()
  }, [warehouseId, calculateStats])

  // Zone operations
  const createZone = useCallback(async (zoneData: Partial<Zone>) => {
    try {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: zoneData.name || 'New Zone',
        code: zoneData.code || 'NZ',
        description: zoneData.description,
        color: zoneData.color || '#6B7280',
        type: zoneData.type || 'storage',
        isActive: true,
        aisles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updatedLayout = layout ? {
        ...layout,
        zones: [...layout.zones, newZone],
        updatedAt: new Date().toISOString()
      } : {
        zones: [newZone],
        defaultLocationFormat: {
          pattern: '{zone}-{aisle}-{shelf}-{bin}',
          separator: '-',
          includeZone: true,
          includeAisle: true,
          includeShelf: true,
          includeBin: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
      setLayoutStats(calculateStats(updatedLayout))
    } catch (err) {
      console.error('Error creating zone:', err)
      setError('Failed to create zone')
    }
  }, [layout, calculateStats])

  const updateZone = useCallback(async (zoneId: string, updates: Partial<Zone>) => {
    try {
      if (!layout) return

      const updatedLayout = {
        ...layout,
        zones: layout.zones.map(zone =>
          zone.id === zoneId
            ? { ...zone, ...updates, updatedAt: new Date().toISOString() }
            : zone
        ),
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
      setLayoutStats(calculateStats(updatedLayout))
    } catch (err) {
      console.error('Error updating zone:', err)
      setError('Failed to update zone')
    }
  }, [layout, calculateStats])

  const deleteZone = useCallback(async (zoneId: string) => {
    try {
      if (!layout) return

      const updatedLayout = {
        ...layout,
        zones: layout.zones.filter(zone => zone.id !== zoneId),
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
      setLayoutStats(calculateStats(updatedLayout))
    } catch (err) {
      console.error('Error deleting zone:', err)
      setError('Failed to delete zone')
    }
  }, [layout, calculateStats])

  // Aisle operations
  const createAisle = useCallback(async (zoneId: string, aisleData: Partial<Aisle>) => {
    try {
      if (!layout) return

      const newAisle: Aisle = {
        id: `aisle-${Date.now()}`,
        name: aisleData.name || 'New Aisle',
        code: aisleData.code || 'NA',
        description: aisleData.description,
        maxHeight: aisleData.maxHeight,
        width: aisleData.width,
        length: aisleData.length,
        unit: aisleData.unit || 'feet',
        shelves: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const updatedLayout = {
        ...layout,
        zones: layout.zones.map(zone =>
          zone.id === zoneId
            ? { ...zone, aisles: [...zone.aisles, newAisle], updatedAt: new Date().toISOString() }
            : zone
        ),
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
      setLayoutStats(calculateStats(updatedLayout))
    } catch (err) {
      console.error('Error creating aisle:', err)
      setError('Failed to create aisle')
    }
  }, [layout, calculateStats])

  const updateAisle = useCallback(async (zoneId: string, aisleId: string, updates: Partial<Aisle>) => {
    try {
      if (!layout) return

      const updatedLayout = {
        ...layout,
        zones: layout.zones.map(zone =>
          zone.id === zoneId
            ? {
                ...zone,
                aisles: zone.aisles.map(aisle =>
                  aisle.id === aisleId
                    ? { ...aisle, ...updates, updatedAt: new Date().toISOString() }
                    : aisle
                ),
                updatedAt: new Date().toISOString()
              }
            : zone
        ),
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
      setLayoutStats(calculateStats(updatedLayout))
    } catch (err) {
      console.error('Error updating aisle:', err)
      setError('Failed to update aisle')
    }
  }, [layout, calculateStats])

  const deleteAisle = useCallback(async (zoneId: string, aisleId: string) => {
    try {
      if (!layout) return

      const updatedLayout = {
        ...layout,
        zones: layout.zones.map(zone =>
          zone.id === zoneId
            ? {
                ...zone,
                aisles: zone.aisles.filter(aisle => aisle.id !== aisleId),
                updatedAt: new Date().toISOString()
              }
            : zone
        ),
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
      setLayoutStats(calculateStats(updatedLayout))
    } catch (err) {
      console.error('Error deleting aisle:', err)
      setError('Failed to delete aisle')
    }
  }, [layout, calculateStats])

  // Location format operations
  const updateLocationFormat = useCallback(async (format: LocationFormat) => {
    try {
      if (!layout) return

      const updatedLayout = {
        ...layout,
        defaultLocationFormat: format,
        updatedAt: new Date().toISOString()
      }

      setLayout(updatedLayout)
    } catch (err) {
      console.error('Error updating location format:', err)
      setError('Failed to update location format')
    }
  }, [layout])

  // Generate location suggestions for products
  const generateLocationSuggestions = useCallback((productId: string, quantity: number): LocationSuggestion[] => {
    if (!layout) return []

    const suggestions: LocationSuggestion[] = []

    layout.zones.forEach(zone => {
      zone.aisles.forEach(aisle => {
        aisle.shelves.forEach(shelf => {
          shelf.bins.forEach(bin => {
            if (bin.isActive && !bin.reserved && bin.capacity && (bin.currentStock || 0) + quantity <= bin.capacity) {
              const structuredLocation: StructuredLocation = {
                zoneId: zone.id,
                zoneName: zone.name,
                zoneCode: zone.code,
                aisleId: aisle.id,
                aisleName: aisle.name,
                aisleCode: aisle.code,
                shelfId: shelf.id,
                shelfName: shelf.name,
                shelfCode: shelf.code,
                shelfLevel: shelf.level,
                binId: bin.id,
                binName: bin.name,
                binCode: bin.code,
                binPosition: bin.position,
                formattedLocation: `${zone.code}-${aisle.code}-${shelf.code}-${bin.code}`
              }

              const availableCapacity = bin.capacity - (bin.currentStock || 0)
              const utilizationAfter = ((bin.currentStock || 0) + quantity) / bin.capacity

              suggestions.push({
                location: structuredLocation,
                reason: `Available capacity: ${availableCapacity} units`,
                priority: utilizationAfter > 0.8 ? 'low' : utilizationAfter > 0.5 ? 'medium' : 'high'
              })
            }
          })
        })
      })
    })

    // Sort by priority and available capacity
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }).slice(0, 10) // Return top 10 suggestions
  }, [layout])

  return {
    layout,
    layoutStats,
    loading,
    error,
    createZone,
    updateZone,
    deleteZone,
    createAisle,
    updateAisle,
    deleteAisle,
    updateLocationFormat,
    generateLocationSuggestions
  }
}
