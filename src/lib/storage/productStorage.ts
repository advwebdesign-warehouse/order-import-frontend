//file path: src/lib/storage/productStorage.ts

import { getCurrentAccountId } from './integrationStorage'

const PRODUCTS_STORAGE_PREFIX = 'orderSync_products_'

export interface Product {
  id: string
  externalId: string
  storeId: string
  platform: string
  name: string
  sku?: string
  barcode?: string
  price: number
  quantity: number
  vendor?: string
  productType?: string
  tags?: string[]
  variants?: any[]
  createdAt: string
  updatedAt: string
}

/**
 * Get all products for a specific account
 */
export function getProductsFromStorage(accountId?: string): Product[] {
  if (typeof window === 'undefined') return []

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${PRODUCTS_STORAGE_PREFIX}${aid}`

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading products from storage:', error)
  }

  return []
}

/**
 * Save products for a specific account
 */
export function saveProductsToStorage(products: Product[], accountId?: string): void {
  if (typeof window === 'undefined') return

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${PRODUCTS_STORAGE_PREFIX}${aid}`

  try {
    localStorage.setItem(storageKey, JSON.stringify(products))
  } catch (error) {
    console.error('Error saving products to storage:', error)
  }
}

/**
 * Get product by SKU
 */
export function getProductBySku(sku: string, accountId?: string): Product | null {
  const products = getProductsFromStorage(accountId)
  return products.find(p => p.sku === sku) || null
}

/**
 * Get product by external ID
 */
export function getProductByExternalId(externalId: string, storeId: string, accountId?: string): Product | null {
  const products = getProductsFromStorage(accountId)
  return products.find(p => p.externalId === externalId && p.storeId === storeId) || null
}

/**
 * Save single product (upsert)
 */
export function saveProduct(product: Product, accountId?: string): void {
  const products = getProductsFromStorage(accountId)
  const existingIndex = products.findIndex(p => p.id === product.id)

  if (existingIndex >= 0) {
    products[existingIndex] = product
  } else {
    products.push(product)
  }

  saveProductsToStorage(products, accountId)
}

/**
 * Update existing product
 */
export function updateProduct(productId: string, updates: Partial<Product>, accountId?: string): void {
  const products = getProductsFromStorage(accountId)
  const existingIndex = products.findIndex(p => p.id === productId)

  if (existingIndex >= 0) {
    products[existingIndex] = {
      ...products[existingIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    saveProductsToStorage(products, accountId)
  }
}

/**
 * Delete product
 */
export function deleteProduct(productId: string, accountId?: string): void {
  const products = getProductsFromStorage(accountId)
  const filtered = products.filter(p => p.id !== productId)
  saveProductsToStorage(filtered, accountId)
}
