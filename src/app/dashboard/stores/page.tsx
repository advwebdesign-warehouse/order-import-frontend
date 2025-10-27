//file path: app/dashboard/stores/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import StoresTable from './components/StoresTable'
import StoreModal from './components/StoreModal'
import StoresToolbar from './components/StoresToolbar'
import { Store, StoreSortState } from './utils/storeTypes'
import { getStoresFromStorage, ensureDefaultStore } from './utils/storeStorage'
import { useStoreFilters } from './hooks/useStoreFilters'
import { useStoreSelection } from './hooks/useStoreSelection'
import { useStoreColumns } from './hooks/useStoreColumns'

// Loading component for Suspense fallback
function StoresLoading() {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading stores...</p>
      </div>
    </div>
  )
}

// Main content component
function StoresContent() {
  const searchParams = useSearchParams()
  const [stores, setStores] = useState<Store[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  // Use the custom hooks
  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filteredStores,
    clearAllFilters
  } = useStoreFilters(stores)

  const {
    selectedStores,
    handleSelectStore,
    handleSelectAll,
    clearSelection
  } = useStoreSelection()

  const {
    columns,
    sortConfig,
    sortedStores,
    handleSort,
    handleColumnVisibilityChange,
    resetToDefaults
  } = useStoreColumns(filteredStores)

  useEffect(() => {
    ensureDefaultStore()
    loadStores()
  }, [])

  // Check for URL parameters to reopen modal after returning from warehouse creation
  useEffect(() => {
    const action = searchParams.get('action')
    const storeId = searchParams.get('storeId')

    if (action === 'edit' && storeId) {
      // Find the store by ID and open the modal
      const store = stores.find(s => s.id === storeId)
      if (store) {
        setSelectedStore(store)
        setIsModalOpen(true)
      }

      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('action')
      newUrl.searchParams.delete('storeId')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams, stores])

  const loadStores = () => {
    setLoading(true)
    const loadedStores = getStoresFromStorage()
    setStores(loadedStores)
    setLoading(false)
  }

  const handleCreateStore = () => {
    setSelectedStore(null)
    setIsModalOpen(true)
  }

  const handleEditStore = (store: Store) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleViewStore = (store: Store) => {
    setSelectedStore(store)
    // You can add a view-only modal here if needed
  }

  const handleModalClose = (updated: boolean) => {
    setIsModalOpen(false)
    setSelectedStore(null)
    if (updated) {
      loadStores()
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedStores.size === 0) {
      alert('Please select at least one store.')
      return
    }

    // Implement bulk actions
    console.log('Bulk action:', action, 'for stores:', Array.from(selectedStores))
    // Add your bulk action logic here
    clearSelection()
  }

  if (loading) {
    return <StoresLoading />
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <StoresToolbar
        selectedStoresCount={selectedStores.size}
        onBulkAction={handleBulkAction}
        onAddStore={handleCreateStore}
        onResetLayout={resetToDefaults}
        columns={columns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        totalStores={stores.length}
        filteredStores={filteredStores.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearAllFilters={clearAllFilters}
      />

      <StoresTable
        stores={sortedStores}
        columns={columns}
        sortConfig={sortConfig}
        selectedStores={selectedStores}
        onSort={handleSort}
        onSelectStore={handleSelectStore}
        onSelectAll={() => handleSelectAll(sortedStores)}
        onViewStore={handleViewStore}
        onEditStore={handleEditStore}
        onRefresh={loadStores}
      />

      {/* Modal */}
      {isModalOpen && (
        <StoreModal
          store={selectedStore}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}

// Export the page wrapped in Suspense
export default function StoresPage() {
  return (
    <Suspense fallback={<StoresLoading />}>
      <StoresContent />
    </Suspense>
  )
}
