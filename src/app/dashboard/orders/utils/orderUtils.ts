// File: app/dashboard/orders/utils/orderUtils.ts

import { Order, OrderWithDetails, OrderItem, Address } from './orderTypes'

/**
 * Calculate total item count from items array (sum of all quantities)
 */
export function calculateTotalItemCount(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Parse line items from JSON string to OrderItem array
 * Handles the lineItems field which stores items as a JSON string
 */
function parseLineItems(order: Order): OrderItem[] {
  if (!order.lineItems) {
    console.warn(`Order ${order.orderNumber} has no lineItems data`)
    return []
  }

  try {
    const parsed = JSON.parse(order.lineItems)

    // Ensure the parsed data is an array
    const itemsArray = Array.isArray(parsed) ? parsed : [parsed]

    // Map to OrderItem structure, ensuring all required fields exist
    return itemsArray.map((item: any, index: number) => ({
      id: item.id || `${order.id}-item-${index + 1}`,
      name: item.name || 'Unknown Item',
      sku: item.sku || `SKU-${index + 1}`,
      quantity: item.quantity || 1,
      price: item.price || 0,
      currency: item.currency || order.currency,
      variant: item.variant || '',
      weight: item.weight || 0,
      location: item.location,
      meta: item.meta || {}
    }))
  } catch (error) {
    console.error(`Failed to parse lineItems for order ${order.orderNumber}:`, error)
    return []
  }
}

/**
 * Build shipping address from order data
 */
function buildShippingAddress(order: Order): Address {
  return {
    firstName: order.shippingFirstName || '',
    lastName: order.shippingLastName || '',
    address1: order.shippingAddress1 || '',
    address2: order.shippingAddress2,
    city: order.shippingCity || '',
    state: order.shippingProvince || '',
    zip: order.shippingZip || '',
    country: order.shippingCountry || order.country || '',
    countryCode: order.shippingCountryCode || order.countryCode || '',
    phone: order.shippingPhone
  }
}

/**
 * Build billing address from order data
 * Uses actual billing address fields if available, falls back to shipping address
 */
function buildBillingAddress(order: Order): Address {
  // Check if order has billing address fields
  const hasBillingAddress = order.billingAddress1 && order.billingCity && order.billingProvince && order.billingZip

  if (hasBillingAddress) {
    // Use actual billing address
    return {
      firstName: order.billingFirstName || order.shippingFirstName || '',
      lastName: order.billingLastName || order.shippingLastName || '',
      address1: order.billingAddress1 || '',
      address2: order.billingAddress2,
      city: order.billingCity || '',
      state: order.billingProvince || '',
      zip: order.billingZip || '',
      country: order.billingCountry || order.country || '',
      countryCode: order.billingCountryCode || order.countryCode || '',
      phone: order.billingPhone,
      company: order.billingCompany
    }
  }

  // Fall back to shipping address (common for many e-commerce orders)
  return {
    firstName: order.shippingFirstName || '',
    lastName: order.shippingLastName || '',
    address1: order.shippingAddress1 || '',
    address2: order.shippingAddress2,
    city: order.shippingCity || '',
    state: order.shippingProvince || '',
    zip: order.shippingZip || '',
    country: order.shippingCountry || order.country || '',
    countryCode: order.shippingCountryCode || order.countryCode || '',
    phone: order.shippingPhone
  }
}

/**
 * Calculate or extract tax amount from order
 * If OrderWithDetails has taxAmount, it's already calculated by the platform
 */
function getTaxAmount(order: Order): number {
  // Check if this is already an OrderWithDetails with taxAmount
  if ('taxAmount' in order && typeof order.taxAmount === 'number') {
    return order.taxAmount
  }

  // If not available, return 0
  // Tax should be provided by the e-commerce platform during order sync
  return 0
}

/**
 * Calculate or extract shipping cost from order
 * If OrderWithDetails has shippingCost, it's already set by the platform
 */
function getShippingCost(order: Order): number {
  // Check if this is already an OrderWithDetails with shippingCost
  if ('shippingCost' in order && typeof order.shippingCost === 'number') {
    return order.shippingCost
  }

  // If not available, return 0
  // Shipping cost should be provided by the e-commerce platform during order sync
  return 0
}

/**
 * Parse discounts from order data
 * If OrderWithDetails has discounts array, use it
 */
function getDiscounts(order: Order): Array<{ code: string; amount: number; description: string; type?: 'fixed' | 'percentage' }> {
  // Check if this is already an OrderWithDetails with discounts
  if ('discounts' in order && Array.isArray(order.discounts)) {
    return order.discounts
  }

  // If not available, return empty array
  // Discounts should be provided by the e-commerce platform during order sync
  return []
}

/**
 * Get fees from order
 */
function getFees(order: Order): number {
  // Check if this is already an OrderWithDetails with fees
  if ('fees' in order && typeof order.fees === 'number') {
    return order.fees
  }

  return 0
}

/**
 * Get handling fee from order
 */
function getHandlingFee(order: Order): number {
  // Check if this is already an OrderWithDetails with handlingFee
  if ('handlingFee' in order && typeof order.handlingFee === 'number') {
    return order.handlingFee
  }

  return 0
}

/**
 * Get notes from order
 */
function getNotes(order: Order): string | undefined {
  // Check if this is already an OrderWithDetails with notes
  if ('notes' in order && typeof order.notes === 'string') {
    return order.notes
  }
  return undefined
}

/**
 * Transform Order to OrderWithDetails
 * Converts the flat Order structure into a detailed order with parsed items and structured addresses
 */
export function transformToDetailedOrder(order: Order): OrderWithDetails {
  // Parse items from JSON string
  const items = parseLineItems(order)

  // Calculate actual item count from parsed items
  const calculatedItemCount = calculateTotalItemCount(items)

  // Build structured addresses from order fields
  const shippingAddress = buildShippingAddress(order)
  const billingAddress = buildBillingAddress(order)

  // Extract or calculate financial details
  const taxAmount = getTaxAmount(order)
  const shippingCost = getShippingCost(order)
  const discounts = getDiscounts(order)
  const fees = getFees(order)
  const handlingFee = getHandlingFee(order)
  const notes = getNotes(order)

  // Calculate subtotal from items
  const subtotal = calculateOrderSubtotal(items)

  // Calculate discount total
  const discountTotal = calculateOrderDiscountTotal(discounts)

  return {
    ...order,

    // Use calculated item count to ensure consistency
    itemCount: calculatedItemCount,

    // Parsed items array
    items: items,

    // Structured addresses
    shippingAddress: shippingAddress,
    billingAddress: billingAddress,

    // Shipping method from order
    shippingMethod: order.requestedShipping,

    // Financial details (from order or calculated)
    shippingCost: shippingCost,
    taxAmount: taxAmount,
    subtotal: subtotal,
    discountTotal: discountTotal,
    fees: fees,
    handlingFee: handlingFee,

    // Discounts
    discounts: discounts,

    // Tracking number from order (may be undefined)
    trackingNumber: order.trackingNumber || '',

    // Notes
    notes: notes
  }
}

/**
 * Format currency amount with proper locale and currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Format date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
/**
 * Format date for packing slip (longer format without time)
 */
export function formatDateForPackingSlip(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Calculate total weight from items array
 */
export function calculateTotalWeight(items: { weight?: number; quantity: number }[]): number {
  return items.reduce((sum, item) => {
    const itemWeight = item.weight || 0
    return sum + (itemWeight * item.quantity)
  }, 0)
}

/**
 * Validate that an order has sufficient data for detailed view
 */
export function validateOrderData(order: Order): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!order.lineItems) {
    errors.push('Order has no line items data')
  }

  if (!order.shippingAddress1 || !order.shippingCity || !order.shippingProvince || !order.shippingZip) {
    errors.push('Order has incomplete shipping address')
  }

  if (!order.shippingFirstName || !order.shippingLastName) {
    errors.push('Order has incomplete customer name')
  }

  return {
    valid: errors.length === 0,
    errors: errors
  }
}

/**
 * Calculate order subtotal from items (before tax and shipping)
 */
export function calculateOrderSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
}

/**
 * Calculate order total discount amount
 */
export function calculateOrderDiscountTotal(discounts: Array<{ amount: number }>): number {
  return discounts.reduce((sum, discount) => sum + discount.amount, 0)
}

/**
 * Verify order total matches calculated amounts
 * Useful for validation and debugging
 */
export function verifyOrderTotal(order: OrderWithDetails): {
  matches: boolean
  calculated: number
  actual: number
  difference: number
} {
  const subtotal = calculateOrderSubtotal(order.items)
  const discountTotal = calculateOrderDiscountTotal(order.discounts || [])
  const calculated = subtotal - discountTotal + (order.taxAmount || 0) + (order.shippingCost || 0) + (order.fees || 0) + (order.handlingFee || 0)
  const actual = order.totalAmount
  const difference = Math.abs(calculated - actual)

  return {
    matches: difference < 0.01, // Allow for rounding differences
    calculated: calculated,
    actual: actual,
    difference: difference
  }
}
