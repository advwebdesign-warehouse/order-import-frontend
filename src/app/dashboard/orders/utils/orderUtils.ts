// File: app/dashboard/orders/utils/orderUtils.ts

import { Order, OrderWithDetails, OrderItem } from './orderTypes'

/**
 * Calculate total item count from items array (sum of all quantities)
 */
export function calculateTotalItemCount(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Generate items array that matches the target item count
 */
function generateItemsForOrder(order: Order, targetCount: number): OrderItem[] {
  const possibleItems = [
    {
      name: 'Premium T-Shirt',
      sku: 'TSH-001',
      price: 29.99,
      weight: 0.5,
      variant: 'Blue - Large',
      meta: { color: 'Blue', size: 'Large', material: '100% Cotton' }
    },
    {
      name: 'Cotton Hoodie',
      sku: 'HOD-001',
      price: 69.99,
      weight: 1.2,
      variant: 'Gray - Medium',
      meta: { color: 'Gray', size: 'Medium', material: '80% Cotton, 20% Polyester' }
    },
    {
      name: 'Baseball Cap',
      sku: 'CAP-001',
      price: 24.99,
      weight: 0.3,
      variant: 'Black - One Size',
      meta: { color: 'Black', size: 'One Size', material: '100% Cotton' }
    },
    {
      name: 'Canvas Tote Bag',
      sku: 'BAG-001',
      price: 19.99,
      weight: 0.4,
      variant: 'Natural - Standard',
      meta: { color: 'Natural', size: 'Standard', material: '100% Canvas' }
    },
    {
      name: 'Wireless Earbuds',
      sku: 'WEB-001',
      price: 89.99,
      weight: 0.2,
      variant: 'White - Standard',
      meta: { color: 'White', size: 'Standard', material: 'Plastic' }
    }
  ]

  const items: OrderItem[] = []
  let remainingCount = targetCount

  // Special cases for specific orders to make them realistic
  if (order.orderNumber === 'ORD-2025-017' && targetCount === 3) {
    return [
      {
        id: '1',
        name: 'Premium T-Shirt',
        sku: 'TSH-001',
        quantity: 2, // 2 T-shirts
        price: 29.99,
        currency: order.currency,
        variant: 'Blue - Large',
        weight: 0.5,
        meta: { color: 'Blue', size: 'Large', material: '100% Cotton' }
      },
      {
        id: '2',
        name: 'Canvas Tote Bag',
        sku: 'BAG-001',
        quantity: 1, // 1 bag
        price: 19.99,
        currency: order.currency,
        variant: 'Natural - Standard',
        weight: 0.4,
        meta: { color: 'Natural', size: 'Standard', material: '100% Canvas' }
      }
    ] // Total: 2 + 1 = 3 items
  }

  // For other orders, distribute items intelligently
  const maxItemsToUse = Math.min(3, possibleItems.length)

  for (let i = 0; i < maxItemsToUse && remainingCount > 0; i++) {
    const item = possibleItems[i]

    // Calculate quantity for this item
    let quantity: number
    if (i === maxItemsToUse - 1) {
      // Last item gets all remaining count
      quantity = remainingCount
    } else {
      // Distribute reasonably - between 1 and half of remaining
      quantity = Math.min(remainingCount, Math.max(1, Math.floor(remainingCount / (maxItemsToUse - i))))
    }

    items.push({
      id: `${order.id}-item-${i + 1}`,
      name: item.name,
      sku: item.sku,
      quantity: quantity,
      price: item.price,
      currency: order.currency,
      variant: item.variant,
      weight: item.weight,
      meta: item.meta
    })

    remainingCount -= quantity
  }

  // Verify we hit the target
  const actualTotal = calculateTotalItemCount(items)
  if (actualTotal !== targetCount) {
    console.warn(`Item count mismatch for ${order.orderNumber}: expected ${targetCount}, got ${actualTotal}`)
  }

  return items
}

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

  // Generate items that match the order's itemCount
  const items = generateItemsForOrder(order, order.itemCount || 1)
  const calculatedItemCount = calculateTotalItemCount(items)

  return {
    ...order,
    itemCount: calculatedItemCount, // Use calculated count to ensure consistency
    items: items,
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

// Fixed getUserId function with client-side check
export function getUserId(): string {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    // Return a default ID for server-side rendering
    return 'user_ssr_fallback'
  }

  try {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', id)
    }
    return id
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available:', error)
    return 'user_fallback_' + Math.random().toString(36).substr(2, 9)
  }
}

export function generateStorageKeys(userId: string) {
  return {
    sortConfig: `orders_sort_${userId}`,
    columns: `orders_columns_${userId}`,
    filters: `orders_filters_${userId}`,
    showFilters: `orders_show_filters_${userId}`,
  }
}
