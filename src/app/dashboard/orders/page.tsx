'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import ReactCountryFlag from "react-country-flag"
import OrderDetailsModal from './OrderDetailsModal'
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

const CountryFlag = ({ countryCode }: { countryCode: string }) => {
  return (
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
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalAmount: number
  currency: string
  status: string
  fulfillmentStatus: string
  platform: string
  orderDate: string
  itemCount: number
  shippingFirstName: string
  shippingLastName: string
  country: string
  countryCode: string
  requestedShipping: string
}

interface OrderWithDetails extends Order {
  items: {
    id: string
    name: string
    sku: string
    quantity: number
    price: number
    currency: string
    variant: string
    weight: number
    meta: {
      color: string
      size: string
      material: string
    }
  }[]
  shippingAddress: {
    firstName: string
    lastName: string
    address1: string
    city: string
    state: string
    zip: string
    country: string
    countryCode: string
    phone: string
  }
  billingAddress: {
    firstName: string
    lastName: string
    address1: string
    city: string
    state: string
    zip: string
    country: string
    countryCode: string
  }
  shippingMethod: string
  shippingCost?: number
  taxAmount?: number
  fees?: number
  handlingFee?: number
  discounts?: {
    code: string
    amount: number
    description: string
  }[]
  trackingNumber: string
}

interface FilterState {
  status: string
  fulfillmentStatus: string
  platform: string
  dateRange: string
}

interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

interface ColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

const fulfillmentColors = {
  PENDING: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKING: 'bg-yellow-100 text-yellow-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  READY_TO_SHIP: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-green-100 text-green-800',
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const itemsPerPage = 20

  // User ID - in a real app, this would come from authentication
  const [userId] = useState(() => {
    // For now, generate a simple user ID or get from localStorage
    let id = localStorage.getItem('userId')
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', id)
    }
    return id
  })

  // Storage keys for user-specific settings
  const STORAGE_KEYS = {
    sortConfig: `orders_sort_${userId}`,
    columns: `orders_columns_${userId}`,
    filters: `orders_filters_${userId}`,
    showFilters: `orders_show_filters_${userId}`,
  }

  console.log('Storage keys:', STORAGE_KEYS) // Debug log

  // Helper function to save settings immediately
  const saveUserSettings = (key: string, value: any) => {
    try {
      console.log(`Saving ${key}:`, value) // Debug log
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving user settings:', error)
    }
  }

  // Load user-specific settings from localStorage
  const loadUserSettings = () => {
    try {
      const savedSort = localStorage.getItem(STORAGE_KEYS.sortConfig)
      const savedColumns = localStorage.getItem(STORAGE_KEYS.columns)
      const savedFilters = localStorage.getItem(STORAGE_KEYS.filters)
      const savedShowFilters = localStorage.getItem(STORAGE_KEYS.showFilters)

      const defaultColumns = [
        { id: 'orderNumber', field: 'orderNumber', label: 'Order Number', sortable: true, visible: true },
        { id: 'customerName', field: 'customerName', label: 'Customer Name', sortable: true, visible: true },
        { id: 'status', field: 'status', label: 'Order Status', sortable: true, visible: true },
        { id: 'fulfillmentStatus', field: 'fulfillmentStatus', label: 'Fulfillment Status', sortable: true, visible: true },
        { id: 'totalAmount', field: 'totalAmount', label: 'Total Amount', sortable: true, visible: true },
        { id: 'currency', field: 'currency', label: 'Currency', sortable: true, visible: false },
        { id: 'itemCount', field: 'itemCount', label: 'Item Count', sortable: true, visible: true },
        { id: 'platform', field: 'platform', label: 'Platform', sortable: true, visible: true },
        { id: 'country', field: 'country', label: 'Country', sortable: true, visible: true },
        { id: 'countryName', field: 'countryName', label: 'Country Name', sortable: true, visible: false },
        { id: 'countryCode', field: 'countryCode', label: 'Country Code', sortable: true, visible: false },
        { id: 'orderDate', field: 'orderDate', label: 'Order Date', sortable: true, visible: true },
        { id: 'shippingFirstName', field: 'shippingFirstName', label: 'Shipping First Name', sortable: true, visible: false },
        { id: 'shippingLastName', field: 'shippingLastName', label: 'Shipping Last Name', sortable: true, visible: false },
        { id: 'shippingFullName', field: 'shippingFullName', label: 'Shipping Name', sortable: true, visible: false },
        { id: 'requestedShipping', field: 'requestedShipping', label: 'Shipping Method', sortable: true, visible: false },
        { id: 'orderTime', field: 'orderTime', label: 'Order Time', sortable: true, visible: false },
        { id: 'orderDay', field: 'orderDay', label: 'Order Day', sortable: true, visible: false },
        { id: 'orderMonth', field: 'orderMonth', label: 'Order Month', sortable: true, visible: false },
        { id: 'orderYear', field: 'orderYear', label: 'Order Year', sortable: true, visible: false },
        { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },
      ]

      let loadedColumns = defaultColumns
      if (savedColumns) {
        const parsedColumns = JSON.parse(savedColumns)
        // Ensure all default columns exist, merge with saved preferences
        loadedColumns = defaultColumns.map(defaultCol => {
          const savedCol = parsedColumns.find((col: ColumnConfig) => col.id === defaultCol.id)
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol
        })

        // Preserve the order from saved columns
        const orderedColumns = []
        for (const savedCol of parsedColumns) {
          const foundCol = loadedColumns.find(col => col.id === savedCol.id)
          if (foundCol) {
            orderedColumns.push(foundCol)
          }
        }
        // Add any new columns that weren't in the saved set
        for (const defaultCol of defaultColumns) {
          if (!orderedColumns.find(col => col.id === defaultCol.id)) {
            orderedColumns.push(defaultCol)
          }
        }
        loadedColumns = orderedColumns
      }

      return {
        sortConfig: savedSort ? JSON.parse(savedSort) : { field: 'orderDate', direction: 'desc' },
        columns: loadedColumns,
        filters: savedFilters ? JSON.parse(savedFilters) : {
          status: '',
          fulfillmentStatus: '',
          platform: '',
          dateRange: ''
        },
        showFilters: savedShowFilters ? JSON.parse(savedShowFilters) : false
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      return {
        sortConfig: { field: 'orderDate', direction: 'desc' },
        columns: [
          { id: 'orderNumber', field: 'orderNumber', label: 'Order', sortable: true, visible: true },
          { id: 'customerName', field: 'customerName', label: 'Customer', sortable: true, visible: true },
          { id: 'status', field: 'status', label: 'Status', sortable: true, visible: true },
          { id: 'fulfillmentStatus', field: 'fulfillmentStatus', label: 'Fulfillment', sortable: true, visible: true },
          { id: 'totalAmount', field: 'totalAmount', label: 'Total', sortable: true, visible: true },
          { id: 'itemCount', field: 'itemCount', label: 'Items', sortable: true, visible: true },
          { id: 'platform', field: 'platform', label: 'Platform', sortable: true, visible: true },
          { id: 'country', field: 'country', label: 'Country', sortable: true, visible: true },
          { id: 'orderDate', field: 'orderDate', label: 'Date', sortable: true, visible: true },
          { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },
        ],
        filters: {
          status: '',
          fulfillmentStatus: '',
          platform: '',
          dateRange: ''
        },
        showFilters: false
      }
    }
  }

  // Initialize state with user-specific settings
  console.log('About to load user settings...') // Debug log
  const userSettings = loadUserSettings()
  console.log('Loaded user settings:', userSettings) // Debug log
  const [sortConfig, setSortConfig] = useState<SortState>(userSettings.sortConfig)
  const [columns, setColumns] = useState<ColumnConfig[]>(userSettings.columns)
  const [filters, setFilters] = useState<FilterState>(userSettings.filters)

  console.log('Component initializing with columns:', columns.map(c => c.label)) // Debug log

  // Initialize showFilters with user preference
  useEffect(() => {
    setShowFilters(userSettings.showFilters)
  }, [])

  // Save settings when they change - removed debouncing for column changes
  useEffect(() => {
    if (initialized) {
      saveUserSettings(STORAGE_KEYS.sortConfig, sortConfig)
    }
  }, [sortConfig, initialized])

  useEffect(() => {
    if (initialized) {
      console.log('Saving columns due to change:', columns.map(c => c.label)) // Debug log
      saveUserSettings(STORAGE_KEYS.columns, columns)
    }
  }, [columns, initialized])

  useEffect(() => {
    if (initialized) {
      saveUserSettings(STORAGE_KEYS.filters, filters)
    }
  }, [filters, initialized])

  useEffect(() => {
    if (initialized) {
      saveUserSettings(STORAGE_KEYS.showFilters, showFilters)
    }
  }, [showFilters, initialized])

  // Set initialized flag after component mounts
  useEffect(() => {
    setInitialized(true)
  }, [])

  // Mock data - replace with API call later
  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      totalAmount: 129.99,
      currency: 'USD',
      status: 'PROCESSING',
      fulfillmentStatus: 'PICKING',
      platform: 'Shopify',
      orderDate: '2024-01-15T10:30:00Z',
      itemCount: 3,
      shippingFirstName: 'John',
      shippingLastName: 'Smith',
      country: 'United States',
      countryCode: 'US',
      requestedShipping: 'Standard Shipping'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.j@email.com',
      totalAmount: 89.50,
      currency: 'USD',
      status: 'SHIPPED',
      fulfillmentStatus: 'SHIPPED',
      platform: 'WooCommerce',
      orderDate: '2024-01-14T14:20:00Z',
      itemCount: 2,
      shippingFirstName: 'Sarah',
      shippingLastName: 'Johnson',
      country: 'Canada',
      countryCode: 'CA',
      requestedShipping: 'Express Shipping'
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      customerName: 'Mike Wilson',
      customerEmail: 'mike.wilson@email.com',
      totalAmount: 245.00,
      currency: 'USD',
      status: 'PENDING',
      fulfillmentStatus: 'PENDING',
      platform: 'Shopify',
      orderDate: '2024-01-16T09:15:00Z',
      itemCount: 5,
      shippingFirstName: 'Mike',
      shippingLastName: 'Wilson',
      country: 'United Kingdom',
      countryCode: 'GB',
      requestedShipping: 'Priority Shipping'
    },
    {
      id: '4',
      orderNumber: 'ORD-2024-004',
      customerName: 'Emily Davis',
      customerEmail: 'emily.davis@email.com',
      totalAmount: 67.25,
      currency: 'USD',
      status: 'DELIVERED',
      fulfillmentStatus: 'DELIVERED',
      platform: 'BigCommerce',
      orderDate: '2024-01-12T16:45:00Z',
      itemCount: 1,
      shippingFirstName: 'Emily',
      shippingLastName: 'Davis',
      country: 'Australia',
      countryCode: 'AU',
      requestedShipping: 'Standard Shipping'
    },
    {
      id: '5',
      orderNumber: 'ORD-2024-005',
      customerName: 'David Brown',
      customerEmail: 'david.brown@email.com',
      totalAmount: 156.75,
      currency: 'EUR',
      status: 'CANCELLED',
      fulfillmentStatus: 'PENDING',
      platform: 'Shopify',
      orderDate: '2024-01-13T11:00:00Z',
      itemCount: 4,
      shippingFirstName: 'David',
      shippingLastName: 'Brown',
      country: 'Germany',
      countryCode: 'DE',
      requestedShipping: 'Express Shipping'
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 1000)
  }, [])

  const handleViewOrderDetails = (order: Order) => {
    // Generate realistic discount data for different orders
    const getDiscountData = (orderNumber: string) => {
      // Some orders have discounts, others don't
      const discountConfigs = {
        'ORD-2024-001': [
          { code: 'WELCOME10', amount: 10.00, description: 'Welcome discount' },
          { code: 'FREESHIP', amount: 5.00, description: 'Free shipping promotion' }
        ],
        'ORD-2024-002': [
          { code: 'LOYALTY5', amount: 4.48, description: 'Loyalty member discount' }
        ],
        'ORD-2024-003': [
          { code: 'BUNDLE15', amount: 15.00, description: 'Bundle discount' },
          { code: 'STUDENT', amount: 8.50, description: 'Student discount' }
        ],
        // ORD-2024-004 and ORD-2024-005 have no discounts
      }

      const discounts = discountConfigs[orderNumber] || []
      const totalDiscount = discounts.reduce((sum, discount) => sum + discount.amount, 0)

      return {
        discounts,
        totalDiscount
      }
    }

    const { discounts, totalDiscount } = getDiscountData(order.orderNumber)

    // Transform order data to match modal expectations
    const orderWithDetails: OrderWithDetails = {
      ...order,
      items: [
        {
          id: '1',
          name: 'Premium T-Shirt',
          sku: 'TSH-001',
          quantity: 2,
          price: 29.99,
          currency: order.currency,
          variant: 'Blue - Large',
          weight: 0.5,
          meta: {
            color: 'Blue',
            size: 'Large',
            material: '100% Cotton'
          }
        },
        {
          id: '2',
          name: 'Cotton Hoodie',
          sku: 'HOD-001',
          quantity: 1,
          price: 69.99,
          currency: order.currency,
          variant: 'Gray - Medium',
          weight: 1.2,
          meta: {
            color: 'Gray',
            size: 'Medium',
            material: '80% Cotton, 20% Polyester'
          }
        }
      ],
      shippingAddress: {
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        address1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: order.country,
        countryCode: order.countryCode,
        phone: '555-123-4567'
      },
      billingAddress: {
        firstName: order.shippingFirstName,
        lastName: order.shippingLastName,
        address1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: order.country,
        countryCode: order.countryCode
      },
      shippingMethod: order.requestedShipping,
      shippingCost: 15.99,
      taxAmount: 12.50,
      fees: 2.50,
      handlingFee: 5.00,
      discounts: discounts, // Only use the new discounts array
      trackingNumber: 'TRK123456789'
    }

    setSelectedOrder(orderWithDetails)
    setShowOrderDetails(true)
  }

  const handleSort = (field: string) => {
    console.log('Sorting by field:', field) // Debug log
    setSortConfig(prevSort => {
      const newDirection = prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
      console.log('New sort config:', { field, direction: newDirection }) // Debug log
      return {
        field,
        direction: newDirection
      }
    })
    setCurrentPage(1) // Reset to first page when sorting
  }

  // Handle column visibility changes
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumns(prevColumns => {
      return prevColumns.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    })
  }

  // Close column settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColumnSettings && !(event.target as Element).closest('.relative')) {
        setShowColumnSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColumnSettings])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      console.log('Dragging column:', active.id, 'to position of:', over.id) // Debug log

      setColumns((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)

        console.log('Moving from index', oldIndex, 'to index', newIndex) // Debug log

        const newOrder = arrayMove(items, oldIndex, newIndex)
        console.log('New column order:', newOrder.map(c => c.label)) // Debug log

        // Immediately save to localStorage after reordering
        if (initialized) {
          console.log('Immediately saving column order after drag') // Debug log
          saveUserSettings(STORAGE_KEYS.columns, newOrder)
        }

        return newOrder
      })
    }
  }

  const getSortedOrders = (ordersToSort: Order[]) => {
    return [...ordersToSort].sort((a, b) => {
      let aValue: any
      let bValue: any

      // Get values based on field, with proper fallbacks
      switch (sortConfig.field) {
        case 'orderNumber':
          aValue = a.orderNumber || ''
          bValue = b.orderNumber || ''
          break
        case 'customerName':
          aValue = a.customerName || ''
          bValue = b.customerName || ''
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        case 'fulfillmentStatus':
          aValue = a.fulfillmentStatus || ''
          bValue = b.fulfillmentStatus || ''
          break
        case 'platform':
          aValue = a.platform || ''
          bValue = b.platform || ''
          break
        case 'country':
          aValue = a.country || ''
          bValue = b.country || ''
          break
        case 'countryName':
          aValue = a.country || ''
          bValue = b.country || ''
          break
        case 'countryCode':
          aValue = a.countryCode || ''
          bValue = b.countryCode || ''
          break
        case 'currency':
          aValue = a.currency || ''
          bValue = b.currency || ''
          break
        case 'shippingFirstName':
          aValue = a.shippingFirstName || ''
          bValue = b.shippingFirstName || ''
          break
        case 'shippingLastName':
          aValue = a.shippingLastName || ''
          bValue = b.shippingLastName || ''
          break
        case 'shippingFullName':
          aValue = `${a.shippingFirstName} ${a.shippingLastName}`
          bValue = `${b.shippingFirstName} ${b.shippingLastName}`
          break
        case 'requestedShipping':
          aValue = a.requestedShipping || ''
          bValue = b.requestedShipping || ''
          break
        case 'totalAmount':
          aValue = Number(a.totalAmount) || 0
          bValue = Number(b.totalAmount) || 0
          break
        case 'itemCount':
          aValue = Number(a.itemCount) || 0
          bValue = Number(b.itemCount) || 0
          break
        case 'orderDate':
          aValue = new Date(a.orderDate).getTime() || 0
          bValue = new Date(b.orderDate).getTime() || 0
          break
        case 'orderTime':
          aValue = new Date(a.orderDate).getTime() || 0
          bValue = new Date(b.orderDate).getTime() || 0
          break
        case 'orderDay':
          aValue = new Date(a.orderDate).getDay() || 0
          bValue = new Date(b.orderDate).getDay() || 0
          break
        case 'orderMonth':
          aValue = new Date(a.orderDate).getMonth() || 0
          bValue = new Date(b.orderDate).getMonth() || 0
          break
        case 'orderYear':
          aValue = new Date(a.orderDate).getFullYear() || 0
          bValue = new Date(b.orderDate).getFullYear() || 0
          break
        default:
          // Fallback for any other field
          aValue = String(a[sortConfig.field as keyof Order] || '')
          bValue = String(b[sortConfig.field as keyof Order] || '')
      }

      // Handle different data types for comparison
      if (sortConfig.field === 'orderDate' || sortConfig.field === 'orderTime') {
        // Already converted to timestamps above
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else if (sortConfig.field === 'totalAmount' || sortConfig.field === 'itemCount' ||
                 sortConfig.field === 'orderDay' || sortConfig.field === 'orderMonth' || sortConfig.field === 'orderYear') {
        // Numeric comparison
        if (sortConfig.direction === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else {
        // String comparison (case insensitive)
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()

        if (sortConfig.direction === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      }
    })
  }

  const renderCellContent = (column: ColumnConfig, order: Order) => {
    switch (column.field) {
      case 'orderNumber':
        return (
          <button
            onClick={() => handleViewOrderDetails(order)}
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
            {order.status}
          </span>
        )
      case 'fulfillmentStatus':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fulfillmentColors[order.fulfillmentStatus as keyof typeof fulfillmentColors]}`}>
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
            onClick={() => handleViewOrderDetails(order)}
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
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleViewOrderDetails(order)}
              className="text-indigo-600 hover:text-indigo-900"
              title="View order details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          </div>
        )
      default:
        return null
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filters.status === '' || order.status === filters.status
    const matchesFulfillment = filters.fulfillmentStatus === '' || order.fulfillmentStatus === filters.fulfillmentStatus
    const matchesPlatform = filters.platform === '' || order.platform === filters.platform

    return matchesSearch && matchesStatus && matchesFulfillment && matchesPlatform
  })

  const sortedOrders = React.useMemo(() => {
    try {
      return getSortedOrders(filteredOrders)
    } catch (error) {
      console.error('Error sorting orders:', error)
      return filteredOrders
    }
  }, [filteredOrders, sortConfig])

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = sortedOrders.slice(startIndex, endIndex)

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting orders...', sortedOrders)
  }

  // Reset user preferences to defaults
  const resetUserPreferences = () => {
    const defaultSettings = {
      sortConfig: { field: 'orderDate', direction: 'desc' },
      columns: [
        { id: 'orderNumber', field: 'orderNumber', label: 'Order', sortable: true, visible: true },
        { id: 'customerName', field: 'customerName', label: 'Customer', sortable: true, visible: true },
        { id: 'status', field: 'status', label: 'Status', sortable: true, visible: true },
        { id: 'fulfillmentStatus', field: 'fulfillmentStatus', label: 'Fulfillment', sortable: true, visible: true },
        { id: 'totalAmount', field: 'totalAmount', label: 'Total', sortable: true, visible: true },
        { id: 'itemCount', field: 'itemCount', label: 'Items', sortable: true, visible: true },
        { id: 'platform', field: 'platform', label: 'Platform', sortable: true, visible: true },
        { id: 'country', field: 'country', label: 'Country', sortable: true, visible: true },
        { id: 'orderDate', field: 'orderDate', label: 'Date', sortable: true, visible: true },
        { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },
      ],
      filters: {
        status: '',
        fulfillmentStatus: '',
        platform: '',
        dateRange: ''
      },
      showFilters: false
    }

    setSortConfig(defaultSettings.sortConfig as SortState)
    setColumns(defaultSettings.columns)
    setFilters(defaultSettings.filters)
    setShowFilters(defaultSettings.showFilters)
    setCurrentPage(1)

    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        console.log('Sort clicked for column:', column.field) // Debug log
        handleSort(column.field)
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Orders Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all your orders from various platforms.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            User preferences saved for: <span className="font-mono">{userId}</span>
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColumnSettings(!showColumnSettings)}
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Columns
            </button>

            {/* Column Visibility Dropdown */}
            {showColumnSettings && (
              <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b border-gray-200">
                    Show/Hide Columns
                  </div>
                  {columns.map((column) => (
                    <label key={column.id} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={column.visible}
                        onChange={(e) => handleColumnVisibilityChange(column.id, e.target.checked)}
                        className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={column.id === 'actions'} // Always keep actions visible
                      />
                      <span className={column.id === 'actions' ? 'text-gray-400' : ''}>
                        {column.label}
                      </span>
                    </label>
                  ))}
                  <div className="border-t border-gray-200 px-4 py-2">
                    <button
                      onClick={() => {
                        console.log('Current columns:', columns.map(c => c.label))
                        console.log('Stored columns raw:', localStorage.getItem(STORAGE_KEYS.columns))
                        const stored = localStorage.getItem(STORAGE_KEYS.columns)
                        if (stored) {
                          const parsed = JSON.parse(stored)
                          console.log('Stored columns parsed:', parsed.map((c: ColumnConfig) => c.label))
                        }
                        console.log('Storage keys:', STORAGE_KEYS)
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Debug: Log Column State
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={resetUserPreferences}
            className="inline-flex items-center gap-x-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            title="Reset column order, sorting, and filters to defaults"
          >
            Reset Layout
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Orders
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search orders, customers, or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fulfillment</label>
              <select
                value={filters.fulfillmentStatus}
                onChange={(e) => setFilters({ ...filters, fulfillmentStatus: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Fulfillment</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PICKING">Picking</option>
                <option value="PACKED">Packed</option>
                <option value="READY_TO_SHIP">Ready to Ship</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                value={filters.platform}
                onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Platforms</option>
                <option value="Shopify">Shopify</option>
                <option value="WooCommerce">WooCommerce</option>
                <option value="BigCommerce">BigCommerce</option>
                <option value="Magento">Magento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
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
                    {currentOrders.map((order) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, sortedOrders.length)}</span> of{' '}
                  <span className="font-medium">{sortedOrders.length}</span> results
                </p>
              </div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          isOpen={showOrderDetails}
          onClose={() => setShowOrderDetails(false)}
          order={selectedOrder}
        />
      )}
    </div>
  )
}
