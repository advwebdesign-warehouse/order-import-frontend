'use client'

import { useState } from 'react'
import OrderDetailsModal from './OrderDetailsModal'
import PackingSlip from './PackingSlip'
import OrdersToolbar from './components/OrdersToolbar'
import OrdersFilters from './components/OrdersFilters'
import OrdersTable from './components/OrdersTable'
import OrdersPagination from './components/OrdersPagination'

// Custom hooks
import { useOrders } from './hooks/useOrders'
import { useOrderFilters } from './hooks/useOrderFilters'
import { useOrderSelection } from './hooks/useOrderSelection'
import { useOrderColumns } from './hooks/useOrderColumns'

// Shared components
import ColumnSettings, { ColumnConfig } from '../shared/components/ColumnSettings'

// Utils
import { transformToDetailedOrder } from './utils/orderUtils'
import { exportToCSV } from '../shared/utils/csvExporter'
import { printMultiplePackingSlips } from './utils/packingSlipGenerator'

// Types
import { Order, OrderWithDetails } from './utils/orderTypes'
import { ITEMS_PER_PAGE } from './constants/orderConstants'

// Helper function to export orders as CSV
const exportOrdersToCSV = (orders: Order[], columns: ColumnConfig[]) => {
  // Convert ColumnConfig to ExportColumn format expected by your CSV exporter
  const exportColumns = columns.map(column => ({
    ...column,
    formatter: (value: any, order: Order) => {
      switch (column.field) {
        case 'orderNumber':
          return order.orderNumber || ''
        case 'customerName':
          return order.customerName || ''
        case 'customerEmail':
          return order.customerEmail || ''
        case 'status':
          return order.status || ''
        case 'fulfillmentStatus':
          return (order.fulfillmentStatus || '').replace('_', ' ')
        case 'totalAmount':
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: order.currency || 'USD'
          }).format(order.totalAmount || 0)
        case 'currency':
          return order.currency || ''
        case 'itemCount':
          return (order.itemCount || 0).toString()
        case 'platform':
          return order.platform || ''
        case 'country':
          return order.country || ''
        case 'countryCode':
          return order.countryCode || ''
        case 'orderDate':
          return order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : ''
        case 'shippingFirstName':
          return order.shippingFirstName || ''
        case 'shippingLastName':
          return order.shippingLastName || ''
        case 'shippingFullName':
          return `${order.shippingFirstName || ''} ${order.shippingLastName || ''}`.trim()
        case 'requestedShipping':
          return order.requestedShipping || ''
        case 'orderTime':
          return order.orderDate ? new Date(order.orderDate).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : ''
        case 'orderDay':
          return order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', {
            weekday: 'long'
          }) : ''
        case 'orderMonth':
          return order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', {
            month: 'long'
          }) : ''
        case 'orderYear':
          return order.orderDate ? new Date(order.orderDate).getFullYear().toString() : ''
        default:
          return value?.toString() || ''
      }
    }
  }))

  // Generate filename with current date
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD format
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS format
  const filename = `orders-export-${dateStr}-${timeStr}.csv`

  // Use your existing CSV exporter
  exportToCSV(orders, exportColumns, filename)
}

export default function OrdersPage() {
  // Modal states
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showPackingSlip, setShowPackingSlip] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Custom hooks for state management
  const { orders, loading } = useOrders()
  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredOrders
  } = useOrderFilters(orders)

  const {
    selectedOrders,
    handleSelectOrder,
    handleSelectAll,
    clearSelection
  } = useOrderSelection()

  const {
    columns,
    sortConfig,
    sortedOrders,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  } = useOrderColumns(filteredOrders)

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentOrders = sortedOrders.slice(startIndex, endIndex)

  // Event handlers
  const handleViewOrderDetails = (order: Order) => {
    const orderWithDetails = transformToDetailedOrder(order)
    setSelectedOrder(orderWithDetails)
    setShowOrderDetails(true)
  }

  const handlePrintPackingSlips = () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order to print packing slips.')
      return
    }

    const selectedOrderIds = Array.from(selectedOrders)
    const selectedOrdersList = orders.filter(order => selectedOrderIds.includes(order.id))

    if (selectedOrders.size === 1) {
      // Single order - show modal
      const orderWithDetails = transformToDetailedOrder(selectedOrdersList[0])
      setSelectedOrder(orderWithDetails)
      setShowPackingSlip(true)
    } else {
      // Multiple orders - batch print
      printMultiplePackingSlips(selectedOrdersList.map(transformToDetailedOrder))
    }
  }

  const handlePrintSinglePackingSlip = (order: Order) => {
    const orderWithDetails = transformToDetailedOrder(order)
    setSelectedOrder(orderWithDetails)
    setShowPackingSlip(true)
  }

  const handleExport = () => {
    exportOrdersToCSV(sortedOrders, columns.filter(col => col.visible))
  }

  const handleResetLayout = () => {
    resetToDefaults()
    setCurrentPage(1)
    clearSelection()
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setFilters({
      status: '',
      fulfillmentStatus: '',
      platform: '',
      dateRange: '',
      startDate: '',
      endDate: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <OrdersToolbar
        selectedOrdersCount={selectedOrders.size}
        onPrintPackingSlips={handlePrintPackingSlips}
        onExport={handleExport}
        onResetLayout={handleResetLayout}
        columns={columns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      <OrdersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAllFilters={handleClearAllFilters}
      />

      <OrdersTable
        orders={currentOrders}
        columns={columns}
        sortConfig={sortConfig}
        selectedOrders={selectedOrders}
        onSort={handleSort}
        onSelectOrder={handleSelectOrder}
        onSelectAll={() => handleSelectAll(currentOrders)}
        onViewOrder={handleViewOrderDetails}
        onPrintPackingSlip={handlePrintSinglePackingSlip}
        onColumnReorder={handleColumnReorder}
      />

      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedOrders.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Modals */}
      {selectedOrder && (
        <>
          <OrderDetailsModal
            isOpen={showOrderDetails}
            onClose={() => setShowOrderDetails(false)}
            order={selectedOrder}
          />

          <PackingSlip
            isOpen={showPackingSlip}
            onClose={() => setShowPackingSlip(false)}
            order={selectedOrder}
          />
        </>
      )}
    </div>
  )
}
