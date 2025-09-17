'use client'

import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { FilterState } from '../utils/orderTypes'

interface OrdersFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearAllFilters: () => void
}

export default function OrdersFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onClearAllFilters
}: OrdersFiltersProps) {
  const hasActiveFilters = searchTerm ||
    filters.status ||
    filters.fulfillmentStatus ||
    filters.platform ||
    filters.dateRange ||
    filters.startDate ||
    filters.endDate

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
              placeholder="Search orders, customers, or emails..."
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

          {/* Fulfillment Status Filter */}
          {filters.fulfillmentStatus && (
            <FilterBadge
              label={`Fulfillment: ${filters.fulfillmentStatus.replace('_', ' ')}`}
              onRemove={() => onFiltersChange({ ...filters, fulfillmentStatus: '' })}
              color="purple"
            />
          )}

          {/* Platform Filter */}
          {filters.platform && (
            <FilterBadge
              label={`Platform: ${filters.platform}`}
              onRemove={() => onFiltersChange({ ...filters, platform: '' })}
              color="indigo"
            />
          )}

          {/* Date Range Filter */}
          {filters.dateRange && filters.dateRange !== 'custom' && (
            <FilterBadge
              label={`Date: ${getDateRangeLabel(filters.dateRange)}`}
              onRemove={() => onFiltersChange({ ...filters, dateRange: '', startDate: '', endDate: '' })}
              color="orange"
            />
          )}

          {/* Custom Date Range Filter */}
          {filters.dateRange === 'custom' && (filters.startDate || filters.endDate) && (
            <FilterBadge
              label={`Date: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'Any'} - ${filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'Any'}`}
              onRemove={() => onFiltersChange({ ...filters, dateRange: '', startDate: '', endDate: '' })}
              color="orange"
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
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fulfillment</label>
              <select
                value={filters.fulfillmentStatus}
                onChange={(e) => onFiltersChange({ ...filters, fulfillmentStatus: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Fulfillment</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PICKING">Picking</option>
                <option value="PACKED">Packed</option>
                <option value="READY_TO_SHIP">Ready to Ship</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                value={filters.platform}
                onChange={(e) => onFiltersChange({ ...filters, platform: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Platforms</option>
                <option value="Shopify">Shopify</option>
                <option value="WooCommerce">WooCommerce</option>
                <option value="BigCommerce">BigCommerce</option>
                <option value="Magento">Magento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  dateRange: e.target.value,
                  startDate: e.target.value === 'custom' ? filters.startDate : '',
                  endDate: e.target.value === 'custom' ? filters.endDate : ''
                })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {filters.dateRange === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 bg-white rounded-md p-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Select start date"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min={filters.startDate}
                  placeholder="Select end date"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper component for filter badges
interface FilterBadgeProps {
  label: string
  onRemove: () => void
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'orange'
}

function FilterBadge({ label, onRemove, color }: FilterBadgeProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200 stroke-blue-700/50 group-hover:stroke-blue-700/75',
    green: 'bg-green-100 text-green-700 hover:bg-green-200 stroke-green-700/50 group-hover:stroke-green-700/75',
    purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200 stroke-purple-700/50 group-hover:stroke-purple-700/75',
    indigo: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 stroke-indigo-700/50 group-hover:stroke-indigo-700/75',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200 stroke-orange-700/50 group-hover:stroke-orange-700/75'
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
        <svg viewBox="0 0 14 14" className={`h-3.5 w-3.5 ${colorClasses[color]}`}>
          <path d="m4 4 6 6m0-6-6 6" />
        </svg>
      </button>
    </span>
  )
}

// Helper function for date range labels
function getDateRangeLabel(dateRange: string): string {
  const labels = {
    today: 'Today',
    yesterday: 'Yesterday',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    thismonth: 'This Month',
    lastmonth: 'Last Month'
  }
  return labels[dateRange as keyof typeof labels] || dateRange
}
