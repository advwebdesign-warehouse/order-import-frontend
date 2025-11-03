//file path: app/dashboard/orders/utils/orderTypes.ts

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
  // NEW: Tracking information
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

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  totalAmount: number
  currency: string
  status: string
  fulfillmentStatus: string
  platform: string
  storeId: string
  orderDate: string
  updatedAt?: string
  externalId?: string
  itemCount: number
  shippingFirstName: string
  shippingLastName: string
  country: string
  countryCode: string
  requestedShipping: string
  // Add warehouse support
  warehouseId?: string
  // ADD THESE SHIPPING ADDRESS FIELDS:
  shippingAddress1?: string
  shippingAddress2?: string
  shippingCity?: string
  shippingProvince?: string  // state/province
  shippingZip?: string
  shippingCountry?: string
  shippingCountryCode?: string
  shippingPhone?: string

  // ADD ORDER ITEMS AND WEIGHT:
  lineItems?: string  // JSON string of items
  totalWeight?: number  // in ounces

  // ADD SHIPPING LABEL SUPPORT:
  shippingLabel?: ShippingLabel
  trackingNumber?: string
}

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
  currency: string
  variant: string
  weight: number
  location?: string
  meta: {
    color: string
    size: string
    material: string
  }
}

export interface Address {
  firstName: string
  lastName: string
  address1: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
  phone?: string
}

export interface OrderWithDetails extends Order {
  items: OrderItem[]
  shippingAddress: Address
  billingAddress: Address
  shippingMethod: string
  shippingCost?: number
  taxAmount?: number
  fees?: number
  handlingFee?: number
  discounts?: {
    code: string
    amount: number
    description: string
  }[]
  trackingNumber: string
  notes?: string
}

// Updated FilterState to support arrays for multi-select filters
export interface FilterState {
  status: string[]               // Array of strings
  fulfillmentStatus: string[]    // Array of strings
  platform: string[]
  storeId: string[]
  dateRange: string             // Single string
  startDate: string             // Single string
  endDate: string               // Single string
  warehouseId?: string          // Optional string
}

export interface SortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface ColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

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
