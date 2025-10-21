//file path: app/dashboard/shipping/components/BoxesTab.tsx

'use client'

/**
 * BoxesTab - Manages shipping boxes with INDEPENDENT multi-warehouse support
 *
 * Storage Architecture v2:
 * -----------------------
 * Each warehouse has its OWN complete set of boxes:
 *   shipping_boxes_warehouse1  // All boxes for NY (carrier + custom)
 *   shipping_boxes_warehouse2  // All boxes for LA (carrier + custom)
 *   shipping_boxes_warehouse3  // All boxes for Miami (carrier + custom)
 *
 * Box Loading (API-ONLY):
 * - Boxes are loaded EXCLUSIVELY from carrier APIs (USPS, UPS, FedEx)
 * - No static/hardcoded boxes - ensures always up-to-date with carrier offerings
 * - User must sync with API to populate boxes
 *
 * Benefits:
 * - Changes in one warehouse don't affect others
 * - Each warehouse can enable/disable boxes independently
 * - "Apply to All Warehouses" option available for bulk updates
 * - Always accurate carrier packaging options
 *
 * "All Warehouses" View:
 * - Shows merged list from all warehouses
 * - Displays which warehouses have each box enabled
 * - No separate storage - computed on-the-fly
 */

import { useState, useEffect } from 'react'
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline'
import { ShippingBox } from '../utils/shippingTypes'
import AddBoxModal from './AddBoxModal'
import Notification from '../../shared/components/Notification'
import { useNotification } from '../../shared/hooks/useNotification'
import { getEnabledShippingCarriers, getUserUSPSCredentials, getUserUPSCredentials } from '@/lib/storage/integrationStorage'
import { useWarehouses } from '../../warehouses/hooks/useWarehouses'

interface BoxesTabProps {
  selectedWarehouseId: string
}

