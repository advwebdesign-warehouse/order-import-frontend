// File: app/dashboard/orders/components/OrdersFilters.tsx

'use client'

import { Fragment, useMemo, useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/20/solid'
import { FilterState, Order } from '../utils/orderTypes'
import { FILTER_OPTIONS } from '../constants/orderConstants'
import { useWarehouses } from '../../warehouses/context/WarehouseContext'
import { getStoresFromStorage } from '../../stores/utils/storeStorage'
import { getStoreName } from '../utils/warehouseUtils'
import ScreenOptions from '../../shared/components/ScreenOptions'
import { ColumnConfig } from '../../shared/components/ColumnSettings'

interface OrdersFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onClearAllFilters: () => void
  hideWarehouseFilter?: boolean
  onExport?: () => void
  optionsOpen?: boolean
  onOptionsOpenChange?: (open: boolean) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (value: number) => void
  maxPickingOrders?: string
  onMaxPickingOrdersChange?: (value: string) => void
  columns?: ColumnConfig[]
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void
  onResetLayout?: () => void
  orders?: Order[]
}

export default function OrdersFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFiltersChange,
  onClearAllFilters,
  hideWarehouseFilter = false,
  onExport,
  optionsOpen,
  onOptionsOpenChange,
  itemsPerPage,
  onItemsPerPageChange,
  maxPickingOrders,
  onMaxPickingOrdersChange,
  columns,
  onColumnVisibilityChange,
  onResetLayout,
  orders = []
}: OrdersFiltersProps) {
  const { warehouses } = useWarehouses()

  // Load stores from storage
  const [stores, setStores] = useState<any[]>([])

  useEffect(() => {
    const loadedStores = getStoresFromStorage()
    setStores(loadedStores)
  }, [])

  // NEW: Dynamically generate store options from orders
  const storeOptions = useMemo(() => {
    const storeMap = new Map<string, string>()

    orders.forEach(order => {
      // Use storeId (required) and storeName (optional)
      const storeId = order.storeId
      const storeName = getStoreName(storeId, stores)

      if (storeId && typeof storeId === 'string' && storeId.trim() !== '') {
        storeMap.set(storeId, storeName || storeId)
      }
    })

    return Array.from(storeMap.entries())
      .map(([id, name]) => ({
        value: id || '',
        label: name || 'Unknown Store'
      }))
      .filter(option => option.value && option.label) // Remove any invalid options
      .sort((a, b) => {
        // Safe sorting that handles undefined/null
        const labelA = a.label || ''
        const labelB = b.label || ''
        return labelA.localeCompare(labelB)
      })
  }, [orders, stores])

  // Helper function to safely render filter values
  const renderFilterValue = (value: any): string => {
    if (typeof value === 'string') {
      return value
    }
    if (typeof value === 'object' && value !== null) {
      // Handle object values (like date ranges)
      if (value.start && value.end) {
        return `${value.start} to ${value.end}`
      }
      if (value.label) {
        return value.label
      }
      // Fallback: convert object to JSON string
      return JSON.stringify(value)
    }
    return String(value || '')
  }

  // Helper function to ensure dateRange is always a string
  const getDateRangeLabel = (dateRange: any): string => {
    if (typeof dateRange === 'string') {
      // Convert internal values to readable labels
      switch (dateRange) {
        case 'today': return 'Today'
        case 'yesterday': return 'Yesterday'
        case 'last7days': return 'Last 7 Days'
        case 'last30days': return 'Last 30 Days'
        case 'last90days': return 'Last 90 Days'
        case 'thismonth': return 'This Month'
        case 'lastmonth': return 'Last Month'
        case 'custom': return 'Custom Range'
        default: return dateRange
      }
    }
    if (typeof dateRange === 'object' && dateRange !== null) {
      if (dateRange.start && dateRange.end) {
        return `${dateRange.start} to ${dateRange.end}`
      }
    }
    return 'Unknown Range'
  }

  // Defensive validation to ensure arrays are always arrays and strings are strings
  const safeFilters = {
    ...filters,
    status: Array.isArray(filters.status) ? filters.status : [],
    fulfillmentStatus: Array.isArray(filters.fulfillmentStatus) ? filters.fulfillmentStatus : [],
    platform: Array.isArray(filters.platform) ? filters.platform : [],
    storeId: Array.isArray(filters.storeId) ? filters.storeId : [],
    dateRange: typeof filters.dateRange === 'string' ? filters.dateRange : '',
    startDate: typeof filters.startDate === 'string' ? filters.startDate : '',
    endDate: typeof filters.endDate === 'string' ? filters.endDate : '',
    warehouseId: typeof filters.warehouseId === 'string' ? filters.warehouseId : ''
  }

  // Multi-select handler for array filters
  const handleMultiSelectChange = (field: keyof FilterState, value: string) => {
    const currentValues = safeFilters[field] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]

    onFiltersChange({
      ...safeFilters,
      [field]: newValues
    })
  }

  // Single select handler for non-array filters
  const handleSingleSelectChange = (field: keyof FilterState, value: string) => {
    onFiltersChange({
      ...safeFilters,
      [field]: value
    })
  }

  // Get warehouse options for filter
  const warehouseOptions = warehouses
    .filter(w => w.status === 'active')
    .map(warehouse => ({
      value: warehouse.id,
      label: warehouse.name
    }))

  const MultiSelectFilter = ({
    label,
    values,
    options,
    field
  }: {
    label: string
    values: string[]
    options: { value: string; label: string }[]
    field: keyof FilterState
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Listbox multiple value={values} onChange={(newValues) => onFiltersChange({ ...safeFilters, [field]: newValues })}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
            <span className="block truncate">
              {values.length === 0
                ? `All ${label}`
                : values.length === 1
                ? options.find(opt => opt.value === values[0])?.label
                : `${values.length} selected`
              }
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )

  const SingleSelectFilter = ({
    label,
    value,
    options,
    field,
    placeholder = `All ${label}`
  }: {
    label: string
    value: string
    options: { value: string; label: string }[]
    field: keyof FilterState
    placeholder?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => handleSingleSelectChange(field, e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )

  const hasActiveFilters =
    (safeFilters.status && safeFilters.status.length > 0) ||
    (safeFilters.fulfillmentStatus && safeFilters.fulfillmentStatus.length > 0) ||
    (safeFilters.platform && safeFilters.platform.length > 0) ||
    (safeFilters.storeId && safeFilters.storeId.length > 0) ||
    safeFilters.dateRange ||
    safeFilters.startDate ||
    safeFilters.endDate ||
    (!hideWarehouseFilter && safeFilters.warehouseId)

  return (
    <div className="mt-4 space-y-4">
      {/* Search Bar and Filter Toggle */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search orders by customer, order number, email..."
            />
          </div>
        </div>
        <button
          onClick={onToggleFilters}
          className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            showFilters
              ? 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-indigo-600 text-white rounded-full">
              {(safeFilters.status?.length || 0) +
               (safeFilters.fulfillmentStatus?.length || 0) +
               (safeFilters.platform?.length || 0) +
               (safeFilters.storeId?.length || 0) +
               (safeFilters.dateRange ? 1 : 0) +
               (safeFilters.warehouseId ? 1 : 0)}
            </span>
          )}
        </button>

        {optionsOpen !== undefined && onOptionsOpenChange && itemsPerPage && onItemsPerPageChange && (
          <ScreenOptions
            isOpen={optionsOpen}
            onOpenChange={onOptionsOpenChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            maxPickingOrders={maxPickingOrders}
            onMaxPickingOrdersChange={onMaxPickingOrdersChange}
            columns={columns?.filter(col => col.id !== 'select' && col.id !== 'actions').map(col => ({
              id: col.id,
              label: col.label || col.field,
              visible: col.visible
            }))}
            onColumnVisibilityChange={onColumnVisibilityChange}
            onResetLayout={onResetLayout}
          />
        )}

        {/* Export Orders Button */}
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Orders
          </button>
        )}
      </div>

      {/* Filters Panel - Collapsible */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={onClearAllFilters}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Status Filter */}
            <MultiSelectFilter
              label="Status"
              values={safeFilters.status}
              options={FILTER_OPTIONS.STATUS}
              field="status"
            />

            {/* Fulfillment Status Filter */}
            <MultiSelectFilter
              label="Fulfillment Status"
              values={safeFilters.fulfillmentStatus}
              options={FILTER_OPTIONS.FULFILLMENT_STATUS}
              field="fulfillmentStatus"
            />

            {/* Platform Filter */}
            <MultiSelectFilter
              label="Platform"
              values={safeFilters.platform}
              options={FILTER_OPTIONS.PLATFORM}
              field="platform"
            />

            {/* NEW: Store Filter */}
            <MultiSelectFilter
              label="Store"
              values={safeFilters.storeId}
              options={storeOptions}
              field="storeId"
            />

            {/* Warehouse Filter - Only show if not hidden */}
            {!hideWarehouseFilter && (
              <SingleSelectFilter
                label="Warehouse"
                value={safeFilters.warehouseId}
                options={warehouseOptions}
                field="warehouseId"
                placeholder="All Warehouses"
              />
            )}

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={safeFilters.dateRange}
                onChange={(e) => handleSingleSelectChange('dateRange', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last90days">Last 90 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Custom Date Range */}
            {safeFilters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={safeFilters.startDate}
                    onChange={(e) => handleSingleSelectChange('startDate', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={safeFilters.endDate}
                    onChange={(e) => handleSingleSelectChange('endDate', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="border-t pt-4">
              <div className="flex flex-wrap gap-2">
                {/* Status filters - Safe array access */}
                {safeFilters.status.map(status => (
                  <span key={status} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Status: {FILTER_OPTIONS.STATUS.find(s => s.value === status)?.label || status}
                    <button
                      onClick={() => handleMultiSelectChange('status', status)}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Fulfillment Status filters - Safe array access */}
                {safeFilters.fulfillmentStatus.map(status => (
                  <span key={status} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Fulfillment: {FILTER_OPTIONS.FULFILLMENT_STATUS.find(s => s.value === status)?.label || status}
                    <button
                      onClick={() => handleMultiSelectChange('fulfillmentStatus', status)}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-400 hover:bg-green-200 hover:text-green-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Platform filters - Safe array access */}
                {safeFilters.platform.map(platform => (
                  <span key={platform} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Platform: {FILTER_OPTIONS.PLATFORM.find(p => p.value === platform)?.label || platform}
                    <button
                      onClick={() => handleMultiSelectChange('platform', platform)}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* NEW: Store filters - Safe array access */}
                {safeFilters.storeId.map(storeId => (
                  <span key={storeId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                    Store: {storeOptions.find(s => s.value === storeId)?.label || storeId}
                    <button
                      onClick={() => handleMultiSelectChange('storeId', storeId)}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-pink-400 hover:bg-pink-200 hover:text-pink-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Date Range filter - SAFE RENDERING */}
                {safeFilters.dateRange && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Range: {getDateRangeLabel(safeFilters.dateRange)}
                    <button
                      onClick={() => handleSingleSelectChange('dateRange', '')}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-yellow-400 hover:bg-yellow-200 hover:text-yellow-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* Start Date filter - SAFE RENDERING */}
                {safeFilters.startDate && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    From: {renderFilterValue(safeFilters.startDate)}
                    <button
                      onClick={() => handleSingleSelectChange('startDate', '')}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-orange-400 hover:bg-orange-200 hover:text-orange-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* End Date filter - SAFE RENDERING */}
                {safeFilters.endDate && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    To: {renderFilterValue(safeFilters.endDate)}
                    <button
                      onClick={() => handleSingleSelectChange('endDate', '')}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-red-400 hover:bg-red-200 hover:text-red-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {/* Warehouse filter - SAFE RENDERING */}
                {!hideWarehouseFilter && safeFilters.warehouseId && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Warehouse: {warehouses.find(w => w.id === safeFilters.warehouseId)?.name || safeFilters.warehouseId}
                    <button
                      onClick={() => handleSingleSelectChange('warehouseId', '')}
                      className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
