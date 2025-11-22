//file path: app/dashboard/shared/utils/warehouseStateUtils.tsx

/**
 * Warehouse State Utilities
 *
 * Provides reusable functions for displaying warehouse states across the application.
 * Used for showing which warehouses have boxes, services, or other resources enabled/disabled.
 */

export interface WarehouseState {
  warehouseId: string
  warehouseName: string
  isActive: boolean
}

export interface WarehouseStateDisplayProps {
  states: WarehouseState[]
  className?: string
}

/**
 * Get warehouse display information from states
 * Returns structured data about enabled/disabled warehouses
 */
export function getWarehouseDisplayInfo(states: WarehouseState[]) {
  const enabledWarehouses = states.filter(s => s.isActive).map(s => s.warehouseName)
  const disabledWarehouses = states.filter(s => !s.isActive).map(s => s.warehouseName)
  const enabledCount = enabledWarehouses.length
  const totalCount = states.length
  const allEnabled = enabledCount === totalCount && totalCount > 0
  const allDisabled = enabledCount === 0

  return {
    enabledWarehouses,
    disabledWarehouses,
    enabledCount,
    totalCount,
    allEnabled,
    allDisabled,
    isSingleWarehouse: states.length === 1,
    singleWarehouseName: states.length === 1 ? states[0].warehouseName : null,
    isEnabledInAny: enabledCount > 0
  }
}

/**
 * Component: Display warehouse status for custom boxes
 * Shows detailed warehouse names (enabled/disabled)
 */
export function CustomBoxWarehouseStatus({ states, className = '' }: WarehouseStateDisplayProps) {
  const info = getWarehouseDisplayInfo(states)

  if (info.isSingleWarehouse) {
    const state = states[0]
    return (
      <span className={`text-xs font-medium mt-0.5 ${
        state.isActive ? 'text-green-600' : 'text-gray-500'
      } ${className}`}>
        {state.isActive ? 'Enabled' : 'Disabled'} in: {info.singleWarehouseName}
      </span>
    )
  }

  if (info.enabledWarehouses.length > 0) {
    return (
      <span className={`text-xs font-medium mt-0.5 text-green-600 ${className}`}>
        Enabled in: {info.enabledWarehouses.join(', ')}
      </span>
    )
  }

  return (
    <span className={`text-xs font-medium mt-0.5 text-gray-500 ${className}`}>
      Disabled in: {info.disabledWarehouses.join(', ')}
    </span>
  )
}

/**
 * Component: Display warehouse status for carrier boxes
 * Shows aggregate counts (enabled in X/Y warehouses)
 */
export function CarrierBoxWarehouseStatus({ states, className = '' }: WarehouseStateDisplayProps) {
  const info = getWarehouseDisplayInfo(states)

  return (
    <span className={`text-xs font-medium mt-0.5 ${
      info.allEnabled ? 'text-green-600' :
      info.allDisabled ? 'text-gray-500' :
      'text-amber-600'
    } ${className}`}>
      {info.allEnabled && 'Enabled in all'}
      {info.allDisabled && 'Disabled in all'}
      {!info.allEnabled && !info.allDisabled && `Enabled in ${info.enabledCount}/${info.totalCount} warehouses`}
    </span>
  )
}

/**
 * Get checkbox checked state for "All Warehouses" view
 * Returns true if enabled in ANY warehouse
 */
export function isEnabledInAnyWarehouse(states: WarehouseState[]): boolean {
  return states.some(s => s.isActive)
}

/**
 * Component: Generic warehouse status display
 * Automatically chooses the right format based on context
 */
export function WarehouseStatus({
  states,
  type = 'custom',
  className = ''
}: WarehouseStateDisplayProps & { type?: 'custom' | 'carrier' }) {
  if (type === 'carrier') {
    return <CarrierBoxWarehouseStatus states={states} className={className} />
  }
  return <CustomBoxWarehouseStatus states={states} className={className} />
}

/**
 * Format warehouse state as plain text (for non-React contexts)
 */
export function formatWarehouseStateText(states: WarehouseState[], type: 'custom' | 'carrier' = 'custom'): string {
  const info = getWarehouseDisplayInfo(states)

  if (type === 'carrier') {
    if (info.allEnabled) return 'Enabled in all'
    if (info.allDisabled) return 'Disabled in all'
    return `Enabled in ${info.enabledCount}/${info.totalCount} warehouses`
  }

  // Custom type
  if (info.isSingleWarehouse) {
    return `${info.singleWarehouseName} only`
  }
  if (info.enabledWarehouses.length > 0) {
    return `Enabled in: ${info.enabledWarehouses.join(', ')}`
  }
  return `Disabled in: ${info.disabledWarehouses.join(', ')}`
}
