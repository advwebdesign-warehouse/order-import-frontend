// File: app/dashboard/products/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccountId } from '@/hooks/useAccountInitialization'
import ProductsToolbar from './components/ProductsToolbar'
import ProductsFilters from './components/ProductsFilters'
import ProductsTable from './components/ProductsTable'
import ProductsPagination from './components/ProductsPagination'

// Custom hooks
import { useProducts } from './hooks/useProducts'
import { useProductFilters } from './hooks/useProductFilters'
import { useProductSelection } from './hooks/useProductSelection'
import { useProductColumns } from './hooks/useProductColumns'
import { useProductSync } from './hooks/useProductSync'

// Shared components
import { ColumnConfig } from '../shared/components/ColumnSettings'
import { usePagination } from '../shared/hooks/usePagination'
import WarehouseSelector from '../shared/components/WarehouseSelector'
import { useSettings } from '../shared/hooks/useSettings'
import { withAuth } from '../shared/components/withAuth'

// Warehouse support
import { useWarehouses } from '../warehouses/hooks/useWarehouses'

// Utils
import { exportToCSV, ExportableItem } from '../shared/utils/csvExporter'
import { getProductWarehouseNames } from './utils/productUtils'

// Types
import { Product } from './utils/productTypes'
import { PRODUCTS_PER_PAGE } from './constants/productConstants'

// Helper function to export products as CSV
const exportProductsToCSV = (
  products: Product[],
  columns: ColumnConfig[],
  isStockManagementEnabled: boolean,
  warehouses: any[]
) => {
  const exportColumns = columns.map(column => ({
    ...column,
    formatter: (value: any, item: ExportableItem): string => {
      const product = item as Product

      switch (column.field) {
        case 'name':
          return product.name || ''
        case 'sku':
          return product.sku || ''
        case 'description':
          return product.description || ''
        case 'price':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(product.price || 0)
        case 'status':
          return product.status || ''
        case 'visibility':
          return product.visibility || ''
        case 'type':
          return product.type || ''
        case 'stockStatus':
          return isStockManagementEnabled ? (product.stockStatus || '').replace('_', ' ') : ''
        case 'stockQuantity':
          return isStockManagementEnabled ? (product.stockQuantity || 0).toString() : ''
        case 'category':
          return product.category || ''
        case 'vendor':
          return product.vendor || ''
        case 'brand':
          return product.brand || ''
        case 'weight':
          return product.weight ? product.weight.toString() : ''
        case 'dimensions':
          return product.dimensions ? `${product.dimensions.length}Ã—${product.dimensions.width}Ã—${product.dimensions.height}` : ''
        case 'tags':
          return product.tags.join(', ')
        case 'variants':
          return product.variants ? product.variants.length.toString() : '0'
        case 'parentId':
          return product.parentId || ''
        case 'warehouseName':
          return getProductWarehouseNames(product, warehouses)
        case 'createdAt':
          return product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : ''
        case 'updatedAt':
          return product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : ''
        default:
          return value?.toString() || ''
      }
    }
  }))

  const filteredColumns = isStockManagementEnabled
    ? exportColumns
    : exportColumns.filter(col => col.field !== 'stockStatus' && col.field !== 'stockQuantity')

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD format
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS format
  const filename = `products-export-${dateStr}-${timeStr}.csv`

  exportToCSV(products, filteredColumns, filename)
}

