// File: app/dashboard/orders/components/OrdersToolbar.tsx
'use client'

import { ArrowDownTrayIcon, PrinterIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { ColumnConfig } from '../utils/orderTypes'
import ScreenOptions from '../../shared/components/ScreenOptions'
import { convertTailwindToHex } from '../../shared/utils/colorUtils'

interface OrdersToolbarProps {
  selectedOrdersCount: number
  onPrintPackingSlips: () => void
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
}

export default function OrdersToolbar({
  selectedOrdersCount,
  onPrintPackingSlips,
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
  fulfillmentStatusOptions = []
}: OrdersToolbarProps) {

  // ✅ ADD THIS DEBUG LOG
  console.log('🔍 OrdersToolbar Debug:', {
    isSpecificWarehouse,
    selectedOrdersCount,
    fulfillmentStatusOptions,
    showItemsToShip,
    hasPickingListHandler: !!onShowPickingList
  })

  const getStatusColors = (statusCode: string) => {
    const status = fulfillmentStatusOptions?.find(s => s.value === statusCode)
    return convertTailwindToHex(status?.color || '#6366f1')
  }

  // Get colors for Packing and Picking
  const packingColors = getStatusColors('PACKING')
  const pickingColors = getStatusColors('PICKING')

  const getButtonStyle = (color: string) => ({
    backgroundColor: color,
    '&:hover': { opacity: 0.9 }
  })

  // Convert ColumnConfig to format expected by ScreenOptions
  const screenOptionsColumns = columns.map(col => ({
    id: col.id,
    label: col.label || col.field,
    visible: col.visible
  })).filter(col => col.id !== 'select' && col.id !== 'actions')

  return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ScreenOptions
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={onItemsPerPageChange}
            maxPickingOrders={maxPickingOrders}
            onMaxPickingOrdersChange={onMaxPickingOrdersChange}
            columns={screenOptionsColumns}
            onColumnVisibilityChange={onColumnVisibilityChange}
            onResetLayout={onResetLayout}
          />
        </div>

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

            {isSpecificWarehouse && (selectedOrdersCount > 0 || showItemsToShip) && onShowPickingList && (
              <button
                onClick={onShowPickingList}
                className="inline-flex items-center gap-x-2 rounded-md px-3 py-2 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: pickingColors.bg, color: pickingColors.text }}
              >
                <ListBulletIcon className="h-4 w-4" />
                {selectedOrdersCount > 0 ? (
                  <>Picking List ({selectedOrdersCount} orders)</>
                ) : (
                  <>Picking List ({itemsToShipCount || 0} items)</>
                )}
              </button>
            )}

            <button
              onClick={onExport}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export Orders
            </button>
          </div>
        </div>
      </div>
    )
  }
