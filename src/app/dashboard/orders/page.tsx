// File: app/dashboard/orders/page.tsx

'use client'

import { useState, useEffect } from 'react'
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
import { usePagination } from '../shared/hooks/usePagination'

// Utils
import { transformToDetailedOrder } from './utils/orderUtils'
import { exportToCSV, ExportableItem } from '../shared/utils/csvExporter'
import { printMultiplePackingSlips } from './utils/packingSlipGenerator'

// Types
import { Order, OrderWithDetails } from './utils/orderTypes'
import { ITEMS_PER_PAGE } from './constants/orderConstants'

//Settings
import { useSettings } from '../shared/hooks/useSettings'

// Helper function to export orders as CSV
const exportOrdersToCSV = (orders: Order[], columns: ColumnConfig[]) => {
  // Convert ColumnConfig to ExportColumn format expected by your CSV exporter
  const exportColumns = columns.map(column => ({
    ...column,
    formatter: (value: any, item: ExportableItem): string => {
      // Cast item to Order type since we know it's an order
      const order = item as Order

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
          return order.orderDate ? new Date(order.orderDate).toLocaleString() : ''
        case 'orderTime':
          return order.orderDate ?
            new Date(order.orderDate).toLocaleTimeString('en-US', {
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
  const [maxPickingOrders, setMaxPickingOrders] = useState<string>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maxPickingOrders_main')
      return saved || 'all'
    }
    return 'all'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('maxPickingOrders_main', maxPickingOrders)
    }
  }, [maxPickingOrders])

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
  const { ordersPerPage, setOrdersPerPage } = usePagination()
  const totalPages = Math.ceil(sortedOrders.length / (ordersPerPage || 20))
  const startIndex = (currentPage - 1) * (ordersPerPage || 20)
  const endIndex = startIndex + (ordersPerPage || 20)
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
      status: [],  // Updated to empty arrays
      fulfillmentStatus: [],  // Updated to empty arrays
      platform: [],  // Updated to empty arrays
      dateRange: '',
      startDate: '',
      endDate: '',
      warehouseId: ''
    })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setOrdersPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const handleMaxPickingOrdersChange = (value: string) => {
    setMaxPickingOrders(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
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
        onColumnReorder={handleColumnReorder}
        itemsPerPage={ordersPerPage || 20}
        onItemsPerPageChange={handleItemsPerPageChange}
        maxPickingOrders={maxPickingOrders}
        onMaxPickingOrdersChange={handleMaxPickingOrdersChange}
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
        itemsPerPage={ordersPerPage || 20}
        onPageChange={setCurrentPage}
      />

      {/* Column Management - Separate from Screen Options for reordering */}
      <div className="mt-4 flex justify-end">
        <ColumnSettings
          columns={columns}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnReorder={handleColumnReorder}
          buttonText="Manage Columns"
        />
      </div>

      {/* Modals */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => {
            setShowOrderDetails(false)
            setSelectedOrder(null)
          }}
        />
      )}

      {showPackingSlip && selectedOrder && (
        <PackingSlip
          order={selectedOrder}
          isOpen={showPackingSlip}
          onClose={() => {
            setShowPackingSlip(false)
            setSelectedOrder(null)
          }}
        />
      )}
    </div>
  )
}
