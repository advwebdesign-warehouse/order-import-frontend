//file path: app/dashboard/stores/utils/storeTypes.ts

export interface Address {
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
}

export interface Store {
  id: string
  storeName: string
  logo?: string
  website?: string
  email?: string
  phone?: string
  address: Address

  // Timestamps
  createdAt: string
  updatedAt: string

  // Multi-tenant support
  accountId: string

  // âœ… NEW: Warehouse assignment configuration
  warehouseConfig?: WarehouseConfig
}

// âœ… NEW: Warehouse assignment configuration
export interface WarehouseConfig {
  defaultWarehouseId: string  // Fallback warehouse
  enableRegionRouting: boolean  // Toggle region-based routing
  assignments: WarehouseAssignment[]  // Region assignments
}

export interface WarehouseAssignment {
  id: string
  warehouseId: string
  warehouseName: string  // Cached for display
  priority: number  // Lower number = higher priority
  regions: AssignedRegion[]
  isActive: boolean
}

export interface AssignedRegion {
  country: string
  countryCode: string
  states: string[]  // State codes (e.g., ['CA', 'NY'])
}

// Region suggestion based on warehouse location
export interface RegionSuggestion {
  warehouseId: string
  suggestedRegions: {
    country: string
    states: string[]
    distance: 'nearby' | 'medium' | 'far'
  }[]
}

export interface StoreFormData {
  storeName?: string
  logo?: string
  website?: string
  email?: string
  phone?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
}

export interface StoreFilterState {
  search: string
  country: string
  state: string
}

export interface StoreSortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface StoreColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

// US States for region assignment
export const US_STATES = [
  { code: 'AL', name: 'Alabama', region: 'South' },
  { code: 'AK', name: 'Alaska', region: 'West' },
  { code: 'AZ', name: 'Arizona', region: 'West' },
  { code: 'AR', name: 'Arkansas', region: 'South' },
  { code: 'CA', name: 'California', region: 'West' },
  { code: 'CO', name: 'Colorado', region: 'West' },
  { code: 'CT', name: 'Connecticut', region: 'Northeast' },
  { code: 'DE', name: 'Delaware', region: 'Northeast' },
  { code: 'FL', name: 'Florida', region: 'South' },
  { code: 'GA', name: 'Georgia', region: 'South' },
  { code: 'HI', name: 'Hawaii', region: 'West' },
  { code: 'ID', name: 'Idaho', region: 'West' },
  { code: 'IL', name: 'Illinois', region: 'Midwest' },
  { code: 'IN', name: 'Indiana', region: 'Midwest' },
  { code: 'IA', name: 'Iowa', region: 'Midwest' },
  { code: 'KS', name: 'Kansas', region: 'Midwest' },
  { code: 'KY', name: 'Kentucky', region: 'South' },
  { code: 'LA', name: 'Louisiana', region: 'South' },
  { code: 'ME', name: 'Maine', region: 'Northeast' },
  { code: 'MD', name: 'Maryland', region: 'Northeast' },
  { code: 'MA', name: 'Massachusetts', region: 'Northeast' },
  { code: 'MI', name: 'Michigan', region: 'Midwest' },
  { code: 'MN', name: 'Minnesota', region: 'Midwest' },
  { code: 'MS', name: 'Mississippi', region: 'South' },
  { code: 'MO', name: 'Missouri', region: 'Midwest' },
  { code: 'MT', name: 'Montana', region: 'West' },
  { code: 'NE', name: 'Nebraska', region: 'Midwest' },
  { code: 'NV', name: 'Nevada', region: 'West' },
  { code: 'NH', name: 'New Hampshire', region: 'Northeast' },
  { code: 'NJ', name: 'New Jersey', region: 'Northeast' },
  { code: 'NM', name: 'New Mexico', region: 'West' },
  { code: 'NY', name: 'New York', region: 'Northeast' },
  { code: 'NC', name: 'North Carolina', region: 'South' },
  { code: 'ND', name: 'North Dakota', region: 'Midwest' },
  { code: 'OH', name: 'Ohio', region: 'Midwest' },
  { code: 'OK', name: 'Oklahoma', region: 'South' },
  { code: 'OR', name: 'Oregon', region: 'West' },
  { code: 'PA', name: 'Pennsylvania', region: 'Northeast' },
  { code: 'RI', name: 'Rhode Island', region: 'Northeast' },
  { code: 'SC', name: 'South Carolina', region: 'South' },
  { code: 'SD', name: 'South Dakota', region: 'Midwest' },
  { code: 'TN', name: 'Tennessee', region: 'South' },
  { code: 'TX', name: 'Texas', region: 'South' },
  { code: 'UT', name: 'Utah', region: 'West' },
  { code: 'VT', name: 'Vermont', region: 'Northeast' },
  { code: 'VA', name: 'Virginia', region: 'South' },
  { code: 'WA', name: 'Washington', region: 'West' },
  { code: 'WV', name: 'West Virginia', region: 'South' },
  { code: 'WI', name: 'Wisconsin', region: 'Midwest' },
  { code: 'WY', name: 'Wyoming', region: 'West' }
]

// Geographic regions for auto-assignment
export const US_REGIONS = {
  'West': ['CA', 'OR', 'WA', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM', 'AK', 'HI'],
  'Midwest': ['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  'South': ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'FL', 'GA', 'SC', 'NC', 'VA', 'WV'],
  'Northeast': ['NY', 'PA', 'NJ', 'CT', 'MA', 'RI', 'VT', 'NH', 'ME', 'DE', 'MD']
}
