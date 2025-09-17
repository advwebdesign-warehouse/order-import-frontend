'use client'

import React from 'react'
import { EyeIcon, PrinterIcon, ChevronUpIcon, ChevronDownIcon, Bars3Icon } from '@heroicons/react/24/outline'
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
import { STATUS_COLORS, FULFILLMENT_COLORS } from '../constants/orderConstants'
import { formatCurrency, formatDate } from '../utils/orderUtils'

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
  onColumnReorder: (columns: ColumnConfig[]) => void
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
  onColumnReorder
}: OrdersTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(item => item.id === active.id)
      const newIndex = columns.findIndex(item => item.id === over.id)
      const newOrder = arrayMove(columns, oldIndex, newIndex)
      onColumnReorder(newOrder)
    }
  }

  const SortableHeader = ({ column }: { column: ColumnConfig }) => {
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
    }

    if (!column.visible) return null

    const isActive = sortConfig.field === column.field
    const isAsc = isActive && sortConfig.direction === 'asc'

    const handleSortClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (column.sortable) {
        onSort(column.field)
      }
    }

    // Special handling for select column
    if (column.field === 'select') {
      return (
        <th
          ref={setNodeRef}
          style={style}
          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide select-none ${
            isDragging ? 'opacity-50' : ''
          }`}
          {...attributes}
        >
          <div className="flex items-center space-x-1">
            {/* Drag handle */}
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-200 flex-shrink-0"
              title="Drag to reorder"
            >
              <Bars3Icon className="h-3 w-3 text-gray-400" />
            </div>

            {/* Select all checkbox */}
            <input
              type="checkbox"
              checked={orders.length > 0 && selectedOrders.size === orders.length}
              onChange={onSelectAll}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              title="Select all orders on this page"
            />
          </div>
        </th>
      )
    }

    return (
      <th
        ref={setNodeRef}
        style={style}
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide select-none ${
          isDragging ? 'opacity-50' : ''
        }`}
        {...attributes}
      >
        <div className="flex items-center space-x-1">
          {/* Drag handle - separate from sort area */}
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-200 flex-shrink-0"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-3 w-3 text-gray-400" />
          </div>

          {/* Sort area - separate click handler */}
          <div
            className={`flex items-center space-x-1 flex-1 ${column.sortable ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5' : ''}`}
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
        </div>
      </th>
    )
  }

  const CountryFlag = ({ countryCode }: { countryCode: string }) => (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: '24px',
        height: '16px',
      }}
      title={countryCode}
    />
  )

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
      case 'status':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
            {order.status}
          </span>
        )
      case 'fulfillmentStatus':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FULFILLMENT_COLORS[order.fulfillmentStatus as keyof typeof FULFILLMENT_COLORS]}`}>
            {order.fulfillmentStatus.replace('_', ' ')}
          </span>
        )
      case 'totalAmount':
        return (
          <div className="text-sm font-medium text-gray-900">
            {formatCurrency(order.totalAmount, order.currency)}
          </div>
        )
      case 'currency':
        return (
          <div className="text-sm text-gray-700 font-mono">
            {order.currency}
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
      case 'platform':
        return (
          <div className="text-sm text-gray-900">{order.platform}</div>
        )
      case 'country':
        return (
          <div className="flex items-center justify-center">
            <CountryFlag countryCode={order.countryCode} />
            <span className="sr-only">{order.country}</span>
          </div>
        )
      case 'countryName':
        return (
          <div className="text-sm text-gray-700">
            {order.country}
          </div>
        )
      case 'countryCode':
        return (
          <div className="text-sm text-gray-700 font-mono">
            {order.countryCode}
          </div>
        )
      case 'orderDate':
        return (
          <div className="text-sm text-gray-900">
            {formatDate(order.orderDate)}
          </div>
        )
      case 'shippingFirstName':
        return (
          <div className="text-sm text-gray-700">
            {order.shippingFirstName}
          </div>
        )
      case 'shippingLastName':
        return (
          <div className="text-sm text-gray-700">
            {order.shippingLastName}
          </div>
        )
      case 'shippingFullName':
        return (
          <div className="text-sm text-gray-700">
            {`${order.shippingFirstName} ${order.shippingLastName}`}
          </div>
        )
      case 'requestedShipping':
        return (
          <div className="text-sm text-gray-700">
            {order.requestedShipping}
          </div>
        )
      case 'orderTime':
        return (
          <div className="text-sm text-gray-700">
            {new Date(order.orderDate).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </div>
        )
      case 'orderDay':
        return (
          <div className="text-sm text-gray-700">
            {new Date(order.orderDate).toLocaleDateString('en-US', {
              weekday: 'long'
            })}
          </div>
        )
      case 'orderMonth':
        return (
          <div className="text-sm text-gray-700">
            {new Date(order.orderDate).toLocaleDateString('en-US', {
              month: 'long'
            })}
          </div>
        )
      case 'orderYear':
        return (
          <div className="text-sm text-gray-700">
            {new Date(order.orderDate).getFullYear()}
          </div>
        )
      case 'actions':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewOrder(order)}
              className="text-indigo-600 hover:text-indigo-900"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPrintPackingSlip(order)}
              className="text-green-600 hover:text-green-900"
              title="Print Packing Slip"
            >
              <PrinterIcon className="h-4 w-4" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
                      {columns.filter(col => col.visible).map((column) => (
                        <SortableHeader key={column.id} column={column} />
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      {columns.filter(col => col.visible).map((column) => (
                        <td key={`${order.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
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
