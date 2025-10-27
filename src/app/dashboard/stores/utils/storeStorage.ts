//file path: app/dashboard/stores/utils/storeStorage.ts

import { Store } from './storeTypes'

const STORAGE_KEY = 'stores'

function getCurrentAccountId(): string {
  if (typeof window === 'undefined') return 'default-account'
  return localStorage.getItem('currentAccountId') || 'default-account'
}

function getAccountStorageKey(accountId?: string): string {
  const aid = accountId || getCurrentAccountId()
  return `${STORAGE_KEY}_${aid}`
}

/**
 * Create a default store if none exists
 */
function createDefaultStore(accountId?: string): Store {
  const defaultStore: Store = {
    id: `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    storeName: 'Main Store',
    logo: undefined,
    website: undefined,
    email: undefined,
    phone: undefined,
    address: {
      address1: '123 Main Street',
      address2: undefined,
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
      country: 'United States',
      countryCode: 'US'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: accountId || getCurrentAccountId()
  }

  return defaultStore
}

/**
 * Get all stores for the current account
 * If no stores exist, create a default one
 */
export function getStoresFromStorage(accountId?: string): Store[] {
  if (typeof window === 'undefined') return []

  try {
    const key = getAccountStorageKey(accountId)
    const stored = localStorage.getItem(key)
    let stores: Store[] = stored ? JSON.parse(stored) : []

    // ✅ If no stores exist, create a default one
    if (stores.length === 0) {
      const defaultStore = createDefaultStore(accountId)
      stores = [defaultStore]
      saveStoresToStorage(stores, accountId)
      console.log('✅ Created default store:', defaultStore)
    }

    return stores
  } catch (error) {
    console.error('Error loading stores:', error)
    // ✅ Even on error, return a default store
    const defaultStore = createDefaultStore(accountId)
    return [defaultStore]
  }
}

/**
 * Save stores to storage
 */
export function saveStoresToStorage(stores: Store[], accountId?: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = getAccountStorageKey(accountId)
    localStorage.setItem(key, JSON.stringify(stores))
  } catch (error) {
    console.error('Error saving stores:', error)
  }
}

/**
 * Get a single store by ID
 */
export function getStoreById(id: string, accountId?: string): Store | null {
  const stores = getStoresFromStorage(accountId)
  return stores.find(store => store.id === id) || null
}

/**
 * Create a new store
 */
export function createStore(storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt' | 'accountId'>, accountId?: string): Store {
  const stores = getStoresFromStorage(accountId)

  const newStore: Store = {
    ...storeData,
    id: `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accountId: accountId || getCurrentAccountId()
  }

  stores.push(newStore)
  saveStoresToStorage(stores, accountId)

  return newStore
}

/**
 * Update an existing store
 */
export function updateStore(id: string, updates: Partial<Omit<Store, 'id' | 'createdAt' | 'accountId'>>, accountId?: string): Store | null {
  const stores = getStoresFromStorage(accountId)
  const index = stores.findIndex(store => store.id === id)

  if (index === -1) return null

  stores[index] = {
    ...stores[index],
    ...updates,
    id: stores[index].id, // Preserve ID
    createdAt: stores[index].createdAt, // Preserve creation date
    accountId: stores[index].accountId, // Preserve account ID
    updatedAt: new Date().toISOString()
  }

  saveStoresToStorage(stores, accountId)
  return stores[index]
}

/**
 * Delete a store
 * ✅ Prevent deletion if it's the last store
 */
export function deleteStore(id: string, accountId?: string): boolean {
  const stores = getStoresFromStorage(accountId)

  // ✅ Prevent deletion of the last store
  if (stores.length <= 1) {
    console.warn('Cannot delete the last store. At least one store is required.')
    alert('Cannot delete the last store. At least one store is required.')
    return false
  }

  const filteredStores = stores.filter(store => store.id !== id)

  if (filteredStores.length === stores.length) return false

  saveStoresToStorage(filteredStores, accountId)
  return true
}

/**
 * Get the first store (default store)
 */
export function getDefaultStore(accountId?: string): Store | null {
  const stores = getStoresFromStorage(accountId)
  return stores[0] || null
}

/**
 * Ensure at least one store exists
 * Call this on app initialization
 */
export function ensureDefaultStore(accountId?: string): void {
  getStoresFromStorage(accountId) // This will create a default store if none exists
}
