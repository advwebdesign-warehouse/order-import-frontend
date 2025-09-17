import { useSelection } from '../../shared/hooks/useSelection'
import { Order } from '../utils/orderTypes'

/**
 * Order-specific selection hook that extends the generic useSelection
 * with order-specific functionality
 */
export function useOrderSelection() {
  const selection = useSelection<Order>()

  // Order-specific selection methods can be added here
  const selectOrdersByStatus = (orders: Order[], status: string) => {
    selection.selectItemsByFilter(orders, order => order.status === status)
  }

  const selectOrdersByPlatform = (orders: Order[], platform: string) => {
    selection.selectItemsByFilter(orders, order => order.platform === platform)
  }

  const selectOrdersByDateRange = (orders: Order[], startDate: string, endDate: string) => {
    selection.selectItemsByFilter(orders, order => {
      const orderDate = new Date(order.orderDate)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return orderDate >= start && orderDate <= end
    })
  }

  return {
    ...selection,
    // Order-specific methods
    selectOrdersByStatus,
    selectOrdersByPlatform,
    selectOrdersByDateRange,
    // Aliases for better naming in order context
    selectedOrders: selection.selectedItems,
    handleSelectOrder: selection.handleSelectItem,
    getSelectedOrders: selection.getSelectedItems,
  }
}
