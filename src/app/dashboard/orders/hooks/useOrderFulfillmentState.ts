//file path: app/dashboard/orders/hooks/useOrderFulfillmentState.ts

import { useState, useEffect, useCallback } from 'react'
import { orderFulfillmentStateApi, OrderFulfillmentState } from '@/app/services/orderFulfillmentStateApi'

/**
 * Custom hook for managing order fulfillment state
 * Replaces localStorage for pickedItems, pickedOrders, and packedOrders
 *
 * This state is shared across all users in the same account!
 */
export function useOrderFulfillmentState(warehouseId: string | null = null) {
  const [state, setState] = useState<OrderFulfillmentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convert warehouseId empty string to null for API
  const normalizedWarehouseId = warehouseId === '' ? null : warehouseId

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedState = await orderFulfillmentStateApi.getState(normalizedWarehouseId)
      setState(fetchedState)
    } catch (err: any) {
      console.error('Error loading fulfillment state:', err)
      setError(err.message)
      // Set empty state on error
      setState({
        id: '',
        accountId: '',
        warehouseId: normalizedWarehouseId,
        pickedItems: [],
        pickedOrders: [],
        packedOrders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [normalizedWarehouseId])

  // Load state on mount and when warehouse changes
  useEffect(() => {
    loadState()
  }, [loadState])

  // Picked Items Operations
  const addPickedItem = useCallback(async (itemId: string) => {
    try {
      const updatedState = await orderFulfillmentStateApi.addPickedItem(itemId, normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error adding picked item:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  const removePickedItem = useCallback(async (itemId: string) => {
    try {
      const updatedState = await orderFulfillmentStateApi.removePickedItem(itemId, normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error removing picked item:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  // Picked Orders Operations
  const addPickedOrder = useCallback(async (orderId: string) => {
    try {
      const updatedState = await orderFulfillmentStateApi.addPickedOrder(orderId, normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error adding picked order:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  const removePickedOrder = useCallback(async (orderId: string) => {
    try {
      const updatedState = await orderFulfillmentStateApi.removePickedOrder(orderId, normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error removing picked order:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  // Packed Orders Operations
  const addPackedOrder = useCallback(async (orderId: string) => {
    try {
      const updatedState = await orderFulfillmentStateApi.addPackedOrder(orderId, normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error adding packed order:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  const removePackedOrder = useCallback(async (orderId: string) => {
    try {
      const updatedState = await orderFulfillmentStateApi.removePackedOrder(orderId, normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error removing packed order:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  // Clear Operations
  const clearPickingState = useCallback(async () => {
    try {
      const updatedState = await orderFulfillmentStateApi.clearPickingState(normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error clearing picking state:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  const clearPackingState = useCallback(async () => {
    try {
      const updatedState = await orderFulfillmentStateApi.clearPackingState(normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error clearing packing state:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  const clearAllState = useCallback(async () => {
    try {
      const updatedState = await orderFulfillmentStateApi.clearAllState(normalizedWarehouseId)
      setState(updatedState)
    } catch (err: any) {
      console.error('Error clearing all state:', err)
      setError(err.message)
    }
  }, [normalizedWarehouseId])

  // Convert arrays to Sets for easier usage in components
  const pickedItems = new Set(state?.pickedItems || [])
  const pickedOrders = new Set(state?.pickedOrders || [])
  const packedOrders = new Set(state?.packedOrders || [])

  return {
    // State
    pickedItems,
    pickedOrders,
    packedOrders,
    loading,
    error,

    // Operations
    addPickedItem,
    removePickedItem,
    addPickedOrder,
    removePickedOrder,
    addPackedOrder,
    removePackedOrder,
    clearPickingState,
    clearPackingState,
    clearAllState,

    // Reload
    reload: loadState
  }
}
