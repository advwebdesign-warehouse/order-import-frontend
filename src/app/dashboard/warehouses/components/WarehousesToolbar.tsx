// app/dashboard/warehouses/components/WarehousesToolbar.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import {
  PlusIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { WarehouseColumnConfig, WarehouseFilterState } from '../utils/warehouseTypes'
import ColumnSettings from '../../shared/components/ColumnSettings'

interface WarehousesToolbarProps {
  selectedWarehousesCount: number
  onBulkAction: (action: string) => void
  onAddWarehouse: () => void
  onResetLayout: () => void
  columns: WarehouseColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
  totalWarehouses: number
  filteredWarehouses: number

  // Search and filters
  searchTerm: string
  onSearchChange: (term: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  filters: WarehouseFilterState
  onFiltersChange: (filters: WarehouseFilterState) => void
  onClearAllFilters: () => void
}

export default function WarehousesToolbar({
  selectedWarehousesCount,
  onBulkAction,
  onAddWarehouse,
  onResetLayout,
  columns,
  onColumnVisibilityChange,
  totalWarehouses,
  filteredWarehouses,
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onClearAllFilters
}: WarehousesToolbarProps) {
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

  const hasActiveFilters = searchTerm ||
    filters.status ||
    filters.country

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Warehouse Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your warehouses and inventory locations.
            {totalWarehouses !== filteredWarehouses && (
              <span className="ml-2 text-indigo-600">
                Showing {filteredWarehouses} of {totalWarehouses} warehouses
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          {/* Bulk Actions Dropdown */}
          {selectedWarehousesCount > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="inline-flex items-center gap-x-2 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
                Bulk Actions ({selectedWarehousesCount})
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
                      Activate Warehouses
                    </button>
                    <button
                      onClick={() => {
                        onBulkAction('deactivate')
                        setShowBulkActions(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Deactivate Warehouses
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        onBulkAction('delete')
                        setShowBulkActions(false)
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete Warehouses
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Warehouse Button */}
          <button
            onClick={onAddWarehouse}
            className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <PlusIcon className="h-4 w-4" />
            Add Warehouse
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
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search warehouses by name, code, or location..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          className={`inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset focus:outline-none ${
            hasActiveFilters
              ? 'bg-indigo-50 text-indigo-700 ring-indigo-300 hover:bg-indigo-100'
              : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>

          {searchTerm && (
            <FilterBadge
              label={`Search: "${searchTerm}"`}
              onRemove={() => onSearchChange('')}
            />
          )}

          {filters.status && (
            <FilterBadge
              label={`Status: ${filters.status}`}
              onRemove={() => onFiltersChange({ ...filters, status: '' })}
            />
          )}

          {filters.country && (
            <FilterBadge
              label={`Country: ${filters.country}`}
              onRemove={() => onFiltersChange({ ...filters, country: '' })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={filters.country}
                onChange={(e) => onFiltersChange({ ...filters, country: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Countries</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Germany">Germany</option>
                <option value="Australia">Australia</option>
              </select>
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
}

function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-indigo-200"
      >
        <span className="sr-only">Remove filter</span>
        <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 stroke-indigo-700/50 group-hover:stroke-indigo-700/75">
          <path d="m4 4 6 6m0-6-6 6" />
        </svg>
      </button>
    </span>
  )
}
