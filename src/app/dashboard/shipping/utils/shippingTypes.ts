//file path: app/dashboard/shipping/utils/shippingTypes.ts

export type BoxType = 'custom' | 'usps' | 'ups' | 'fedex' | 'dhl'
export type ServiceType = 'domestic' | 'international' | 'both'
export type PackageType = 'box' | 'envelope' | 'tube' | 'pak' | 'other'

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
  packageType?: PackageType // Package type classification

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

// ============================================================================
// UPDATED: Enhanced Shipping Preset with priority-based evaluation
// ============================================================================
export interface ShippingPreset {
  id: string
  name: string
  description?: string
  warehouse: string // warehouse ID or 'all'
  isActive: boolean
  priority: number // 1 = highest priority, system evaluates in order

  // UPDATED: Multiple carriers with fallback order (instead of single defaultCarrier)
  carrierPreferences: CarrierPreference[]

  // UPDATED: Box selection strategy (instead of single defaultBoxId)
  boxRules: BoxSelectionRules

  // UPDATED: Enhanced conditions with more granular control
  conditions: PresetConditions

  // UPDATED: More flexible options with conditional logic
  options: ShippingOptions

  createdAt: string
  updatedAt: string
}

// NEW: Carrier preference with fallback order
export interface CarrierPreference {
  carrier: 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  services: string[] // Service IDs or names to try in order
  order: number // Priority order (1 = try first)
}

// NEW: Box selection strategies
export interface BoxSelectionRules {
  strategy: 'smallest_fit' | 'preferred_boxes' | 'weight_based' | 'cheapest'
  preferredBoxes?: string[] // Box IDs (used when strategy is 'preferred_boxes')
  excludeBoxes?: string[] // Box IDs to never use
}

// NEW: Enhanced conditions for preset matching
export interface PresetConditions {
  weight?: {
    min?: number
    max?: number
    unit: 'lbs' | 'kg' | 'oz'
  }
  orderValue?: {
    min?: number
    max?: number
    currency: 'USD' | 'EUR' | 'GBP'
  }
  destination?: ('domestic' | 'international')[] // Array of allowed types
  states?: string[] // US state codes (e.g., ['CA', 'NY'])
  excludeStates?: string[] // US state codes to exclude
  countries?: string[] // Country codes (e.g., ['US', 'CA', 'MX'])
  productTypes?: string[]
  tags?: string[]
}

// NEW: Flexible shipping options with conditional logic
export interface ShippingOptions {
  signatureRequired?: boolean | 'conditional' // conditional = based on value
  signatureThreshold?: number // Dollar amount for conditional signature
  insurance?: boolean | 'conditional'
  insuranceThreshold?: number // Dollar amount for conditional insurance
  saturdayDelivery?: boolean
  requireAdultSignature?: boolean
}

// NEW: Helper type for evaluating presets at runtime
export interface PresetEvaluationContext {
  weight: number
  weightUnit: 'lbs' | 'kg' | 'oz'
  orderValue: number
  destination: {
    country: string
    state?: string
    isInternational: boolean
  }
  productTypes?: string[]
  tags?: string[]
}

// ============================================================================
// Existing interfaces (unchanged)
// ============================================================================
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
