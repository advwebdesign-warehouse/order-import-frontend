//file path: app/dashboard/warehouses/context/WarehouseContext.tsx

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Warehouse, LinkedIntegration, DEFAULT_ORDER_STATUS_SETTINGS } from '../utils/warehouseTypes'
import { WarehouseAPI } from '@/lib/api/warehouseApi'

interface WarehouseContextType {
  warehouses: Warehouse[]
  loading: boolean
  error: string | null
  addWarehouse: (warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Warehouse>
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => Promise<void>
  deleteWarehouse: (id: string) => Promise<void>
  getDefaultWarehouse: () => Warehouse | null
  getActiveWarehouses: () => Warehouse[]
  refetchWarehouses: () => Promise<void>
  updateWarehouseOrderSettings: (id: string, orderStatusSettings: Partial<Warehouse['settings']['orderStatusSettings']>) => Promise<void>
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined)

interface WarehouseProviderProps {
  children: ReactNode
}

// ✅ NEW: Helper to compute linked integrations for warehouses
async function computeLinkedIntegrations(warehouses: Warehouse[]): Promise<Warehouse[]> {
  try {
    // Fetch all integrations
    const response = await fetch('/api/integrations', {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      console.warn('[WarehouseContext] Failed to fetch integrations, skipping linking')
      return warehouses
    }

    const data = await response.json()
    const integrations = data.integrations || []

    console.log('[WarehouseContext] Computing linked integrations for', warehouses.length, 'warehouses from', integrations.length, 'integrations')

    // Map each warehouse to include linked integrations
    return warehouses.map(warehouse => {
      const linkedIntegrations: LinkedIntegration[] = []

      for (const integration of integrations) {
        // Check shipping integrations (single warehouse)
        if (integration.type === 'shipping' && integration.warehouseId === warehouse.id) {
          linkedIntegrations.push({
            id: integration.id,
            name: integration.name,
            type: integration.type,
            status: integration.status || 'active',
            logo: integration.logo,
            linkType: 'single',
          })
        }

        // Check e-commerce integrations (routing config)
        if (integration.type === 'ecommerce' && integration.routingConfig) {
          const config = integration.routingConfig

          // Simple mode: primary warehouse
          if (config.mode === 'simple' && config.primaryWarehouseId === warehouse.id) {
            linkedIntegrations.push({
              id: integration.id,
              name: integration.name,
              type: integration.type,
              status: integration.status || 'active',
              logo: integration.logo,
              linkType: 'primary',
              storeId: integration.storeId,
              storeName: integration.storeName,
            })
          }

          // Simple mode: fallback warehouse
          if (config.mode === 'simple' && config.fallbackWarehouseId === warehouse.id) {
            linkedIntegrations.push({
              id: integration.id,
              name: integration.name,
              type: integration.type,
              status: integration.status || 'active',
              logo: integration.logo,
              linkType: 'fallback',
              storeId: integration.storeId,
              storeName: integration.storeName,
            })
          }

          // Advanced mode: check assignments
          if (config.mode === 'advanced' && config.assignments) {
            const hasAssignment = config.assignments.some(
              (assignment: any) => assignment.warehouseId === warehouse.id && assignment.isActive
            )

            if (hasAssignment) {
              linkedIntegrations.push({
                id: integration.id,
                name: integration.name,
                type: integration.type,
                status: integration.status || 'active',
                logo: integration.logo,
                linkType: 'assigned',
                storeId: integration.storeId,
                storeName: integration.storeName,
              })
            }
          }
        }
      }

      return {
        ...warehouse,
        linkedIntegrations,
      }
    })
  } catch (error) {
    console.error('[WarehouseContext] Error computing linked integrations:', error)
    return warehouses
  }
}

export function WarehouseProvider({ children }: WarehouseProviderProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load warehouses from API on mount
  useEffect(() => {
    loadWarehouses()
  }, [])

  // Load warehouses from API
  const loadWarehouses = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[WarehouseContext] Loading warehouses from API...')

      // ✅ FIXED: Changed const to let so we can reassign
      let warehousesData = await WarehouseAPI.getAllWarehouses()

      console.log('[WarehouseContext] ✅ Loaded warehouses:', warehousesData.length)

      // ✅ Compute linked integrations
      warehousesData = await computeLinkedIntegrations(warehousesData)

      console.log('[WarehouseContext] ✅ Computed linked integrations')

      setWarehouses(warehousesData)
    } catch (err: any) {
      console.error('[WarehouseContext] Error loading warehouses:', err)
      setError(err.message || 'Failed to load warehouses')
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  // Add new warehouse
  const addWarehouse = async (warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> => {
    try {
      console.log('[WarehouseContext] Creating warehouse:', warehouseData.name)

      // ✅ lastSyncAtCreate via API
      const newWarehouse = await WarehouseAPI.createWarehouse({
        ...warehouseData,
        settings: {
          ...warehouseData.settings,
          orderStatusSettings: warehouseData.settings.orderStatusSettings || DEFAULT_ORDER_STATUS_SETTINGS
        },
        useDifferentReturnAddress: warehouseData.useDifferentReturnAddress ?? false,
        returnAddress: warehouseData.returnAddress ?? undefined
      })

      console.log('[WarehouseContext] ✅ Created warehouse:', newWarehouse.id)

      // Update local state (recompute integrations)
      await loadWarehouses()

      return newWarehouse
    } catch (err: any) {
      console.error('[WarehouseContext] Error adding warehouse:', err)
      throw new Error(err.message || 'Failed to add warehouse')
    }
  }

  // Update existing warehouse
  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      console.log('[WarehouseContext] Updating warehouse:', id)

      // ✅ lastSyncAtUpdate via API
      const updatedWarehouse = await WarehouseAPI.updateWarehouse(id, updates)

      console.log('[WarehouseContext] ✅ Updated warehouse:', id)

      // Update local state (recompute integrations)
      await loadWarehouses()
    } catch (err: any) {
      console.error('[WarehouseContext] Error updating warehouse:', err)
      throw new Error(err.message || 'Failed to update warehouse')
    }
  }

  // Update warehouse order status settings specifically
  const updateWarehouseOrderSettings = async (
    id: string,
    orderStatusSettings: Partial<Warehouse['settings']['orderStatusSettings']>
  ) => {
    try {
      console.log('[WarehouseContext] Updating order settings for warehouse:', id)

      // Get current warehouse
      const warehouse = warehouses.find(w => w.id === id)
      if (!warehouse) {
        throw new Error('Warehouse not found')
      }

      // Merge settings
      const updatedSettings = {
        ...warehouse.settings,
        orderStatusSettings: {
          ...warehouse.settings.orderStatusSettings,
          ...orderStatusSettings
        }
      }

      // ✅ lastSyncAtUpdate via API
      await WarehouseAPI.updateWarehouse(id, { settings: updatedSettings })

      console.log('[WarehouseContext] ✅ Updated order settings for warehouse:', id)

      // Update local state (recompute integrations)
      await loadWarehouses()
    } catch (err: any) {
      console.error('[WarehouseContext] Error updating warehouse order settings:', err)
      throw new Error(err.message || 'Failed to update warehouse order settings')
    }
  }

  // Delete warehouse
  const deleteWarehouse = async (id: string) => {
    try {
      const warehouseToDelete = warehouses.find(w => w.id === id)

      if (warehouseToDelete?.isDefault) {
        throw new Error('Cannot delete the default warehouse')
      }

      console.log('[WarehouseContext] Deleting warehouse:', id)

      // ✅ lastSyncAtDelete via API
      await WarehouseAPI.deleteWarehouse(id)

      console.log('[WarehouseContext] ✅ Deleted warehouse:', id)

      // Update local state
      setWarehouses(prev => prev.filter(w => w.id !== id))
    } catch (err: any) {
      console.error('[WarehouseContext] Error deleting warehouse:', err)
      throw new Error(err.message || 'Failed to delete warehouse')
    }
  }

  // Get default warehouse
  const getDefaultWarehouse = (): Warehouse | null => {
    return warehouses.find(w => w.isDefault) || null
  }

  // Get active warehouses
  const getActiveWarehouses = (): Warehouse[] => {
    return warehouses.filter(w => w.status === 'ACTIVE')
  }

  // Refresh warehouses data
  const refetchWarehouses = async () => {
    console.log('[WarehouseContext] Refetching warehouses...')
    await loadWarehouses()
  }

  const value: WarehouseContextType = {
    warehouses,
    loading,
    error,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getDefaultWarehouse,
    getActiveWarehouses,
    refetchWarehouses,
    updateWarehouseOrderSettings
  }

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  )
}

// Custom hook to use the warehouse context
export function useWarehouses() {
  const context = useContext(WarehouseContext)
  if (context === undefined) {
    throw new Error('useWarehouses must be used within a WarehouseProvider')
  }
  return context
}

export default WarehouseContext
