'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

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
}

interface FilterState {
  status: string
  fulfillmentStatus: string
  platform: string
  dateRange: string
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
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    fulfillmentStatus: '',
    platform: '',
    dateRange: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Mock data for now - will be replaced with API calls
  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customerName: 'John Smith',
      customerEmail: 'john@example.com',
      totalAmount: 149.99,
      currency: 'USD',
      status: 'PROCESSING',
      fulfillmentStatus: 'PICKING',
      platform: 'SHOPIFY',
      orderDate: '2024-01-15T10:30:00Z',
      itemCount: 3
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      totalAmount: 89.50,
      currency: 'USD',
      status: 'SHIPPED',
      fulfillmentStatus: 'SHIPPED',
      platform: 'SHOPIFY',
      orderDate: '2024-01-14T14:22:00Z',
      itemCount: 2
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      customerName: 'Mike Wilson',
      customerEmail: 'mike@example.com',
      totalAmount: 299.99,
      currency: 'USD',
      status: 'PENDING',
      fulfillmentStatus: 'PENDING',
      platform: 'SHOPIFY',
      orderDate: '2024-01-16T09:15:00Z',
      itemCount: 1
    }
  ]

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders)
      setPagination({
        page: 1,
        limit: 20,
        total: mockOrders.length,
        totalPages: 1
      })
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !filters.status || order.status === filters.status
    const matchesFulfillment = !filters.fulfillmentStatus || order.fulfillmentStatus === filters.fulfillmentStatus
    const matchesPlatform = !filters.platform || order.platform === filters.platform

    return matchesSearch && matchesStatus && matchesFulfillment && matchesPlatform
  })

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting orders...')
  }

  const handleViewOrder = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`)
  }

  const handleEditOrder = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}/edit`)
  }

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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <ArrowDownTrayIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
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

            {/* Filter Toggle */}
            <div className="mt-4 sm:mt-0 sm:ml-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <FunnelIcon className="-ml-0.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                Filters
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fulfillment</label>
                <select
                  className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={filters.fulfillmentStatus}
                  onChange={(e) => setFilters({...filters, fulfillmentStatus: e.target.value})}
                >
                  <option value="">All Fulfillment</option>
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKING">Picking</option>
                  <option value="PACKED">Packed</option>
                  <option value="READY_TO_SHIP">Ready to Ship</option>
                  <option value="SHIPPED">Shipped</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Platform</label>
                <select
                  className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={filters.platform}
                  onChange={(e) => setFilters({...filters, platform: e.target.value})}
                >
                  <option value="">All Platforms</option>
                  <option value="SHOPIFY">Shopify</option>
                  <option value="WOOCOMMERCE">WooCommerce</option>
                  <option value="BIGCOMMERCE">BigCommerce</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <select
                  className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Order
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Fulfillment
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Platform
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                        <div>
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-gray-500">{order.itemCount} items</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>
                          <div className="text-gray-900">{order.customerName}</div>
                          <div className="text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          fulfillmentColors[order.fulfillmentStatus as keyof typeof fulfillmentColors] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.platform}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <div className="flex items-center gap-x-2">
                          <button
                            onClick={() => handleViewOrder(order.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditOrder(order.id)}
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
            </div>

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

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{filteredOrders.length}</span> of{' '}
                <span className="font-medium">{filteredOrders.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
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
    </div>
  )
}
