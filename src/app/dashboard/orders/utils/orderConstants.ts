//file path: app/dashboard/orders/utils/orderConstants.ts

import { FulfillmentStatus } from '../../settings/types'

export const FULFILLMENT_STATUSES_NEED_SHIPPING = [
  'PROCESSING',
  'PICKING',
  'PACKING',
  'PACKED',
  'READY_TO_SHIP'
] as const

export const FULFILLMENT_STATUSES_READY_FOR_PACKING = [
  'PROCESSING',
  'PICKING',
  'PACKING',
  'PACKED',
  'READY_TO_SHIP'
] as const

export const FULFILLMENT_STATUSES_EXCLUDED = [
  'PENDING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED'
] as const

export const ALLOW_PROCESSING_PACKING_SLIPS = true

export const orderNeedsShipping = (order: { fulfillmentStatus: string; status?: string }): boolean => {
  if (FULFILLMENT_STATUSES_EXCLUDED.includes(order.fulfillmentStatus as any)) {
    return false
  }
  return FULFILLMENT_STATUSES_NEED_SHIPPING.includes(order.fulfillmentStatus as any)
}

export const orderNeedsPicking = (
  order: { fulfillmentStatus: string },
  fulfillmentStatuses: FulfillmentStatus[]
): boolean => {
  const statusConfig = fulfillmentStatuses.find(s => s.code === order.fulfillmentStatus)

  if (!statusConfig) {
    return ['PENDING', 'PROCESSING'].includes(order.fulfillmentStatus)
  }

  return statusConfig.needsPicking || false
}

export const orderNeedsShippingDynamic = (
  order: { fulfillmentStatus: string },
  fulfillmentStatuses: FulfillmentStatus[]
): boolean => {
  const statusConfig = fulfillmentStatuses.find(s => s.code === order.fulfillmentStatus)

  if (!statusConfig) {
    return orderNeedsShipping(order)
  }

  return statusConfig.needsShipping || false
}

export const orderReadyForPacking = (order: { fulfillmentStatus: string }): boolean => {
  if (FULFILLMENT_STATUSES_EXCLUDED.includes(order.fulfillmentStatus as any)) {
    return false
  }

  if (order.fulfillmentStatus === 'PROCESSING' && !ALLOW_PROCESSING_PACKING_SLIPS) {
    return false
  }

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

export const getFulfillmentStatusDescription = (status: string): string => {
  const descriptions: Record<string, string> = {
    'PENDING': 'Order received, awaiting processing',
    'PROCESSING': 'Order is being processed',
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
