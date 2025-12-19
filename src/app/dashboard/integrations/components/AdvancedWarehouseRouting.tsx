//file path: app/dashboard/integrations/components/AdvancedWarehouseRouting.tsx

'use client'

import { useState, useEffect } from 'react'
import {
  BuildingOffice2Icon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import {
  EcommerceWarehouseConfig,
  WarehouseAssignment,
  AssignedRegion,
  US_STATES,
  US_REGIONS,
  USRegion
} from '../types/integrationTypes'
import { REGION_ADJACENCY } from '@/app/dashboard/shared/utils/usStates'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'

interface AdvancedWarehouseRoutingProps {
  config: EcommerceWarehouseConfig
  warehouses: Warehouse[]
  onChange: (config: EcommerceWarehouseConfig) => void
}

export default function AdvancedWarehouseRouting({
  config,
  warehouses,
  onChange
}: AdvancedWarehouseRoutingProps) {

  const [selectedWarehouseToAdd, setSelectedWarehouseToAdd] = useState('')
  const [draggedState, setDraggedState] = useState<string | null>(null)
  const [unassignedStates, setUnassignedStates] = useState<string[]>([])

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

  // Get the region of a state
  const getStateRegion = (stateCode: string): USRegion => {
    return US_STATES.find(s => s.code === stateCode)?.region || 'Mountain'
  }

  // Get the region of a warehouse
  const getWarehouseRegion = (warehouse: Warehouse): USRegion => {
    if (!warehouse?.address?.state) {
      console.warn(`[getWarehouseRegion] ⚠️ Warehouse "${warehouse?.name}" is missing address.state - defaulting to West region`)
      return 'Mountain'
    }

    // ✅ FIX: Trim whitespace from state code
    const stateCode = warehouse.address.state.trim()
    return US_STATES.find(s => s.code === stateCode)?.region || 'Mountain'
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
  // ✅ Enhanced with priority-based tiebreaking for equal distances
  const findClosestWarehouse = (stateCode: string, warehouseAssignments: WarehouseAssignment[]): string | null => {
    let closestWarehouse: string | null = null
    let lowestScore = Infinity

    warehouseAssignments.forEach(assignment => {
      const warehouse = warehouses.find(w => w.id === assignment.warehouseId)
      if (!warehouse) return

      const score = calculateProximityScore(stateCode, warehouse)

      // If this warehouse is closer, it becomes the closest
      if (score < lowestScore) {
        lowestScore = score
        closestWarehouse = assignment.warehouseId
      } else if (score === lowestScore && closestWarehouse) {
        // Tie: use priority (lower priority number wins)
        const currentAssignment = warehouseAssignments.find(a => a.warehouseId === closestWarehouse)
        if (currentAssignment && assignment.priority < currentAssignment.priority) {
          closestWarehouse = assignment.warehouseId
        }
      }
    })

    return closestWarehouse
  }

  // Auto-assign states to warehouses based on proximity
  // ✅ FIXED: Assigns each state to exactly ONE warehouse (no overlaps)
  const handleAutoAssign = () => {
    if (config.assignments.length === 0) return
    const allUSStates = US_STATES.map(s => s.code)

    // Single-pass assignment: each state goes to exactly ONE warehouse
    const stateToWarehouse: Record<string, string> = {}

    allUSStates.forEach(stateCode => {
      const closestWarehouseId = findClosestWarehouse(stateCode, config.assignments)

      if (closestWarehouseId) {
        stateToWarehouse[stateCode] = closestWarehouseId

        // Log first 10 for debugging
        if (Object.keys(stateToWarehouse).length <= 10) {
          const warehouse = warehouses.find(w => w.id === closestWarehouseId)
          console.log(`[Auto-Assign] ${stateCode} → ${warehouse?.name} (priority: ${config.assignments.find(a => a.warehouseId === closestWarehouseId)?.priority})`)
        }
      }
    })

    // Build final assignments
    const finalAssignments = config.assignments.map(assignment => {
      const assignedStates = Object.entries(stateToWarehouse)
        .filter(([state, warehouseId]) => warehouseId === assignment.warehouseId)
        .map(([state]) => state)
        .sort()

      console.log(`[Auto-Assign] ${assignment.warehouseName}: ${assignedStates.length} states`)

      return {
        ...assignment,
        regions: [{
          country: 'United States',
          countryCode: 'US',
          states: assignedStates
        }]
      }
    })

    console.log('[Auto-Assign] ✅ Complete - states distributed with no overlaps')

    // Update config
    onChange({
      ...config,
      assignments: finalAssignments
    })
  }

  // Add a warehouse to assignments
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

    onChange({
      ...config,
      assignments: [...config.assignments, newAssignment],
      primaryWarehouseId: config.assignments.length === 0 ? warehouse.id : config.primaryWarehouseId
    })

    setSelectedWarehouseToAdd('')
  }

  // Remove a warehouse assignment
  const handleRemoveAssignment = (assignmentId: string) => {
    onChange({
      ...config,
      assignments: config.assignments.filter(a => a.id !== assignmentId)
    })
  }

  // Drag and drop handlers
  const handleDragStart = (stateCode: string) => {
    setDraggedState(stateCode)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnWarehouse = (assignmentId: string) => {
    if (!draggedState) return

    const newAssignments = config.assignments.map(assignment => {
      // Remove state from all assignments
      const cleanedAssignment = {
        ...assignment,
        regions: assignment.regions.map(region => ({
          ...region,
          states: region.states.filter(s => s !== draggedState)
        }))
      }

      // Add state to target assignment
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

    onChange({
      ...config,
      assignments: newAssignments
    })

    setDraggedState(null)
  }

  const handleDropOnUnassigned = () => {
    if (!draggedState) return

    const newAssignments = config.assignments.map(assignment => ({
      ...assignment,
      regions: assignment.regions.map(region => ({
        ...region,
        states: region.states.filter(s => s !== draggedState)
      }))
    }))

    onChange({
      ...config,
      assignments: newAssignments
    })

    setDraggedState(null)
  }

  // Get state name from code
  const getStateName = (code: string) => {
    return US_STATES.find(s => s.code === code)?.name || code
  }

  // Available warehouses to add
  const availableWarehouses = warehouses.filter(
    w => !config.assignments.some(a => a.warehouseId === w.id)
  )

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleAutoAssign}
            disabled={config.assignments.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Automatically assign states to warehouses based on geographic proximity"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Auto-Assign States
          </button>
        </div>

        {/* Add Warehouse Dropdown */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedWarehouseToAdd}
            onChange={(e) => handleAddWarehouse(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
          >
            <option value="">Add warehouse...</option>
            {availableWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.address.city}, {warehouse.address.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Warehouse Assignments */}
      <div className="space-y-4">
        {config.assignments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No warehouses assigned</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add warehouses above to start configuring region-based routing
            </p>
          </div>
        ) : (
          config.assignments.map((assignment) => {
            const warehouse = warehouses.find(w => w.id === assignment.warehouseId)
            if (!warehouse) return null

            const assignedStateCodes = assignment.regions[0]?.states || []

            return (
              <div
                key={assignment.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnWarehouse(assignment.id)}
                className="bg-white border border-gray-300 rounded-lg p-4 hover:border-indigo-400 transition-colors"
              >
                {/* Warehouse Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <BuildingOffice2Icon className="h-5 w-5 text-gray-400" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{warehouse.name}</h4>
                      <p className="text-xs text-gray-500">
                        {warehouse.address.city}, {warehouse.address.state}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAssignment(assignment.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove warehouse"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Assigned States */}
                <div className="flex flex-wrap gap-1">
                  {assignedStateCodes.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-2">
                      Drag states here to assign them to this warehouse
                    </div>
                  ) : (
                    assignedStateCodes.map(stateCode => (
                      <div
                        key={stateCode}
                        draggable
                        onDragStart={() => handleDragStart(stateCode)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 cursor-move hover:bg-indigo-200 transition-colors"
                        title={`Drag to reassign ${getStateName(stateCode)}`}
                      >
                        {stateCode}
                      </div>
                    ))
                  )}
                </div>

                {/* State Count */}
                <div className="mt-2 text-xs text-gray-500">
                  {assignedStateCodes.length} state{assignedStateCodes.length !== 1 ? 's' : ''} assigned
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Unassigned States */}
      {unassignedStates.length > 0 && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDropOnUnassigned}
          className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg p-4"
        >
          <div className="flex items-center mb-3">
            <MapPinIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h4 className="text-sm font-medium text-yellow-900">
              Unassigned States ({unassignedStates.length})
            </h4>
          </div>
          <p className="text-xs text-yellow-700 mb-3">
            These states are not assigned to any warehouse. Drag them to a warehouse above or use Auto-Assign.
          </p>
          <div className="flex flex-wrap gap-1">
            {unassignedStates.map(stateCode => (
              <div
                key={stateCode}
                draggable
                onDragStart={() => handleDragStart(stateCode)}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 cursor-move hover:bg-yellow-200 transition-colors"
                title={`Drag to assign ${getStateName(stateCode)}`}
              >
                {stateCode}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Orders are routed to warehouses based on customer's shipping state</li>
                <li>Drag and drop states to assign them to specific warehouses</li>
                <li>Use "Auto-Assign" to automatically assign states based on warehouse locations</li>
                <li>The first warehouse added becomes the primary/fallback warehouse</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
