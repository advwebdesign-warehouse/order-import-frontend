'use client'

import { useState, useEffect, useRef } from 'react'

export interface ColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

interface ColumnSettingsProps {
  columns: ColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
  buttonText?: string
  className?: string
}

export default function ColumnSettings({
  columns,
  onColumnVisibilityChange,
  buttonText = "Columns",
  className = ""
}: ColumnSettingsProps) {
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnSettings(false)
      }
    }

    if (showColumnSettings) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnSettings])

  // Get visible columns count
  const visibleColumnsCount = columns.filter(col => col.visible).length
  const totalColumnsCount = columns.length

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setShowColumnSettings(!showColumnSettings)}
        className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {buttonText}
        <span className="text-xs text-gray-500">
          ({visibleColumnsCount}/{totalColumnsCount})
        </span>
      </button>

      {showColumnSettings && (
        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <span>Show/Hide Columns</span>
                <span className="text-xs text-gray-500">
                  {visibleColumnsCount} of {totalColumnsCount}
                </span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {columns.map((column) => (
                <label
                  key={column.id}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={column.visible}
                    onChange={(e) => onColumnVisibilityChange(column.id, e.target.checked)}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">
                      {column.label || column.field}
                    </span>
                    {column.field && column.label !== column.field && (
                      <span className="block text-xs text-gray-500 truncate">
                        {column.field}
                      </span>
                    )}
                  </div>
                  {!column.sortable && (
                    <span className="ml-2 text-xs text-gray-400">
                      No sort
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <button
                  onClick={() => {
                    // Show all columns
                    columns.forEach(col => {
                      if (!col.visible) {
                        onColumnVisibilityChange(col.id, true)
                      }
                    })
                  }}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    // Hide all non-essential columns (keep first few essential ones)
                    columns.forEach((col, index) => {
                      if (index > 2 && col.visible) { // Keep first 3 columns visible
                        onColumnVisibilityChange(col.id, false)
                      }
                    })
                  }}
                  className="text-gray-600 hover:text-gray-500 font-medium"
                >
                  Hide Most
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
