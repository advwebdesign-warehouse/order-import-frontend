//file path: app/dashboard/stores/components/WarehouseAssignmentTab.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BuildingOffice2Icon,
  ArrowPathIcon,
  InformationCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { WarehouseConfig, WarehouseAssignment, US_STATES, US_REGIONS } from '../utils/storeTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'

interface WarehouseAssignmentTabProps {
  warehouseConfig: WarehouseConfig | undefined
  warehouses: Warehouse[]
  onChange: (config: WarehouseConfig) => void
  storeId?: string
}

// Region adjacency map for geographic proximity
const REGION_ADJACENCY: Record<string, string[]> = {
  'West': ['Midwest'],
  'Midwest': ['West', 'South', 'Northeast'],
  'South': ['Midwest', 'West'],
  'Northeast': ['Midwest', 'South']
}

export default function WarehouseAssignmentTab({
  warehouseConfig,
  warehouses,
  onChange,
  storeId
}: WarehouseAssignmentTabProps) {
  const router = useRouter()
  const [config, setConfig] = useState<WarehouseConfig>(
    warehouseConfig || {
      defaultWarehouseId: warehouses[0]?.id || '',
      enableRegionRouting: true,
      assignments: []
    }
  )

  const [draggedState, setDraggedState] = useState<string | null>(null)
  const [unassignedStates, setUnassignedStates] = useState<string[]>([])
  const [selectedWarehouseToAdd, setSelectedWarehouseToAdd] = useState('')

  // Calculate unassigned states
  useEffect(() => {
    const assignedStates = new Set<string>()
    config.assignments.forEach(assignment => {
      assignment.regions.forEach(region => {
        region.states.forEach(state => assignedStates.add(state))
      })
    })

    const allUSStates = US_STATES.map(s => s.code)
    const unassigned = allUSStates.filter(state => !assignedStates.has(state))
    setUnassignedStates(unassigned)
  }, [config.assignments])

  // Sync config changes to parent
  useEffect(() => {
    onChange(config)
  }, [config])

  const setDefaultWarehouse = (warehouseId: string) => {
    setConfig(prev => ({
      ...prev,
      defaultWarehouseId: warehouseId
    }))
  }

  // Get the region of a state
  const getStateRegion = (stateCode: string): string => {
    return US_STATES.find(s => s.code === stateCode)?.region || 'West'
  }

  // Get the region of a warehouse
  const getWarehouseRegion = (warehouse: Warehouse): string => {
    return US_STATES.find(s => s.code === warehouse.address.state)?.region || 'West'
  }

  // Calculate distance score between a state and warehouse (lower = closer)
  const calculateProximityScore = (stateCode: string, warehouse: Warehouse): number => {
    const stateRegion = getStateRegion(stateCode)
    const warehouseRegion = getWarehouseRegion(warehouse)

    // Same region = score 0 (closest)
    if (stateRegion === warehouseRegion) {
      return 0
    }

    // Adjacent region = score 1
    const adjacentRegions = REGION_ADJACENCY[warehouseRegion] || []
    if (adjacentRegions.includes(stateRegion)) {
      return 1
    }

    // Far region = score 2
    return 2
  }

  // Find the closest warehouse for a given state
  const findClosestWarehouse = (stateCode: string, warehouseAssignments: WarehouseAssignment[]): string | null => {
    let closestWarehouse: string | null = null
    let lowestScore = Infinity

    warehouseAssignments.forEach(assignment => {
      const warehouse = warehouses.find(w => w.id === assignment.warehouseId)
      if (!warehouse) return

      const score = calculateProximityScore(stateCode, warehouse)
      if (score < lowestScore) {
        lowestScore = score
        closestWarehouse = assignment.warehouseId
      }
    })

    return closestWarehouse
  }

  const handleAutoAssign = () => {
    if (config.assignments.length === 0) return

    // Step 1: Assign states based on warehouse regions (same region gets assigned)
    const updatedAssignments: WarehouseAssignment[] = config.assignments.map((assignment) => {
      const warehouse = warehouses.find(w => w.id === assignment.warehouseId)
      if (!warehouse) return assignment

      const warehouseRegion = getWarehouseRegion(warehouse)
      const regionStates = US_REGIONS[warehouseRegion as keyof typeof US_REGIONS] || []

      return {
        ...assignment,
        regions: [{
          country: 'United States',
          countryCode: 'US',
          states: regionStates
        }]
      }
    })

    // Step 2: Find all unassigned states
    const assignedStates = new Set<string>()
    updatedAssignments.forEach(assignment => {
      assignment.regions.forEach(region => {
        region.states.forEach(state => assignedStates.add(state))
      })
    })

    const allUSStates = US_STATES.map(s => s.code)
    const remainingUnassigned = allUSStates.filter(state => !assignedStates.has(state))

    // Step 3: Assign each remaining state to the closest warehouse
    const stateToWarehouse: Record<string, string[]> = {}

    remainingUnassigned.forEach(stateCode => {
      const closestWarehouseId = findClosestWarehouse(stateCode, updatedAssignments)
      if (closestWarehouseId) {
        if (!stateToWarehouse[closestWarehouseId]) {
          stateToWarehouse[closestWarehouseId] = []
        }
        stateToWarehouse[closestWarehouseId].push(stateCode)
      }
    })

    // Step 4: Add the proximity-based assignments to each warehouse
    const finalAssignments = updatedAssignments.map(assignment => {
      const additionalStates = stateToWarehouse[assignment.warehouseId] || []
      return {
        ...assignment,
        regions: [{
          country: 'United States',
          countryCode: 'US',
          states: [...assignment.regions[0].states, ...additionalStates]
        }]
      }
    })

    setConfig(prev => ({
      ...prev,
      assignments: finalAssignments
    }))
  }

  const handleAddWarehouse = (warehouseId: string) => {
    if (!warehouseId) return

    const warehouse = warehouses.find(w => w.id === warehouseId)
    if (!warehouse) return

    const newAssignment: WarehouseAssignment = {
      id: `assignment-${warehouse.id}-${Date.now()}`,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      priority: config.assignments.length + 1,
      regions: [{
        country: 'United States',
        countryCode: 'US',
        states: []
      }],
      isActive: true
    }

    setConfig(prev => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment],
      defaultWarehouseId: prev.assignments.length === 0 ? warehouse.id : prev.defaultWarehouseId
    }))

    setSelectedWarehouseToAdd('')
  }

  const handleRemoveAssignment = (assignmentId: string) => {
    setConfig(prev => ({
      ...prev,
      assignments: prev.assignments.filter(a => a.id !== assignmentId)
    }))
  }

  const handleDragStart = (stateCode: string) => {
    setDraggedState(stateCode)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnWarehouse = (assignmentId: string) => {
    if (!draggedState) return

    setConfig(prev => {
      const newAssignments = prev.assignments.map(assignment => {
        const cleanedAssignment = {
          ...assignment,
          regions: assignment.regions.map(region => ({
            ...region,
            states: region.states.filter(s => s !== draggedState)
          }))
        }

        if (assignment.id === assignmentId) {
          return {
            ...cleanedAssignment,
            regions: cleanedAssignment.regions.map((region, idx) =>
              idx === 0 ? {
                ...region,
                states: [...region.states, draggedState]
              } : region
            )
          }
        }

        return cleanedAssignment
      })

      return {
        ...prev,
        assignments: newAssignments
      }
    })

    setDraggedState(null)
  }

  const handleDropOnUnassigned = () => {
    if (!draggedState) return

    setConfig(prev => ({
      ...prev,
      assignments: prev.assignments.map(assignment => ({
        ...assignment,
        regions: assignment.regions.map(region => ({
          ...region,
          states: region.states.filter(s => s !== draggedState)
        }))
      }))
    }))

    setDraggedState(null)
  }

  const getStatesByAssignment = (assignment: WarehouseAssignment): string[] => {
    return assignment.regions.flatMap(r => r.states)
  }

  const getStateName = (code: string): string => {
    return US_STATES.find(s => s.code === code)?.name || code
  }

  const getWarehouseColor = (index: number): string => {
    const colors = [
      'bg-blue-100 border-blue-300 text-blue-800',
      'bg-green-100 border-green-300 text-green-800',
      'bg-purple-100 border-purple-300 text-purple-800',
      'bg-orange-100 border-orange-300 text-orange-800',
      'bg-pink-100 border-pink-300 text-pink-800',
    ]
    return colors[index % colors.length]
  }

  const unusedWarehouses = warehouses.filter(
    wh => !config.assignments.find(a => a.warehouseId === wh.id)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Warehouse Assignment</h3>
        <p className="mt-1 text-sm text-gray-500">
          Assign warehouses to fulfill orders based on shipping regions. Click the star to set a warehouse as default.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAutoAssign}
          disabled={config.assignments.length === 0}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Auto-Assign by Region
        </button>
      </div>

      {/* Info Message */}
      {config.assignments.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm text-indigo-700">
            💡 <strong>Auto-Assign</strong> will intelligently distribute states to warehouses based on geographic proximity - each state goes to its nearest warehouse.
          </p>
        </div>
      )}

      {/* Warehouse Selector */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Select Warehouse to Add</h4>
        <div className="space-y-3">
          <select
            value={selectedWarehouseToAdd}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__add_new__') {
                const params = new URLSearchParams({
                  action: 'add',
                  returnTo: 'stores'
                });
                if (storeId) {
                  params.append('storeId', storeId);
                }
                router.push(`/dashboard/warehouses?${params.toString()}`);
                return;
              }
              setSelectedWarehouseToAdd(value);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a warehouse...</option>
            <option value="__add_new__" className="font-semibold text-indigo-600">
              ➕ Add a warehouse
            </option>
            {unusedWarehouses.length > 0 && (
              <option disabled className="text-gray-400">
                ──────────
              </option>
            )}
            {unusedWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} - {warehouse.address.city}, {warehouse.address.state}
              </option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleAddWarehouse(selectedWarehouseToAdd)}
              disabled={!selectedWarehouseToAdd}
              className="px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected Warehouse
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Drag & Drop to Assign States
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Drag states from unassigned or between warehouses</li>
                <li>Higher priority warehouses are checked first</li>
                <li>States appear in the warehouse's color</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Assignments */}
      <div className="space-y-4">
        {config.assignments.map((assignment, index) => {
          const warehouse = warehouses.find(w => w.id === assignment.warehouseId)
          const assignedStates = getStatesByAssignment(assignment)
          const colorClass = getWarehouseColor(index)

          return (
            <div
              key={assignment.id}
              className={`border-2 rounded-lg p-4 ${colorClass}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDropOnWarehouse(assignment.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <BuildingOffice2Icon className="h-5 w-5" />
                  <div>
                    <h4 className="font-medium">
                      {warehouse?.name || 'Unknown Warehouse'}
                    </h4>
                    <p className="text-xs opacity-75">
                      {warehouse?.address.city}, {warehouse?.address.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultWarehouse(assignment.warehouseId)}
                    className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors flex items-center gap-1.5"
                    title={config.defaultWarehouseId === assignment.warehouseId ? 'Default warehouse' : 'Set as default warehouse'}
                  >
                    {config.defaultWarehouseId === assignment.warehouseId ? (
                      <>
                        <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        <span className="text-xs font-semibold">Default Warehouse</span>
                      </>
                    ) : (
                      <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    className="text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-white bg-opacity-50 rounded border-2 border-dashed border-current">
                {assignedStates.length === 0 ? (
                  <p className="text-sm opacity-60 italic">
                    Drag states here to assign to this warehouse
                  </p>
                ) : (
                  assignedStates.map(stateCode => (
                    <div
                      key={stateCode}
                      draggable
                      onDragStart={() => handleDragStart(stateCode)}
                      className="px-2 py-1 bg-white rounded shadow-sm cursor-move hover:shadow-md transition-shadow text-xs font-medium"
                      title={getStateName(stateCode)}
                    >
                      {stateCode}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-2 text-xs opacity-75">
                {assignedStates.length} {assignedStates.length === 1 ? 'state' : 'states'} assigned
              </div>
            </div>
          )
        })}
      </div>

      {/* Unassigned States */}
      {unassignedStates.length > 0 && (
        <div
          className="border-2 border-gray-300 border-dashed rounded-lg p-4 bg-gray-50"
          onDragOver={handleDragOver}
          onDrop={handleDropOnUnassigned}
        >
          <h4 className="font-medium text-gray-700 mb-3">
            Unassigned States ({unassignedStates.length})
          </h4>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {unassignedStates.map(stateCode => (
              <div
                key={stateCode}
                draggable
                onDragStart={() => handleDragStart(stateCode)}
                className="px-2 py-1 bg-white rounded shadow-sm cursor-move hover:shadow-md transition-shadow text-xs font-medium text-gray-700"
                title={getStateName(stateCode)}
              >
                {stateCode}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Drag these states to a warehouse to assign them
          </p>
        </div>
      )}
    </div>
  )
}