export default function BoxesTab({ selectedWarehouseId }: BoxesTabProps) {
  const [boxes, setBoxes] = useState<ShippingBox[]>([])
  const [filteredBoxes, setFilteredBoxes] = useState<ShippingBox[]>([])
  const [selectedType, setSelectedType] = useState<'all' | 'custom' | 'usps' | 'ups' | 'fedex'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBox, setEditingBox] = useState<ShippingBox | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([])
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Use the notification hook
  const { notification, showSuccess, showError, closeNotification } = useNotification()

  // Get all warehouses for "Apply to All" feature
  const { warehouses } = useWarehouses()

  // Get the localStorage key for specific warehouse
  const getStorageKey = (warehouseId: string) => {
    return `shipping_boxes_${warehouseId}`
  }

  // Get box state across all warehouses
  const getBoxStateAcrossWarehouses = (boxId: string) => {
    const states: { warehouseId: string; warehouseName: string; isActive: boolean }[] = []

    warehouses.forEach(warehouse => {
      const storageKey = getStorageKey(warehouse.id)
      const savedBoxes = localStorage.getItem(storageKey)

      if (savedBoxes) {
        const boxes: ShippingBox[] = JSON.parse(savedBoxes)
        const box = boxes.find(b => {
          // Match by ID for custom boxes
          if (b.id === boxId) return true

          // For carrier boxes, match by type and carrier code
          const targetBox = filteredBoxes.find(fb => fb.id === boxId)
          if (targetBox && b.boxType === targetBox.boxType) {
            const bCarrierCode = (b as any).carrierCode
            const targetCarrierCode = (targetBox as any).carrierCode
            return bCarrierCode === targetCarrierCode
          }
          return false
        })

        if (box) {
          states.push({
            warehouseId: warehouse.id,
            warehouseName: warehouse.name,
            isActive: box.isActive
          })
        }
      }
    })

    return states
  }

  // Get enabled carriers - runs FIRST
  useEffect(() => {
    const carriers = getEnabledShippingCarriers()
    setEnabledCarriers(carriers)
    setIsLoadingCarriers(false)
  }, [])

  // Load boxes from localStorage - runs AFTER carriers are loaded
  useEffect(() => {
    // Don't load boxes until carriers are loaded
    if (isLoadingCarriers || enabledCarriers.length === 0) return

    if (selectedWarehouseId === '') {
      // "All Warehouses" view - merge boxes from all warehouses
      loadAllWarehousesBoxes()
    } else {
      // Specific warehouse - load only that warehouse's boxes
      loadWarehouseBoxes(selectedWarehouseId)
    }
  }, [enabledCarriers, isLoadingCarriers, selectedWarehouseId, warehouses])

  const loadWarehouseBoxes = (warehouseId: string) => {
    const storageKey = getStorageKey(warehouseId)
    const savedBoxes = localStorage.getItem(storageKey)

    if (savedBoxes) {
      const parsed = JSON.parse(savedBoxes)
      // Filter boxes to only show those for enabled carriers
      const filtered = parsed.filter((box: ShippingBox) => {
        if (box.boxType === 'custom') return true
        return enabledCarriers.some(carrier => carrier === box.boxType.toUpperCase())
      })
      setBoxes(filtered)
    } else {
      // No boxes found - user needs to sync from API
      console.log(`[BoxesTab] No boxes found for warehouse ${warehouseId}. User must sync from API.`)
      setBoxes([])
    }
  }

  const loadAllWarehousesBoxes = () => {
    // Merge boxes from all warehouses
    const boxMap = new Map<string, ShippingBox>()
    let hasAnyBoxes = false

    warehouses.forEach(warehouse => {
      const storageKey = getStorageKey(warehouse.id)
      const savedBoxes = localStorage.getItem(storageKey)

      if (savedBoxes) {
        hasAnyBoxes = true
        const parsed = JSON.parse(savedBoxes) as ShippingBox[]

        parsed.forEach(box => {
          // Use a unique key based on box type and identifier
          let boxKey: string

          if (box.boxType === 'custom') {
            // For grouped duplicates - group by duplicateGroupId (NOT originalBoxId!)
            if (box.isDuplicate && box.duplicateGroupId) {
              boxKey = `duplicate-group-${box.duplicateGroupId}` // FIXED: Use duplicateGroupId
            } else {
              boxKey = box.id // Use unique ID for independent custom boxes
            }
          } else {
            // Carrier boxes: group by type and carrier code
            boxKey = `${box.boxType}-${(box as any).carrierCode || box.name}`
          }

          if (!boxMap.has(boxKey)) {
            boxMap.set(boxKey, box)
          }
        })
      }
    })

    if (!hasAnyBoxes) {
      console.log(`[BoxesTab] No boxes found in any warehouse. User must sync from API.`)
      setBoxes([])
      return
    }

    const merged = Array.from(boxMap.values())

    // Filter boxes to only show those for enabled carriers
    const filtered = merged.filter((box: ShippingBox) => {
      if (box.boxType === 'custom') return true
      return enabledCarriers.some(carrier => carrier === box.boxType.toUpperCase())
    })

    setBoxes(filtered)
  }

  // Sync boxes from carrier APIs
  const handleSyncFromAPI = async () => {
    try {
      setIsSyncing(true)

      // Gather credentials for all enabled carriers
      const allCredentials: any = {}

      if (enabledCarriers.includes('USPS')) {
        const uspsCredentials = getUserUSPSCredentials()
        if (uspsCredentials) {
          allCredentials.usps = uspsCredentials
        } else {
          showError('USPS Credentials Missing', 'Please configure USPS in Integrations.')
          setIsSyncing(false)
          return
        }
      }

      if (enabledCarriers.includes('UPS')) {
        const upsCredentials = getUserUPSCredentials()
        if (upsCredentials) {
          allCredentials.ups = upsCredentials
        } else {
          showError('UPS Credentials Missing', 'Please configure UPS in Integrations.')
          setIsSyncing(false)
          return
        }
      }

      console.log('[BoxesTab] Starting sync...')

      const response = await fetch('/api/shipping/boxes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: enabledCarriers,
          credentials: allCredentials
        })
      })

      if (response.ok) {
        const data = await response.json()
        const apiBoxes = data.boxes || []

        console.log('[BoxesTab] Sync response:', apiBoxes.length, 'boxes')

        // Separate variable/editable boxes from regular boxes
        const variableBoxes = apiBoxes.filter((box: any) => box.isEditable || box.needsDimensions)
        const regularBoxes = apiBoxes.filter((box: any) => !box.isEditable && !box.needsDimensions)

        console.log('[BoxesTab] Variable boxes:', variableBoxes.length)
        console.log('[BoxesTab] Regular boxes:', regularBoxes.length)

        // Apply sync to current warehouse or all warehouses
        if (selectedWarehouseId === '') {
          // Sync all warehouses
          console.log('[BoxesTab] Syncing to all warehouses')
          warehouses.forEach(warehouse => {
            syncWarehouseBoxes(warehouse.id, apiBoxes, variableBoxes)
          })
        } else {
          // Sync only selected warehouse
          console.log('[BoxesTab] Syncing to warehouse', selectedWarehouseId)
          syncWarehouseBoxes(selectedWarehouseId, apiBoxes, variableBoxes)
        }

        const updatedCount = apiBoxes.length
        const addedVariableCount = variableBoxes.length

        showSuccess(
          'Sync Successful',
          `Synced ${updatedCount} boxes${addedVariableCount > 0 ? ` (${addedVariableCount} variable boxes included)` : ''}`
        )

        // Reload boxes after a small delay to ensure localStorage is updated
        setTimeout(() => {
          if (selectedWarehouseId === '') {
            loadAllWarehousesBoxes()
          } else {
            loadWarehouseBoxes(selectedWarehouseId)
          }
          setIsSyncing(false)
        }, 100)
      } else {
        const error = await response.json()
        showError('Sync Failed', error.error || 'Unknown error occurred')
        setIsSyncing(false) // Stop loading on error
      }
    } catch (error: any) {
      console.error('[BoxesTab] Sync error:', error)
      showError('Sync Failed', 'Failed to sync boxes. Check console for details.')
      setIsSyncing(false) // Stop loading on error
    }
  }

  const syncWarehouseBoxes = (warehouseId: string, apiBoxes: any[], variableBoxes: any[]) => {
    const storageKey = getStorageKey(warehouseId)
    const savedBoxes = localStorage.getItem(storageKey)
    const existingBoxes: ShippingBox[] = savedBoxes ? JSON.parse(savedBoxes) : []

    // Smart merge with special handling for variable boxes
    const mergedBoxes = smartMergeBoxes(existingBoxes, apiBoxes, variableBoxes)
    localStorage.setItem(storageKey, JSON.stringify(mergedBoxes))

    console.log(`[BoxesTab] Synced ${mergedBoxes.length} boxes to warehouse ${warehouseId}`)
  }

  // Enhanced smart merge function - handles variable boxes specially
  const smartMergeBoxes = (
    existingBoxes: ShippingBox[],
    apiBoxes: any[],
    variableBoxes: any[]
  ): ShippingBox[] => {
    const merged: ShippingBox[] = []
    const processedIds = new Set<string>()

    // Step 1: Process API boxes (regular + variable)
    apiBoxes.forEach(apiBox => {
      const isVariable = apiBox.isEditable || apiBox.needsDimensions

      // Find existing box by carrier code and mail class
      const existing = existingBoxes.find(box =>
        box.boxType === apiBox.boxType &&
        (box as any).carrierCode === apiBox.carrierCode &&
        (box as any).mailClass === apiBox.mailClass
      )

      if (existing) {
        processedIds.add(existing.id)

        if (isVariable) {
          // For variable boxes: preserve user-set dimensions if they exist
          const hasUserDimensions = existing.dimensions.length > 0 &&
                                   existing.dimensions.width > 0 &&
                                   existing.dimensions.height > 0

          merged.push({
            ...existing,
            name: apiBox.name, // Update name from API
            weight: {
              ...existing.weight,
              maxWeight: apiBox.weight.maxWeight, // Update max weight from API
              unit: apiBox.weight.unit
            },
            dimensions: hasUserDimensions ? existing.dimensions : apiBox.dimensions,
            isEditable: true,
            needsDimensions: !hasUserDimensions,
            updatedAt: new Date().toISOString()
          })
        } else {
          // Regular boxes: update from API
          merged.push({
            ...existing,
            name: apiBox.name,
            dimensions: apiBox.dimensions,
            weight: {
              ...existing.weight,
              maxWeight: apiBox.weight.maxWeight,
              unit: apiBox.weight.unit
            },
            updatedAt: new Date().toISOString()
          })
        }
      } else {
        // New box from API - add it
        merged.push({
          ...apiBox,
          id: `${apiBox.boxType}-${merged.length}-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        console.log(`[Sync] Added new ${isVariable ? 'variable' : 'regular'} box: ${apiBox.name}`)
      }
    })

    // Step 2: Keep existing custom boxes (boxType === 'custom')
    const customBoxes = existingBoxes.filter(box =>
      box.boxType === 'custom' && !processedIds.has(box.id)
    )
    merged.push(...customBoxes)

    // Step 3: Keep existing user-modified variable boxes that weren't in API response
    const orphanedVariableBoxes = existingBoxes.filter(box =>
      !processedIds.has(box.id) &&
      box.boxType !== 'custom' &&
      (box as any).isEditable === true
    )
    merged.push(...orphanedVariableBoxes)

    return merged.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Filter boxes
  useEffect(() => {
    let filtered = boxes

    if (selectedType !== 'all') {
      if (selectedType === 'custom') {
        filtered = filtered.filter(box =>
          box.boxType === 'custom' || (box as any).isEditable
        )
      } else {
        filtered = filtered.filter(box =>
          box.boxType === selectedType && !(box as any).isEditable
        )
      }
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(box => {
        const nameMatch = box.name.toLowerCase().includes(searchLower)
        const descMatch = box.description?.toLowerCase().includes(searchLower)
        const boxTypeMatch = box.boxType.toLowerCase().includes(searchLower)
        const carrierTypeMatch = (box as any).carrierType?.toLowerCase().includes(searchLower)
        const mailClassMatch = (box as any).mailClass?.toLowerCase().replace(/_/g, ' ').includes(searchLower)

        return nameMatch || descMatch || boxTypeMatch || carrierTypeMatch || mailClassMatch
      })
    }

    setFilteredBoxes(filtered)
  }, [boxes, selectedType, searchTerm])

  const handleSaveBox = (boxData: Partial<ShippingBox>, applyToAllWarehouses: boolean = false) => {
    if (editingBox) {
      // Editing existing box
      if (applyToAllWarehouses && selectedWarehouseId !== '') {
        // Apply changes to all warehouses
        warehouses.forEach(warehouse => {
          updateBoxInWarehouse(warehouse.id, editingBox, boxData)
        })
        showSuccess('Box Updated', `${boxData.name} has been updated in all warehouses.`)
      } else if (selectedWarehouseId === '') {
        // Update in all warehouses (when "All Warehouses" view)
        warehouses.forEach(warehouse => {
          updateBoxInWarehouse(warehouse.id, editingBox, boxData)
        })
        showSuccess('Box Updated', `${boxData.name} has been updated in all warehouses.`)
      } else {
        // Update only in current warehouse
        updateBoxInWarehouse(selectedWarehouseId, editingBox, boxData)
        showSuccess('Box Updated', `${boxData.name} has been updated.`)
      }
    } else {
      // Creating new custom box
      const newBox: ShippingBox = {
        ...boxData as ShippingBox,
        id: `custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedWarehouseId === '') {
        // Add to all warehouses
        warehouses.forEach(warehouse => {
          addBoxToWarehouse(warehouse.id, newBox)
        })
        showSuccess('Box Added', `${boxData.name} has been created in all warehouses.`)
      } else {
        // Add to current warehouse only
        addBoxToWarehouse(selectedWarehouseId, newBox)
        showSuccess('Box Added', `${boxData.name} has been created.`)
      }
    }

    setShowAddModal(false)
    setEditingBox(null)

    // Reload boxes
    if (selectedWarehouseId === '') {
      loadAllWarehousesBoxes()
    } else {
      loadWarehouseBoxes(selectedWarehouseId)
    }
  }


  const updateBoxInWarehouse = (warehouseId: string, targetBox: ShippingBox, boxData: Partial<ShippingBox>) => {
    const storageKey = getStorageKey(warehouseId)
    const savedBoxes = localStorage.getItem(storageKey)
    const boxes: ShippingBox[] = savedBoxes ? JSON.parse(savedBoxes) : []

    const updatedBoxes = boxes.map(box => {
      let isMatch = false

      if (targetBox.boxType === 'custom') {
        // For grouped duplicates - match by duplicateGroupId
        if (targetBox.isDuplicate && targetBox.duplicateGroupId) {
          isMatch = !!(box.isDuplicate && box.duplicateGroupId === targetBox.duplicateGroupId) // FIX: Force boolean
        } else {
          // Regular custom box - match by ID
          isMatch = box.id === targetBox.id
        }
      } else {
        // Match by carrier properties for carrier boxes
        isMatch = box.boxType === targetBox.boxType &&
                  (box as any).carrierCode === (targetBox as any).carrierCode &&
                  (box as any).mailClass === (targetBox as any).mailClass
      }

      if (isMatch) {
        const hasValidDimensions = boxData.dimensions &&
                                   boxData.dimensions.length > 0 &&
                                   boxData.dimensions.width > 0 &&
                                   boxData.dimensions.height > 0

        const shouldActivate = hasValidDimensions &&
                              (box as any).isEditable &&
                              !box.isActive

        return {
          ...box,
          ...boxData,
          isActive: shouldActivate ? true : (boxData.isActive !== undefined ? boxData.isActive : box.isActive),
          needsDimensions: !hasValidDimensions,
          updatedAt: new Date().toISOString()
        }
      }
      return box
    })

    localStorage.setItem(storageKey, JSON.stringify(updatedBoxes))
    console.log(`[Update] Updated box in warehouse ${warehouseId}`)
  }

  const addBoxToWarehouse = (warehouseId: string, box: ShippingBox) => {
    const storageKey = getStorageKey(warehouseId)
    const savedBoxes = localStorage.getItem(storageKey)
    const boxes: ShippingBox[] = savedBoxes ? JSON.parse(savedBoxes) : []

    boxes.push(box)
    localStorage.setItem(storageKey, JSON.stringify(boxes))
  }

  //file path: app/dashboard/shipping/components/BoxesTab.tsx

  const handleDuplicateBox = (box: ShippingBox) => {
    const hasZeroDimensions = box.dimensions.length === 0 &&
                             box.dimensions.width === 0 &&
                             box.dimensions.height === 0

    const originalCarrier = (box as any).carrierType || box.boxType

    if (selectedWarehouseId === '') {
      // In "All Warehouses" view - create GROUPED duplicates with unique group ID
      const uniqueGroupId = `duplicate-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      console.log(`[Duplicate] Creating grouped duplicates with groupId: ${uniqueGroupId}`)

      warehouses.forEach(warehouse => {
        const warehouseDuplicate: ShippingBox = {
          ...box,
          id: `custom-${warehouse.id}-${Date.now()}-${Math.random()}`,
          boxType: 'custom',
          name: `Copy of ${box.name}`,
          isActive: false,
          carrierType: originalCarrier,
          mailClass: (box as any).mailClass,
          packageType: (box as any).packageType,
          isEditable: true,
          needsDimensions: hasZeroDimensions,
          warehouse: warehouse.id,
          isDuplicate: true,
          duplicateGroupId: uniqueGroupId, // SAME group ID for all warehouses
          originalBoxId: box.id, // Keep for reference
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any
        addBoxToWarehouse(warehouse.id, warehouseDuplicate)
      })
      showSuccess('Box Duplicated', `Created a copy of ${box.name} in all warehouses.`)
      loadAllWarehousesBoxes()
    } else {
      // Specific warehouse - create INDEPENDENT duplicate
      const duplicate: ShippingBox = {
        ...box,
        id: `custom-${Date.now()}-${Math.random()}`,
        boxType: 'custom',
        name: `Copy of ${box.name}`,
        isActive: false,
        carrierType: originalCarrier,
        mailClass: (box as any).mailClass,
        packageType: (box as any).packageType,
        isEditable: true,
        needsDimensions: hasZeroDimensions,
        // No warehouse, isDuplicate, duplicateGroupId, or originalBoxId
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as any
      addBoxToWarehouse(selectedWarehouseId, duplicate)
      showSuccess('Box Duplicated', `Created a copy of ${box.name}.`)
      loadWarehouseBoxes(selectedWarehouseId)
    }
  }

  const deleteBoxFromWarehouse = (warehouseId: string, targetBox: ShippingBox) => {
    const storageKey = getStorageKey(warehouseId)
    const savedBoxes = localStorage.getItem(storageKey)
    if (!savedBoxes) return

    const boxes: ShippingBox[] = JSON.parse(savedBoxes)

    const updatedBoxes = boxes.filter(box => {
      if (targetBox.boxType === 'custom') {
        // For grouped duplicates - match by duplicateGroupId
        if (targetBox.isDuplicate && targetBox.duplicateGroupId) {
          return !(box.isDuplicate && box.duplicateGroupId === targetBox.duplicateGroupId)
        }
        // Regular custom box - match by ID
        return box.id !== targetBox.id
      }

      // For carrier boxes - match by type and carrier code
      return !(
        box.boxType === targetBox.boxType &&
        (box as any).carrierCode === (targetBox as any).carrierCode &&
        (box as any).mailClass === (targetBox as any).mailClass
      )
    })

    localStorage.setItem(storageKey, JSON.stringify(updatedBoxes))
    console.log(`[Delete] Deleted box from warehouse ${warehouseId}`)
  }

  const handleDeleteBox = (id: string) => {
    const boxToDelete = boxes.find(box => box.id === id)
    if (!boxToDelete) return

    if (selectedWarehouseId === '') {
      // All Warehouses View - check if this is a grouped duplicate
      if (boxToDelete.boxType === 'custom' &&
          boxToDelete.isDuplicate &&
          boxToDelete.duplicateGroupId) { // Changed from originalBoxId

        // This is a grouped duplicate - delete from ALL warehouses
        console.log('[Delete] Grouped duplicate - deleting from all warehouses')

        warehouses.forEach(warehouse => {
          const storageKey = getStorageKey(warehouse.id)
          const savedBoxes = localStorage.getItem(storageKey)

          if (savedBoxes) {
            const boxes: ShippingBox[] = JSON.parse(savedBoxes)
            // Find and remove boxes with matching duplicateGroupId
            const updatedBoxes = boxes.filter(box => {
              if (box.isDuplicate && box.duplicateGroupId === boxToDelete.duplicateGroupId) {
                console.log(`[Delete] Removing duplicate from warehouse ${warehouse.id}`)
                return false
              }
              return true
            })
            localStorage.setItem(storageKey, JSON.stringify(updatedBoxes))
          }
        })

        showSuccess('Box Deleted', `${boxToDelete.name} has been deleted from all warehouses.`)
      } else {
        // Regular delete from all warehouses
        warehouses.forEach(warehouse => {
          deleteBoxFromWarehouse(warehouse.id, boxToDelete)
        })
        showSuccess('Box Deleted', `${boxToDelete.name} has been deleted from all warehouses.`)
      }

      loadAllWarehousesBoxes()
    } else {
      // Delete from current warehouse only
      deleteBoxFromWarehouse(selectedWarehouseId, boxToDelete)
      showSuccess('Box Deleted', `${boxToDelete.name} has been deleted.`)
      loadWarehouseBoxes(selectedWarehouseId)
    }
  }

  const handleToggleActive = (id: string) => {
    const box = boxes.find(b => b.id === id)
    if (!box) return

    if (selectedWarehouseId === '') {
      // All Warehouses View

      if (box.boxType === 'custom') {
        // Check if this is a GROUPED DUPLICATE
        if (box.isDuplicate && box.duplicateGroupId) { // Changed from originalBoxId
          console.log('[Toggle] Grouped duplicate - toggling in ALL warehouses')

          // Find all states across warehouses for this group
          let allStates: { warehouseId: string; warehouseName: string; isActive: boolean }[] = []
          warehouses.forEach(warehouse => {
            const storageKey = getStorageKey(warehouse.id)
            const savedBoxes = localStorage.getItem(storageKey)
            if (savedBoxes) {
              const boxes: ShippingBox[] = JSON.parse(savedBoxes)
              const matchingBox = boxes.find(b =>
                b.isDuplicate && b.duplicateGroupId === box.duplicateGroupId
              )
              if (matchingBox) {
                allStates.push({
                  warehouseId: warehouse.id,
                  warehouseName: warehouse.name,
                  isActive: matchingBox.isActive
                })
              }
            }
          })

          const enabledCount = allStates.filter(s => s.isActive).length
          const newState = enabledCount === 0

          console.log(`[Toggle] Grouped duplicate - Setting all to: ${newState}`)
          warehouses.forEach(warehouse => {
            toggleBoxInWarehouse(warehouse.id, box, newState)
          })
          loadAllWarehousesBoxes()
          return
        }

        // For single-warehouse or non-grouped custom boxes
        const boxWarehouse = box.warehouse
        if (boxWarehouse && boxWarehouse !== 'all') {
          console.log(`[Toggle] Single-warehouse custom box - toggling only in: ${boxWarehouse}`)
          toggleBoxInWarehouse(boxWarehouse, box)
          loadAllWarehousesBoxes()
          return
        }

        // Box is in all warehouses - toggle all
        const states = getBoxStateAcrossWarehouses(id)
        const enabledCount = states.filter(s => s.isActive).length
        const allDisabled = enabledCount === 0
        const newState = allDisabled

        console.log(`[Toggle] Custom box (all warehouses) - Setting all to: ${newState}`)
        warehouses.forEach(warehouse => {
          toggleBoxInWarehouse(warehouse.id, box, newState)
        })
        loadAllWarehousesBoxes()
        return
      }

      // For CARRIER boxes - Enable/Disable ALL
      const states = getBoxStateAcrossWarehouses(id)
      const enabledCount = states.filter(s => s.isActive).length
      const allDisabled = enabledCount === 0
      const newState = allDisabled

      console.log(`[Toggle] Carrier box - Setting all to: ${newState}`)
      warehouses.forEach(warehouse => {
        toggleBoxInWarehouse(warehouse.id, box, newState)
      })
      loadAllWarehousesBoxes()
    } else {
      // Single warehouse - normal toggle
      toggleBoxInWarehouse(selectedWarehouseId, box)
      loadWarehouseBoxes(selectedWarehouseId)
    }
  }

  const toggleBoxInWarehouse = (warehouseId: string, targetBox: ShippingBox, forceState?: boolean) => {
    const storageKey = getStorageKey(warehouseId)
    const savedBoxes = localStorage.getItem(storageKey)
    const boxes: ShippingBox[] = savedBoxes ? JSON.parse(savedBoxes) : []

    let matchFound = false
    const updatedBoxes = boxes.map(box => {
      let isMatch = false

      if (targetBox.boxType === 'custom') {
        // For grouped duplicates - match by duplicateGroupId
        if (targetBox.isDuplicate && targetBox.duplicateGroupId) {
          isMatch = !!(box.isDuplicate && box.duplicateGroupId === targetBox.duplicateGroupId) // FIX: Force boolean
        } else {
          // Regular custom box - match by ID
          isMatch = box.id === targetBox.id
        }
      } else {
        // Match by carrier properties for carrier boxes
        isMatch = box.boxType === targetBox.boxType &&
                  (box as any).carrierCode === (targetBox as any).carrierCode &&
                  (box as any).mailClass === (targetBox as any).mailClass
      }

      if (isMatch) {
        matchFound = true
        const newState = forceState !== undefined ? forceState : !box.isActive
        console.log(`[Toggle] Warehouse ${warehouseId}: ${box.name} → ${newState}`)
        return { ...box, isActive: newState }
      }

      return box
    })

    if (!matchFound) {
      console.warn(`[Toggle] No match found in warehouse ${warehouseId} for box:`, targetBox.name)
    }

    localStorage.setItem(storageKey, JSON.stringify(updatedBoxes))
    console.log(`[Toggle] Updated box in warehouse ${warehouseId}`)
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

  const filterOptions = [
    { value: 'all', label: 'All Boxes' },
    { value: 'custom', label: 'Custom' },
    ...enabledCarriers.map(carrier => ({
      value: carrier.toLowerCase(),
      label: carrier
    }))
  ]

  // Show loading state while carriers are being loaded
  if (isLoadingCarriers) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shipping carriers...</p>
        </div>
      </div>
    )
  }

  if (enabledCarriers.length === 0) {
    return (
      <div className="space-y-6">
        <Notification
          show={notification.show}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={closeNotification}
        />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipping Integrations Found</h3>
          <p className="text-gray-600 mb-4">
            You need to enable a shipping integration before managing boxes
          </p>
          <a href="/dashboard/integrations"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Integrations
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
      />

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CubeIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              {selectedWarehouseId ?
                'Packaging Options for This Warehouse' :
                'Packaging Options - All Warehouses'
              }
            </h4>
            <p className="text-sm text-blue-700">
              {selectedWarehouseId ? (
                <>
                  Each warehouse has its own boxes loaded from carrier APIs. Changes here only affect <strong>this warehouse</strong>.
                  Use "Enabled/Disable in all" when editing to sync changes everywhere.
                </>
              ) : (
                <>
                  Changes made here will affect <strong>all warehouses</strong>.
                  Boxes are loaded from carrier APIs to ensure accurate packaging options.
                </>
              )}
            </p>
            {boxes.length === 0 && !searchTerm && (
              <button
                onClick={handleSyncFromAPI}
                disabled={isSyncing}
                className="mt-3 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isSyncing ? 'Syncing...' : 'Sync from API'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search boxes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {/* Clear button - only show when there's text */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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

                  {box.boxType === 'custom' && (box as any).carrierType ? (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getBoxTypeColor((box as any).carrierType)
                    }`}>
                      {(box as any).carrierType.toUpperCase()}
                    </span>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getBoxTypeColor(box.boxType)
                    }`}>
                      {box.boxType.toUpperCase()}
                    </span>
                  )}

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
                  {(box as any).needsDimensions && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 flex items-center gap-1">
                      ⚠️ Needs Dimensions
                    </span>
                  )}
                </div>

                {/* Action Buttons - Duplicate, Edit, Delete */}
                {(box.boxType === 'custom' || (box as any).isEditable) && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicateBox(box)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplicate this box"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>

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

              {/* Availability - Enhanced for All Warehouses View */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">
                    {box.availableFor === 'both' ? 'Domestic & International' :
                     box.availableFor === 'domestic' ? 'Domestic Only' : 'International Only'}
                  </span>

                  {/* All Warehouses View - Show status/action text */}
                  {/* All Warehouses View - Show status/action text */}
                  {selectedWarehouseId === '' && (() => {
                    // For CUSTOM boxes - check warehouse field FIRST
                    if (box.boxType === 'custom') {
                      const boxWarehouse = box.warehouse

                      // For duplicates created from "All Warehouses", show multi-warehouse status
                      if (box.isDuplicate && box.duplicateGroupId && boxWarehouse && boxWarehouse !== 'all') { // Changed
                        const states = getBoxStateAcrossWarehouses(box.id)

                        // If no states found, search by duplicateGroupId
                        let allStates = states
                        if (states.length === 0) {
                          allStates = []
                          warehouses.forEach(warehouse => {
                            const storageKey = getStorageKey(warehouse.id)
                            const savedBoxes = localStorage.getItem(storageKey)
                            if (savedBoxes) {
                              const boxes: ShippingBox[] = JSON.parse(savedBoxes)
                              const matchingBox = boxes.find(b =>
                                b.isDuplicate && b.duplicateGroupId === box.duplicateGroupId // Changed
                              )
                              if (matchingBox) {
                                allStates.push({
                                  warehouseId: warehouse.id,
                                  warehouseName: warehouse.name,
                                  isActive: matchingBox.isActive
                                })
                              }
                            }
                          })
                        }

                        const enabledCount = allStates.filter(s => s.isActive).length
                        const totalCount = allStates.length
                        const allEnabled = enabledCount === totalCount
                        const allDisabled = enabledCount === 0

                        return (
                          <span className={`text-xs font-medium mt-0.5 ${
                            allEnabled ? 'text-green-600' :
                            allDisabled ? 'text-gray-500' :
                            'text-amber-600'
                          }`}>
                            {allEnabled && 'Enabled in all'}
                            {allDisabled && 'Disabled in all'}
                            {!allEnabled && !allDisabled && `Enabled in ${enabledCount}/${totalCount} warehouses`}
                          </span>
                        )
                      }

                      // For single-warehouse custom boxes
                      if (boxWarehouse && boxWarehouse !== 'all') {
                        const warehouse = warehouses.find(w => w.id === boxWarehouse)
                        const warehouseName = warehouse?.name || 'Unknown'

                        return (
                          <span className={`text-xs font-medium mt-0.5 ${
                            box.isActive ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {box.isActive ? 'Enabled' : 'Disabled'} in: {warehouseName}
                          </span>
                        )
                      }

                      // For custom boxes in all warehouses (warehouse === 'all' or not set)
                      const states = getBoxStateAcrossWarehouses(box.id)
                      const enabledWarehouses = states.filter(s => s.isActive).map(s => s.warehouseName)
                      const disabledWarehouses = states.filter(s => !s.isActive).map(s => s.warehouseName)

                      if (states.length === 1) {
                        return (
                          <span className="text-xs font-medium mt-0.5 text-gray-600">
                            {states[0].warehouseName} only
                          </span>
                        )
                      } else if (enabledWarehouses.length > 0) {
                        return (
                          <span className="text-xs font-medium mt-0.5 text-green-600">
                            Enabled in: {enabledWarehouses.join(', ')}
                          </span>
                        )
                      } else {
                        return (
                          <span className="text-xs font-medium mt-0.5 text-gray-500">
                            Disabled in: {disabledWarehouses.join(', ')}
                          </span>
                        )
                      }
                    }

                    // For CARRIER boxes - show multi-warehouse toggle logic
                    const states = getBoxStateAcrossWarehouses(box.id)
                    const enabledCount = states.filter(s => s.isActive).length
                    const totalCount = states.length
                    const allEnabled = enabledCount === totalCount
                    const allDisabled = enabledCount === 0

                    return (
                      <span className={`text-xs font-medium mt-0.5 ${
                        allEnabled ? 'text-green-600' :      // Changed to green for enabled
                        allDisabled ? 'text-gray-500' :      // Changed to gray for disabled
                        'text-amber-600'
                      }`}>
                        {allEnabled && 'Enabled in all'}     {/* STATE not action */}
                        {allDisabled && 'Disabled in all'}   {/* STATE not action */}
                        {!allEnabled && !allDisabled && `Enabled in ${enabledCount}/${totalCount} warehouses`}
                      </span>
                    )
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  {(box as any).needsDimensions && (
                    <span className="text-xs text-amber-600">Set dimensions first</span>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(() => {
                        if (selectedWarehouseId === '') {
                          // All Warehouses View

                          // For CUSTOM boxes with specific warehouse - use direct isActive state
                          if (box.boxType === 'custom' && box.warehouse && box.warehouse !== 'all') {
                            return box.isActive
                          }

                          // For other boxes - check across all warehouses
                          const states = getBoxStateAcrossWarehouses(box.id)
                          const enabledCount = states.filter(s => s.isActive).length
                          return enabledCount > 0
                        }
                        return box.isActive
                      })()}
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
          {boxes.length === 0 ? (
            // No boxes at all - need to sync
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Boxes Found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {searchTerm
                  ? 'No boxes match your search. Try clearing the search filter.'
                  : 'Sync with carrier APIs to load available packaging options'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleSyncFromAPI}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync from API to Load Boxes
                </button>
              )}
            </>
          ) : (
            // Has boxes but filter is hiding them
            <>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No boxes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search'
                  : selectedType === 'custom'
                    ? 'Duplicate a box to create custom variants'
                    : 'Try adjusting your filter'}
              </p>
            </>
          )}
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
        selectedWarehouseId={selectedWarehouseId}
        allWarehouses={warehouses}
      />
    </div>
  )
}
