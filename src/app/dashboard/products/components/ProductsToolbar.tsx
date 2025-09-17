'use client'

import {
  ArrowDownTrayIcon,
  PlusIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'
import { useState, useRef, useEffect } from 'react'
import { ProductColumnConfig } from '../utils/productTypes'
import ColumnSettings from '../../shared/components/ColumnSettings'

interface ProductsToolbarProps {
  selectedProductsCount: number
  onBulkAction: (action: string) => void
  onExport: () => void
  onResetLayout: () => void
  columns: ProductColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
  totalProducts: number
  filteredProducts: number
}

export default function ProductsToolbar({
  selectedProductsCount,
  onBulkAction,
  onExport,
  onResetLayout,
  columns,
  onColumnVisibilityChange,
  totalProducts,
  filteredProducts
}: ProductsToolbarProps) {
  const [showBulkActions, setShowBulkActions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBulkActions(false)
      }
    }

    if (showBulkActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBulkActions])

  return (
    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">Products Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your product catalog including variants and parent-child relationships.
          {totalProducts !== filteredProducts && (
            <span className="ml-2 text-indigo-600">
              Showing {filteredProducts} of {totalProducts} products
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
        {/* Bulk Actions Dropdown */}
        {selectedProductsCount > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="inline-flex items-center gap-x-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
              Bulk Actions ({selectedProductsCount})
            </button>

            {showBulkActions && (
              <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onBulkAction('activate')
                      setShowBulkActions(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Activate Products
                  </button>
                  <button
                    onClick={() => {
                      onBulkAction('deactivate')
                      setShowBulkActions(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Deactivate Products
                  </button>
                  <button
                    onClick={() => {
                      onBulkAction('export')
                      setShowBulkActions(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export Selected
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      onBulkAction('delete')
                      setShowBulkActions(false)
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    Delete Products
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Product Button */}
        <button
          onClick={() => console.log('Add new product')}
          className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
        >
          <PlusIcon className="h-4 w-4" />
          Add Product
        </button>

        {/* Column Settings */}
        <ColumnSettings
          columns={columns}
          onColumnVisibilityChange={onColumnVisibilityChange}
        />

        {/* Reset Layout Button */}
        <button
          onClick={onResetLayout}
          className="inline-flex items-center gap-x-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          title="Reset column order, sorting, and filters to defaults"
        >
          Reset Layout
        </button>

        {/* Export All Button */}
        <button
          onClick={onExport}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Products
        </button>
      </div>
    </div>
  )
}
