// File: app/dashboard/warehouses/[id]/orders/page.tsx

'use client'

import { useState, useMemo, useEffect  } from 'react'
import { useParams } from 'next/navigation'
import { useWarehouses } from '../../context/WarehouseContext'
import OrderDetailsModal from '../../../orders/OrderDetailsModal'
import PackingSlip from '../../../orders/PackingSlip'
import PickingListModal from '../../../orders/components/PickingListModal'
import OrdersToolbar from '../../../orders/components/OrdersToolbar'
import OrdersFilters from '../../../orders/components/OrdersFilters'
import OrdersTable from '../../../orders/components/OrdersTable'
import OrdersPagination from '../../../orders/components/OrdersPagination'

// Custom hooks
import { useWarehouseOrders } from './hooks/useWarehouseOrders'
import { useOrderFilters } from '../../../orders/hooks/useOrderFilters'
import { useOrderSelection } from '../../../orders/hooks/useOrderSelection'
import { useOrderColumns } from '../../../orders/hooks/useOrderColumns'

// Shared hooks
import { usePagination } from '../../../shared/hooks/usePagination'

// Utils
import { transformToDetailedOrder } from '../../../orders/utils/orderUtils'
import { exportToCSV, ExportableItem } from '../../../shared/utils/csvExporter'
import { printMultiplePackingSlips } from '../../../orders/utils/packingSlipGenerator'

// Types
import { Order, OrderWithDetails, ColumnConfig } from '../../../orders/utils/orderTypes'
import { ITEMS_PER_PAGE } from '../../../orders/constants/orderConstants'

// Settings
import { useSettings } from '../../../shared/hooks/useSettings'

// Helper function to export orders as CSV
const exportOrdersToCSV = (orders: Order[], columns: ColumnConfig[]) => {
  const exportColumns = columns.map(column => ({
    ...column,
    formatter: (value: any, item: ExportableItem): string => {
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
        case 'requestedShipping':
          return order.requestedShipping || ''
        case 'country':
          return order.country || ''
        case 'countryCode':
          return order.countryCode || ''
        case 'orderDate':
          return order.orderDate ? new Date(order.orderDate).toLocaleString() : ''
        default:
          return value?.toString() || ''
      }
    }
  }))

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
  const filename = `warehouse-orders-export-${dateStr}-${timeStr}.csv`

  exportToCSV(orders, exportColumns, filename)
}

