// app/dashboard/warehouses/hooks/useWarehouseSelection.tsx
import { useSelection } from '../../shared/hooks/useSelection'
import { Warehouse } from '../utils/warehouseTypes'

/**
 * Warehouse-specific selection hook that extends the generic useSelection
 * with warehouse-specific functionality
 */
export function useWarehouseSelection() {
  const selection = useSelection<Warehouse>()

  // Warehouse-specific selection methods
  const selectWarehousesByStatus = (warehouses: Warehouse[], status: string) => {
    selection.selectItemsByFilter(warehouses, warehouse => warehouse.status === status)
  }

  const selectWarehousesByCountry = (warehouses: Warehouse[], country: string) => {
    selection.selectItemsByFilter(warehouses, warehouse => warehouse.address.country === country)
  }

  const selectActiveWarehouses = (warehouses: Warehouse[]) => {
    selection.selectItemsByFilter(warehouses, warehouse => warehouse.status === 'ACTIVE')
  }

  const selectInactiveWarehouses = (warehouses: Warehouse[]) => {
    selection.selectItemsByFilter(warehouses, warehouse => warehouse.status === 'INACTIVE')
  }

  const selectNonDefaultWarehouses = (warehouses: Warehouse[]) => {
    selection.selectItemsByFilter(warehouses, warehouse => !warehouse.isDefault)
  }

  return {
    ...selection,
    // Warehouse-specific methods
    selectWarehousesByStatus,
    selectWarehousesByCountry,
    selectActiveWarehouses,
    selectInactiveWarehouses,
    selectNonDefaultWarehouses,
    // Aliases for better naming in warehouse context
    selectedWarehouses: selection.selectedItems,
    handleSelectWarehouse: selection.handleSelectItem,
    getSelectedWarehouses: selection.getSelectedItems,
  }
}
