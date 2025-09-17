// orderConstants.ts
import { ColumnConfig } from './orderTypes'

export const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
} as const

export const FULFILLMENT_COLORS = {
  PENDING: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  PICKING: 'bg-yellow-100 text-yellow-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  READY_TO_SHIP: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-green-100 text-green-800',
} as const

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'select', field: 'select', label: '', sortable: false, visible: true },
  { id: 'orderDate', field: 'orderDate', label: 'Date', sortable: true, visible: true },
  { id: 'orderNumber', field: 'orderNumber', label: 'Order', sortable: true, visible: true },
  { id: 'itemCount', field: 'itemCount', label: 'Items', sortable: true, visible: true },
  { id: 'customerName', field: 'customerName', label: 'Customer', sortable: true, visible: true },
  { id: 'status', field: 'status', label: 'Status', sortable: true, visible: true },
  { id: 'totalAmount', field: 'totalAmount', label: 'Total', sortable: true, visible: true },
  { id: 'platform', field: 'platform', label: 'Platform', sortable: true, visible: true },
  { id: 'requestedShipping', field: 'requestedShipping', label: 'Shipping Method', sortable: true, visible: true },
  { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },

  // Hidden columns (available but not shown by default)
  { id: 'fulfillmentStatus', field: 'fulfillmentStatus', label: 'Fulfillment Status', sortable: true, visible: false },
  { id: 'currency', field: 'currency', label: 'Currency', sortable: true, visible: false },
  { id: 'country', field: 'country', label: 'Country', sortable: true, visible: false },
  { id: 'countryName', field: 'countryName', label: 'Country Name', sortable: true, visible: false },
  { id: 'countryCode', field: 'countryCode', label: 'Country Code', sortable: true, visible: false },
  { id: 'shippingFirstName', field: 'shippingFirstName', label: 'Shipping First Name', sortable: true, visible: false },
  { id: 'shippingLastName', field: 'shippingLastName', label: 'Shipping Last Name', sortable: true, visible: false },
  { id: 'shippingFullName', field: 'shippingFullName', label: 'Shipping Name', sortable: true, visible: false },
  { id: 'orderTime', field: 'orderTime', label: 'Order Time', sortable: true, visible: false },
  { id: 'orderDay', field: 'orderDay', label: 'Order Day', sortable: true, visible: false },
  { id: 'orderMonth', field: 'orderMonth', label: 'Order Month', sortable: true, visible: false },
  { id: 'orderYear', field: 'orderYear', label: 'Order Year', sortable: true, visible: false },
]

export const DEFAULT_FILTERS = {
  status: '',
  fulfillmentStatus: '',
  platform: '',
  dateRange: '',
  startDate: '',
  endDate: ''
}

export const DEFAULT_SORT = {
  field: 'orderDate',
  direction: 'desc' as const
}

export const DEFAULT_COMPANY_INFO = {
  name: 'Your Company Name',
  address: '123 Business Street',
  city: 'Your City',
  state: 'ST',
  zip: '12345',
  country: 'United States',
  phone: '+1 (555) 123-4567',
  email: 'orders@yourcompany.com',
  website: 'www.yourcompany.com'
}

export const ITEMS_PER_PAGE = 20
