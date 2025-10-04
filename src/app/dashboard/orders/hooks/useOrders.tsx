// File: app/dashboard/orders/hooks/useOrders.ts

import { useState, useEffect } from 'react'
import { Order } from '../utils/orderTypes'

// Updated mock orders data with warehouse assignments
const mockOrdersData: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    totalAmount: 129.97,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'Shopify',
    orderDate: '2025-09-19T10:30:00Z',
    itemCount: 3,
    shippingFirstName: 'John',
    shippingLastName: 'Smith',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.johnson@email.com',
    totalAmount: 89.47,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'WooCommerce',
    orderDate: '2025-09-19T14:15:00Z',
    itemCount: 2,
    shippingFirstName: 'Sarah',
    shippingLastName: 'Johnson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: '2',
    warehouseName: 'Los Angeles Warehouse'
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerName: 'Michael Brown',
    customerEmail: 'michael.brown@email.com',
    totalAmount: 156.23,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'BigCommerce',
    orderDate: '2025-09-18T09:45:00Z',
    itemCount: 4,
    shippingFirstName: 'Michael',
    shippingLastName: 'Brown',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-004',
    customerName: 'Emma Wilson',
    customerEmail: 'emma.wilson@email.com',
    totalAmount: 75.99,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'Shopify',
    orderDate: '2025-09-17T16:20:00Z',
    itemCount: 1,
    shippingFirstName: 'Emma',
    shippingLastName: 'Wilson',
    country: 'Canada',
    countryCode: 'CA',
    requestedShipping: 'International Shipping',
    warehouseId: '3',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '5',
    orderNumber: 'ORD-2025-005',
    customerName: 'David Lee',
    customerEmail: 'david.lee@email.com',
    totalAmount: 203.45,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PACKED',
    platform: 'Amazon',
    orderDate: '2025-09-19T11:00:00Z',
    itemCount: 5,
    shippingFirstName: 'David',
    shippingLastName: 'Lee',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Next Day Shipping',
    warehouseId: '2',
    warehouseName: 'Los Angeles Warehouse'
  },
  {
    id: '6',
    orderNumber: 'ORD-2025-006',
    customerName: 'Lisa Garcia',
    customerEmail: 'lisa.garcia@email.com',
    totalAmount: 67.89,
    currency: 'USD',
    status: 'CANCELLED',
    fulfillmentStatus: 'PENDING',
    platform: 'eBay',
    orderDate: '2025-09-16T13:30:00Z',
    itemCount: 2,
    shippingFirstName: 'Lisa',
    shippingLastName: 'Garcia',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '7',
    orderNumber: 'ORD-2025-007',
    customerName: 'James Taylor',
    customerEmail: 'james.taylor@email.com',
    totalAmount: 142.30,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PROCESSING',
    platform: 'Magento',
    orderDate: '2025-09-18T08:15:00Z',
    itemCount: 3,
    shippingFirstName: 'James',
    shippingLastName: 'Taylor',
    country: 'United Kingdom',
    countryCode: 'GB',
    requestedShipping: 'International Express',
    warehouseId: '3',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '8',
    orderNumber: 'ORD-2025-008',
    customerName: 'Anna Davis',
    customerEmail: 'anna.davis@email.com',
    totalAmount: 91.50,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'Shopify',
    orderDate: '2025-09-17T12:45:00Z',
    itemCount: 2,
    shippingFirstName: 'Anna',
    shippingLastName: 'Davis',
    country: 'Australia',
    countryCode: 'AU',
    requestedShipping: 'International Shipping',
    warehouseId: '2',
    warehouseName: 'Los Angeles Warehouse'
  },
  {
    id: '9',
    orderNumber: 'ORD-2025-009',
    customerName: 'Robert Miller',
    customerEmail: 'robert.miller@email.com',
    totalAmount: 198.75,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'READY_TO_SHIP',
    platform: 'WooCommerce',
    orderDate: '2025-09-19T07:22:00Z',
    itemCount: 6,
    shippingFirstName: 'Robert',
    shippingLastName: 'Miller',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '10',
    orderNumber: 'ORD-2025-010',
    customerName: 'Jennifer White',
    customerEmail: 'jennifer.white@email.com',
    totalAmount: 45.99,
    currency: 'USD',
    status: 'REFUNDED',
    fulfillmentStatus: 'PENDING',
    platform: 'Amazon',
    orderDate: '2025-09-15T19:55:00Z',
    itemCount: 1,
    shippingFirstName: 'Jennifer',
    shippingLastName: 'White',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '3',
    warehouseName: 'Chicago Warehouse'
  }
]

/**
 * Hook to fetch all orders across all warehouses
 */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // In a real app, this would be:
        // const response = await fetch('/api/orders')
        // const orders = await response.json()

        setOrders(mockOrdersData)
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const refreshOrders = async () => {
    // Create new object references to force React re-render
    setOrders(mockOrdersData.map(order => ({ ...order })))
  }

  // Add function to update order fulfillment status
  const updateOrdersFulfillmentStatus = async (orderIds: string[], newStatus: string) => {
    try {
      // In a real app, this would be an API call:
      // await fetch('/api/orders/bulk-update', {
      //   method: 'POST',
      //   body: JSON.stringify({ orderIds, fulfillmentStatus: newStatus })
      // })

      // Update the orders in state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          orderIds.includes(order.id)
            ? { ...order, fulfillmentStatus: newStatus }
            : order
        )
      )

      // Also update the mock data for persistence
      mockOrdersData.forEach(order => {
        if (orderIds.includes(order.id)) {
          order.fulfillmentStatus = newStatus
        }
      })

      return true
    } catch (err) {
      console.error('Error updating orders:', err)
      setError('Failed to update orders')
      return false
    }
  }

    /**
   * Update single order status
   */
  const updateStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      // Update mock data
      const orderIndex = mockOrdersData.findIndex(o => o.id === orderId)
      if (orderIndex !== -1) {
        mockOrdersData[orderIndex].status = newStatus
      }

      console.log(`Order ${orderId} status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  /**
   * Update single order fulfillment status
   */
  const updateFulfillmentStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fulfillmentStatus: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order fulfillment status')
      }

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
        )
      )

      // Update mock data
      const orderIndex = mockOrdersData.findIndex(o => o.id === orderId)
      if (orderIndex !== -1) {
        mockOrdersData[orderIndex].fulfillmentStatus = newStatus
      }

      console.log(`Order ${orderId} fulfillment status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order fulfillment status:', error)
      throw error
    }
  }

  // Then UPDATE your return statement to include these:
  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrdersFulfillmentStatus,
    updateStatus,              // ADD THIS
    updateFulfillmentStatus    // ADD THIS
  }
}
