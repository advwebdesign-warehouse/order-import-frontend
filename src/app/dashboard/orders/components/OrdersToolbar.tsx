// File: app/dashboard/orders/components/OrdersToolbar.tsx
'use client'

import { ArrowDownTrayIcon, PrinterIcon, ListBulletIcon, TruckIcon } from '@heroicons/react/24/outline'
import { ColumnConfig } from '../utils/orderTypes'
import ScreenOptions from '../../shared/components/ScreenOptions'
import { convertTailwindToHex } from '../../shared/utils/colorUtils'

interface OrdersToolbarProps {
  selectedOrdersCount: number
  onPrintPackingSlips: () => void
  onShipNow?: () => void  // ADD THIS
  onExport: () => void
  onResetLayout: () => void
  columns: ColumnConfig[]
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
  onColumnReorder: (newColumns: ColumnConfig[]) => void
  itemsPerPage: number
  onItemsPerPageChange: (value: number) => void
  maxPickingOrders?: string
  onMaxPickingOrdersChange?: (value: string) => void
  showItemsToShip?: boolean
  onShowPickingList?: () => void
  itemsToShipCount?: number
  isSpecificWarehouse?: boolean
  fulfillmentStatusOptions?: Array<{ value: string; label: string; color: string }>
  optionsOpen?: boolean
  onOptionsOpenChange?: (open: boolean) => void
}

export default function OrdersToolbar({
  selectedOrdersCount,
  onPrintPackingSlips,
  onShipNow,
  onExport,
  onResetLayout,
  columns,
  onColumnVisibilityChange,
  onColumnReorder,
  itemsPerPage,
  onItemsPerPageChange,
  maxPickingOrders,
  onMaxPickingOrdersChange,
  showItemsToShip,
  onShowPickingList,
  itemsToShipCount,
  isSpecificWarehouse = true,
  fulfillmentStatusOptions = [],
  optionsOpen,
  onOptionsOpenChange
}: OrdersToolbarProps) {

  const getStatusColors = (statusCode: string) => {
    const status = fulfillmentStatusOptions?.find(s => s.value === statusCode)
    return convertTailwindToHex(status?.color || '#6366f1')
  }

  // Get colors for buttons
  const packingColors = getStatusColors('PACKING')
  const pickingColors = getStatusColors('PICKING')
  const shippingColors = getStatusColors('READY_TO_SHIP')

  // Convert ColumnConfig to format expected by ScreenOptions
  const screenOptionsColumns = columns.map(col => ({
    id: col.id,
    label: col.label || col.field,
    visible: col.visible
  })).filter(col => col.id !== 'select' && col.id !== 'actions')

  return (
    <div className="space-y-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Orders Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all your orders from various platforms.
            {selectedOrdersCount > 0 && (
              <span className="ml-2 font-medium text-indigo-600">
                {selectedOrdersCount} order{selectedOrdersCount !== 1 ? 's' : ''} selected
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          {/* Picking List Button */}
          {isSpecificWarehouse && selectedOrdersCount > 0 && onShowPickingList && (
            <button
              onClick={onShowPickingList}
              className="inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: pickingColors.bg, color: pickingColors.text }}
            >
              <ListBulletIcon className="h-4 w-4" />
              Picking List ({selectedOrdersCount})
            </button>
          )}

          {/* Packing Slips Button */}
          {isSpecificWarehouse && selectedOrdersCount > 0 && (
            <button
              onClick={onPrintPackingSlips}
              className="inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: packingColors.bg, color: packingColors.text }}
            >
              <PrinterIcon className="h-4 w-4" />
              Packing Slips ({selectedOrdersCount})
            </button>
          )}

          {/* Ship Now Button */}
          {isSpecificWarehouse && selectedOrdersCount > 0 && onShipNow && (
            <button
              onClick={onShipNow}
              className="inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: shippingColors.bg, color: shippingColors.text }}
            >
              <TruckIcon className="h-4 w-4" />
              Ship Now ({selectedOrdersCount})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
