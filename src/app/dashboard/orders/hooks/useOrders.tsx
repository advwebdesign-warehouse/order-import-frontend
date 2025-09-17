import { useState, useEffect } from 'react'
import { Order } from '../utils/orderTypes'

// Mock data - in real app, this would be an API call
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    totalAmount: 129.99,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'Shopify',
    orderDate: '2025-09-15T10:30:00Z',
    itemCount: 3,
    shippingFirstName: 'John',
    shippingLastName: 'Smith',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping'
  },
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@email.com',
    totalAmount: 89.50,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'WooCommerce',
    orderDate: '2025-09-14T14:20:00Z',
    itemCount: 2,
    shippingFirstName: 'Sarah',
    shippingLastName: 'Johnson',
    country: 'Canada',
    countryCode: 'CA',
    requestedShipping: 'Express Shipping'
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerName: 'Mike Wilson',
    customerEmail: 'mike.wilson@email.com',
    totalAmount: 245.00,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'Shopify',
    orderDate: '2025-09-16T09:15:00Z',
    itemCount: 5,
    shippingFirstName: 'Mike',
    shippingLastName: 'Wilson',
    country: 'United Kingdom',
    countryCode: 'GB',
    requestedShipping: 'Priority Shipping'
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-004',
    customerName: 'Emily Davis',
    customerEmail: 'emily.davis@email.com',
    totalAmount: 67.25,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'BigCommerce',
    orderDate: '2025-09-12T16:45:00Z',
    itemCount: 1,
    shippingFirstName: 'Emily',
    shippingLastName: 'Davis',
    country: 'Australia',
    countryCode: 'AU',
    requestedShipping: 'Standard Shipping'
  },
  {
    id: '5',
    orderNumber: 'ORD-2025-005',
    customerName: 'David Brown',
    customerEmail: 'david.brown@email.com',
    totalAmount: 156.75,
    currency: 'EUR',
    status: 'CANCELLED',
    fulfillmentStatus: 'PENDING',
    platform: 'Shopify',
    orderDate: '2025-09-13T11:00:00Z',
    itemCount: 4,
    shippingFirstName: 'David',
    shippingLastName: 'Brown',
    country: 'Germany',
    countryCode: 'DE',
    requestedShipping: 'Express Shipping'
  }
]

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call
    const fetchOrders = async () => {
      try {
        setLoading(true)
        // In real app: const response = await fetch('/api/orders')
        // const orders = await response.json()

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        setOrders(mockOrders)
        setError(null)
      } catch (err) {
        setError('Failed to fetch orders')
        console.error('Error fetching orders:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const refetchOrders = async () => {
    // Function to refresh orders data
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setOrders([...mockOrders]) // Force re-render with fresh data
    setLoading(false)
  }

  return {
    orders,
    loading,
    error,
    refetchOrders
  }
}
