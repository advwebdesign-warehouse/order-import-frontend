//file path: app/dashboard/shipping/components/BoxesTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { ShippingBox } from '../utils/shippingTypes'
import { USPS_BOXES, UPS_BOXES, FEDEX_BOXES } from '../data/carrierBoxes'
import AddBoxModal from './AddBoxModal'
import { getEnabledShippingCarriers, getUserUSPSCredentials } from '@/lib/storage/integrationStorage'

export default function BoxesTab() {
  const [boxes, setBoxes] = useState<ShippingBox[]>([])
  const [filteredBoxes, setFilteredBoxes] = useState<ShippingBox[]>([])
  const [selectedType, setSelectedType] = useState<'all' | 'custom' | 'usps' | 'ups' | 'fedex'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBox, setEditingBox] = useState<ShippingBox | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)

  // Get enabled carriers
  useEffect(() => {
    const carriers = getEnabledShippingCarriers()
    setEnabledCarriers(carriers)
  }, [])

  // Load boxes from localStorage
  useEffect(() => {
    const savedBoxes = localStorage.getItem('shipping_boxes')
    if (savedBoxes) {
      const parsed = JSON.parse(savedBoxes)
      // Filter boxes to only show those for enabled carriers
      const filtered = parsed.filter((box: ShippingBox) => {
        if (box.boxType === 'custom') return true
        return enabledCarriers.some(carrier => carrier === box.boxType.toUpperCase())
      })
      setBoxes(filtered)
    } else {
      // Initialize with only enabled carrier boxes
      initializeBoxesForEnabledCarriers()
    }
  }, [enabledCarriers])

  // Auto-sync check on load
  useEffect(() => {
    const checkAndAutoSync = async () => {
      if (enabledCarriers.length === 0) return

      const lastSync = localStorage.getItem('boxes_last_sync')
      const now = Date.now()
      const oneDayMs = 24 * 60 * 60 * 1000 // 24 hours

      // Check if last sync was more than 24 hours ago
      if (!lastSync || now - parseInt(lastSync) > oneDayMs) {
        console.log('[Auto-Sync] Last sync was more than 24 hours ago, syncing...')

        // Auto-sync in background
        try {
          await handleSyncFromAPI()
          localStorage.setItem('boxes_last_sync', now.toString())
        } catch (error) {
          console.error('[Auto-Sync] Failed:', error)
        }
      }
    }

    checkAndAutoSync()
  }, [enabledCarriers]) // Run when carriers are loaded

  const initializeBoxesForEnabledCarriers = () => {
    const initialBoxes: ShippingBox[] = []

    enabledCarriers.forEach(carrier => {
      if (carrier === 'USPS') {
        initialBoxes.push(...USPS_BOXES.map((box, index) => ({
          ...box,
          id: `usps-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })))
      } else if (carrier === 'UPS') {
        initialBoxes.push(...UPS_BOXES.map((box, index) => ({
          ...box,
          id: `ups-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })))
      } else if (carrier === 'FedEx' || carrier === 'FEDEX') {
        initialBoxes.push(...FEDEX_BOXES.map((box, index) => ({
          ...box,
          id: `fedex-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })))
      }
    })

    setBoxes(initialBoxes)
    localStorage.setItem('shipping_boxes', JSON.stringify(initialBoxes))
  }

  // Sync boxes from carrier APIs
  const handleSyncFromAPI = async () => {
    setSyncing(true)
    try {
      // Get credentials from localStorage (client-side)
      const credentials = getUserUSPSCredentials()

      console.log('Credentials from localStorage:', credentials ? 'Found' : 'Not found')

      if (!credentials && enabledCarriers.includes('USPS')) {
        alert('USPS credentials not found. Please configure USPS in Integrations.')
        setSyncing(false)
        return
      }

      // Call API to get available packaging options from carrier
      const response = await fetch('/api/shipping/boxes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: enabledCarriers,
          credentials: credentials
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)

        const apiBoxes = data.boxes || []

        // Smart merge: Keep custom boxes, intelligently update carrier boxes
        const mergedBoxes = smartMergeBoxes(boxes, apiBoxes)

        setBoxes(mergedBoxes)
        localStorage.setItem('shipping_boxes', JSON.stringify(mergedBoxes))
        localStorage.setItem('boxes_last_sync', Date.now().toString())

        const updatedCount = mergedBoxes.filter(box => box.boxType !== 'custom').length
        alert(`Successfully synced ${updatedCount} boxes from carrier APIs!`)
      } else {
        const error = await response.json()
        alert(`Failed to sync: ${error.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Sync error:', error)
      alert('Failed to sync boxes. Check console for details.')
    } finally {
      setSyncing(false)
    }
  }

  // Smart merge function - preserves user customizations
  const smartMergeBoxes = (existingBoxes: ShippingBox[], apiBoxes: any[]): ShippingBox[] => {
    const merged: ShippingBox[] = []

    // Process API boxes first
    apiBoxes.forEach(apiBox => {
      // Find if this box already exists
      const existing = existingBoxes.find(box =>
        box.boxType === apiBox.boxType &&
        (box as any).carrierCode === apiBox.carrierCode &&
        (box as any).mailClass === apiBox.mailClass
      )

      if (existing) {
        // Box exists - check if user customized it
        const isVariableBox = apiBox.isEditable
        const hasCustomDimensions = existing.dimensions.length > 0 &&
                                     existing.dimensions.width > 0 &&
                                     existing.dimensions.height > 0

        if (isVariableBox && hasCustomDimensions) {
          // Variable box with custom dimensions - preserve user customizations
          console.log(`[Sync] Preserving customizations for: ${existing.name}`)
          merged.push({
            ...existing,
            // Only update carrier-controlled fields
            weight: {
              ...existing.weight,
              maxWeight: apiBox.weight.maxWeight, // Update max weight from API
              unit: apiBox.weight.unit
            },
            availableFor: apiBox.availableFor, // Update availability rules
            updatedAt: new Date().toISOString()
          })
        } else {
          // Non-customized box or flat rate box - update everything
          console.log(`[Sync] Updating: ${apiBox.name}`)
          merged.push({
            ...apiBox,
            id: existing.id, // Keep the same ID
            isActive: existing.isActive, // Preserve active state
            createdAt: existing.createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
          })
        }
      } else {
        // New box from API - add it
        console.log(`[Sync] Adding new box: ${apiBox.name}`)
        merged.push(apiBox)
      }
    })

    // Keep legacy carrier boxes that are no longer in API
    const existingCarrierBoxes = existingBoxes.filter(box =>
      box.boxType !== 'custom' &&
      !merged.some(m => m.id === box.id)
    )

    existingCarrierBoxes.forEach(box => {
      console.log(`[Sync] Keeping legacy box: ${box.name}`)
      merged.push(box)
    })

    // Add custom boxes at the end
    const customBoxes = existingBoxes.filter(box => box.boxType === 'custom')
    merged.push(...customBoxes)

    // Sort boxes in logical order
    const sorted = merged.sort((a, b) => {
      // 1. Carrier boxes first, then custom boxes
      const aIsCustom = a.boxType === 'custom'
      const bIsCustom = b.boxType === 'custom'

      if (aIsCustom !== bIsCustom) {
        return aIsCustom ? 1 : -1 // Carrier boxes first
      }

      // 2. Within carrier boxes: flat rate first, then variable/editable boxes
      if (!aIsCustom && !bIsCustom) {
        const aIsFlatRate = a.flatRate
        const bIsFlatRate = b.flatRate
        const aIsEditable = (a as any).isEditable
        const bIsEditable = (b as any).isEditable

        if (aIsFlatRate !== bIsFlatRate) {
          return aIsFlatRate ? -1 : 1 // Flat rate first
        }

        // Both flat rate or both variable - sort alphabetically
        return a.name.localeCompare(b.name)
      }

      // 3. Custom boxes: sort by creation date (newest first)
      if (aIsCustom && bIsCustom) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }

      return 0
    })

    return sorted
  }

  // Filter boxes
  useEffect(() => {
    let filtered = boxes

    if (selectedType !== 'all') {
      if (selectedType === 'custom') {
        // Show both custom boxes AND editable variable boxes
        filtered = filtered.filter(box =>
          box.boxType === 'custom' || (box as any).isEditable
        )
      } else {
        // For carrier filters (usps, ups, fedex), exclude editable boxes
        filtered = filtered.filter(box =>
          box.boxType === selectedType && !(box as any).isEditable
        )
      }
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(box => {
        // Search in name
        const nameMatch = box.name.toLowerCase().includes(searchLower)

        // Search in description
        const descMatch = box.description?.toLowerCase().includes(searchLower)

        // Search in box type (usps, ups, fedex, custom)
        const boxTypeMatch = box.boxType.toLowerCase().includes(searchLower)

        // Search in carrier type (for custom boxes that have original carrier)
        const carrierTypeMatch = (box as any).carrierType?.toLowerCase().includes(searchLower)

        // Search in mail class (PRIORITY_MAIL, GROUND_ADVANTAGE, etc)
        const mailClassMatch = (box as any).mailClass?.toLowerCase().replace(/_/g, ' ').includes(searchLower)

        // Return true if any field matches
        return nameMatch || descMatch || boxTypeMatch || carrierTypeMatch || mailClassMatch
      })
    }

    setFilteredBoxes(filtered)
  }, [boxes, selectedType, searchTerm])

  const handleSaveBox = (boxData: Partial<ShippingBox>) => {
    if (editingBox) {
      // Update existing
      const updated = boxes.map(box => {
        if (box.id === editingBox.id) {
          // Check if dimensions were added to a variable box
          const hasValidDimensions = boxData.dimensions &&
                                     boxData.dimensions.length > 0 &&
                                     boxData.dimensions.width > 0 &&
                                     boxData.dimensions.height > 0

          // Auto-activate if dimensions are now set
          const shouldActivate = hasValidDimensions &&
                                (box as any).isEditable &&
                                !box.isActive

          return {
            ...box,
            ...boxData,
            isActive: shouldActivate ? true : box.isActive, // Auto-activate
            needsDimensions: !hasValidDimensions, // Clear warning if dimensions set
            updatedAt: new Date().toISOString()
          }
        }
        return box
      })
      setBoxes(updated)
      localStorage.setItem('shipping_boxes', JSON.stringify(updated))
    } else {
      // Add new custom box
      const newBox: ShippingBox = {
        ...boxData as ShippingBox,
        id: `custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      const updated = [...boxes, newBox]
      setBoxes(updated)
      localStorage.setItem('shipping_boxes', JSON.stringify(updated))
    }
    setShowAddModal(false)
    setEditingBox(null)
  }

  const handleDuplicateBox = (box: ShippingBox) => {
    // Check if original box needs dimensions
    const hasZeroDimensions = box.dimensions.length === 0 &&
                             box.dimensions.width === 0 &&
                             box.dimensions.height === 0

    const originalCarrier = (box as any).carrierType || box.boxType

    // Create a duplicate with custom type
    const duplicate: ShippingBox = {
      ...box,
      id: `custom-${Date.now()}`,
      boxType: 'custom',
      name: `Copy of ${box.name}`,
      isActive: false, // Start inactive
      carrierType: originalCarrier, // Store original carrier
      mailClass: (box as any).mailClass,
      packageType: (box as any).packageType,
      isEditable: true,
      needsDimensions: hasZeroDimensions, // This should be true for 0×0×0 boxes
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as any

    const updated = [...boxes, duplicate]
    setBoxes(updated)
    localStorage.setItem('shipping_boxes', JSON.stringify(updated))
  }

  const handleDeleteBox = (id: string) => {
    if (confirm('Are you sure you want to delete this box?')) {
      const updated = boxes.filter(box => box.id !== id)
      setBoxes(updated)
      localStorage.setItem('shipping_boxes', JSON.stringify(updated))
    }
  }

  const handleToggleActive = (id: string) => {
    const updated = boxes.map(box =>
      box.id === id ? { ...box, isActive: !box.isActive } : box
    )
    setBoxes(updated)
    localStorage.setItem('shipping_boxes', JSON.stringify(updated))
  }

  const getBoxTypeColor = (type: string) => {
    switch (type) {
      case 'custom': return 'bg-purple-100 text-purple-800'
      case 'usps': return 'bg-blue-100 text-blue-800'
      case 'ups': return 'bg-amber-100 text-amber-800'
      case 'fedex': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Build filter options based on enabled carriers
  const filterOptions = [
    { value: 'all', label: 'All Boxes' },
    { value: 'custom', label: 'Custom' },
    ...enabledCarriers.map(carrier => ({
      value: carrier.toLowerCase(),
      label: carrier
    }))
  ]

  if (enabledCarriers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipping Integrations Found</h3>
        <p className="text-gray-600 mb-4">
          You need to enable a shipping integration before managing boxes
        </p>

        <a href="/dashboard/integrations"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Integrations
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CubeIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Packaging Options Based on Your Account
            </h4>
            <p className="text-sm text-blue-700">
              These boxes reflect the packaging options available with your carrier account.
              Rates and availability may vary based on your negotiated rates and service level.
              Click "Sync from API" to refresh with your latest options.
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search boxes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSyncFromAPI}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowPathIcon className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from API'}
            </button>
          </div>
        </div>
      </div>

      {/* Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBoxes.map((box) => (
          <div
            key={box.id}
            className="bg-white rounded-lg shadow-sm border-2 border-gray-200 transition-all"
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <CubeIcon className="h-6 w-6 text-gray-400" />

                  {/* Show original carrier for custom boxes, otherwise show box type */}
                  {box.boxType === 'custom' && (box as any).carrierType ? (
                    // Custom box - show original carrier
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getBoxTypeColor((box as any).carrierType)
                    }`}>
                      {(box as any).carrierType.toUpperCase()}
                    </span>
                  ) : (
                    // Regular box - show box type
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getBoxTypeColor(box.boxType)
                    }`}>
                      {box.boxType.toUpperCase()}
                    </span>
                  )}

                  {/* Service Type Badge */}
                  {(box as any).mailClass && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {(box as any).mailClass.replace(/_/g, ' ')}
                    </span>
                  )}

                  {box.flatRate && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Flat Rate
                    </span>
                  )}
                  {/* Warning badge for boxes needing dimensions */}
                  {(box as any).needsDimensions && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center gap-1">
                      ⚠️ Needs Dimensions
                    </span>
                  )}
                </div>

                {/* Action buttons - Icon only */}
                {(box.boxType === 'custom' || (box as any).isEditable) && (
                  <div className="flex gap-1">
                    {/* Duplicate button - Icon only */}
                    <button
                      onClick={() => handleDuplicateBox(box)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplicate this box"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>

                    {/* Edit button - Icon only */}
                    <button
                      onClick={() => {
                        setEditingBox(box)
                        setShowAddModal(true)
                      }}
                      className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title={box.boxType === 'custom' ? 'Edit box' : 'Edit dimensions'}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    {/* Delete button - Icon only (only for custom boxes) */}
                    {box.boxType === 'custom' && (
                      <button
                        onClick={() => handleDeleteBox(box.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete box"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Box Name */}
              <h3 className="font-semibold text-gray-900 mb-2">{box.name}</h3>
              {box.description && (
                <p className="text-sm text-gray-600 mb-3">{box.description}</p>
              )}

              {/* Dimensions */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dimensions:</span>
                  <span className="font-medium text-gray-900">
                    {box.dimensions.length} × {box.dimensions.width} × {box.dimensions.height} {box.dimensions.unit}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max Weight:</span>
                  <span className="font-medium text-gray-900">
                    {box.weight.maxWeight} {box.weight.unit}
                  </span>
                </div>

              </div>

              {/* Availability */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {box.availableFor === 'both' ? 'Domestic & International' :
                   box.availableFor === 'domestic' ? 'Domestic Only' : 'International Only'}
                </span>
                <div className="flex items-center gap-2">
                  {/* Show warning whenever dimensions are needed */}
                  {(box as any).needsDimensions && (
                    <span className="text-xs text-amber-600">Set dimensions first</span>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={box.isActive}
                      onChange={() => handleToggleActive(box.id)}
                      disabled={(box as any).needsDimensions}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBoxes.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No boxes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search'
              : selectedType === 'custom'
                ? 'Duplicate a box to create custom variants'
                : 'Click "Sync from API" to load your carrier boxes'
            }
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddBoxModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingBox(null)
        }}
        onSave={handleSaveBox}
        box={editingBox}
      />
    </div>
  )
}
