// file path: app/dashboard/orders/page.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import OrderDetailsModal from './OrderDetailsModal'
import PackingSlip from './PackingSlip'
import PackingSlipModal from './components/PackingSlipModal'
import PickingListModal from './components/PickingListModal'
import OrdersToolbar from './components/OrdersToolbar'
import OrdersFilters from './components/OrdersFilters'
import OrdersTable from './components/OrdersTable'
import OrdersPagination from './components/OrdersPagination'

// Custom hooks
import { useOrders } from './hooks/useOrders'
import { useOrderFilters } from './hooks/useOrderFilters'
import { useOrderSelection } from './hooks/useOrderSelection'
import { useOrderColumns } from './hooks/useOrderColumns'

// Warehouse support
import { useWarehouses } from '../warehouses/hooks/useWarehouses'

// Shared components
import WarehouseSelector from '../shared/components/WarehouseSelector'
import ColumnSettings, { ColumnConfig } from '../shared/components/ColumnSettings'
import { usePagination } from '../shared/hooks/usePagination'

// Utils
import { transformToDetailedOrder } from './utils/orderUtils'
import { exportToCSV, ExportableItem } from '../shared/utils/csvExporter'
import { printMultiplePackingSlips } from './utils/packingSlipGenerator'
import { orderNeedsPicking, orderNeedsShippingDynamic } from './utils/orderConstants'

// Types
import { Order, OrderWithDetails } from './utils/orderTypes'
import { ITEMS_PER_PAGE } from './constants/orderConstants'

