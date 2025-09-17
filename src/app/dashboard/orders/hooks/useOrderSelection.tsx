import { useState } from 'react'
import { Order } from '../utils/orderTypes'

export function useOrderSelection() {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(orderId)) {
        newSelection.delete(orderId)
      } else {
        newSelection.add(orderId)
      }
      return newSelection
    })
  }

  const handleSelectAll = (orders: Order[]) => {
    const allOrderIds = orders.map(order => order.id)
    setSelectedOrders(prev => {
      // If all current orders are selected, deselect all
      if (allOrderIds.every(id => prev.has(id))) {
        return new Set()
      } else {
        // Otherwise, select all current orders
        return new Set(allOrderIds)
      }
    })
  }

  const clearSelection = () => {
    setSelectedOrders(new Set())
  }

  const isSelected = (orderId: string) => {
    return selectedOrders.has(orderId)
  }

  const isAllSelected = (orders: Order[]) => {
    return orders.length > 0 && orders.every(order => selectedOrders.has(order.id))
  }

  const getSelectedOrderIds = () => {
    return Array.from(selectedOrders)
  }

  return {
    selectedOrders,
    handleSelectOrder,
    handleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    getSelectedOrderIds
  }
}
