//file path: app/dashboard/orders/utils/orderTypes.ts

// ============================================================================
// PRODUCT REFERENCE (Import only for typing, not for data storage)
// ============================================================================
// We import Product types for reference purposes only
// OrderItem stores its own snapshot of product data at time of purchase
import type { Product, ProductVariant, VariantAttribute } from '../../products/utils/productTypes'

// ============================================================================
// COUNTRY AND ADDRESS TYPES
// ============================================================================

/**
 * Country information with code
 */
export interface Country {
  name: string       // Full country name (e.g., "United States")
  code: string       // ISO 3166-1 alpha-2 code (e.g., "US")
  code3?: string     // ISO 3166-1 alpha-3 code (e.g., "USA")
}

/**
 * Shipping Address - Used for order shipping and label generation
 * ✅ Consolidated from multiple sources
 */
export interface ShippingAddress {
  // Street address
  streetAddress: string      // Address line 1 (also: address1)
  secondaryAddress?: string  // Address line 2 (also: address2, apt/suite)

  // Location
  city: string
  state: string              // State/Province code (e.g., "NY", "CA")
  zipCode: string            // ZIP/Postal code

  // Country
  country: string            // Country name (e.g., "United States")
  countryCode: string        // ISO country code (e.g., "US")

  // Contact
  phone?: string
}

/**
 * Billing/Contact Address - More detailed than shipping address
 */
export interface Address {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
  phone?: string
  company?: string
  email?: string
}

// ============================================================================
// SHIPPING LABEL
// ============================================================================

export interface ShippingLabel {
  id: string
  trackingNumber: string
  carrier: 'USPS' | 'UPS' | 'FedEx'
  serviceType: string
  labelUrl: string
  labelImage?: string
  postage: number
  createdAt: string
  shipDate: string
  deliveryDate?: string
  weight: {
    lbs: number
    oz: number
  }
  dimensions?: {
    length: number
    width: number
    height: number
  }
  // Tracking information
  trackingStatus?: string
  trackingCategory?: 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown'
  trackingLocation?: string
  trackingLastUpdate?: string
  trackingEvents?: Array<{
    timestamp: string
    status: string
    location: string
    description: string
  }>
}

// ============================================================================
// ORDER ITEM TYPES
// ============================================================================

/**
 * Order Item - SNAPSHOT-BASED DESIGN
 *
 * 🎯 CRITICAL DESIGN PRINCIPLE:
 * OrderItem is a HISTORICAL SNAPSHOT of the product at the time of purchase.
 * It stores all data needed to preserve the exact state of the order, even if:
 * - Product prices change
 * - Product is deleted
 * - Variant attributes are renamed
 * - Product metadata is modified
 *
 * The productId/sku are REFERENCES for:
 * - Inventory tracking
 * - Fulfillment
 * - Looking up current product info (if needed)
 *
 * ✅ DO: Store all display and pricing data in OrderItem
 * ❌ DON'T: Rely on Product lookup for order history display
 */
export interface OrderItem {
  // ═══════════════════════════════════════════════════════════════
  // IDENTITY & REFERENCES
  // ═══════════════════════════════════════════════════════════════
  id: string                 // Unique order item ID

  // Product Reference (for inventory/fulfillment, NOT for display data)
  productId?: string         // Reference to Product.id (may be null if product deleted)
  sku: string                // Product SKU (SNAPSHOT - preserved even if product SKU changes)
  externalProductId?: string // External ID from platform (Shopify, WooCommerce, etc.)

  // Variant Reference (if applicable)
  variantId?: string         // Reference to ProductVariant.id (may be null if variant deleted)
  variantSku?: string        // Variant SKU (SNAPSHOT)

  // ═══════════════════════════════════════════════════════════════
  // DISPLAY INFORMATION (SNAPSHOT - What customer saw at purchase time)
  // ═══════════════════════════════════════════════════════════════
  name: string               // Product name AT TIME OF ORDER (preserved forever)
  description?: string       // Product description at time of order
  variant?: string           // Variant display text (e.g., "Large / Blue")
  image?: string             // Product image URL at time of order

  // Variant Attributes (SNAPSHOT of what was selected)
  variantAttributes?: VariantAttribute[]  // e.g., [{name: "Size", value: "Large"}, {name: "Color", value: "Blue"}]

  // ═══════════════════════════════════════════════════════════════
  // PRICING (SNAPSHOT - What customer paid)
  // ═══════════════════════════════════════════════════════════════
  price: number              // Unit price AT TIME OF ORDER (not current product price!)
  comparePrice?: number      // Compare-at price shown to customer
  costPrice?: number         // Cost to business (for margin calculation)
  currency: string           // Currency code (USD, EUR, etc.)

