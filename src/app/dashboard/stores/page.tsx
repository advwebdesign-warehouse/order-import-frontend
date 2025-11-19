//file path: app/dashboard/stores/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import StoresTable from './components/StoresTable'
import StoreModal from './components/StoreModal'
import StoresToolbar from './components/StoresToolbar'
import { Store, StoreSortState } from './utils/storeTypes'
import { storeApi } from '@/app/services/storeApi'
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
  const [error, setError] = useState<string | null>(null)

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

  const loadStores = async () => {
    try {
      setLoading(true)
      setError(null)
      const loadedStores = await storeApi.getStores()
      setStores(loadedStores)
    } catch (err: any) {
      console.error('Failed to load stores:', err)
      setError(err.message || 'Failed to load stores')
    } finally {
      setLoading(false)
    }
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

  const handleBulkAction = async (action: string) => {
    if (selectedStores.size === 0) {
      alert('Please select at least one store.')
      return
    }

    try {
      if (action === 'delete') {
        const confirmDelete = window.confirm(
          `Are you sure you want to delete ${selectedStores.size} store(s)?`
        )
        if (!confirmDelete) return

        // Delete stores via API
        const deletePromises = Array.from(selectedStores).map(storeId =>
          storeApi.deleteStore(storeId)
        )
        await Promise.all(deletePromises)

        await loadStores()
        clearSelection()
        alert('Stores deleted successfully')
      }
    } catch (err: any) {
      console.error('Bulk action failed:', err)
      alert(err.message || 'Failed to perform bulk action')
    }
  }

  if (loading) {
    return <StoresLoading />
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading stores</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadStores}
                  className="text-sm font-medium text-red-800 hover:text-red-600"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
