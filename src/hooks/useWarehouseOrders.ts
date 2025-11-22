//file path: src/hooks/useWarehouseOrders.ts

import { useState, useEffect, useCallback } from 'react'
import { WarehouseAPI } from '@/lib/api/warehouseApi'

interface OrderFulfillmentState {
  pickedItems: string[]
  pickedOrders: string[]
  packedOrders: string[]
}

interface WarehouseSettings {
  maxPickingOrders: number | 'all'
  [key: string]: any
}

/**
 * Custom hook for managing warehouse order fulfillment state
 * Replaces localStorage with API-backed database storage
 */
export function useWarehouseOrders(warehouseId: string | null) {
  const [state, setState] = useState<OrderFulfillmentState>({
    pickedItems: [],
    pickedOrders: [],
    packedOrders: []
  })
  const [settings, setSettings] = useState<WarehouseSettings>({
    maxPickingOrders: 'all'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load state and settings from API
  const loadState = useCallback(async () => {
    if (!warehouseId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Load order states and settings in parallel
      const [orderStates, warehouseSettings] = await Promise.all([
        WarehouseAPI.getWarehouseOrderStates(warehouseId),
        WarehouseAPI.getWarehouseSettings(warehouseId)
      ])

      setState({
        pickedItems: orderStates.pickedItems || [],
        pickedOrders: orderStates.pickedOrders || [],
        packedOrders: orderStates.packedOrders || []
      })

      setSettings({
        maxPickingOrders: warehouseSettings.maxPickingOrders || 'all',
        ...warehouseSettings
      })
    } catch (err: any) {
      console.error('[useWarehouseOrders] Error loading state:', err)
      setError(err.message || 'Failed to load warehouse state')

      // Set default empty state on error
      setState({
        pickedItems: [],
        pickedOrders: [],
        packedOrders: []
      })
    } finally {
      setIsLoading(false)
    }
  }, [warehouseId])

  // Load state on mount and when warehouseId changes
  useEffect(() => {
    loadState()
  }, [loadState])

  // Update packed orders
  const updatePackedOrders = useCallback(async (orderIds: string[]) => {
    if (!warehouseId) {
      console.warn('[useWarehouseOrders] Cannot update packed orders: no warehouseId')
      return
    }

    try {
      const result = await WarehouseAPI.updatePackedOrders(warehouseId, orderIds)
      setState(prev => ({
        ...prev,
        packedOrders: result.packedOrders || orderIds
      }))
    } catch (err: any) {
      console.error('[useWarehouseOrders] Error updating packed orders:', err)
      setError(err.message || 'Failed to update packed orders')
      throw err
    }
  }, [warehouseId])

  // Update picked items
  const updatePickedItems = useCallback(async (itemIds: string[]) => {
    if (!warehouseId) {
      console.warn('[useWarehouseOrders] Cannot update picked items: no warehouseId')
      return
    }

    try {
      const result = await WarehouseAPI.updatePickedItems(warehouseId, itemIds)
      setState(prev => ({
        ...prev,
        pickedItems: result.pickedItems || itemIds
      }))
    } catch (err: any) {
      console.error('[useWarehouseOrders] Error updating picked items:', err)
      setError(err.message || 'Failed to update picked items')
      throw err
    }
  }, [warehouseId])

  // Update picked orders
  const updatePickedOrders = useCallback(async (orderIds: string[]) => {
    if (!warehouseId) {
      console.warn('[useWarehouseOrders] Cannot update picked orders: no warehouseId')
      return
    }

    try {
      const result = await WarehouseAPI.updatePickedOrders(warehouseId, orderIds)
      setState(prev => ({
        ...prev,
        pickedOrders: result.pickedOrders || orderIds
      }))
    } catch (err: any) {
      console.error('[useWarehouseOrders] Error updating picked orders:', err)
      setError(err.message || 'Failed to update picked orders')
      throw err
    }
  }, [warehouseId])

  // Update warehouse settings
  const updateSettings = useCallback(async (newSettings: Partial<WarehouseSettings>) => {
    if (!warehouseId) {
      console.warn('[useWarehouseOrders] Cannot update settings: no warehouseId')
      return
    }

    try {
      const result = await WarehouseAPI.updateWarehouseSettings(warehouseId, newSettings)
      setSettings(prev => ({
        ...prev,
        ...result.settings
      }))
    } catch (err: any) {
      console.error('[useWarehouseOrders] Error updating settings:', err)
      setError(err.message || 'Failed to update settings')
      throw err
    }
  }, [warehouseId])

  // Clear all order states
  const clearAllStates = useCallback(async () => {
    if (!warehouseId) {
      console.warn('[useWarehouseOrders] Cannot clear states: no warehouseId')
      return
    }

    try {
      await WarehouseAPI.clearWarehouseOrderStates(warehouseId)
      setState({
        pickedItems: [],
        pickedOrders: [],
        packedOrders: []
      })
    } catch (err: any) {
      console.error('[useWarehouseOrders] Error clearing states:', err)
      setError(err.message || 'Failed to clear states')
      throw err
    }
  }, [warehouseId])

  // Helper functions for common operations
  const addPickedItem = useCallback(async (itemId: string) => {
    const newPickedItems = [...state.pickedItems, itemId]
    await updatePickedItems(newPickedItems)
  }, [state.pickedItems, updatePickedItems])

  const removePickedItem = useCallback(async (itemId: string) => {
    const newPickedItems = state.pickedItems.filter(id => id !== itemId)
    await updatePickedItems(newPickedItems)
  }, [state.pickedItems, updatePickedItems])

  const addPickedOrder = useCallback(async (orderId: string) => {
    const newPickedOrders = [...state.pickedOrders, orderId]
    await updatePickedOrders(newPickedOrders)
  }, [state.pickedOrders, updatePickedOrders])

  const removePickedOrder = useCallback(async (orderId: string) => {
    const newPickedOrders = state.pickedOrders.filter(id => id !== orderId)
    await updatePickedOrders(newPickedOrders)
  }, [state.pickedOrders, updatePickedOrders])

  const addPackedOrder = useCallback(async (orderId: string) => {
    const newPackedOrders = [...state.packedOrders, orderId]
    await updatePackedOrders(newPackedOrders)
  }, [state.packedOrders, updatePackedOrders])

  const removePackedOrder = useCallback(async (orderId: string) => {
    const newPackedOrders = state.packedOrders.filter(id => id !== orderId)
    await updatePackedOrders(newPackedOrders)
  }, [state.packedOrders, updatePackedOrders])

  const isItemPicked = useCallback((itemId: string) => {
    return state.pickedItems.includes(itemId)
  }, [state.pickedItems])

  const isOrderPicked = useCallback((orderId: string) => {
    return state.pickedOrders.includes(orderId)
  }, [state.pickedOrders])

  const isOrderPacked = useCallback((orderId: string) => {
    return state.packedOrders.includes(orderId)
  }, [state.packedOrders])

  return {
    // State
    pickedItems: state.pickedItems,
    pickedOrders: state.pickedOrders,
    packedOrders: state.packedOrders,
    settings,
    isLoading,
    error,

    // Update functions
    updatePackedOrders,
    updatePickedItems,
    updatePickedOrders,
    updateSettings,
    clearAllStates,

    // Helper functions
    addPickedItem,
    removePickedItem,
    addPickedOrder,
    removePickedOrder,
    addPackedOrder,
    removePackedOrder,
    isItemPicked,
    isOrderPicked,
    isOrderPacked,

    // Reload function
    reload: loadState
  }
}
