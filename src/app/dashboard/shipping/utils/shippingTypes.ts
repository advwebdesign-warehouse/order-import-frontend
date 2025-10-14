//file path: app/dashboard/shipping/utils/shippingTypes.ts

export type BoxType = 'custom' | 'usps' | 'ups' | 'fedex' | 'dhl'
export type ServiceType = 'domestic' | 'international' | 'both'

export interface ShippingBox {
  id: string
  name: string
  boxType: BoxType
  carrierCode?: string // For carrier-specific boxes (e.g., 'USPS-FRE' for flat rate envelope)
  dimensions: {
    length: number
    width: number
    height: number
    unit: 'in' | 'cm'
  }
  weight: {
    maxWeight: number
    tareWeight: number // Empty box weight
    unit: 'lbs' | 'kg'
  }
  description?: string
  isActive: boolean
  cost?: number // Box cost if applicable
  flatRate?: boolean // Is this a flat rate box?
  flatRatePrice?: number
  availableFor: ServiceType
  createdAt: string
  updatedAt: string

  // Carrier-specific fields (used by BoxesTab)
  carrierType?: string // Original carrier type for duplicated boxes
  mailClass?: string // USPS mail class (PRIORITY_MAIL, GROUND_ADVANTAGE, etc.)
  packageType?: string // Package type classification

  // Variable/editable box fields
  isEditable?: boolean // Can user customize dimensions?
  needsDimensions?: boolean // Does this box need dimensions set?

  // NEW: Warehouse tracking
  warehouse?: string // 'all' for all warehouses, or specific warehouse ID

  // NEW: Duplication tracking
  isDuplicate?: boolean // Is this box a duplicate of another?
  duplicateGroupId?: string // Unique ID for this duplication group (NEW!)
  originalBoxId?: string // ID of the original box (if isDuplicate is true)
}

export interface CarrierService {
  id: string
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  serviceCode: string
  serviceName: string
  displayName: string
  description?: string
  serviceType: ServiceType
  estimatedDays?: string
  isActive: boolean
  features: {
    trackingIncluded: boolean
    signatureAvailable: boolean
    insuranceAvailable: boolean
    saturdayDelivery: boolean
    maxInsuranceValue?: number
  }
  restrictions?: {
    maxWeight?: number
    maxDimensions?: {
      length: number
      width: number
      height: number
    }
    prohibitedCountries?: string[]
  }
  createdAt: string
  updatedAt: string
}

export interface ShippingPreset {
  id: string
  name: string
  description?: string
  defaultCarrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  defaultService: string
  defaultBoxId?: string
  options: {
    signatureRequired: boolean
    saturdayDelivery: boolean
    insuranceValue: number
    returnLabel: boolean
  }
  conditions?: {
    minWeight?: number
    maxWeight?: number
    domestic?: boolean
    international?: boolean
    countries?: string[]
  }
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface ShippingAddress {
  id: string
  name: string
  type: 'warehouse' | 'return' | 'custom'
  isDefault: boolean
  address: {
    company?: string
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
    email?: string
  }
}
