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
import ReactCountryFlag from "react-country-flag"
import OrderDetailsModal from './OrderDetailsModal'

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
  trackingNumber: string
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
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const [filters, setFilters] = useState<FilterState>({
    status: '',
    fulfillmentStatus: '',
    platform: '',
    dateRange: ''
  })

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
      trackingNumber: 'TRK123456789'
    }

    setSelectedOrder(orderWithDetails)
    setShowOrderDetails(true)
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

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const handleExport = () => {
    // TODO: Implement CSV export
    console.log('Exporting orders...', filteredOrders)
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
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
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
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Fulfillment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fulfillmentColors[order.fulfillmentStatus as keyof typeof fulfillmentColors]}`}>
                          {order.fulfillmentStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline cursor-pointer"
                        >
                          {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.platform}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <CountryFlag countryCode={order.countryCode} />
                          <span className="sr-only">{order.country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(order.orderDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewOrderDetails(order)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span> of{' '}
                  <span className="font-medium">{filteredOrders.length}</span> results
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
