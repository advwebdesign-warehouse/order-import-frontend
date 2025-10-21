//file path: app/dashboard/stores/components/StoresTable.tsx

'use client'

import { useState } from 'react'
import {
  PencilIcon,
  TrashIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { Store, StoreSortState } from '../utils/storeTypes'
import { deleteStore } from '../utils/storeStorage'

interface StoresTableProps {
  stores: Store[]
  sort: StoreSortState
  onSort: (sort: StoreSortState) => void
  onEdit: (store: Store) => void
  onRefresh: () => void
}

export default function StoresTable({ stores, sort, onSort, onEdit, onRefresh }: StoresTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleSort = (field: string) => {
    onSort({
      field,
      direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      deleteStore(id)
      setDeleteConfirm(null)
      onRefresh()
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field) {
      return <span className="text-gray-400">↕</span>
    }
    return <span>{sort.direction === 'asc' ? '↑' : '↓'}</span>
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No stores</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new store.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('companyName')}
            >
              <div className="flex items-center">
                Company Name <SortIcon field="companyName" />
              </div>
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('storeName')}
            >
              <div className="flex items-center">
                Store Name <SortIcon field="storeName" />
              </div>
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Contact
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('city')}
            >
              <div className="flex items-center">
                Location <SortIcon field="city" />
              </div>
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Shipping
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {stores.map((store) => (
            <tr key={store.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                <div className="flex items-center">
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={store.companyName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-sm">
                        {store.companyName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{store.companyName}</div>
                    {store.taxId && (
                      <div className="text-gray-500 text-xs">Tax ID: {store.taxId}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                {store.storeName || <span className="text-gray-400">—</span>}
              </td>
              <td className="px-3 py-4 text-sm text-gray-500">
                <div className="space-y-1">
                  {store.email && (
                    <div className="flex items-center text-xs">
                      <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {store.email}
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center text-xs">
                      <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                      {store.phone}
                    </div>
                  )}
                  {store.website && (
                    <div className="flex items-center text-xs">
                      <GlobeAltIcon className="h-4 w-4 mr-1 text-gray-400" />
                      <a
                        href={store.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-500">
                <div className="flex items-start">
                  <MapPinIcon className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>{store.address.city}, {store.address.state}</div>
                    <div className="text-xs text-gray-400">{store.address.country}</div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                {store.defaultShippingFrom ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Default
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onEdit(store)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className={`${
                      deleteConfirm === store.id
                        ? 'text-red-600 hover:text-red-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                {deleteConfirm === store.id && (
                  <div className="text-xs text-red-600 mt-1">Click again to confirm</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
