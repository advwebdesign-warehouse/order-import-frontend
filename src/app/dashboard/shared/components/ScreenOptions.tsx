// File: app/dashboard/shared/components/ScreenOptions.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ScreenOptionsProps {
  // Pagination
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  itemsPerPageOptions?: number[]

  // Max Picking Orders
  maxPickingOrders?: string
  onMaxPickingOrdersChange?: (value: string) => void

  // Columns (optional)
  columns?: Array<{
    id: string
    label: string
    visible: boolean
  }>
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void

  // View mode (optional)
  viewMode?: 'compact' | 'extended'
  onViewModeChange?: (mode: 'compact' | 'extended') => void

  // Reset Layout (optional)
  onResetLayout?: () => void

  className?: string
}

const DEFAULT_ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200]
const MAX_PICKING_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '30', label: '30' },
  { value: '40', label: '40' },
  { value: '50', label: '50' },
  { value: 'custom', label: 'Custom' }
]

export default function ScreenOptions({
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = DEFAULT_ITEMS_PER_PAGE_OPTIONS,
  maxPickingOrders = 'all',
  onMaxPickingOrdersChange,
  columns,
  onColumnVisibilityChange,
  viewMode,
  onViewModeChange,
  onResetLayout,
  className = ''
}: ScreenOptionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Add fallback for undefined itemsPerPage
  const safeItemsPerPage = itemsPerPage || 20
  const [localItemsPerPage, setLocalItemsPerPage] = useState(safeItemsPerPage.toString())
  const [customPickingLimit, setCustomPickingLimit] = useState('100')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update local state when itemsPerPage prop changes
  useEffect(() => {
    setLocalItemsPerPage((itemsPerPage || 20).toString())
  }, [itemsPerPage])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleApply = () => {
    const newValue = parseInt(localItemsPerPage)
    if (newValue && newValue > 0 && newValue <= 1000) {
      onItemsPerPageChange(newValue)
      setIsOpen(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  const handleResetLayout = () => {
    if (onResetLayout) {
      onResetLayout()
      setIsOpen(false)
    }
  }

  const handleMaxPickingOrdersChange = (value: string) => {
    if (onMaxPickingOrdersChange) {
      if (value === 'custom') {
        // When switching to custom, use current custom limit value
        onMaxPickingOrdersChange(`custom:${currentCustomValue}`)
      } else {
        onMaxPickingOrdersChange(value)
      }
    }
  }

  const handleCustomPickingLimitChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setCustomPickingLimit(value)
      // Always update the parent state immediately when custom value changes
      if (onMaxPickingOrdersChange) {
        onMaxPickingOrdersChange(`custom:${value}`)
      }
    }
  }

  // Parse current max picking orders value
  const currentMaxPickingOption = maxPickingOrders?.startsWith('custom:') ? 'custom' : maxPickingOrders
  const currentCustomValue = maxPickingOrders?.startsWith('custom:')
    ? maxPickingOrders.split(':')[1] || customPickingLimit
    : customPickingLimit

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Options Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-x-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Options
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {/* Screen Options Panel */}
      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4 space-y-6">
            {/* Columns Section */}
            {columns && columns.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Columns</h3>
                <div className="grid grid-cols-2 gap-2">
                  {columns.map((column) => (
                    <label key={column.id} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={(e) => onColumnVisibilityChange?.(column.id, e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                      />
                      <span className="text-gray-700">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Pagination</h3>
              <div className="space-y-4">
                {/* Items per page */}
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Number of items per page:</label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={localItemsPerPage}
                      onChange={(e) => setLocalItemsPerPage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-16 rounded-md border-0 py-1 px-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    />
                  </div>

                  {/* Quick Options */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {itemsPerPageOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setLocalItemsPerPage(option.toString())
                          onItemsPerPageChange(option)
                          setIsOpen(false)
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          option === safeItemsPerPage
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Picking Orders */}
                {onMaxPickingOrdersChange && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Max picking orders:</label>
                    <select
                      value={currentMaxPickingOption}
                      onChange={(e) => handleMaxPickingOrdersChange(e.target.value)}
                      className="w-full rounded-md border-0 py-1 px-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                    >
                      {MAX_PICKING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Custom input when "Custom" is selected */}
                    {currentMaxPickingOption === 'custom' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={currentCustomValue}
                          onChange={(e) => handleCustomPickingLimitChange(e.target.value)}
                          placeholder="Enter number"
                          className="w-full rounded-md border-0 py-1 px-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                        />
                      </div>
                    )}

                    {/* Quick preset buttons */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {MAX_PICKING_OPTIONS.filter(opt => opt.value !== 'all' && opt.value !== 'custom').map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleMaxPickingOrdersChange(option.value)}
                          className={`px-2 py-1 text-xs rounded ${
                            option.value === maxPickingOrders
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* View Mode Section */}
            {viewMode && onViewModeChange && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">View Mode</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewModeChange('compact')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'compact'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => onViewModeChange('extended')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'extended'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Extended
                  </button>
                </div>
              </div>
            )}

            {/* Reset Layout Section */}
            {onResetLayout && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Layout</h3>
                <button
                  onClick={handleResetLayout}
                  className="inline-flex items-center gap-x-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  title="Reset column order, sorting, and filters to defaults"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reset Layout
                </button>
              </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
