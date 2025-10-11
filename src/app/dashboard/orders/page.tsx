//file path: app/dashboard/orders/page.tsx

'use client'

import { useState, useEffect, useMemo } from 'react'
import OrderDetailsModal from './OrderDetailsModal'
import PackingSlip from './PackingSlip'
import PackingSlipModal from './components/PackingSlipModal'
import PickingListModal from './components/PickingListModal'
import ShippingModal from './components/ShippingModal'
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
import ScreenOptions from '../shared/components/ScreenOptions'
import { usePagination } from '../shared/hooks/usePagination'

// Utils
import { transformToDetailedOrder } from './utils/orderUtils'
import { exportToCSV, ExportableItem } from '../shared/utils/csvExporter'
import { printMultiplePackingSlips } from './utils/packingSlipGenerator'
import { orderNeedsPicking, orderNeedsShippingDynamic } from './utils/orderConstants'

// Types
import { Order, OrderWithDetails } from './utils/orderTypes'
import { ITEMS_PER_PAGE, STATUS_COLORS, FULFILLMENT_COLORS } from './constants/orderConstants'

//Settings
import { useSettings } from '../shared/hooks/useSettings'
import { useFulfillmentStatuses } from '../settings/hooks/useFulfillmentStatuses'

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

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
  const filename = `orders-export-${dateStr}-${timeStr}.csv`

  exportToCSV(orders, exportColumns, filename)
}

