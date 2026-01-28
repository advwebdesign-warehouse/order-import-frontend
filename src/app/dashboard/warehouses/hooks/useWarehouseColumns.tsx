//file path: app/dashboard/warehouses/hooks/useWarehouseColumns.tsx

import { useState, useMemo } from 'react'
import { Warehouse, WarehouseColumnConfig, WarehouseSortState } from '../utils/warehouseTypes'

const DEFAULT_COLUMNS: WarehouseColumnConfig[] = [
  { id: 'select', field: 'select', label: '', sortable: false, visible: true },
  { id: 'isDefault', field: 'isDefault', label: 'Default', sortable: true, visible: true },
  { id: 'name', field: 'name', label: 'Warehouse', sortable: true, visible: true },
  { id: 'address', field: 'address', label: 'Location', sortable: true, visible: true },
  { id: 'status', field: 'status', label: 'Status', sortable: true, visible: true },
  { id: 'integrations', field: 'integrations', label: 'Integrations', sortable: false, visible: true }, // ✅ NEW
  { id: 'productCount', field: 'productCount', label: 'Products', sortable: true, visible: true },
  { id: 'contact', field: 'contact', label: 'Contact', sortable: false, visible: true },
  { id: 'updatedAt', field: 'updatedAt', label: 'Last Updated', sortable: true, visible: true },
  { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },
]

const DEFAULT_SORT: WarehouseSortState = {
  field: 'name',
  direction: 'asc'
}

export function useWarehouseColumns(warehouses: Warehouse[]) {
  const [columns, setColumns] = useState<WarehouseColumnConfig[]>(DEFAULT_COLUMNS)
  const [sortConfig, setSortConfig] = useState<WarehouseSortState>(DEFAULT_SORT)

  // Sort warehouses based on current sort config
  const sortedWarehouses = useMemo(() => {
    if (!warehouses.length) return []

    return [...warehouses].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Get values based on field, with proper fallbacks
      switch (sortConfig.field) {
        case 'name':
          aValue = a.name || ''
          bValue = b.name || ''
          break
        case 'code':
          aValue = a.code || ''
          bValue = b.code || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'address':
          aValue = `${a.address.city}, ${a.address.state}, ${a.address.country}`
          bValue = `${b.address.city}, ${b.address.state}, ${b.address.country}`
          break
        case 'isDefault':
          aValue = a.isDefault ? 1 : 0
          bValue = b.isDefault ? 1 : 0
          break
        case 'productCount':
          aValue = Number(a.productCount) || 0
          bValue = Number(b.productCount) || 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime() || 0
          bValue = new Date(b.createdAt).getTime() || 0
          break
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime() || 0
          bValue = new Date(b.updatedAt).getTime() || 0
          break
        default:
          // Fallback for any other field
          aValue = String(a[sortConfig.field as keyof Warehouse] || '')
          bValue = String(b[sortConfig.field as keyof Warehouse] || '')
      }

      // Handle different data types for comparison
      if (sortConfig.field === 'productCount') {
        // Numeric comparison
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else if (sortConfig.field === 'createdAt' || sortConfig.field === 'updatedAt') {
        // Date comparison (already converted to timestamps)
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else if (sortConfig.field === 'isDefault') {
        // Boolean comparison (default warehouses first in desc order)
        if (sortConfig.direction === 'desc') {
          return bValue - aValue
        } else {
          return aValue - bValue
        }
      } else {
        // String comparison (case insensitive)
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()

        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }
    })
  }, [warehouses, sortConfig])

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig(prevSort => {
      const newDirection = prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
      return {
        field,
        direction: newDirection
      }
    })
  }

  // Handle column visibility changes
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumns(prevColumns => {
      return prevColumns.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    })
  }

  // Handle column reordering (for drag & drop)
  const handleColumnReorder = (newColumns: WarehouseColumnConfig[]) => {
    setColumns(newColumns)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    setSortConfig(DEFAULT_SORT)
    setColumns(DEFAULT_COLUMNS)
  }

  return {
    columns,
    sortConfig,
    sortedWarehouses,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  }
}
