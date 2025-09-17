import { Order, OrderWithDetails } from './orderTypes'

export function transformToDetailedOrder(order: Order): OrderWithDetails {
  // Generate realistic discount data for different orders
  const getDiscountData = (orderNumber: string) => {
    const discountConfigs = {
      'ORD-2025-001': [
        { code: 'WELCOME10', amount: 10.00, description: 'Welcome discount' },
        { code: 'FREESHIP', amount: 5.00, description: 'Free shipping promotion' }
      ],
      'ORD-2025-002': [
        { code: 'LOYALTY5', amount: 4.48, description: 'Loyalty member discount' }
      ],
      'ORD-2025-003': [
        { code: 'BUNDLE15', amount: 15.00, description: 'Bundle discount' },
        { code: 'STUDENT', amount: 8.50, description: 'Student discount' }
      ],
    }

    const discounts = discountConfigs[orderNumber as keyof typeof discountConfigs] || []
    return { discounts }
  }

  const { discounts } = getDiscountData(order.orderNumber)

  return {
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
    discounts: discounts,
    trackingNumber: 'TRK123456789',
    notes: order.id === '3' ? 'Please handle with care - fragile items' : undefined
  }
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateForPackingSlip(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function calculateTotalWeight(items: { weight?: number; quantity: number }[]): number {
  return items.reduce((sum, item) => {
    const itemWeight = item.weight || 0
    return sum + (itemWeight * item.quantity)
  }, 0)
}

export function getUserId(): string {
  let id = localStorage.getItem('userId')
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('userId', id)
  }
  return id
}

export function generateStorageKeys(userId: string) {
  return {
    sortConfig: `orders_sort_${userId}`,
    columns: `orders_columns_${userId}`,
    filters: `orders_filters_${userId}`,
    showFilters: `orders_show_filters_${userId}`,
  }
}
