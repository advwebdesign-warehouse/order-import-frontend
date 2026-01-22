//file path: app/dashboard/stores/components/StoresTable.tsx

'use client'

import React from 'react'
import {
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { Store, StoreColumnConfig, StoreSortState } from '../utils/storeTypes'
import { storeApi } from '@/app/services/storeApi'

interface StoresTableProps {
  stores: Store[]
  columns: StoreColumnConfig[]
  sortConfig: StoreSortState
  selectedStores: Set<string>
  onSort: (field: string) => void
  onSelectStore: (storeId: string) => void
  onSelectAll: () => void
  onViewStore: (store: Store) => void
  onEditStore: (store: Store) => void
  onRefresh: () => void
}

export default function StoresTable({
  stores,
  columns,
  sortConfig,
  selectedStores,
  onSort,
  onSelectStore,
  onSelectAll,
  onViewStore,
  onEditStore,
  onRefresh
}: StoresTableProps) {
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        // ✅ Delete store via existing API service
        await storeApi.deleteStore(id)
        setDeleteConfirm(null)
        onRefresh()
      } catch (error) {
        console.error('Error deleting store:', error)
        // Optionally show error to user
        alert('Failed to delete store. Please try again.')
        setDeleteConfirm(null)
      }
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortConfig.field !== field) {
      return (
        <div className="flex flex-col">
          <ChevronUpIcon className="h-3 w-3 text-gray-300" />
          <ChevronDownIcon className="h-3 w-3 -mt-1 text-gray-300" />
        </div>
      )
    }

    return (
      <div className="flex flex-col">
        <ChevronUpIcon
          className={`h-3 w-3 ${sortConfig.direction === 'asc' ? 'text-indigo-600' : 'text-gray-300'}`}
        />
        <ChevronDownIcon
          className={`h-3 w-3 -mt-1 ${sortConfig.direction === 'desc' ? 'text-indigo-600' : 'text-gray-300'}`}
        />
      </div>
    )
  }

  const renderCellContent = (column: StoreColumnConfig, store: Store) => {
    switch (column.field) {
      case 'select':
        return (
          <input
            type="checkbox"
            checked={selectedStores.has(store.id)}
            onChange={() => onSelectStore(store.id)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        )

      case 'storeName':
        return (
          <div>
            <div className="flex items-center">
              {store.logo ? (
                <button
                  onClick={() => onEditStore(store)}
                  className="text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer text-left"
                >
                  <img
                    src={store.logo}
                    alt={store.storeName}
                    className="h-10 w-10 rounded-full object-cover mr-3"
                  />
                </button>
              ) : (
                <div>
                  <button
                    onClick={() => onEditStore(store)}
                    className="text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer text-left"
                  >
                    {store.storeName || <span className="text-gray-400">—</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )

        case 'address':
          return (
            <div className="text-sm text-gray-900">
              <div>{store.address.address1}</div>
              {store.address.address2 && (
                <div className="text-gray-500">{store.address.address2}</div>
              )}
              <div className="text-gray-500">
                {store.address.city}, {store.address.state} {store.address.zip}
              </div>
            </div>
          )

      case 'actions':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEditStore(store)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit Store"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(store.id)}
              className={`${
                deleteConfirm === store.id
                  ? 'text-red-600 hover:text-red-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={deleteConfirm === store.id ? 'Click again to confirm' : 'Delete Store'}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {columns.filter(col => col.visible).map((column) => (
                    <th
                      key={column.id}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => column.sortable && onSort(column.field)}
                    >
                      <div className="flex items-center space-x-1">
                        {column.field === 'select' ? (
                          <input
                            type="checkbox"
                            checked={stores.length > 0 && selectedStores.size === stores.length}
                            onChange={onSelectAll}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            title="Select all stores on this page"
                          />
                        ) : (
                          <>
                            <span>{column.label}</span>
                            {column.sortable && renderSortIcon(column.field)}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-gray-50"
                  >
                    {columns.filter(col => col.visible).map((column) => (
                      <td key={`${store.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                        {renderCellContent(column, store)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stores</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first store.</p>
        </div>
      )}
    </div>
  )
}
