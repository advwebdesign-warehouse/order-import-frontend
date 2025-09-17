'use client'

import { useState } from 'react'
import ProductsToolbar from './components/ProductsToolbar'
import ProductsFilters from './components/ProductsFilters'
import ProductsTable from './components/ProductsTable'
import ProductsPagination from './components/ProductsPagination'

// Custom hooks
import { useProducts } from './hooks/useProducts'
import { useProductFilters } from './hooks/useProductFilters'
import { useProductSelection } from './hooks/useProductSelection'
import { useProductColumns } from './hooks/useProductColumns'

// Utils
import { exportToCSV } from '../shared/utils/csvExporter'

// Types
import { Product } from './utils/productTypes'
import { PRODUCTS_PER_PAGE } from './constants/productConstants'

export default function ProductsPage() {
  // Modal states
  const [currentPage, setCurrentPage] = useState(1)

  // Custom hooks for state management
  const { products, loading } = useProducts()

  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredProducts
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

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
  const endIndex = startIndex + PRODUCTS_PER_PAGE
  const currentProducts = sortedProducts.slice(startIndex, endIndex)

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

    exportProductsToCSV(productsToExport, columns.filter(col => col.visible))
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
    })
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
        products={products}
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
    </div>
  )
}