// ✅ Separate component that receives guaranteed valid accountId
function ProductsPageContent({ accountId }: { accountId: string }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')

  // Get settings for stock management
  const { settings } = useSettings()
  const isStockManagementEnabled = settings?.inventory?.manageStock || false

  // General product sync hook (works with ALL integrations)
  const {
    syncProducts,
    syncSingleIntegration,
    syncing,
    progress,
    error: syncError,
    ecommerceIntegrations,
    hasIntegrations,
    integrationCount,
    getSyncStats
  } = useProductSync(accountId, []) // accountId is guaranteed to be valid here

  // Get sync stats
  const [syncStats, setSyncStats] = useState(() => getSyncStats())

  // Get URL parameters for warehouse filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const warehouseParam = urlParams.get('warehouse')
    if (warehouseParam) {
      setSelectedWarehouseId(warehouseParam)
    }
  }, [])

  // Warehouse management
  const { warehouses } = useWarehouses()

  // Custom hooks for state management
  const { products, loading, refetchProducts } = useProducts(selectedWarehouseId)

  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredProducts,
    filterOptions
  } = useProductFilters(products)

  const {
    selectedProducts,
    handleSelectProduct,
    handleSelectAll,
    clearSelection
  } = useProductSelection()

  const {
    columns,
    sortConfig,
    sortedProducts,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  } = useProductColumns(filteredProducts)

  const { productsPerPage, setProductsPerPage } = usePagination()

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE
  const currentProducts = sortedProducts.slice(startIndex, endIndex)

  // Handle product sync
  const handleSyncProducts = async () => {
    const result = await syncProducts()
    if (result.success) {
      setSyncStats(getSyncStats())
      await refetchProducts()
      alert(`Successfully synced ${result.totalCount} products!`)
    } else {
      alert(`Sync completed with errors: ${syncError || 'Unknown error'}`)
    }
  }

  // Handle single integration sync
  const handleSyncSingleIntegration = async (integrationId: string) => {
    const result = await syncSingleIntegration(integrationId)
    if (result.success) {
      setSyncStats(getSyncStats())
      await refetchProducts()
      alert(`Successfully synced ${result.count} products!`)
    } else {
      alert(`Sync failed: ${result.error || 'Unknown error'}`)
    }
  }

  // Event handlers
  const handleViewProduct = (product: Product) => {
    console.log('View product:', product.sku)
    // TODO: Navigate to product details page or open modal
  }

  const handleEditProduct = (product: Product) => {
    console.log('Edit product:', product.sku)
    // TODO: Navigate to product edit page or open modal
  }

  const handleDuplicateProduct = (product: Product) => {
    console.log('Duplicate product:', product.sku)
    // TODO: Implement product duplication
  }

  const handleBulkAction = (action: string) => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product.')
      return
    }

    const selectedProductIds = Array.from(selectedProducts)
    console.log(`Bulk ${action} for products:`, selectedProductIds)

    switch (action) {
      case 'activate':
        // TODO: Bulk activate products
        break
      case 'deactivate':
        // TODO: Bulk deactivate products
        break
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) {
          // TODO: Bulk delete products
        }
        break
      case 'export':
        handleExport()
        break
    }
  }

  const handleExport = () => {
    const productsToExport = selectedProducts.size > 0
      ? sortedProducts.filter(product => selectedProducts.has(product.id))
      : sortedProducts

    exportProductsToCSV(productsToExport, columns.filter(col => col.visible), isStockManagementEnabled, warehouses)  // FIXED: Added third parameter
  }

  const handleResetLayout = () => {
    resetToDefaults()
    setCurrentPage(1)
    clearSelection()
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setFilters({
      search: '',
      status: '',
      visibility: '',
      type: '',
      stockStatus: '',
      category: '',
      vendor: '',
      brand: '',
      priceMin: '',
      priceMax: '',
      tags: [],
      hasVariants: '',
      parentOnly: false,
      includeVariants: true,
      warehouseId: '',
    })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setProductsPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId)
    setCurrentPage(1)
    clearSelection()

    // Update URL to reflect warehouse selection
    const url = new URL(window.location.href)
    if (warehouseId) {
      url.searchParams.set('warehouse', warehouseId)
    } else {
      url.searchParams.delete('warehouse')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // Get selected warehouse name for display
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId)
  const warehouseDisplayName = selectedWarehouse
    ? selectedWarehouse.name
    : selectedWarehouseId === ''
    ? 'All Warehouses'
    : 'Unknown Warehouse'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Determine UI mode based on integrations
  const showIntegrationSpecificUI = hasIntegrations && integrationCount === 1
  const singleIntegration = showIntegrationSpecificUI ? ecommerceIntegrations[0] : null

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Empty State - No Integrations */}
      {!hasIntegrations && syncStats.totalProducts === 0 && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">No Products Found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>No ecommerce integrations are connected. Connect to a store platform (Shopify, WooCommerce, etc.) to sync your products.</p>
              </div>
              <div className="mt-4">
                <a
                  href="/dashboard/integrations"
                  className="inline-flex items-center gap-x-2 rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Connect Integration
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status - Single Integration */}
      {showIntegrationSpecificUI && syncStats.totalProducts > 0 && singleIntegration && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {syncStats.totalProducts} products from {singleIntegration.name}
                </p>
                <p className="text-xs text-blue-700">
                  Last sync: {syncStats.lastSyncDate
                    ? new Date(syncStats.lastSyncDate).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleSyncSingleIntegration(singleIntegration.id)}
              disabled={syncing}
              className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Products
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sync Status - Multiple Integrations */}
      {hasIntegrations && integrationCount > 1 && syncStats.totalProducts > 0 && (
        <div className="mb-6 rounded-lg bg-indigo-50 border border-indigo-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900">
                {syncStats.totalProducts} products from {integrationCount} integrations
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(syncStats.byPlatform).map(([platform, count]) => (
                  <span key={platform} className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 capitalize">
                    {platform}: {count}
                  </span>
                ))}
              </div>
              <p className="text-xs text-indigo-700 mt-1">
                Last sync: {syncStats.lastSyncDate
                  ? new Date(syncStats.lastSyncDate).toLocaleString()
                  : 'Never'}
              </p>
            </div>
            <button
              onClick={handleSyncProducts}
              disabled={syncing}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Syncing All...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync All
                </>
              )}
            </button>
          </div>

          {/* Show individual integration progress when syncing */}
          {syncing && Object.keys(progress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(progress).map(([id, prog]) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-indigo-900 w-24">
                    {prog.integration}
                  </span>
                  <div className="flex-1 bg-indigo-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        prog.status === 'success' ? 'bg-green-500' :
                        prog.status === 'error' ? 'bg-red-500' :
                        'bg-indigo-600'
                      }`}
                      style={{ width: `${prog.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-indigo-700 w-20">
                    {prog.status === 'success' ? `${prog.count} products` :
                     prog.status === 'error' ? 'Failed' :
                     prog.status === 'syncing' ? 'Syncing...' :
                     'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State - Has Integrations but No Products */}
      {hasIntegrations && products.length === 0 && (
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Products Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              You have {integrationCount} integration{integrationCount > 1 ? 's' : ''} connected, but no products have been synced yet.
            </p>
            <div className="mt-6">
              <button
                onClick={handleSyncProducts}
                disabled={syncing}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Products Now
                  </>
                )}
              </button>
            </div>
            {syncError && (
              <div className="mt-4 text-sm text-red-600">
                Error: {syncError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warehouse Selector */}
      {products.length > 0 && (
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Warehouse</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedWarehouseId ? `Showing products from ${warehouseDisplayName}` : 'Showing products from all warehouses'}
                </p>
              </div>
              <div className="w-64">
                <WarehouseSelector
                  warehouses={warehouses.map(w => ({
                    id: w.id,
                    name: w.name,
                    code: w.code,
                    isDefault: w.isDefault,
                    status: w.status,
                    productCount: w.productCount
                  }))}
                  selectedWarehouseId={selectedWarehouseId}
                  onWarehouseChange={handleWarehouseChange}
                  showProductCount={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <>
          <ProductsToolbar
            selectedProductsCount={selectedProducts.size}
            onBulkAction={handleBulkAction}
            onExport={handleExport}
            onResetLayout={handleResetLayout}
            columns={columns}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            totalProducts={products.length}
            filteredProducts={filteredProducts.length}
          />

          <ProductsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            filters={filters}
            onFiltersChange={setFilters}
            onClearAllFilters={handleClearAllFilters}
            filterOptions={filterOptions}
          />

          <ProductsTable
            products={currentProducts}
            columns={columns}
            sortConfig={sortConfig}
            selectedProducts={selectedProducts}
            onSort={handleSort}
            onSelectProduct={handleSelectProduct}
            onSelectAll={() => handleSelectAll(currentProducts)}
            onViewProduct={handleViewProduct}
            onEditProduct={handleEditProduct}
            onDuplicateProduct={handleDuplicateProduct}
            onColumnReorder={handleColumnReorder}
          />

          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedProducts.length}
            itemsPerPage={PRODUCTS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
          </>
        )}
    </div>
  )
}
export default withAuth(ProductsPageContent)
