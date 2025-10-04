// File: app/dashboard/orders/components/OrdersTable.tsx

'use client'

import React from 'react'
import {
  EyeIcon,
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import ReactCountryFlag from "react-country-flag"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Order, ColumnConfig, SortState } from '../utils/orderTypes'
import {
  STATUS_COLORS,
  FULFILLMENT_COLORS
} from '../constants/orderConstants'
import EditableStatusCell from './EditableStatusCell'
import { ORDER_STATUS_OPTIONS, FULFILLMENT_STATUS_OPTIONS } from '../constants/statusOptions'
import { convertTailwindToHex } from '../../shared/utils/colorUtils'

// Date extraction utility functions
const extractDateParts = (dateString: string) => {
  const date = new Date(dateString)

  return {
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    day: date.toLocaleDateString('en-US', {
      weekday: 'long'
    }),
    month: date.toLocaleDateString('en-US', {
      month: 'long'
    }),
    year: date.getFullYear().toString()
  }
}

interface OrdersTableProps {
  orders: Order[]
  columns: ColumnConfig[]
  sortConfig: SortState
  selectedOrders: Set<string>
  onSort: (field: string) => void
  onSelectOrder: (orderId: string) => void
  onSelectAll: () => void
  onViewOrder: (order: Order) => void
  onPrintPackingSlip: (order: Order) => void
  onPrintPickingList?: (order: Order) => void
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void
  onColumnReorder?: (columns: ColumnConfig[]) => void
  onUpdateStatus?: (orderId: string, newStatus: string) => Promise<void>
  onUpdateFulfillmentStatus?: (orderId: string, newStatus: string) => Promise<void>
  fulfillmentStatusOptions?: Array<{ value: string; label: string; color: string }>  // ADD THIS
}