export default function WarehouseOrdersPage() {
  const params = useParams()
  const warehouseId = params.id as string
  const { warehouses } = useWarehouses()
  const warehouse = warehouses.find(w => w.id === warehouseId)

  // Modal states
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showPackingSlip, setShowPackingSlip] = useState(false)
  const [showPickingList, setShowPickingList] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Checkbox states
  const [showOrdersToShip, setShowOrdersToShip] = useState(false)
  const [showItemsToShip, setShowItemsToShip] = useState(false)

  // Max picking orders setting
  const [maxPickingOrders, setMaxPickingOrders] = useState<string>(() => {
    // Load from localStorage on initialization, using warehouseId for unique keys
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`maxPickingOrders_${warehouseId}`)
      return saved || 'all'
    }
    return 'all'
  })

  // Persistent picking state - keyed by warehouse
  const getPickingStateKey = (type: 'items' | 'orders') => {
    return `picking_${type}_warehouse_${warehouseId}`
  }

  const [pickedItems, setPickedItems] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getPickingStateKey('items'))
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })

  const [pickedOrders, setPickedOrders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getPickingStateKey('orders'))
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })

  // Save picking state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getPickingStateKey('items'), JSON.stringify(Array.from(pickedItems)))
    }
  }, [pickedItems, warehouseId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getPickingStateKey('orders'), JSON.stringify(Array.from(pickedOrders)))
    }
  }, [pickedOrders, warehouseId])

  useEffect(() => {
    if (typeof window !== 'undefined' && warehouseId) {
      localStorage.setItem(`maxPickingOrders_${warehouseId}`, maxPickingOrders)
    }
  }, [maxPickingOrders, warehouseId])

  // Custom hooks for state management
  const { orders, loading } = useWarehouseOrders(warehouseId)
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

  // Calculate orders to ship (only PROCESSING orders)
  const ordersToShip = useMemo(() => {
    return filteredOrders.filter(order =>
      order.status === 'PROCESSING' || order.fulfillmentStatus === 'PROCESSING'
    )
  }, [filteredOrders])

  // Calculate total items to ship from processing orders only
  const itemsToShip = useMemo(() => {
    return ordersToShip.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [ordersToShip])

  // Calculate selected orders for picking list
  const selectedOrdersForPicking = useMemo(() => {
    const selectedOrderIds = Array.from(selectedOrders)
    return orders.filter(order => selectedOrderIds.includes(order.id))
  }, [selectedOrders, orders])

  // Calculate items in selected orders for picking
  const itemsInSelectedOrders = useMemo(() => {
    return selectedOrdersForPicking.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [selectedOrdersForPicking])

  // Calculate LIMITED orders for picking list (apply max limit here for "all orders to ship" scenario)
  const limitedOrdersForPicking = useMemo(() => {
    // Parse max picking orders - handle both "5", "10", "20", "all" and "custom:X" formats
    let limit = null
    if (maxPickingOrders && maxPickingOrders !== 'all') {
      if (maxPickingOrders.startsWith('custom:')) {
        limit = parseInt(maxPickingOrders.replace('custom:', ''))
      } else {
        limit = parseInt(maxPickingOrders)
      }
    }

    // Apply limit if we have a valid number
    if (limit && !isNaN(limit)) {
      return ordersToShip.slice(0, limit)
    }

    return ordersToShip
  }, [ordersToShip, maxPickingOrders])

  // Calculate items in limited orders for picking
  const itemsInLimitedOrders = useMemo(() => {
    return limitedOrdersForPicking.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [limitedOrdersForPicking])

  // Determine which orders to show in table based on checkbox state
  const ordersToDisplay = showOrdersToShip ? ordersToShip : filteredOrders

  const {
    columns,
    sortConfig,
    sortedOrders,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  } = useOrderColumns(ordersToDisplay, true)

  // Pagination
  const { ordersPerPage, setOrdersPerPage, isLoading: paginationLoading } = usePagination()
  const totalPages = Math.ceil(sortedOrders.length / (ordersPerPage || 20))
  const startIndex = (currentPage - 1) * (ordersPerPage || 20)
  const endIndex = startIndex + (ordersPerPage || 20)
  const currentOrders = sortedOrders.slice(startIndex, endIndex)

  // Picking state handlers
  const handleItemPicked = (sku: string) => {
    setPickedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sku)) {
        newSet.delete(sku)
      } else {
        newSet.add(sku)
      }
      return newSet
    })
  }

  const handleOrderPicked = (orderId: string) => {
    setPickedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

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

    const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id))
    const selectedOrdersWithDetails = selectedOrdersList.map(transformToDetailedOrder)
    printMultiplePackingSlips(selectedOrdersWithDetails)
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

  const handleItemsPerPageChange = (newValue: number) => {
    setOrdersPerPage(newValue)
    setCurrentPage(1)
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setCurrentPage(1)

    // Use the correct FilterState structure
    setFilters({
      status: [],
      fulfillmentStatus: [],
      platform: [],
      dateRange: '',
      startDate: '',
      endDate: '',
      warehouseId: warehouseId || ''
    })
  }

  // Checkbox handlers
  const handleOrdersToShipChange = (checked: boolean) => {
    setShowOrdersToShip(checked)

    if (checked) {
      // Only select orders that aren't already selected
      const orderIdsToShip = ordersToShip.map(order => order.id)

      orderIdsToShip.forEach(orderId => {
        if (!selectedOrders.has(orderId)) {
          handleSelectOrder(orderId)
        }
      })
    } else {
      // When unchecked, only deselect orders that are in the "orders to ship" list
      const orderIdsToShip = new Set(ordersToShip.map(order => order.id))

      Array.from(selectedOrders).forEach(orderId => {
        if (orderIdsToShip.has(orderId)) {
          handleSelectOrder(orderId)
        }
      })
    }
    setCurrentPage(1) // Reset to first page when toggling
  }

  const handleItemsToShipChange = (checked: boolean) => {
    setShowItemsToShip(checked)
  }

  const handleShowPickingList = () => {
    setShowPickingList(true)
  }

  // Clear picking state for current warehouse (useful for testing or reset)
  const handleClearPickingState = () => {
    setPickedItems(new Set())
    setPickedOrders(new Set())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getPickingStateKey('items'))
      localStorage.removeItem(getPickingStateKey('orders'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Warehouse not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The warehouse you're looking for doesn't exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            {warehouse.name} Orders
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage orders for {warehouse.name} warehouse.
          </p>
        </div>
      </div>

      {/* Orders Stats with Checkboxes */}
      <div className="mt-6">
        <div className="flex items-center space-x-6 min-h-[40px]">
          {/* Orders to ship with checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer h-10">
            <input
              type="checkbox"
              checked={showOrdersToShip}
              onChange={(e) => handleOrdersToShipChange(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              {ordersToShip.length} order{ordersToShip.length !== 1 ? 's' : ''} to ship
            </span>
          </label>

          {/* Items to ship with checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer h-10">
            <input
              type="checkbox"
              checked={showItemsToShip}
              onChange={(e) => handleItemsToShipChange(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              {itemsToShip} item{itemsToShip !== 1 ? 's' : ''} to ship
            </span>
          </label>

          {/* Debug: Clear picking state button (remove in production) */}
          {process.env.NODE_ENV === 'development' && (pickedItems.size > 0 || pickedOrders.size > 0) && (
            <button
              onClick={handleClearPickingState}
              className="text-xs text-gray-500 hover:text-red-600"
              title="Clear picking state (dev only)"
            >
              Clear Picking ({pickedItems.size} items, {pickedOrders.size} orders)
            </button>
          )}
        </div>
      </div>

      {/* Orders Management Interface */}
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
        onMaxPickingOrdersChange={setMaxPickingOrders}
        showItemsToShip={showItemsToShip}
        onShowPickingList={handleShowPickingList}
        itemsToShipCount={itemsToShip}
      />

      {/* Show Filters Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-4">
          <OrdersFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            filters={filters}
            onFiltersChange={setFilters}
            onClearAllFilters={handleClearAllFilters}
            hideWarehouseFilter={true}
          />
        </div>
      )}

      {/* Orders Table */}
      <div className="mt-6">
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
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnReorder={handleColumnReorder}
        />
      </div>

      {/* Pagination */}
      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedOrders.length}
        itemsPerPage={ordersPerPage || 20}
        onPageChange={setCurrentPage}
      />

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

      {/* Picking List Modal - Show selected orders if any, otherwise show limited orders to ship */}
      {showPickingList && (selectedOrdersForPicking.length > 0 || (showItemsToShip && limitedOrdersForPicking.length > 0)) && (
        <PickingListModal
          orders={selectedOrdersForPicking.length > 0 ? selectedOrdersForPicking : limitedOrdersForPicking}
          isOpen={showPickingList}
          onClose={() => setShowPickingList(false)}
          warehouseName={warehouse.name}
          maxOrdersLimit={selectedOrdersForPicking.length > 0 ? "all" : maxPickingOrders}
          totalOrdersCount={selectedOrdersForPicking.length > 0 ? selectedOrdersForPicking.length : ordersToShip.length}
          limitedOrdersCount={selectedOrdersForPicking.length > 0 ? selectedOrdersForPicking.length : limitedOrdersForPicking.length}
          itemsCount={selectedOrdersForPicking.length > 0 ? itemsInSelectedOrders : itemsInLimitedOrders}
          pickedItems={pickedItems}
          pickedOrders={pickedOrders}
          onItemPicked={handleItemPicked}
          onOrderPicked={handleOrderPicked}
        />
      )}
    </div>
  )
}