  // Discounts & Adjustments (per unit)
  discount?: number          // Discount amount per unit
  discountType?: 'fixed' | 'percentage' | 'bogo' | 'bundle'
  discountReason?: string    // e.g., "SUMMER20 promo code", "Bulk discount", "Price match"

  // Tax (per unit)
  tax?: number               // Tax amount per unit
  taxRate?: number           // Tax rate applied (e.g., 0.0825 for 8.25%)
  taxDescription?: string    // e.g., "CA Sales Tax"

  // ═══════════════════════════════════════════════════════════════
  // QUANTITY & FULFILLMENT
  // ═══════════════════════════════════════════════════════════════
  quantity: number           // Quantity ordered
  quantityFulfilled?: number // Quantity already shipped/fulfilled
  quantityRefunded?: number  // Quantity refunded
  quantityCancelled?: number // Quantity cancelled

  // ═══════════════════════════════════════════════════════════════
  // PHYSICAL PROPERTIES (SNAPSHOT - for shipping calculation)
  // ═══════════════════════════════════════════════════════════════
  weight?: number            // Weight in ounces (as configured at time of order)
  weightUnit?: 'oz' | 'lb' | 'g' | 'kg'
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: 'in' | 'cm'
  }

  // ═══════════════════════════════════════════════════════════════
  // FULFILLMENT & WAREHOUSE
  // ═══════════════════════════════════════════════════════════════
  warehouseId?: string       // Assigned warehouse for fulfillment
  location?: string          // Warehouse bin/shelf location
  fulfillmentStatus?: 'pending' | 'allocated' | 'picked' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMIZATION & PERSONALIZATION
  // ═══════════════════════════════════════════════════════════════
  customization?: string     // Personalization text (e.g., "Engrave: Happy Birthday John!")
  customFields?: {           // Custom fields for special requirements
    [key: string]: string | number | boolean
  }

  // Gift Options
  isGift?: boolean
  giftMessage?: string
  giftWrap?: boolean
  giftWrapStyle?: string

  // Special Instructions
  notes?: string             // Customer notes or special requests
  internalNotes?: string     // Internal fulfillment notes

  // ═══════════════════════════════════════════════════════════════
  // METADATA (For any additional platform-specific attributes)
  // ═══════════════════════════════════════════════════════════════
  meta?: {
    // Standard attributes (commonly used)
    color?: string
    size?: string
    material?: string
    style?: string

    // Platform-specific data
    shopifyVariantId?: string
    woocommerceVariationId?: string

    // Custom attributes from platform
    [key: string]: any
  }

  // ═══════════════════════════════════════════════════════════════
  // OPTIONAL: Current Product Data (populated on-demand)
  // ═══════════════════════════════════════════════════════════════
  // These are NOT stored in database, only populated when needed
  // for UI that wants to show current product info alongside order history
  currentProduct?: Product          // Current product data (if still exists)
  currentVariant?: ProductVariant   // Current variant data (if still exists)
  productDeleted?: boolean          // Flag if product no longer exists
  priceChanged?: boolean            // Flag if current price differs from order price
}

/**
 * Order Line Item Summary - Lightweight version for order listings
 * Use this when you don't need full order item details
 */
export interface OrderLineItemSummary {
  id: string
  productId?: string
  sku: string
  name: string
  variant?: string
  quantity: number
  price: number
  currency: string
  image?: string
  fulfillmentStatus?: string
}

// ============================================================================
// ORDER TYPES
// ============================================================================

/**
 * Main Order Interface
 * ✅ Core order data with integration tracking
 */
 export interface Order {
  // System identifiers
  id: string
  orderNumber: string

  // Integration tracking
  storeId: string
  integrationId?: string
  externalId?: string
  platform: string

  // Customer information
  customerName: string
  customerEmail: string

  // Order details
  totalAmount: number
  currency: string
  itemCount: number
  status: string
  fulfillmentStatus: string

  // Dates
  orderDate: string
  updatedAt?: string

  // Shipping information - Basic fields (for backward compatibility)
  shippingFirstName: string
  shippingLastName: string
  country: string
  countryCode: string
  requestedShipping: string

  // Shipping address - Detailed fields
  shippingAddress1?: string
  shippingAddress2?: string
  shippingCity?: string
  shippingProvince?: string        // State/Province
  shippingZip?: string
  shippingCountry?: string
  shippingCountryCode?: string
  shippingPhone?: string

  // ✅ NEW: Billing address - Detailed fields
  billingFirstName?: string
  billingLastName?: string
  billingAddress1?: string
  billingAddress2?: string
  billingCity?: string
  billingProvince?: string         // State/Province
  billingZip?: string
  billingCountry?: string
  billingCountryCode?: string
  billingPhone?: string
  billingCompany?: string
  
  // Warehouse assignment
  warehouseId?: string

  // Order items and weight
  lineItems?: string               // JSON string of items (for storage)
  totalWeight?: number             // Total weight in ounces

  // Shipping label support
  shippingLabel?: ShippingLabel
  trackingNumber?: string
}