export default function OrdersPage() {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      // Then check localStorage
      const saved = localStorage.getItem('selectedWarehouseId_orders') // or '_products'
      return saved || ''
    }
    return ''
  })

  const { warehouses, loading: warehousesLoading } = useWarehouses()

  const { statuses: fulfillmentStatuses, loading: fulfillmentLoading } = useFulfillmentStatuses()

  const fulfillmentStatusOptions = useMemo(() => {
    return fulfillmentStatuses.map(status => ({
      value: status.code,
      label: status.label,
      color: status.color
    }))
  }, [fulfillmentStatuses])

  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showPackingSlip, setShowPackingSlip] = useState(false)
  const [showPackingSlipModal, setShowPackingSlipModal] = useState(false)
  const [showPickingList, setShowPickingList] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [showOrdersToShip, setShowOrdersToShip] = useState(false)
  const [showItemsToShip, setShowItemsToShip] = useState(false)

  const [maxPickingOrders, setMaxPickingOrders] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maxPickingOrders_main')
      if (saved && saved.startsWith('custom:')) {
        return saved
      }
      return saved || 'all'
    }
    return 'all'
  })

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

  const [packedOrders, setPackedOrders] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const packingKey = `packing_orders_${selectedWarehouseId || 'all'}`
      const saved = localStorage.getItem(packingKey)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedItems = localStorage.getItem(getPickingStateKey('items'))
      const savedOrders = localStorage.getItem(getPickingStateKey('orders'))

      setPickedItems(savedItems ? new Set(JSON.parse(savedItems)) : new Set())
      setPickedOrders(savedOrders ? new Set(JSON.parse(savedOrders)) : new Set())

      const packingKey = `packing_orders_${selectedWarehouseId || 'all'}`
      const savedPackedOrders = localStorage.getItem(packingKey)
      setPackedOrders(savedPackedOrders ? new Set(JSON.parse(savedPackedOrders)) : new Set())
    }
  }, [selectedWarehouseId])

  const {
    orders,
    loading,
    updateOrdersFulfillmentStatus,
    updateStatus,
    updateFulfillmentStatus,
    refreshOrders
  } = useOrders()

  const warehouseFilteredOrders = useMemo(() => {
    if (!selectedWarehouseId || selectedWarehouseId === '') {
      return orders
    }
    return orders.filter(order => order.warehouseId === selectedWarehouseId)
  }, [orders, selectedWarehouseId])

  // Add these two state variables for shipping
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [orderToShip, setOrderToShip] = useState<Order | null>(null)
  const [optionsOpen, setOptionsOpen] = useState(false)

  // Clean up stale order IDs from packedOrders Set
  useEffect(() => {
    if (typeof window !== 'undefined' && packedOrders.size > 0) {
      const currentOrderIds = new Set(warehouseFilteredOrders.map(o => o.id))
      const validPackedOrders = new Set(
        Array.from(packedOrders).filter(id => currentOrderIds.has(id))
      )

      // Only update if there are invalid IDs
      if (validPackedOrders.size !== packedOrders.size) {
        setPackedOrders(validPackedOrders)
      }
    }
  }, [warehouseFilteredOrders, packedOrders])

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

  const ordersToShip = useMemo(() => {
    return warehouseFilteredOrders.filter(order => {
      return orderNeedsShippingDynamic(order, fulfillmentStatuses)
    })
  }, [warehouseFilteredOrders, fulfillmentStatuses])

  const ordersToPick = useMemo(() => {
    return warehouseFilteredOrders.filter(order => {
      return orderNeedsPicking(order, fulfillmentStatuses)
    })
  }, [warehouseFilteredOrders, fulfillmentStatuses])

  const itemsToShip = useMemo(() => {
    const detailedOrders = ordersToShip.map(order => transformToDetailedOrder(order))

    let totalQuantity = 0
    detailedOrders.forEach(order => {
      order.items.forEach(item => {
        totalQuantity += item.quantity
      })
    })

    return totalQuantity
  }, [ordersToShip])

  const itemsToPick = useMemo(() => {
    const detailedOrders = ordersToPick.map(order => transformToDetailedOrder(order))

    let totalQuantity = 0
    detailedOrders.forEach(order => {
      order.items.forEach(item => {
        totalQuantity += item.quantity
      })
    })

    return totalQuantity
  }, [ordersToPick])

  const selectedOrdersForPicking = useMemo(() => {
    const selectedOrderIds = Array.from(selectedOrders)
    return warehouseFilteredOrders.filter(order => selectedOrderIds.includes(order.id))
  }, [selectedOrders, warehouseFilteredOrders])

  const itemsInSelectedOrders = useMemo(() => {
    const detailedOrders = selectedOrdersForPicking.map(order => transformToDetailedOrder(order))

    let totalQuantity = 0
    detailedOrders.forEach(order => {
      order.items.forEach(item => {
        totalQuantity += item.quantity
      })
    })

    return totalQuantity
  }, [selectedOrdersForPicking])

  const limitedOrdersForShipping = useMemo(() => {
    let limit = null
    if (maxPickingOrders && maxPickingOrders !== 'all') {
      if (maxPickingOrders.startsWith('custom:')) {
        limit = parseInt(maxPickingOrders.replace('custom:', ''))
      } else {
        limit = parseInt(maxPickingOrders)
      }
    }

    const sortedByDate = [...ordersToShip].sort((a, b) => {
      const dateA = new Date(a.orderDate || 0).getTime()
      const dateB = new Date(b.orderDate || 0).getTime()
      return dateA - dateB
    })

    if (limit && !isNaN(limit)) {
      return sortedByDate.slice(0, limit)
    }

    return sortedByDate
  }, [ordersToShip, maxPickingOrders])

  const limitedOrdersForPicking = useMemo(() => {
    let limit = null
    if (maxPickingOrders && maxPickingOrders !== 'all') {
      if (maxPickingOrders.startsWith('custom:')) {
        limit = parseInt(maxPickingOrders.replace('custom:', ''))
      } else {
        limit = parseInt(maxPickingOrders)
      }
    }

    const sortedByDate = [...ordersToPick].sort((a, b) => {
      const dateA = new Date(a.orderDate || 0).getTime()
      const dateB = new Date(b.orderDate || 0).getTime()
      return dateA - dateB
    })

    if (limit && !isNaN(limit)) {
      return sortedByDate.slice(0, limit)
    }

    return sortedByDate
  }, [ordersToPick, maxPickingOrders])

  const itemsInLimitedShippingOrders = useMemo(() => {
    const detailedOrders = limitedOrdersForShipping.map(order => transformToDetailedOrder(order))

    let totalQuantity = 0
    detailedOrders.forEach(order => {
      order.items.forEach(item => {
        totalQuantity += item.quantity
      })
    })

    return totalQuantity
  }, [limitedOrdersForShipping])

  const itemsInLimitedPickingOrders = useMemo(() => {
    const detailedOrders = limitedOrdersForPicking.map(order => transformToDetailedOrder(order))

    let totalQuantity = 0
    detailedOrders.forEach(order => {
      order.items.forEach(item => {
        totalQuantity += item.quantity
      })
    })

    return totalQuantity
  }, [limitedOrdersForPicking])

  const ordersWithDetailsForPicking = useMemo(() => {
    const ordersToTransform = selectedOrders.size > 0 ? selectedOrdersForPicking : limitedOrdersForPicking
    return ordersToTransform.map(order => transformToDetailedOrder(order))
  }, [selectedOrders.size, selectedOrdersForPicking, limitedOrdersForPicking])

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

  const remainingItemsToPick = useMemo(() => {
    if (pickedItems.size === 0) {
      return itemsToPick
    }

    const pickedQuantity = consolidatedItemsForPicking
      .filter(item => pickedItems.has(item.sku))
      .reduce((sum, item) => sum + item.totalQuantity, 0)

    return Math.max(0, itemsToPick - pickedQuantity)
  }, [itemsToPick, pickedItems, consolidatedItemsForPicking])

  const pickedItemsQuantity = useMemo(() => {
    return consolidatedItemsForPicking
      .filter(item => pickedItems.has(item.sku))
      .reduce((sum, item) => sum + item.totalQuantity, 0)
  }, [pickedItems, consolidatedItemsForPicking])

  const {
    columns,
    sortConfig,
    sortedOrders,
    handleSort,
    handleColumnVisibilityChange,
    handleColumnReorder,
    resetToDefaults
  } = useOrderColumns(filteredOrders)

  const { ordersPerPage, setOrdersPerPage } = usePagination()
  const totalPages = Math.ceil(sortedOrders.length / (ordersPerPage || 20))
  const startIndex = (currentPage - 1) * (ordersPerPage || 20)
  const endIndex = startIndex + (ordersPerPage || 20)
  const currentOrders = sortedOrders.slice(startIndex, endIndex)

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

  const handleUpdateFulfillmentStatus = async (orderIds: string[], status: string) => {
    const success = await updateOrdersFulfillmentStatus(orderIds, status)

    if (success) {
      alert(`Successfully updated ${orderIds.length} order(s) to ${status} status`)
    } else {
      alert('Failed to update orders. Please try again.')
    }
  }

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

    setShowPackingSlipModal(true)
  }

  const handlePrintSinglePackingSlip = (order: Order) => {
    const orderWithDetails = transformToDetailedOrder(order)
    setSelectedOrder(orderWithDetails)
    setShowPackingSlip(true)
  }

  const handlePrintPickingListForOrder = (order: Order) => {
    // Clear current selection and select only this order
    clearSelection()
    handleSelectOrder(order.id)
    // Open picking list modal
    setShowPickingList(true)
  }

  const handleShipOrder = (order: Order) => {
    console.log('🚢 Ship button clicked!', order)  // ADD THIS
    setOrderToShip(order)
    setShowShippingModal(true)
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

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedWarehouseId_orders', warehouseId) // or '_products'
    }

    // Update URL to reflect warehouse selection
    const url = new URL(window.location.href)
    if (warehouseId) {
      url.searchParams.set('warehouse', warehouseId)
    } else {
      url.searchParams.delete('warehouse')
    }
    window.history.replaceState({}, '', url.toString())
  }

  const handleOrdersToShipChange = (checked: boolean) => {
    setShowOrdersToShip(checked)

    if (checked) {
      setShowItemsToShip(false)
      clearSelection()

      const orderIdsToShip = limitedOrdersForShipping.map(order => order.id)
      orderIdsToShip.forEach(orderId => {
        handleSelectOrder(orderId)
      })
    } else {
      const orderIdsToShip = new Set(limitedOrdersForShipping.map(order => order.id))
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
      setShowOrdersToShip(false)
      clearSelection()

      if (itemsInLimitedPickingOrders > 0) {
        const orderIdsToShip = limitedOrdersForPicking.map(order => order.id)
        orderIdsToShip.forEach(orderId => {
          handleSelectOrder(orderId)
        })
      }
    } else {
      const orderIdsToShip = new Set(limitedOrdersForPicking.map(order => order.id))
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
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Orders Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage orders across all warehouses.
          </p>
        </div>
      </div>

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

      {selectedWarehouseId === '' ? (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Select a warehouse to pick and ship orders
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Please select a specific warehouse from the dropdown above to view picking and shipping options.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : ordersToShip.length > 0 && (
        <div className="mb-6">
          <div className="mb-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Quick Select <span className="text-gray-400">·</span> Auto-select orders limited by max order setting
              <span className="text-gray-500 normal-case font-normal">
                {' '}(adjustable in{' '}
                <button
                  onClick={() => setOptionsOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 underline decoration-dotted font-medium cursor-pointer"
                >
                  Options ⚙️
                </button>)
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-6 min-h-[40px]">
            <label className="flex items-center space-x-2 cursor-pointer h-10">
              <input
                type="checkbox"
                checked={showOrdersToShip}
                onChange={(e) => handleOrdersToShipChange(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {limitedOrdersForShipping.length} order{limitedOrdersForShipping.length !== 1 ? 's' : ''} to ship
                {ordersToShip.length > limitedOrdersForShipping.length && (
                  <span className="text-xs text-gray-500 ml-1">
                    (of {ordersToShip.length} total)
                  </span>
                )}
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer h-10">
              <input
                type="checkbox"
                checked={showItemsToShip}
                onChange={(e) => handleItemsToShipChange(e.target.checked)}
                disabled={itemsInLimitedPickingOrders === 0}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className={`text-sm font-medium ${itemsInLimitedPickingOrders === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                {itemsInLimitedPickingOrders} item{itemsInLimitedPickingOrders !== 1 ? 's' : ''} to pick
                {itemsToPick > itemsInLimitedPickingOrders && (
                  <span className="text-xs text-gray-500 ml-1">
                    (of {itemsToPick} total)
                  </span>
                )}
              </span>
            </label>

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
        onShipNow={() => {
          // Ship the first selected order
          const firstOrderId = Array.from(selectedOrders)[0]
          const order = warehouseFilteredOrders.find(o => o.id === firstOrderId)
          if (order) {
            handleShipOrder(order)
          }
        }}
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
        itemsToShipCount={itemsInLimitedPickingOrders}
        isSpecificWarehouse={selectedWarehouseId !== ''}
        fulfillmentStatusOptions={fulfillmentStatusOptions}
      />

      <OrdersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAllFilters={handleClearAllFilters}
        onExport={handleExport}
        optionsOpen={optionsOpen}
        onOptionsOpenChange={setOptionsOpen}
        itemsPerPage={ordersPerPage || 20}
        onItemsPerPageChange={handleItemsPerPageChange}
        maxPickingOrders={maxPickingOrders}
        onMaxPickingOrdersChange={handleMaxPickingOrdersChange}
        columns={columns}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onResetLayout={handleResetLayout}
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
        onPrintPickingList={handlePrintPickingListForOrder}
        onShipOrder={handleShipOrder}
        onColumnReorder={handleColumnReorder}
        onUpdateStatus={updateStatus}
        onUpdateFulfillmentStatus={updateFulfillmentStatus}
        fulfillmentStatusOptions={fulfillmentStatusOptions}
      />

      <OrdersPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedOrders.length}
        itemsPerPage={ordersPerPage || 20}
        onPageChange={setCurrentPage}
      />

      <div className="mt-4 flex justify-end">
        <ColumnSettings
          columns={columns}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnReorder={handleColumnReorder}
          buttonText="Manage Columns"
        />
      </div>

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
          onClose={() => {
            setShowPackingSlipModal(false)
            refreshOrders()
          }}
          warehouseName={selectedWarehouse ? selectedWarehouse.name : 'All Warehouses'}
          packedOrders={packedOrders}
          onOrderPacked={handleOrderPacked}
          fulfillmentStatusOptions={fulfillmentStatusOptions}
          onUpdateFulfillmentStatus={handleUpdateFulfillmentStatus}
        />
      )}

      {showPickingList && (selectedOrdersForPicking.length > 0 || (showItemsToShip && limitedOrdersForPicking.length > 0)) && (
        <PickingListModal
          orders={ordersWithDetailsForPicking}
          isOpen={showPickingList}
          onClose={() => setShowPickingList(false)}
          warehouseName={selectedWarehouse ? selectedWarehouse.name : 'All Warehouses'}
          maxOrdersLimit={selectedOrdersForPicking.length > 0 ? "all" : maxPickingOrders}
          totalOrdersCount={selectedOrdersForPicking.length > 0 ? selectedOrdersForPicking.length : ordersToShip.length}
          limitedOrdersCount={ordersWithDetailsForPicking.length}
          itemsCount={selectedOrdersForPicking.length > 0 ? itemsInSelectedOrders : itemsInLimitedPickingOrders}
          pickedItems={pickedItems}
          pickedOrders={pickedOrders}
          onItemPicked={handleItemPicked}
          onOrderPicked={handleOrderPicked}
          onUpdateFulfillmentStatus={handleUpdateFulfillmentStatus}
          fulfillmentStatusOptions={fulfillmentStatusOptions}
        />
      )}

      {showShippingModal && orderToShip && (
        <ShippingModal
          order={{
            id: orderToShip.id,
            orderNumber: orderToShip.orderNumber,
            customer: {
              name: orderToShip.customerName || '',
              email: orderToShip.customerEmail || ''
            },
            shippingAddress: {
              streetAddress: orderToShip.shippingAddress1 || '',
              secondaryAddress: orderToShip.shippingAddress2,
              city: orderToShip.shippingCity || '',
              state: orderToShip.shippingProvince || '',
              zipCode: orderToShip.shippingZip || ''
            },
            items: orderToShip.lineItems ? JSON.parse(orderToShip.lineItems).map((item: any) => ({
              name: item.name || '',
              quantity: item.quantity || 0,
              sku: item.sku || ''
            })) : [],
            total: orderToShip.totalAmount || 0,
            weight: orderToShip.totalWeight
          }}
          isOpen={showShippingModal}
          onClose={() => {
            setShowShippingModal(false)
            setOrderToShip(null)
          }}
          onShipmentCreated={() => {
            refreshOrders()
          }}
        />
      )}

    </div>
  )
}
