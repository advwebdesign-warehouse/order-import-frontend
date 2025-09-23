// File path: app/dashboard/warehouses/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import WarehousesToolbar from './components/WarehousesToolbar'
import WarehousesTable from './components/WarehousesTable'
import AddWarehouseModal from './components/AddWarehouseModal'
import WarehouseDetailsModal from './components/WarehouseDetailsModal'

// Custom hooks
import { useWarehouses } from './hooks/useWarehouses'
import { useWarehouseFilters } from './hooks/useWarehouseFilters'
import { useWarehouseSelection } from './hooks/useWarehouseSelection'
import { useWarehouseColumns } from './hooks/useWarehouseColumns'

// Types
import { Warehouse } from './utils/warehouseTypes'

// Loading component for Suspense fallback
function WarehousesLoading() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading warehouses...</p>
      </div>
    </div>
  )
}

// Main content component
function WarehousesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Modal states
  const [showAddWarehouse, setShowAddWarehouse] = useState(false)
  const [showWarehouseDetails, setShowWarehouseDetails] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)

  // Custom hooks for state management
  const { warehouses, loading, addWarehouse, updateWarehouse, deleteWarehouse } = useWarehouses()

  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredWarehouses
  } = useWarehouseFilters(warehouses)

  const {
    selectedWarehouses,
    handleSelectWarehouse,
    handleSelectAll,
    clearSelection
  } = useWarehouseSelection()

  const {
    columns,
    sortConfig,
    sortedWarehouses,
    handleSort,
    handleColumnVisibilityChange,
    resetToDefaults
  } = useWarehouseColumns(filteredWarehouses)

  // Check for URL parameters on component mount
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'add') {
      setEditingWarehouse(null)
      setShowAddWarehouse(true)

      // Clean up the URL parameter after opening the modal
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('action')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  // Event handlers
  const handleViewWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setShowWarehouseDetails(true)
  }

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setShowAddWarehouse(true)
  }

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    if (warehouse.isDefault) {
      alert('Cannot delete the default warehouse. Please set another warehouse as default first.')
      return
    }

    if (confirm(`Are you sure you want to delete "${warehouse.name}"? This action cannot be undone.`)) {
      try {
        await deleteWarehouse(warehouse.id)
      } catch (error) {
        console.error('Error deleting warehouse:', error)
        alert('Failed to delete warehouse. Please try again.')
      }
    }
  }

  const handleSetDefaultWarehouse = async (warehouse: Warehouse) => {
    if (warehouse.isDefault) return

    try {
      await updateWarehouse(warehouse.id, { isDefault: true })
    } catch (error) {
      console.error('Error setting default warehouse:', error)
      alert('Failed to set default warehouse. Please try again.')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedWarehouses.size === 0) {
      alert('Please select at least one warehouse.')
      return
    }

    const selectedWarehouseIds = Array.from(selectedWarehouses)
    const selectedWarehousesList = warehouses.filter(w => selectedWarehouseIds.includes(w.id))

    switch (action) {
      case 'activate':
        for (const warehouse of selectedWarehousesList) {
          await updateWarehouse(warehouse.id, { status: 'active' })
        }
        clearSelection()
        break
      case 'deactivate':
        for (const warehouse of selectedWarehousesList) {
          if (!warehouse.isDefault) {
            await updateWarehouse(warehouse.id, { status: 'inactive' })
          }
        }
        clearSelection()
        break
      case 'delete':
        const nonDefaultWarehouses = selectedWarehousesList.filter(w => !w.isDefault)
        if (nonDefaultWarehouses.length === 0) {
          alert('Cannot delete default warehouses.')
          return
        }

        if (confirm(`Are you sure you want to delete ${nonDefaultWarehouses.length} warehouses? This action cannot be undone.`)) {
          for (const warehouse of nonDefaultWarehouses) {
            await deleteWarehouse(warehouse.id)
          }
          clearSelection()
        }
        break
    }
  }

  const handleSaveWarehouse = async (warehouseData: Partial<Warehouse>) => {
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, warehouseData)
      } else {
        await addWarehouse(warehouseData as Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>)
      }
      setShowAddWarehouse(false)
      setEditingWarehouse(null)
    } catch (error) {
      console.error('Error saving warehouse:', error)
      alert('Failed to save warehouse. Please try again.')
    }
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setFilters({
      search: '',
      status: '',
      country: '',
      hasLayout: false
    })
  }

  const handleAddWarehouse = () => {
    setEditingWarehouse(null)
    setShowAddWarehouse(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <WarehousesToolbar
        selectedWarehousesCount={selectedWarehouses.size}
        onBulkAction={handleBulkAction}
        onAddWarehouse={handleAddWarehouse}
        onResetLayout={resetToDefaults}
        columns={columns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        totalWarehouses={warehouses.length}
        filteredWarehouses={filteredWarehouses.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAllFilters={handleClearAllFilters}
      />

      <WarehousesTable
        warehouses={sortedWarehouses}
        columns={columns}
        sortConfig={sortConfig}
        selectedWarehouses={selectedWarehouses}
        onSort={handleSort}
        onSelectWarehouse={handleSelectWarehouse}
        onSelectAll={() => handleSelectAll(sortedWarehouses)}
        onViewWarehouse={handleViewWarehouse}
        onEditWarehouse={handleEditWarehouse}
        onDeleteWarehouse={handleDeleteWarehouse}
        onSetDefaultWarehouse={handleSetDefaultWarehouse}
      />

      {/* Modals */}
      <AddWarehouseModal
        isOpen={showAddWarehouse}
        onClose={() => {
          setShowAddWarehouse(false)
          setEditingWarehouse(null)
        }}
        onSave={handleSaveWarehouse}
        warehouse={editingWarehouse}
        warehouses={warehouses}
      />

      {selectedWarehouse && (
        <WarehouseDetailsModal
          isOpen={showWarehouseDetails}
          onClose={() => {
            setShowWarehouseDetails(false)
            setSelectedWarehouse(null)
          }}
          warehouse={selectedWarehouse}
          onEdit={handleEditWarehouse}
        />
      )}
    </div>
  )
}

// Export the page wrapped in Suspense
export default function WarehousesPage() {
  return (
    <Suspense fallback={<WarehousesLoading />}>
      <WarehousesContent />
    </Suspense>
  )
}
