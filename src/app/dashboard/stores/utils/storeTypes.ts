//file path: app/dashboard/stores/utils/storeTypes.ts

export interface Store {
  id: string
  companyName: string
  storeName?: string
  logo?: string
  website?: string
  email?: string
  phone?: string
  address: {
    address1: string
    address2?: string
    city: string
    state: string
    zip: string
    country: string
    countryCode: string
  }
  // Business details
  taxId?: string
  businessType?: 'sole_proprietor' | 'llc' | 'corporation' | 'partnership'

  // Shipping settings
  defaultShippingFrom?: boolean // Use this address as default "ship from"

  // Timestamps
  createdAt: string
  updatedAt: string

  // Multi-tenant support
  accountId?: string
}

export interface StoreFormData {
  companyName: string
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
  taxId?: string
  businessType?: 'sole_proprietor' | 'llc' | 'corporation' | 'partnership'
  defaultShippingFrom?: boolean
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
