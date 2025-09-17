'use client'

import { ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { ColumnConfig } from '../utils/orderTypes'
import ColumnSettings from '../../shared/components/ColumnSettings'

interface OrdersToolbarProps {
  selectedOrdersCount: number
  onPrintPackingSlips: () => void
  onExport: () => void
  onResetLayout: () => void
  columns: ColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
}

export default function OrdersToolbar({
  selectedOrdersCount,
  onPrintPackingSlips,
  onExport,
  onResetLayout,
  columns,
  onColumnVisibilityChange
}: OrdersToolbarProps) {
  return (
    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">Orders Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage and track all your orders from various platforms.
        </p>
      </div>

      <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
        {selectedOrdersCount > 0 && (
          <button
            onClick={onPrintPackingSlips}
            className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <PrinterIcon className="h-4 w-4" />
            Print Packing Slips ({selectedOrdersCount})
          </button>
        )}

        <ColumnSettings
          columns={columns}
          onColumnVisibilityChange={onColumnVisibilityChange}
        />

        <button
          onClick={onResetLayout}
          className="inline-flex items-center gap-x-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          title="Reset column order, sorting, and filters to defaults"
        >
          Reset Layout
        </button>

        <button
          onClick={onExport}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Orders
        </button>
      </div>
    </div>
  )
}
