//file path: app/dashboard/orders/utils/orderConstants.ts

import { FulfillmentStatus } from '../../settings/types'

// Fulfillment statuses that indicate an order needs shipping (for picking list)
// Based on "Needs Shipping" setting in fulfillment configuration
export const FULFILLMENT_STATUSES_NEED_SHIPPING = [
  'PROCESSING',
  'PICKING',
  'PACKING',
  'PACKED',
  'READY_TO_SHIP'
] as const

// Fulfillment statuses that indicate an order is ready for packing slip
// PROCESSING is included for flexibility but can be configured
export const FULFILLMENT_STATUSES_READY_FOR_PACKING = [
  'PROCESSING', // Optional - for cases where clients want to print packing slips early
  'PICKING',
  'PACKING',
  'PACKED',
  'READY_TO_SHIP'
] as const

// Fulfillment statuses that are excluded from operations
export const FULFILLMENT_STATUSES_EXCLUDED = [
  'PENDING',    // Not ready for any operations
  'SHIPPED',    // Already shipped
  'DELIVERED',  // Already delivered
  'CANCELLED'   // Cancelled orders
] as const

// Setting to control whether PROCESSING status can print packing slips
// This can be loaded from user settings/database
export const ALLOW_PROCESSING_PACKING_SLIPS = true // Make this configurable in settings

// Helper functions
export const orderNeedsShipping = (order: { fulfillmentStatus: string; status?: string }): boolean => {
  // Exclude if fulfillment status is in excluded list
  if (FULFILLMENT_STATUSES_EXCLUDED.includes(order.fulfillmentStatus as any)) {
    return false
  }

  // Include if fulfillment status indicates it needs shipping
  return FULFILLMENT_STATUSES_NEED_SHIPPING.includes(order.fulfillmentStatus as any)
}

// NEW: Helper function to check if order needs picking based on dynamic fulfillment configuration
export const orderNeedsPicking = (
  order: { fulfillmentStatus: string },
  fulfillmentStatuses: FulfillmentStatus[]
): boolean => {
  // Find the fulfillment status configuration for this order's status
  const statusConfig = fulfillmentStatuses.find(s => s.value === order.fulfillmentStatus)

  // If no configuration found, fall back to default behavior
  if (!statusConfig) {
    // Default to including statuses that typically need picking
    return ['PENDING', 'PROCESSING', 'ASSIGNED'].includes(order.fulfillmentStatus)
  }

  // Use the needsPicking field from the configuration
  return statusConfig.needsPicking || false
}

// NEW: Helper function to check if order needs shipping based on dynamic fulfillment configuration
export const orderNeedsShippingDynamic = (
  order: { fulfillmentStatus: string },
  fulfillmentStatuses: FulfillmentStatus[]
): boolean => {
  // Find the fulfillment status configuration for this order's status
  const statusConfig = fulfillmentStatuses.find(s => s.value === order.fulfillmentStatus)

  // If no configuration found, fall back to static function
  if (!statusConfig) {
    return orderNeedsShipping(order)
  }

  // Use the needsShipping field from the configuration
  return statusConfig.needsShipping || false
}

export const orderReadyForPacking = (order: { fulfillmentStatus: string }): boolean => {
  // Exclude if fulfillment status is in excluded list
  if (FULFILLMENT_STATUSES_EXCLUDED.includes(order.fulfillmentStatus as any)) {
    return false
  }

  // Check if PROCESSING should be allowed based on setting
  if (order.fulfillmentStatus === 'PROCESSING' && !ALLOW_PROCESSING_PACKING_SLIPS) {
    return false
  }

  // Check if order has started picking and is ready for packing slip
  return FULFILLMENT_STATUSES_READY_FOR_PACKING.includes(order.fulfillmentStatus as any)
}

export const orderIsComplete = (order: { fulfillmentStatus: string }): boolean => {
  return ['SHIPPED', 'DELIVERED'].includes(order.fulfillmentStatus)
}

export const orderIsCancelled = (order: { fulfillmentStatus: string }): boolean => {
  return order.fulfillmentStatus === 'CANCELLED'
}

export const orderIsPending = (order: { fulfillmentStatus: string }): boolean => {
  return order.fulfillmentStatus === 'PENDING'
}

// Get human-readable status descriptions
export const getFulfillmentStatusDescription = (status: string): string => {
  const descriptions: Record<string, string> = {
    'PENDING': 'Order received, awaiting processing',
    'PROCESSING': 'Order is being processed',
    'ASSIGNED': 'Order assigned to warehouse/picker',
    'PICKING': 'Items are being picked from inventory',
    'PACKING': 'Items are being packed for shipment',
    'PACKED': 'Order is packed and ready for shipping label',
    'READY_TO_SHIP': 'Order has shipping label and awaits carrier pickup',
    'SHIPPED': 'Order has been shipped',
    'DELIVERED': 'Order has been delivered',
    'CANCELLED': 'Order has been cancelled'
  }

  return descriptions[status] || status
}
