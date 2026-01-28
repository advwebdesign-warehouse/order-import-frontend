//file path: app/dashboard/stores/utils/storeTypes.ts

import { US_STATES } from '@/app/dashboard/shared/utils/usStates'

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
  logo?: string | null  // ✅ Can be NULL in database
  website?: string | null  // ✅ Can be NULL in database
  email?: string | null  // ✅ Can be NULL in database
  phone?: string | null  // ✅ Can be NULL in database
  address: Address

  // Timestamps
  createdAt: string
  updatedAt: string

  // Multi-tenant support
  accountId: string

  // Linked integrations (computed field)
  linkedIntegrations?: LinkedIntegration[]
}

// Integration linked to a store
export interface LinkedIntegration {
  id: string
  name: string
  type: 'shipping' | 'ecommerce' | 'warehouse' | 'accounting' | 'other'
  status: 'active' | 'inactive' | 'error'
  logo?: string | null
  provider?: string // e.g., 'Shopify', 'WooCommerce', 'USPS'
}

export interface StoreFormData {
  id?: string  // ✅ ADDED: Stable identifier - undefined for create, required for edit (validated at runtime)
  storeName?: string
  logo?: string | null  // ✅ Can be NULL when cleared
  website?: string | null
  email?: string | null
  phone?: string | null
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

// ============================================================================
// RE-EXPORT US GEOGRAPHY DATA
// ============================================================================

// Re-export constants from shared utils for convenience
// These are used in address forms and other store-related features
export { US_STATES, US_REGIONS } from '@/app/dashboard/shared/utils/usStates'

// Re-export types from shared utils
export type { USState, USRegion } from '@/app/dashboard/shared/utils/usStates'
