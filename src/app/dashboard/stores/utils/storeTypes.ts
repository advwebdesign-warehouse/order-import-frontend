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

// ============================================================================
// RE-EXPORT US GEOGRAPHY DATA
// ============================================================================

// Re-export constants from shared utils for convenience
// These are used in address forms and other store-related features
export { US_STATES, US_REGIONS } from '@/app/dashboard/shared/utils/usStates'

// Re-export types from shared utils
export type { USState, USRegion } from '@/app/dashboard/shared/utils/usStates'