/**
 * Detailed Order with Items and Addresses
 * Used when displaying full order details
 */
export interface OrderWithDetails extends Order {
  items: OrderItem[]             // ✅ Full order items (snapshot-based)
  shippingAddress: Address
  billingAddress: Address
  shippingMethod: string
  shippingCost?: number
  taxAmount?: number
  subtotal?: number              // Sum of all item prices before tax/shipping
  discountTotal?: number         // Total discounts applied
  fees?: number
  handlingFee?: number
  discounts?: {
    code: string
    amount: number
    description: string
    type?: 'fixed' | 'percentage'
  }[]
  trackingNumber: string
  notes?: string
  customerNotes?: string         // Notes from customer
  internalNotes?: string         // Internal notes
}

/**
 * Order with Summary Items - Lightweight version
 * Used for order lists where full item details aren't needed
 */
export interface OrderWithSummary extends Order {
  items: OrderLineItemSummary[]  // Lightweight item summaries
}

// ============================================================================
// FILTER AND SORT TYPES
// ============================================================================

/**
 * Order Filter State
 * ✅ Updated to support arrays for multi-select filters
 */
 export interface FilterState {
   status: string[]               // Order status (multi-select)
   fulfillmentStatus: string[]    // Fulfillment status (multi-select)
   platform: string[]             // Platform filter (multi-select)
   storeId: string[]              // Store filter (multi-select)
   integrationId?: string[]       // ✅ Integration filter (multi-select)
   warehouseId?: string           // Warehouse filter (single select)

   // Date range filters
   dateRange: string              // Preset date range (e.g., "today", "last7days")
   startDate: string              // Custom start date
   endDate: string                // Custom end date
 }

 /**
  * Sort Configuration
  */
 export interface SortState {
   field: string
   direction: 'asc' | 'desc'
 }

 /**
  * Column Configuration for Table Display
  */
export interface ColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

// ============================================================================
// COMPANY INFO
// ============================================================================

export interface CompanyInfo {
  name: string
  address: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
  website?: string
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an order has a shipping address
 */
export function hasShippingAddress(order: Order): boolean {
  return !!(
    order.shippingAddress1 &&
    order.shippingCity &&
    order.shippingProvince &&
    order.shippingZip
  )
}

/**
 * Type guard to check if an order has integration tracking
 */
export function hasIntegrationTracking(order: Order): boolean {
  return !!(order.integrationId && order.externalId)
}

/**
 * Type guard to check if OrderItem has variant information
 */
export function hasVariant(item: OrderItem): boolean {
  return !!(item.variantId || item.variantSku || (item.variantAttributes && item.variantAttributes.length > 0))
}

/**
 * Type guard to check if OrderItem is fulfilled
 */
export function isItemFulfilled(item: OrderItem): boolean {
  return item.quantityFulfilled === item.quantity
}

/**
 * Type guard to check if OrderItem is partially fulfilled
 */
export function isItemPartiallyFulfilled(item: OrderItem): boolean {
  return !!item.quantityFulfilled && item.quantityFulfilled > 0 && item.quantityFulfilled < item.quantity
}

/**
 * Type guard to check if OrderItem has customization
 */
export function hasCustomization(item: OrderItem): boolean {
  return !!(item.customization || item.isGift || item.giftMessage || item.customFields)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Order to ShippingAddress
 */
export function orderToShippingAddress(order: Order): ShippingAddress {
  return {
    streetAddress: order.shippingAddress1 || '',
    secondaryAddress: order.shippingAddress2 || '',
    city: order.shippingCity || '',
    state: order.shippingProvince || '',
    zipCode: order.shippingZip || '',
    country: order.shippingCountry || order.country || '',
    countryCode: order.shippingCountryCode || order.countryCode || '',
    phone: order.shippingPhone || '',
  }
}

/**
 * Convert ShippingAddress to Address (with customer info)
 */
export function shippingAddressToAddress(
  shippingAddress: ShippingAddress,
  firstName: string,
  lastName: string,
  email?: string
): Address {
  return {
    firstName,
    lastName,
    address1: shippingAddress.streetAddress,
    address2: shippingAddress.secondaryAddress || '',
    city: shippingAddress.city,
    state: shippingAddress.state,
    zip: shippingAddress.zipCode,
    country: shippingAddress.country,
    countryCode: shippingAddress.countryCode,
    phone: shippingAddress.phone || '',
    email,
  }
}

/**
 * Calculate base price for an order item (before tax/discount)
 */
export function calculateItemBasePrice(item: OrderItem): number {
  return item.price * item.quantity
}

/**
 * Calculate total discount for an order item
 */
export function calculateItemDiscount(item: OrderItem): number {
  return (item.discount || 0) * item.quantity
}

/**
 * Calculate total tax for an order item
 */
export function calculateItemTax(item: OrderItem): number {
  return (item.tax || 0) * item.quantity
}

/**
 * Calculate final total price for an order item (price - discount + tax)
 */
export function calculateItemTotal(item: OrderItem): number {
  const basePrice = calculateItemBasePrice(item)
  const discount = calculateItemDiscount(item)
  const tax = calculateItemTax(item)
  return basePrice - discount + tax
}

/**
 * Calculate subtotal for all items in an order (before discounts and tax)
 */
export function calculateOrderSubtotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + calculateItemBasePrice(item), 0)
}

