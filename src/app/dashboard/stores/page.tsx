//file path: app/dashboard/stores/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import StoresTable from './components/StoresTable'
import StoreModal from './components/StoreModal'
import { Store, StoreFilterState, StoreSortState } from './utils/storeTypes'
import { getStoresFromStorage } from './utils/storeStorage'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [filters, setFilters] = useState<StoreFilterState>({
    search: '',
    country: '',
    state: ''
  })
  const [sort, setSort] = useState<StoreSortState>({
    field: 'companyName',
    direction: 'asc'
  })

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = () => {
    const loadedStores = getStoresFromStorage()
    setStores(loadedStores)
  }

  const handleCreateStore = () => {
    setSelectedStore(null)
    setIsModalOpen(true)
  }

  const handleEditStore = (store: Store) => {
    setSelectedStore(store)
    setIsModalOpen(true)
  }

  const handleModalClose = (updated: boolean) => {
    setIsModalOpen(false)
    setSelectedStore(null)
    if (updated) {
      loadStores()
    }
  }

  // Filter stores
  const filteredStores = stores.filter(store => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        store.companyName.toLowerCase().includes(searchLower) ||
        store.storeName?.toLowerCase().includes(searchLower) ||
        store.email?.toLowerCase().includes(searchLower) ||
        store.phone?.includes(filters.search)
      if (!matchesSearch) return false
    }

    if (filters.country && store.address.country !== filters.country) {
      return false
    }

    if (filters.state && store.address.state !== filters.state) {
      return false
    }

    return true
  })

  // Sort stores
  const sortedStores = [...filteredStores].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sort.field) {
      case 'companyName':
        aValue = a.companyName.toLowerCase()
        bValue = b.companyName.toLowerCase()
        break
      case 'storeName':
        aValue = (a.storeName || '').toLowerCase()
        bValue = (b.storeName || '').toLowerCase()
        break
      case 'city':
        aValue = a.address.city.toLowerCase()
        bValue = b.address.city.toLowerCase()
        break
      case 'state':
        aValue = a.address.state.toLowerCase()
        bValue = b.address.state.toLowerCase()
        break
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Stores</h1>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            Manage your store locations and shipping information
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateStore}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Store
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search by name, email, phone..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id="country"
            value={filters.country}
            onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Countries</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="Mexico">Mexico</option>
          </select>
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State
          </label>
          <input
            type="text"
            id="state"
            value={filters.state}
            onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
            placeholder="Filter by state..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <StoresTable
        stores={sortedStores}
        sort={sort}
        onSort={setSort}
        onEdit={handleEditStore}
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
