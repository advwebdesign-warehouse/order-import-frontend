//file path: app/lib/shipping/shippingTypes.ts

/**
 * Shared types across all shipping carriers
 */

export interface BaseShippingAddress {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
  phone?: string
  email?: string
}

export interface BaseShippingRate {
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  serviceName: string
  serviceCode: string
  rate: number
  currency: string
  estimatedDays?: number
  deliveryDate?: string
}

export interface BaseShippingLabel {
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  trackingNumber: string
  labelFormat: 'PDF' | 'PNG' | 'ZPL'
  labelData: string // Base64 encoded
  cost: number
  currency: string
  createdAt: string
  shipDate: string
  estimatedDeliveryDate?: string
}

export interface BaseTrackingEvent {
  timestamp: string
  status: string
  statusCode: string
  location: string
  description: string
}

export interface BaseTrackingInfo {
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  trackingNumber: string
  status: string
  statusCategory: 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown'
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  currentLocation?: string
  events: BaseTrackingEvent[]
  lastUpdated: string
}
