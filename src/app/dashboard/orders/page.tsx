'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactCountryFlag from "react-country-flag"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
  Cog6ToothIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'


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
  orderDate: string
  storeName: string
  orderNumber: string
  itemCount: number
  notes: string
  requestedShipping: string
  country: string
  countryCode: string
  shippingFirstName: string
  shippingLastName: string
  status: string
  totalAmount: number
  currency: string
  // Optional columns
  totalWeight?: number
  shipByDate?: string
  deliverByDate?: string
  shippingAddress?: {
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
  }
  billingAddress?: {
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
  }
}

interface Column {
  key: string
  label: string
  required: boolean
  visible: boolean
}

const DEFAULT_COLUMNS: Column[] = [
  { key: 'orderDate', label: 'Date', required: true, visible: true },
  { key: 'storeName', label: 'Store', required: true, visible: true },
  { key: 'orderNumber', label: 'Order #', required: true, visible: true },
  { key: 'itemCount', label: 'Items', required: true, visible: true },
  { key: 'notes', label: 'Notes', required: true, visible: true },
  { key: 'requestedShipping', label: 'Shipping', required: true, visible: true },
  { key: 'country', label: 'Country', required: true, visible: true },
  { key: 'shippingFirstName', label: 'First Name', required: true, visible: true },
  { key: 'shippingLastName', label: 'Last Name', required: true, visible: true },
  { key: 'status', label: 'Status', required: true, visible: true },
  { key: 'totalAmount', label: 'Total', required: true, visible: true },
]

const OPTIONAL_COLUMNS: Column[] = [
  { key: 'totalWeight', label: 'Weight', required: false, visible: false },
  { key: 'shipByDate', label: 'Ship By', required: false, visible: false },
  { key: 'deliverByDate', label: 'Deliver By', required: false, visible: false },
  { key: 'shippingAddress', label: 'Ship Address', required: false, visible: false },
  { key: 'billingAddress', label: 'Bill Address', required: false, visible: false },
]

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}


export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [columns, setColumns] = useState<Column[]>([...DEFAULT_COLUMNS, ...OPTIONAL_COLUMNS])

  // Mock data with the new column structure
  const mockOrders: Order[] = [
    {
      id: '1',
      orderDate: '2024-01-15T10:30:00Z',
      storeName: 'Main Store',
      orderNumber: 'ORD-2024-001',
      itemCount: 3,
      notes: 'Priority order',
      requestedShipping: 'Express',
      country: 'United States',
      countryCode: 'US',
      shippingFirstName: 'John',
      shippingLastName: 'Smith',
      status: 'PROCESSING',
      totalAmount: 149.99,
      currency: 'USD',
      totalWeight: 2.5,
      shipByDate: '2024-01-16T00:00:00Z',
      deliverByDate: '2024-01-18T00:00:00Z',
      shippingAddress: {
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      }
    },
    {
      id: '2',
      orderDate: '2024-01-14T14:22:00Z',
      storeName: 'Online Store',
      orderNumber: 'ORD-2024-002',
      itemCount: 2,
      notes: 'Gift wrap',
      requestedShipping: 'Standard',
      country: 'Canada',
      countryCode: 'CA',
      shippingFirstName: 'Sarah',
      shippingLastName: 'Johnson',
      status: 'SHIPPED',
      totalAmount: 89.50,
      currency: 'USD',
      totalWeight: 1.2,
      shipByDate: '2024-01-15T00:00:00Z',
      deliverByDate: '2024-01-17T00:00:00Z'
    },
    {
      id: '3',
      orderDate: '2024-01-16T09:15:00Z',
      storeName: 'Mobile Store',
      orderNumber: 'ORD-2024-003',
      itemCount: 1,
      notes: 'Fragile item',
      requestedShipping: 'Overnight',
      country: 'United Kingdom',
      countryCode: 'GB',
      shippingFirstName: 'Mike',
      shippingLastName: 'Wilson',
      status: 'PENDING',
      totalAmount: 299.99,
      currency: 'USD',
      totalWeight: 0.8,
      shipByDate: '2024-01-17T00:00:00Z',
      deliverByDate: '2024-01-19T00:00:00Z'
    }
  ]

  useEffect(() => {
    // Load user column preferences from localStorage
    const savedColumns = localStorage.getItem('orderColumns')
    if (savedColumns) {
      setColumns(JSON.parse(savedColumns))
    }

    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders)
      setLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatWeight = (weight?: number) => {
    if (!weight) return '-'
    return `${weight} lbs`
  }

  const toggleColumnVisibility = (columnKey: string) => {
    const updatedColumns = columns.map(col =>
      col.key === columnKey ? { ...col, visible: !col.visible } : col
    )
    setColumns(updatedColumns)
    localStorage.setItem('orderColumns', JSON.stringify(updatedColumns))
  }

  const renderCellContent = (order: Order, columnKey: string) => {
    switch (columnKey) {
      case 'orderDate':
        return formatDate(order.orderDate)
      case 'storeName':
        return order.storeName
      case 'orderNumber':
        return (
          <div>
            <div className="font-medium text-gray-900">{order.orderNumber}</div>
          </div>
        )
      case 'itemCount':
        return `${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}`
      case 'notes':
        return order.notes || '-'
      case 'requestedShipping':
        return order.requestedShipping
      case 'country':
        return (
            <div className="flex items-center gap-2">
              <CountryFlag countryCode={order.countryCode} />
              <span>{order.country}</span>
            </div>
          )
      case 'shippingFirstName':
        return order.shippingFirstName
      case 'shippingLastName':
        return order.shippingLastName
      case 'status':
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
        )
      case 'totalAmount':
        return formatCurrency(order.totalAmount, order.currency)
      case 'totalWeight':
        return formatWeight(order.totalWeight)
      case 'shipByDate':
        return order.shipByDate ? formatDate(order.shipByDate) : '-'
      case 'deliverByDate':
        return order.deliverByDate ? formatDate(order.deliverByDate) : '-'
      case 'shippingAddress':
        return order.shippingAddress ?
          `${order.shippingAddress.address1}, ${order.shippingAddress.city}` : '-'
      case 'billingAddress':
        return order.billingAddress ?
          `${order.billingAddress.address1}, ${order.billingAddress.city}` : '-'
      default:
        return '-'
    }
  }

  const visibleColumns = columns.filter(col => col.visible)
  const filteredOrders = orders.filter(order => {
    return !searchTerm ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingLastName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900">Orders</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all your imported orders from connected platforms.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:flex sm:gap-3">
          <button
            type="button"
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Cog6ToothIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Columns
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <ArrowDownTrayIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Customize Columns</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center">
                  <input
                    id={column.key}
                    type="checkbox"
                    checked={column.visible}
                    onChange={() => !column.required && toggleColumnVisibility(column.key)}
                    disabled={column.required}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <label htmlFor={column.key} className="ml-2 text-sm text-gray-700">
                    {column.label}
                    {column.required && <span className="text-gray-400 ml-1">(required)</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="relative max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 first:pl-6 last:pr-6"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="relative py-3.5 pl-3 pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="whitespace-nowrap py-4 px-3 text-sm text-gray-900 first:pl-6 last:pr-6"
                    >
                      {renderCellContent(order, column.key)}
                    </td>
                  ))}
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                    <div className="flex items-center gap-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/orders/${order.id}/edit`)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-sm text-gray-500">
                No orders found matching your criteria.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
