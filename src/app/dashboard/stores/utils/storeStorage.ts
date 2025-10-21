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
 * Get all stores for the current account
 */
export function getStoresFromStorage(accountId?: string): Store[] {
  if (typeof window === 'undefined') return []

  try {
    const key = getAccountStorageKey(accountId)
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading stores:', error)
    return []
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
export function createStore(storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>, accountId?: string): Store {
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
export function updateStore(id: string, updates: Partial<Store>, accountId?: string): Store | null {
  const stores = getStoresFromStorage(accountId)
  const index = stores.findIndex(store => store.id === id)

  if (index === -1) return null

  stores[index] = {
    ...stores[index],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  saveStoresToStorage(stores, accountId)
  return stores[index]
}

/**
 * Delete a store
 */
export function deleteStore(id: string, accountId?: string): boolean {
  const stores = getStoresFromStorage(accountId)
  const filteredStores = stores.filter(store => store.id !== id)

  if (filteredStores.length === stores.length) return false

  saveStoresToStorage(filteredStores, accountId)
  return true
}

/**
 * Get default shipping store (if any)
 */
export function getDefaultShippingStore(accountId?: string): Store | null {
  const stores = getStoresFromStorage(accountId)
  return stores.find(store => store.defaultShippingFrom) || stores[0] || null
}
