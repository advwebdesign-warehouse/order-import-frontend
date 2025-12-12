//file path: app/dashboard/products/components/ProductsFilters.tsx

'use client'

import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { Product, ProductFilterState } from '../utils/productTypes'
import { useSettings } from '../../shared/hooks/useSettings'

interface FilterOptions {
  categories: string[]
  vendors: string[]
  brands: string[]
  tags: string[]
  warehouses: Array<{ id: string; name: string }>
  statuses: string[]
  visibilities: string[]
  types: string[]
  stockStatuses: string[]
  platforms: string[]
  stores: string[]
}

interface ProductsFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  filters: ProductFilterState
  onFiltersChange: (filters: ProductFilterState) => void
  onClearAllFilters: () => void
  filterOptions: FilterOptions
}

export default function ProductsFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onClearAllFilters,
  filterOptions
}: ProductsFiltersProps) {
  const { settings } = useSettings()
  const isStockManagementEnabled = settings.inventory.manageStock

  const hasActiveFilters = searchTerm ||
    filters.status ||
    filters.visibility ||
    filters.type ||
    (isStockManagementEnabled && filters.stockStatus) ||
    filters.category ||
    filters.vendor ||
    filters.brand ||
    filters.platform ||
    filters.storeId ||
    filters.priceMin ||
    filters.priceMax ||
    filters.hasVariants ||
    filters.parentOnly ||
    !filters.includeVariants ||
    filters.tags.length > 0

  return (
    <div className="mt-8">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search products by name, SKU, description, brand..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Stock Management Disabled Notice */}
      {!isStockManagementEnabled && (
        <div className="mt-3 rounded-md bg-blue-50 p-3">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Stock management is disabled.</strong> Stock-related filters and columns are hidden.
                <button
                  onClick={() => window.location.href = '/dashboard/settings'}
                  className="ml-1 underline hover:text-blue-900"
                >
                  Enable in settings
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>

          {/* Search Term Filter */}
          {searchTerm && (
            <FilterBadge
              label={`Search: "${searchTerm}"`}
              onRemove={() => onSearchChange('')}
              color="blue"
            />
          )}

          {/* Status Filter */}
          {filters.status && (
            <FilterBadge
              label={`Status: ${filters.status}`}
              onRemove={() => onFiltersChange({ ...filters, status: '' })}
              color="green"
            />
          )}

          {/* Visibility Filter */}
          {filters.visibility && (
            <FilterBadge
              label={`Visibility: ${filters.visibility}`}
              onRemove={() => onFiltersChange({ ...filters, visibility: '' })}
              color="purple"
            />
          )}

          {/* Type Filter */}
          {filters.type && (
            <FilterBadge
              label={`Type: ${filters.type}`}
              onRemove={() => onFiltersChange({ ...filters, type: '' })}
              color="indigo"
            />
          )}

          {/* Stock Status Filter - Only show if stock management is enabled */}
          {isStockManagementEnabled && filters.stockStatus && (
            <FilterBadge
              label={`Stock: ${filters.stockStatus.replace('_', ' ')}`}
              onRemove={() => onFiltersChange({ ...filters, stockStatus: '' })}
              color="orange"
            />
          )}

          {/* Other filters remain the same */}
          {filters.category && (
            <FilterBadge
              label={`Category: ${filters.category}`}
              onRemove={() => onFiltersChange({ ...filters, category: '' })}
              color="pink"
            />
          )}

          {filters.vendor && (
            <FilterBadge
              label={`Vendor: ${filters.vendor}`}
              onRemove={() => onFiltersChange({ ...filters, vendor: '' })}
              color="cyan"
            />
          )}

          {filters.brand && (
            <FilterBadge
              label={`Brand: ${filters.brand}`}
              onRemove={() => onFiltersChange({ ...filters, brand: '' })}
              color="emerald"
            />
          )}

          {/* ✅ NEW: Platform Filter Badge */}
          {filters.platform && (
            <FilterBadge
              label={`Platform: ${filters.platform}`}
              onRemove={() => onFiltersChange({ ...filters, platform: '' })}
              color="stone"
            />
          )}

          {/* ✅ NEW: Store Filter Badge */}
          {filters.storeId && (
            <FilterBadge
              label={`Store: ${filters.storeId}`}
              onRemove={() => onFiltersChange({ ...filters, storeId: '' })}
              color="slate"
            />
          )}

          {(filters.priceMin || filters.priceMax) && (
            <FilterBadge
              label={`Price: $${filters.priceMin || '0'} - $${filters.priceMax || '∞'}`}
              onRemove={() => onFiltersChange({ ...filters, priceMin: '', priceMax: '' })}
              color="yellow"
            />
          )}

          {filters.hasVariants && (
            <FilterBadge
              label={`Has Variants: ${filters.hasVariants}`}
              onRemove={() => onFiltersChange({ ...filters, hasVariants: '' })}
              color="violet"
            />
          )}

          {filters.parentOnly && (
            <FilterBadge
              label="Parent Products Only"
              onRemove={() => onFiltersChange({ ...filters, parentOnly: false })}
              color="slate"
            />
          )}

          {!filters.includeVariants && (
            <FilterBadge
              label="Exclude Variants"
              onRemove={() => onFiltersChange({ ...filters, includeVariants: true })}
              color="stone"
            />
          )}

          {/* Clear All Filters */}
          <button
            type="button"
            onClick={onClearAllFilters}
            className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={filters.visibility}
                onChange={(e) => onFiltersChange({ ...filters, visibility: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="catalog">Catalog Only</option>
                <option value="search">Search Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Types</option>
                <option value="simple">Simple</option>
                <option value="variant">Variant</option>
                <option value="bundle">Bundle</option>
                <option value="configurable">Configurable</option>
              </select>
            </div>

            {/* Stock Status Filter - Only show if stock management is enabled */}
            {isStockManagementEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                <select
                  value={filters.stockStatus}
                  onChange={(e) => onFiltersChange({ ...filters, stockStatus: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option value="">All Stock Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="backorder">Backorder</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <select
                value={filters.vendor}
                onChange={(e) => onFiltersChange({ ...filters, vendor: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Vendors</option>
                {filterOptions.vendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => onFiltersChange({ ...filters, brand: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Brands</option>
                {filterOptions.brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ✅ NEW: Platform and Store Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                value={filters.platform || ''}
                onChange={(e) => onFiltersChange({ ...filters, platform: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Platforms</option>
                {filterOptions.platforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
              <select
                value={filters.storeId || ''}
                onChange={(e) => onFiltersChange({ ...filters, storeId: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Stores</option>
                {filterOptions.stores.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="0.00"
                value={filters.priceMin}
                onChange={(e) => onFiltersChange({ ...filters, priceMin: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="999.99"
                value={filters.priceMax}
                onChange={(e) => onFiltersChange({ ...filters, priceMax: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Product Relationship Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Has Variants</label>
              <select
                value={filters.hasVariants}
                onChange={(e) => onFiltersChange({ ...filters, hasVariants: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Products</option>
                <option value="yes">Has Variants</option>
                <option value="no">No Variants</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="parentOnly"
                checked={filters.parentOnly}
                onChange={(e) => onFiltersChange({ ...filters, parentOnly: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="parentOnly" className="ml-2 block text-sm text-gray-700">
                Show parent products only
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeVariants"
                checked={filters.includeVariants}
                onChange={(e) => onFiltersChange({ ...filters, includeVariants: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="includeVariants" className="ml-2 block text-sm text-gray-700">
                Include variant products
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper component for filter badges
interface FilterBadgeProps {
  label: string
  onRemove: () => void
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'orange' | 'pink' | 'cyan' | 'emerald' | 'yellow' | 'violet' | 'slate' | 'stone'
}

function FilterBadge({ label, onRemove, color }: FilterBadgeProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    pink: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    cyan: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
    emerald: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    yellow: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    violet: 'bg-violet-100 text-violet-700 hover:bg-violet-200',
    slate: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    stone: 'bg-stone-100 text-stone-700 hover:bg-stone-200'
  }

  return (
    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${colorClasses[color]}`}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        className={`group relative -mr-1 h-3.5 w-3.5 rounded-sm ${colorClasses[color]}`}
      >
        <span className="sr-only">Remove filter</span>
        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5">
          <path d="m4 4 6 6m0-6-6 6" />
        </svg>
      </button>
    </span>
  )
}