/**
 * Calculate total discount for all items in an order
 */
export function calculateOrderDiscount(items: OrderItem[]): number {
  return items.reduce((total, item) => total + calculateItemDiscount(item), 0)
}

/**
 * Calculate total tax for all items in an order
 */
export function calculateOrderTax(items: OrderItem[]): number {
  return items.reduce((total, item) => total + calculateItemTax(item), 0)
}

/**
 * Calculate grand total for all items (subtotal - discount + tax)
 */
export function calculateItemsGrandTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + calculateItemTotal(item), 0)
}

/**
 * Get unfulfilled quantity for an order item
 */
export function getUnfulfilledQuantity(item: OrderItem): number {
  return item.quantity - (item.quantityFulfilled || 0) - (item.quantityCancelled || 0)
}

/**
 * Get refundable quantity for an order item
 */
export function getRefundableQuantity(item: OrderItem): number {
  return item.quantity - (item.quantityRefunded || 0) - (item.quantityCancelled || 0)
}

/**
 * Check if entire order is fulfilled
 */
export function isOrderFullyFulfilled(order: OrderWithDetails): boolean {
  return order.items.every(item => isItemFulfilled(item))
}

/**
 * Check if order has any fulfilled items
 */
export function hasAnyFulfilledItems(order: OrderWithDetails): boolean {
  return order.items.some(item => (item.quantityFulfilled || 0) > 0)
}

/**
 * Create OrderItem from Product (snapshot at time of adding to order)
 * This is used when creating a new order from current product data
 */
export function productToOrderItem(
  product: Product,
  quantity: number = 1,
  options?: {
    variantId?: string
    customPrice?: number      // Override price (for custom pricing)
    discount?: number         // Apply discount
    customization?: string    // Personalization
    warehouseId?: string      // Assign warehouse
  }
): OrderItem {
  // Find variant if specified
  const variant = options?.variantId
    ? product.variants?.find(v => v.id === options.variantId)
    : undefined

  // Use variant price if variant selected, otherwise product price
  const price = options?.customPrice ?? variant?.price ?? product.price

  return {
    id: '', // Will be set by backend
    productId: product.id,
    sku: variant?.sku || product.sku,
    externalProductId: product.externalId,
    variantId: variant?.id,
    variantSku: variant?.sku,

    // SNAPSHOT of display info
    name: product.name,
    description: product.shortDescription || product.description,
    variant: variant?.name,
    image: variant?.image || product.images?.[0]?.url,
    variantAttributes: variant?.attributes,

    // SNAPSHOT of pricing
    price: price,
    comparePrice: variant?.comparePrice || product.comparePrice,
    currency: product.currency,
    discount: options?.discount,

    // Quantity
    quantity: quantity,
    quantityFulfilled: 0,
    quantityRefunded: 0,
    quantityCancelled: 0,

    // Physical properties SNAPSHOT
    weight: variant?.weight || product.weight,
    dimensions: product.dimensions,

    // Fulfillment
    warehouseId: options?.warehouseId,
    fulfillmentStatus: 'pending',

    // Customization
    customization: options?.customization,

    // Meta
    meta: {
      // Copy any relevant product metadata
    }
  }
}
