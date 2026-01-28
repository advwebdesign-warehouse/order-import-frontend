//file path: app/dashboard/products/components/ProductsToolbar.tsx

'use client'

import {
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { ProductColumnConfig, ProductFilterState } from '../utils/productTypes'
import ScreenOptions from '../../shared/components/ScreenOptions'

interface ProductsToolbarProps {
  selectedProductsCount: number
  onBulkAction: (action: string) => void
  onExport: () => void
  onResetLayout: () => void
  onImport?: () => void // Import handler
  columns: ProductColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
  totalProducts: number
  totalProductsInContext: number // Total in current warehouse/context
  filteredProducts: number
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  optionsOpen?: boolean
  onOptionsOpenChange?: (open: boolean) => void
  hasEcommerceIntegrations?: boolean // Show import button only if integrations exist
  searchTerm?: string // For detecting if search filter is active
  filters?: ProductFilterState // For detecting if filters are active
}

export default function ProductsToolbar({
  selectedProductsCount,
  onBulkAction,
  onExport,
  onResetLayout,
  onImport,
  columns,
  onColumnVisibilityChange,
  totalProducts,
  filteredProducts,
  totalProductsInContext,
  itemsPerPage,
  onItemsPerPageChange,
  optionsOpen,
  onOptionsOpenChange,
  hasEcommerceIntegrations = false,
  searchTerm = '',
  filters
}: ProductsToolbarProps) {

  // ✅ Helper: Check if any real filters (not warehouse/store context) are active
  const hasActiveFilters = (): boolean => {
    // Check search term
    if (searchTerm && searchTerm.trim() !== '') return true

    // Check if any filter properties are set (excluding context selectors)
    if (!filters) return false

    return (
      filters.status !== '' ||
      filters.visibility !== '' ||
      filters.type !== '' ||
      filters.stockStatus !== '' ||
      filters.category !== '' ||
      filters.vendor !== '' ||
      filters.brand !== '' ||
      filters.priceMin !== '' ||
      filters.priceMax !== '' ||
      filters.tags.length > 0 ||
      filters.hasVariants !== '' ||
      filters.parentOnly === true ||
      filters.storeId !== '' ||
      filters.platform !== ''
      // Note: warehouseId, integrationId are NOT filters - they're context
    )
  }

  // ✅ DEBUG: Log when component renders
  console.log('[ProductsToolbar] Rendered with selectedProductsCount:', selectedProductsCount)

  // ✅ DEBUG: Add handler with logging
  const handleDeleteClick = () => {
    console.log('[ProductsToolbar] 🔴 DELETE BUTTON CLICKED!')
    console.log('[ProductsToolbar] Selected products count:', selectedProductsCount)
    console.log('[ProductsToolbar] Calling onBulkAction with "delete"...')
    try {
      onBulkAction('delete')
      console.log('[ProductsToolbar] ✅ onBulkAction called successfully')
    } catch (error) {
      console.error('[ProductsToolbar] ❌ Error calling onBulkAction:', error)
    }
  }

  // Convert ProductColumnConfig to format expected by ScreenOptions
  // Filter out select and actions columns
  const screenOptionsColumns = columns
    .filter(col => col.id !== 'select' && col.id !== 'actions')
    .map(col => ({
      id: col.id,
      label: col.label || col.field,
      visible: col.visible
    }))

  return (
    <div className="space-y-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Products Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your product catalog including variants and parent-child relationships.
            {/* Only show "Showing X of Y" when ACTUAL filters are applied (not warehouse selection) */}
            {/* Use totalProductsInContext (warehouse total) instead of totalProducts (global total) */}
            {totalProductsInContext !== filteredProducts && filteredProducts > 0 && hasActiveFilters() && (
              <span className="ml-2 text-indigo-600">
                Showing {filteredProducts} of {totalProductsInContext} products
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          {/* Bulk Actions Dropdown */}
          {selectedProductsCount > 0 && (
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Delete Products ({selectedProductsCount})
            </button>
          )}

          {/* Import from Shopify Button */}
          {hasEcommerceIntegrations && onImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Import from Integration
            </button>
          )}

          {/* Add Product Button */}
          <button
            onClick={() => {
              console.log('[ProductsToolbar] ➕ Add Product clicked')
            }}
            className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </button>

          {/* Screen Options - Replaces ColumnSettings */}
          <ScreenOptions
            isOpen={optionsOpen}
            onOpenChange={onOptionsOpenChange}
            columns={screenOptionsColumns}
            onColumnVisibilityChange={onColumnVisibilityChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            onResetLayout={onResetLayout}
          />

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
    </div>
  )
}
