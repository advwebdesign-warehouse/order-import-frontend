'use client'

import { useState, useEffect, useRef } from 'react'
import { ColumnConfig } from '../utils/orderTypes'

interface OrdersColumnSettingsProps {
  columns: ColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
}

export default function OrdersColumnSettings({
  columns,
  onColumnVisibilityChange
}: OrdersColumnSettingsProps) {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowColumnSettings(!showColumnSettings)}
        className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Columns
      </button>

      {showColumnSettings && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
              Show/Hide Columns
            </div>
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
                <span>
                  {column.label || column.field}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
