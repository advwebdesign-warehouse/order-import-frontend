//file path: app/dashboard/products/components/ProductsToolbar.tsx

'use client'

import {
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
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
          <button
            onClick={() => onBulkAction('delete')}
            className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Delete Products ({selectedProductsCount})
          </button>
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