//Settings
import { useSettings } from '../shared/hooks/useSettings'
import { useFulfillmentStatuses } from '../settings/hooks/useFulfillmentStatuses'

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
        case 'shippingFullName':
          return `${order.shippingFirstName || ''} ${order.shippingLastName || ''}`.trim()
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
  // Warehouse selector state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const { warehouses, loading: warehousesLoading } = useWarehouses()

  // Load fulfillment statuses from settings
  const { statuses: fulfillmentStatuses, loading: fulfillmentLoading } = useFulfillmentStatuses()

  // Modal states
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showPackingSlip, setShowPackingSlip] = useState(false)
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false)
  const [showPickingList, setShowPickingList] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Checkbox states for orders/items to ship
  const [showOrdersToShip, setShowOrdersToShip] = useState(false)
  const [showItemsToShip, setShowItemsToShip] = useState(false)

  const [maxPickingOrders, setMaxPickingOrders] = useState<string>(() => {
    // Load from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maxPickingOrders_main')
      // Handle custom format properly on initial load
      if (saved && saved.startsWith('custom:')) {
        return saved
      }
      return saved || 'all'
    }
    return 'all'
  })

  // Persistent picking state - keyed by warehouse
  const getPickingStateKey = (type: 'items' | 'orders') => {
    return `picking_${type}_${selectedWarehouseId || 'all'}`
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

  // Persistent packing state - keyed by warehouse
  const [packedOrders, setPackedOrders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const packingKey = `packing_orders_${selectedWarehouseId || 'all'}`
      const saved = localStorage.getItem(packingKey)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })

  // Save picking state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getPickingStateKey('items'), JSON.stringify(Array.from(pickedItems)))
    }
  }, [pickedItems, selectedWarehouseId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(getPickingStateKey('orders'), JSON.stringify(Array.from(pickedOrders)))
    }
  }, [pickedOrders, selectedWarehouseId])

  // Save packing state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const packingKey = `packing_orders_${selectedWarehouseId || 'all'}`
      localStorage.setItem(packingKey, JSON.stringify(Array.from(packedOrders)))
    }
  }, [packedOrders, selectedWarehouseId])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('maxPickingOrders_main', maxPickingOrders)
    }
  }, [maxPickingOrders])

  // Load picking state when warehouse changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedItems = localStorage.getItem(getPickingStateKey('items'))
      const savedOrders = localStorage.getItem(getPickingStateKey('orders'))

      setPickedItems(savedItems ? new Set(JSON.parse(savedItems)) : new Set())
      setPickedOrders(savedOrders ? new Set(JSON.parse(savedOrders)) : new Set())

      // Load packing state when warehouse changes
      const packingKey = `packing_orders_${selectedWarehouseId || 'all'}`
      const savedPackedOrders = localStorage.getItem(packingKey)
      setPackedOrders(savedPackedOrders ? new Set(JSON.parse(savedPackedOrders)) : new Set())
    }
  }, [selectedWarehouseId])

  // Custom hooks for state management
  const { orders, loading } = useOrders()

  // Filter orders by selected warehouse
  const warehouseFilteredOrders = useMemo(() => {
    if (!selectedWarehouseId || selectedWarehouseId === '') {
      return orders // All warehouses
    }
    return orders.filter(order => order.warehouseId === selectedWarehouseId)
  }, [orders, selectedWarehouseId])

  const {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredOrders
  } = useOrderFilters(warehouseFilteredOrders)

  const {
    selectedOrders,
    handleSelectOrder,
    handleSelectAll,
    clearSelection
  } = useOrderSelection()

  // Calculate ALL orders to ship (using dynamic fulfillment settings)
  const ordersToShip = useMemo(() => {
    return warehouseFilteredOrders.filter(order => {
      // Use dynamic settings to determine if order needs shipping
      return orderNeedsShippingDynamic(order, fulfillmentStatuses)
    })
  }, [warehouseFilteredOrders, fulfillmentStatuses])

  // Calculate orders that need PICKING (based on fulfillment settings)
  const ordersToPick = useMemo(() => {
    return ordersToShip.filter(order => {
      // Use dynamic settings to determine if order needs picking
      return orderNeedsPicking(order, fulfillmentStatuses)
    })
  }, [ordersToShip, fulfillmentStatuses])

  // Calculate total items to ship from ALL processing orders
  const itemsToShip = useMemo(() => {
    return ordersToShip.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [ordersToShip])

  // Calculate total items to PICK (excludes PACKED orders)
  const itemsToPick = useMemo(() => {
    return ordersToPick.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [ordersToPick])

  // Calculate selected orders for picking list
  const selectedOrdersForPicking = useMemo(() => {
    const selectedOrderIds = Array.from(selectedOrders)
    return warehouseFilteredOrders.filter(order => selectedOrderIds.includes(order.id))
  }, [selectedOrders, warehouseFilteredOrders])

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

    // Apply limit if we have a valid number - use ordersToPick instead of ordersToShip
    if (limit && !isNaN(limit)) {
      return ordersToPick.slice(0, limit)
    }

    return ordersToPick
  }, [ordersToPick, maxPickingOrders])

  // Calculate items in limited orders for picking
  const itemsInLimitedOrders = useMemo(() => {
    return limitedOrdersForPicking.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [limitedOrdersForPicking])

  // Transform orders to get actual items for picking calculations
  const ordersWithDetailsForPicking = useMemo(() => {
    const ordersToTransform = selectedOrders.size > 0 ? selectedOrdersForPicking : limitedOrdersForPicking
    return ordersToTransform.map(order => transformToDetailedOrder(order))
  }, [selectedOrders.size, selectedOrdersForPicking, limitedOrdersForPicking])

  // Calculate consolidated items from actual order items
  const consolidatedItemsForPicking = useMemo(() => {
    const itemMap = new Map<string, { sku: string; totalQuantity: number }>()

    ordersWithDetailsForPicking.forEach((order) => {
      order.items.forEach(item => {
        if (itemMap.has(item.sku)) {
          const existing = itemMap.get(item.sku)!
          existing.totalQuantity += item.quantity
        } else {
          itemMap.set(item.sku, {
            sku: item.sku,
            totalQuantity: item.quantity
          })
        }
      })
    })

    return Array.from(itemMap.values())
  }, [ordersWithDetailsForPicking])

  // Calculate remaining items using actual quantities
  const remainingItemsToPick = useMemo(() => {
    // If we don't have any picked items, return full count
    if (pickedItems.size === 0) {
      return itemsToPick  // Changed from itemsToShip
    }

    // Calculate how many items have been picked by summing quantities from actual items
    const pickedQuantity = consolidatedItemsForPicking
      .filter(item => pickedItems.has(item.sku))
      .reduce((sum, item) => sum + item.totalQuantity, 0)

    // Return remaining items
    return Math.max(0, itemsToPick - pickedQuantity)  // Changed from itemsToShip
  }, [itemsToPick, pickedItems, consolidatedItemsForPicking])

  // Calculate total picked quantity for display
  const pickedItemsQuantity = useMemo(() => {
    return consolidatedItemsForPicking
      .filter(item => pickedItems.has(item.sku))
      .reduce((sum, item) => sum + item.totalQuantity, 0)
  }, [pickedItems, consolidatedItemsForPicking])

  // Auto-uncheck the items checkbox when all items are picked
  useEffect(() => {
    if (showItemsToShip && remainingItemsToPick === 0) {
      setShowItemsToShip(false)
    }
  }, [remainingItemsToPick, showItemsToShip])

  const {
    columns,
    sortConfig,
    sortedOrders,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  } = useOrderColumns(filteredOrders) // Always use filteredOrders, not filtered by checkbox

  // Pagination
  const { ordersPerPage, setOrdersPerPage } = usePagination()
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

  // Packing state handlers
  const handleOrderPacked = (orderId: string) => {
    setPackedOrders(prev => {
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

    // Show the packing slip modal instead of direct printing
    setShowPackingSlipModal(true)
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
      status: [],
      fulfillmentStatus: [],
      platform: [],
      dateRange: '',
      startDate: '',
      endDate: '',
      warehouseId: ''
    })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setOrdersPerPage(newItemsPerPage)
    setCurrentPage(1)
  }

  const handleMaxPickingOrdersChange = (value: string) => {
    setMaxPickingOrders(value)
  }

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId)
    setCurrentPage(1)
    clearSelection()
    // Note: picking state will be loaded automatically via useEffect
  }

  // Checkbox handlers
  const handleOrdersToShipChange = (checked: boolean) => {
    setShowOrdersToShip(checked)

    if (checked) {
      // Select all orders that need to be shipped (ensure they're selected, don't toggle)
      const orderIdsToShip = ordersToShip.map(order => order.id)

      // Only select orders that aren't already selected
      orderIdsToShip.forEach(orderId => {
        if (!selectedOrders.has(orderId)) {
          handleSelectOrder(orderId)
        }
      })
    } else {
      // When unchecked, only deselect orders that are in the "orders to ship" list
      // but keep other selected orders that might not be shipping orders
      const orderIdsToShip = new Set(ordersToShip.map(order => order.id))

      // Deselect only the shipping orders
      Array.from(selectedOrders).forEach(orderId => {
        if (orderIdsToShip.has(orderId)) {
          handleSelectOrder(orderId)
        }
      })
    }
  }

  const handleItemsToShipChange = (checked: boolean) => {
    setShowItemsToShip(checked)

    if (checked) {
      // Only select orders if there are items left to pick
      if (remainingItemsToPick > 0) {
        // Use ordersToPick instead of ordersToShip - only select orders that need picking
        const orderIdsToShip = ordersToPick.map(order => order.id)

        orderIdsToShip.forEach(orderId => {
          if (!selectedOrders.has(orderId)) {
            handleSelectOrder(orderId)
          }
        })
      }
    } else {
      // When unchecked, deselect orders that need picking
      const orderIdsToShip = new Set(ordersToPick.map(order => order.id))

      Array.from(selectedOrders).forEach(orderId => {
        if (orderIdsToShip.has(orderId)) {
          handleSelectOrder(orderId)
        }
      })
    }
  }

  const handleShowPickingList = () => {
    setShowPickingList(true)
  }

  // Clear picking state for current warehouse (useful for testing or reset)
  const handleClearPickingState = () => {
    setPickedItems(new Set())
    setPickedOrders(new Set())
    setPackedOrders(new Set())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(getPickingStateKey('items'))
      localStorage.removeItem(getPickingStateKey('orders'))
      const packingKey = `packing_orders_${selectedWarehouseId || 'all'}`
      localStorage.removeItem(packingKey)
    }
  }

  // Get selected warehouse name for display
  const selectedWarehouse = warehouses.find(w => w.id === selectedWarehouseId)
  const warehouseDisplayName = selectedWarehouse
    ? selectedWarehouse.name
    : selectedWarehouseId === ''
    ? 'All Warehouses'
    : 'Unknown Warehouse'

  if (loading || warehousesLoading || fulfillmentLoading) {
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
      {/* Header with Warehouse Selector */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Orders Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage orders across all warehouses.
          </p>
        </div>
      </div>

      {/* Warehouse Selector */}
      <div className="mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Warehouse</h3>
              <p className="text-xs text-gray-500 mt-1">
                {selectedWarehouseId ?
                  `Showing orders from ${warehouseDisplayName}` :
                  'Showing orders from all warehouses'}
              </p>
            </div>
            <div className="w-64">
              <WarehouseSelector
                warehouses={warehouses.map(w => ({
                  id: w.id,
                  name: w.name,
                  code: w.code,
                  isDefault: w.isDefault,
                  status: w.status,
                  productCount: w.productCount
                }))}
                selectedWarehouseId={selectedWarehouseId}
                onWarehouseChange={handleWarehouseChange}
                showProductCount={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Stats with Checkboxes - Only show if there are orders to ship */}
      {ordersToShip.length > 0 && (
        <div className="mb-6">
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
                disabled={remainingItemsToPick === 0}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium ${remainingItemsToPick === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                {remainingItemsToPick} item{remainingItemsToPick !== 1 ? 's' : ''} to pick
                {pickedItemsQuantity > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({pickedItemsQuantity} picked)
                  </span>
                )}
              </span>
            </label>

            {/* Debug: Clear picking state button (remove in production) */}
            {process.env.NODE_ENV === 'development' && (pickedItems.size > 0 || pickedOrders.size > 0) && (
              <button
                onClick={handleClearPickingState}
                className="text-xs text-gray-500 hover:text-red-600"
                title="Clear picking state (dev only)"
              >
                Clear Picking ({pickedItemsQuantity} items, {pickedOrders.size} orders)
              </button>
            )}
          </div>
        </div>
      )}

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
        showItemsToShip={showItemsToShip}
        onShowPickingList={handleShowPickingList}
        itemsToShipCount={remainingItemsToPick} // Changed from itemsToShip
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

      {/* Column Management */}
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

      {showPackingSlipModal && selectedOrdersForPicking.length > 0 && (
        <PackingSlipModal
          orders={selectedOrdersForPicking}
          isOpen={showPackingSlipModal}
          onClose={() => setShowPackingSlipModal(false)}
          warehouseName={selectedWarehouse ? selectedWarehouse.name : 'All Warehouses'}
          packedOrders={packedOrders}
          onOrderPacked={handleOrderPacked}
        />
      )}

      {/* Picking List Modal - Show selected orders if any, otherwise show limited orders to ship */}
      {showPickingList && (selectedOrdersForPicking.length > 0 || (showItemsToShip && limitedOrdersForPicking.length > 0)) && (
        <PickingListModal
          orders={ordersWithDetailsForPicking}
          isOpen={showPickingList}
          onClose={() => setShowPickingList(false)}
          warehouseName={selectedWarehouse ? selectedWarehouse.name : 'All Warehouses'}
          maxOrdersLimit={selectedOrdersForPicking.length > 0 ? "all" : maxPickingOrders}
          totalOrdersCount={selectedOrdersForPicking.length > 0 ? selectedOrdersForPicking.length : ordersToShip.length}
          limitedOrdersCount={ordersWithDetailsForPicking.length}
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
