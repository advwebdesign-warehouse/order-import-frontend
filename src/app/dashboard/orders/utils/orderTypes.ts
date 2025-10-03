// File: app/dashboard/orders/utils/orderTypes.ts

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
  orderDate: string
  itemCount: number
  shippingFirstName: string
  shippingLastName: string
  country: string
  countryCode: string
  requestedShipping: string
  // Add warehouse support
  warehouseId?: string
  warehouseName?: string
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
  platform: string[]            // Array of strings
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
