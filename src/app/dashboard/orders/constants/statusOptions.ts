//================================================================================
//file path: app/dashboard/orders/constants/statusOptions.ts
//================================================================================

import { STATUS_COLORS, FULFILLMENT_COLORS } from './orderConstants'

export const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: STATUS_COLORS.PENDING },
  { value: 'PROCESSING', label: 'Processing', color: STATUS_COLORS.PROCESSING },
  { value: 'COMPLETED', label: 'Completed', color: STATUS_COLORS.COMPLETED },
  { value: 'SHIPPED', label: 'Shipped', color: STATUS_COLORS.SHIPPED },
  { value: 'DELIVERED', label: 'Delivered', color: STATUS_COLORS.DELIVERED },
  { value: 'CANCELLED', label: 'Cancelled', color: STATUS_COLORS.CANCELLED },
  { value: 'REFUNDED', label: 'Refunded', color: STATUS_COLORS.REFUNDED }
]

export const FULFILLMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: FULFILLMENT_COLORS.PENDING },
  { value: 'PROCESSING', label: 'Processing', color: FULFILLMENT_COLORS.PROCESSING },
  { value: 'PICKING', label: 'Picking', color: FULFILLMENT_COLORS.PICKING },
  { value: 'PACKING', label: 'Packing', color: FULFILLMENT_COLORS.PACKING },
  { value: 'PACKED', label: 'Packed', color: FULFILLMENT_COLORS.PACKED },
  { value: 'READY_TO_SHIP', label: 'Ready to Ship', color: FULFILLMENT_COLORS.READY_TO_SHIP },
  { value: 'SHIPPED', label: 'Shipped', color: FULFILLMENT_COLORS.SHIPPED },
  { value: 'DELIVERED', label: 'Delivered', color: FULFILLMENT_COLORS.DELIVERED }
]