// Sortable header component for drag-and-drop column reordering
function SortableHeader({ column, children }: { column: ColumnConfig; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Don't make select and actions columns draggable
  const isDraggable = column.id !== 'select' && column.id !== 'actions'

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 relative"
      {...attributes}
    >
      <div className="flex items-center justify-between">
        {children}
        {isDraggable && (
          <div
            {...listeners}
            className="cursor-grab hover:cursor-grabbing flex items-center ml-2"
          >
            <Bars3Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </th>
  )
}

export default function OrdersTable({
  orders,
  columns,
  sortConfig,
  selectedOrders,
  onSort,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
  onPrintPackingSlip,
  onPrintPickingList,
  onColumnVisibilityChange,
  onColumnReorder,
  onUpdateStatus,
  onUpdateFulfillmentStatus,
  fulfillmentStatusOptions
}: OrdersTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && onColumnReorder) {
      const oldIndex = columns.findIndex(item => item.id === active.id)
      const newIndex = columns.findIndex(item => item.id === over.id)

      const newColumns = arrayMove(columns, oldIndex, newIndex)
      onColumnReorder(newColumns)
    }
  }

  const getStatusColors = (statusCode: string) => {
    const status = fulfillmentStatusOptions?.find(s => s.value === statusCode)
    return convertTailwindToHex(status?.color || '#6366f1')
  }

  // Filter visible columns
  const visibleColumns = columns.filter(column => column.visible)

  // Check if all orders are selected
  const allSelected = orders.length > 0 && orders.every(order => selectedOrders.has(order.id))
  const someSelected = orders.some(order => selectedOrders.has(order.id))

  const renderSortableHeader = (column: ColumnConfig) => {
    const isActive = sortConfig.field === column.field
    const isAsc = isActive && sortConfig.direction === 'asc'

    const handleSortClick = () => {
      if (column.sortable) {
        onSort(column.field)
      }
    }

    return (
      <SortableHeader key={column.id} column={column}>
        <div
          className={`flex items-center space-x-1 ${
            column.sortable ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5' : ''
          }`}
          onClick={handleSortClick}
        >
          <span className="select-none">
            {column.label}
          </span>
          {column.sortable && (
            <div className="flex flex-col flex-shrink-0">
              <ChevronUpIcon
                className={`h-3 w-3 ${isActive && isAsc ? 'text-indigo-600' : 'text-gray-300'}`}
              />
              <ChevronDownIcon
                className={`h-3 w-3 -mt-1 ${isActive && !isAsc ? 'text-indigo-600' : 'text-gray-300'}`}
              />
            </div>
          )}
        </div>
      </SortableHeader>
    )
  }

  const renderCellContent = (column: ColumnConfig, order: Order) => {
    switch (column.field) {
      case 'select':
        return (
          <input
            type="checkbox"
            checked={selectedOrders.has(order.id)}
            onChange={() => onSelectOrder(order.id)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        )

      case 'orderNumber':
        return (
          <button
            onClick={() => onViewOrder(order)}
            className="text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer text-left"
          >
            {order.orderNumber}
          </button>
        )

      case 'orderDate':
        return (
          <div className="text-sm text-gray-900">
            {new Date(order.orderDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        )

      // Date-specific columns using extraction function
      case 'orderTime':
        const timeData = extractDateParts(order.orderDate)
        return (
          <div className="text-sm text-gray-900">
            {timeData.time}
          </div>
        )

      case 'orderDay':
        const dayData = extractDateParts(order.orderDate)
        return (
          <div className="text-sm text-gray-900">
            {dayData.day}
          </div>
        )

      case 'orderMonth':
        const monthData = extractDateParts(order.orderDate)
        return (
          <div className="text-sm text-gray-900">
            {monthData.month}
          </div>
        )

      case 'orderYear':
        const yearData = extractDateParts(order.orderDate)
        return (
          <div className="text-sm text-gray-900">
            {yearData.year}
          </div>
        )

      case 'customerName':
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {order.customerName}
            </div>
            <div className="text-sm text-gray-500">
              {order.customerEmail}
            </div>
          </div>
        )

      case 'itemCount':
        return (
          <button
            onClick={() => onViewOrder(order)}
            className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline cursor-pointer"
          >
            {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
          </button>
        )

        case 'status':
          // Use EditableStatusCell if update function provided
          if (onUpdateStatus) {
            return (
              <EditableStatusCell
                orderId={order.id}
                currentValue={order.status}
                options={ORDER_STATUS_OPTIONS}
                onUpdate={onUpdateStatus}
                type="status"
              />
            )
          }
          // Fallback to static badge
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
              {order.status}
            </span>
          )

          case 'fulfillmentStatus':
            // Use EditableStatusCell if update function provided
            if (onUpdateFulfillmentStatus) {
              return (
                <EditableStatusCell
                  orderId={order.id}
                  currentValue={order.fulfillmentStatus}
                  options={fulfillmentStatusOptions || FULFILLMENT_STATUS_OPTIONS}
                  onUpdate={onUpdateFulfillmentStatus}
                  type="fulfillmentStatus"
                />
              )
            }
            // Fallback to static badge
            return (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FULFILLMENT_COLORS[order.fulfillmentStatus as keyof typeof FULFILLMENT_COLORS]}`}>
                {order.fulfillmentStatus.replace('_', ' ')}
              </span>
            )

      case 'totalAmount':
        return (
          <div className="text-sm font-medium text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: order.currency || 'USD'
            }).format(order.totalAmount || 0)}
          </div>
        )

      case 'platform':
        return (
          <div className="text-sm text-gray-900">
            {order.platform}
          </div>
        )

      case 'requestedShipping':
        return (
          <div className="text-sm text-gray-900">
            {order.requestedShipping}
          </div>
        )

      // Country-related columns
      case 'country':
        // Show only the flag
        return (
          <div className="flex justify-center">
            <ReactCountryFlag
              countryCode={order.countryCode}
              svg
              style={{ width: '24px', height: '18px' }}
            />
          </div>
        )

      case 'countryName':
        // Show country name
        return (
          <div className="text-sm text-gray-900">
            {order.country}
          </div>
        )

      case 'countryCode':
        // Show country code
        return (
          <div className="text-sm text-gray-700 font-mono">
            {order.countryCode}
          </div>
        )

      // Shipping name columns
      case 'shippingFirstName':
        return (
          <div className="text-sm text-gray-900">
            {order.shippingFirstName}
          </div>
        )

      case 'shippingLastName':
        return (
          <div className="text-sm text-gray-900">
            {order.shippingLastName}
          </div>
        )

      case 'shippingFullName':  // FIXED: Changed from 'shippingName' to 'shippingFullName'
        // Show full name (first + last)
        return (
          <div className="text-sm text-gray-900">
            {`${order.shippingFirstName || ''} ${order.shippingLastName || ''}`.trim() || '-'}
          </div>
        )

      case 'shippingAddress':
        return (
          <div className="text-sm text-gray-900">
            <div>{order.shippingFirstName} {order.shippingLastName}</div>
            <div className="text-xs text-gray-500">{order.country}</div>
          </div>
        )

      case 'warehouseName':
        return (
          <div className="text-sm text-gray-900">
            {order.warehouseName}
          </div>
        )

      case 'currency':
        return (
          <div className="text-sm text-gray-700 font-mono">
            {order.currency}
          </div>
        )

        case 'actions':
          const packingColors = getStatusColors('PACKING')
          const pickingColors = getStatusColors('PICKING')

          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewOrder(order)}
                className="hover:opacity-75 transition-opacity"
                style={{ color: '#6366f1' }}
                title="View Order"
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onPrintPackingSlip(order)}
                className="hover:opacity-75 transition-opacity"
                style={{ color: packingColors.text }}
                title="Print Packing Slip"
              >
                <DocumentTextIcon className="h-4 w-4" />
              </button>
              {onPrintPickingList && (
                <button
                  onClick={() => onPrintPickingList(order)}
                  className="hover:opacity-75 transition-opacity"
                  style={{ color: pickingColors.text }}
                  title="Print Picking List"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )

      default:
        // Fallback for any other fields
        const value = order[column.field as keyof Order]
        return (
          <div className="text-sm text-gray-900">
            {value?.toString() || ''}
          </div>
        )
    }
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableContext
                      items={visibleColumns.map(col => col.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {visibleColumns.map((column) => {
                        if (column.field === 'select') {
                          return (
                            <th key={column.id} className="relative w-12 px-6 sm:w-16 sm:px-8">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(input) => {
                                  if (input) input.indeterminate = someSelected && !allSelected
                                }}
                                onChange={onSelectAll}
                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 sm:left-6"
                              />
                            </th>
                          )
                        }
                        return renderSortableHeader(column)
                      })}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.map((order, orderIdx) => (
                    <tr
                      key={order.id}
                      className={selectedOrders.has(order.id) ? 'bg-gray-50' : undefined}
                    >
                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className={`whitespace-nowrap px-6 py-4 text-sm ${
                            column.field === 'select' ? 'relative w-12 sm:w-16' : ''
                          }`}
                        >
                          {renderCellContent(column, order)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  )
}
