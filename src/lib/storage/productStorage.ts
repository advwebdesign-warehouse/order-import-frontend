//file path: src/lib/storage/productStorage.ts

import { Product } from '@/app/dashboard/products/utils/productTypes'
import { getCurrentAccountId, getAccountIntegrations } from './integrationStorage'

const PRODUCTS_STORAGE_PREFIX = 'orderSync_products_'

/**
 * Get all products for a specific account
 */
export function getProductsFromStorage(accountId?: string): Product[] {
  console.log('[getProductsFromStorage] 🔍 Called with accountId:', accountId)

  if (typeof window === 'undefined') {
    console.warn('[getProductsFromStorage] ⚠️ Window is undefined, returning empty array')
    return []
  }

  const aid = accountId || getCurrentAccountId()
  console.log('[getProductsFromStorage] 📋 Account ID resolved:', {
    providedAccountId: accountId,
    currentAccountId: getCurrentAccountId(),
    finalAccountId: aid
  })

  if (!aid) {
    console.error('[getProductsFromStorage] ❌ No account ID available, returning empty array')
    return []
  }

  const storageKey = `${PRODUCTS_STORAGE_PREFIX}${aid}`
  console.log('[getProductsFromStorage] 🔑 Looking for products at key:', storageKey)

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const products = JSON.parse(stored)
      console.log('[getProductsFromStorage] ✅ Found products:', {
        key: storageKey,
        count: products.length,
        dataSize: `${(stored.length / 1024).toFixed(2)} KB`
      })
      return products
    } else {
      console.warn('[getProductsFromStorage] ⚠️ No products found at key:', storageKey)

      // Check if products exist under any other key
      const allKeys = Object.keys(localStorage)
      const productKeys = allKeys.filter(k => k.startsWith(PRODUCTS_STORAGE_PREFIX))

      if (productKeys.length > 0) {
        console.warn('[getProductsFromStorage] 🔍 But products found at other keys:')
        productKeys.forEach(key => {
          const data = localStorage.getItem(key)
          if (data) {
            try {
              const parsed = JSON.parse(data)
              console.warn(`  - ${key}: ${parsed.length} products`)
            } catch (e) {
              console.warn(`  - ${key}: (parse error)`)
            }
          }
        })
      } else {
        console.warn('[getProductsFromStorage] 📭 No product keys found in localStorage at all')
      }
    }
  } catch (error) {
    console.error('[getProductsFromStorage] ❌ Error loading products from storage:', error)
  }

  return []
}

/**
 * Save products for a specific account
 */
export function saveProductsToStorage(products: Product[], accountId?: string): void {
  console.log('[saveProductsToStorage] 💾 Called with:', {
    productsCount: products?.length || 0,
    accountIdParam: accountId,
    isWindowDefined: typeof window !== 'undefined'
  })

  if (typeof window === 'undefined') {
    console.warn('[saveProductsToStorage] ⚠️ Window is undefined, skipping save')
    return
  }

  const aid = accountId || getCurrentAccountId()
  console.log('[saveProductsToStorage] 📋 Account ID resolved:', {
    providedAccountId: accountId,
    currentAccountId: getCurrentAccountId(),
    finalAccountId: aid
  })

  if (!aid) {
    console.error('[saveProductsToStorage] ❌ No account ID available, cannot save products!')
    return
  }

  const storageKey = `${PRODUCTS_STORAGE_PREFIX}${aid}`
  console.log('[saveProductsToStorage] 🔑 Storage key:', storageKey)

  try {
    const productsJson = JSON.stringify(products)
    console.log('[saveProductsToStorage] 📦 Attempting to save:', {
      key: storageKey,
      productsCount: products.length,
      dataSize: `${(productsJson.length / 1024).toFixed(2)} KB`
    })

    localStorage.setItem(storageKey, productsJson)

    // Verify the save
    const verification = localStorage.getItem(storageKey)
    if (verification) {
      const parsed = JSON.parse(verification)
      console.log('[saveProductsToStorage] ✅ Save successful and verified!', {
        key: storageKey,
        verifiedCount: parsed.length
      })
    } else {
      console.error('[saveProductsToStorage] ❌ Save appeared to succeed but verification failed!')
    }
  } catch (error) {
    console.error('[saveProductsToStorage] ❌ Error saving products to storage:', error)
    console.error('[saveProductsToStorage] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      storageKey,
      productsCount: products.length
    })
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

// ============================================================================
// NEW: Multi-Integration Helper Functions
// ============================================================================

/**
 * Get products by integration ID
 */
export function getProductsByIntegration(integrationId: string, accountId?: string): Product[] {
  const products = getProductsFromStorage(accountId)
  return products.filter(p => p.integrationId === integrationId)
}

/**
 * Get products by platform name (looks up integrations to find matching platform)
 */
export function getProductsByPlatform(platform: string, accountId?: string): Product[] {
  const aid = accountId || getCurrentAccountId()
  const integrations = getAccountIntegrations(aid)

  if (!integrations) return []

  // Find all integration IDs that match the platform
  const matchingIntegrationIds = integrations.integrations
    .filter(i => i.name.toLowerCase() === platform.toLowerCase())
    .map(i => i.id)

  // Get products for those integrations
  const products = getProductsFromStorage(accountId)
  return products.filter(p => matchingIntegrationIds.includes(p.integrationId))
}

/**
 * Get products by store ID (looks up integrations to find matching store)
 */
export function getProductsByStore(storeId: string, accountId?: string): Product[] {
  const aid = accountId || getCurrentAccountId()
  const integrations = getAccountIntegrations(aid)

  if (!integrations) return []

  // Find all integration IDs that belong to this store
  const matchingIntegrationIds = integrations.integrations
    .filter(i => 'storeId' in i && i.storeId === storeId)
    .map(i => i.id)

  // Get products for those integrations
  const products = getProductsFromStorage(accountId)
  return products.filter(p => matchingIntegrationIds.includes(p.integrationId))
}

/**
 * Get products by warehouse ID (checks warehouseStock array)
 */
 export function getProductsByWarehouse(warehouseId: string, accountId?: string): Product[] {
   const products = getProductsFromStorage(accountId)
   return products.filter(p =>
     p.warehouseStock?.some(stock => stock.warehouseId === warehouseId)
   )
 }

 /**
  * Get warehouse stock for a specific product and warehouse
  */
 export function getProductWarehouseStock(productId: string, warehouseId: string, accountId?: string) {
   const products = getProductsFromStorage(accountId)
   const product = products.find(p => p.id === productId)
   return product?.warehouseStock?.find(stock => stock.warehouseId === warehouseId)
 }

 /**
  * Delete products by integration (when disconnecting an integration)
  */
 export function deleteProductsByIntegration(integrationId: string, accountId?: string): void {
   const products = getProductsFromStorage(accountId)
   const filtered = products.filter(p => p.integrationId !== integrationId)
   saveProductsToStorage(filtered, accountId)
 }

 /**
  * Delete products by platform (removes all products from all integrations of that platform)
  */
 export function deleteProductsByPlatform(platform: string, accountId?: string): void {
   const aid = accountId || getCurrentAccountId()
   const integrations = getAccountIntegrations(aid)

   if (!integrations) return

   // Find all integration IDs for this platform
   const platformIntegrationIds = integrations.integrations
     .filter(i => i.name.toLowerCase() === platform.toLowerCase())
     .map(i => i.id)

   // Remove products from those integrations
   const products = getProductsFromStorage(accountId)
   const filtered = products.filter(p => !platformIntegrationIds.includes(p.integrationId))
   saveProductsToStorage(filtered, accountId)
 }

 /**
  * Delete products by store (removes all products from all integrations of that store)
  */
 export function deleteProductsByStore(storeId: string, accountId?: string): void {
   const aid = accountId || getCurrentAccountId()
   const integrations = getAccountIntegrations(aid)

   if (!integrations) return

   // Find all integration IDs for this store
   const storeIntegrationIds = integrations.integrations
     .filter(i => 'storeId' in i && i.storeId === storeId)
     .map(i => i.id)

   // Remove products from those integrations
   const products = getProductsFromStorage(accountId)
   const filtered = products.filter(p => !storeIntegrationIds.includes(p.integrationId))
   saveProductsToStorage(filtered, accountId)
 }

 // ============================================================================
 // Statistics and Analytics
 // ============================================================================

 /**
  * Get product sync statistics with integration, platform, store, and warehouse breakdown
  */
export function getProductSyncStats(accountId?: string): {
  totalProducts: number
  byIntegration: Record<string, number>
  byPlatform: Record<string, number>
  byStore: Record<string, number>
  byWarehouse: Record<string, number>
  lastSyncDate?: Date
} {
  const aid = accountId || getCurrentAccountId()
  const products = getProductsFromStorage(accountId)
  const integrations = getAccountIntegrations(aid)

  const byIntegration: Record<string, number> = {}
  const byPlatform: Record<string, number> = {}
  const byStore: Record<string, number> = {}
  const byWarehouse: Record<string, number> = {}

  products.forEach(product => {
    // Count by integration
    if (product.integrationId) {
      byIntegration[product.integrationId] = (byIntegration[product.integrationId] || 0) + 1

      // Look up platform and store from integration
      if (integrations) {
        const integration = integrations.integrations.find(i => i.id === product.integrationId)
        if (integration) {
          // Count by platform
          byPlatform[integration.name] = (byPlatform[integration.name] || 0) + 1

          // Count by store (only for ecommerce integrations)
          if ('storeId' in integration && integration.storeId) {
            byStore[integration.storeId] = (byStore[integration.storeId] || 0) + 1
          }
        }
      }
    }

    // Count by warehouse (a product can be in multiple warehouses)
    if (product.warehouseStock) {
      product.warehouseStock.forEach(stock => {
        byWarehouse[stock.warehouseId] = (byWarehouse[stock.warehouseId] || 0) + 1
      })
    }
  })

  // Find most recent update date
  const productDates = products
    .map(p => new Date(p.updatedAt))
    .filter(Boolean)

  const lastSyncDate = productDates.length > 0
    ? new Date(Math.max(...productDates.map(d => d.getTime())))
    : undefined

  return {
    totalProducts: products.length,
    byIntegration,
    byPlatform,
    byStore,
    byWarehouse,
    lastSyncDate
  }
}

/**
 * Get integration details for a product (platform name, store ID, etc.)
 */
export function getProductIntegrationDetails(product: Product, accountId?: string): {
  integrationId: string
  platform: string
  storeId?: string
  integration: any
} | null {
  const aid = accountId || getCurrentAccountId()
  const integrations = getAccountIntegrations(aid)

  if (!integrations) return null

  const integration = integrations.integrations.find(i => i.id === product.integrationId)
  if (!integration) return null

  return {
    integrationId: integration.id,
    platform: integration.name,
    storeId: 'storeId' in integration ? integration.storeId : undefined,
    integration
  }
}

/**
 * Get list of platforms that have products
 */
export function getPlatformsWithProducts(accountId?: string): Array<{ platform: string; count: number }> {
  const stats = getProductSyncStats(accountId)

  return Object.entries(stats.byPlatform).map(([platform, count]) => ({
    platform,
    count
  }))
}

/**
 * Get list of stores with products
 */
export function getStoresWithProducts(accountId?: string): Array<{ storeId: string; count: number }> {
  const stats = getProductSyncStats(accountId)

  return Object.entries(stats.byStore).map(([storeId, count]) => ({
    storeId,
    count
  }))
}

/**
 * Get list of warehouses with products
 */
export function getWarehousesWithProducts(accountId?: string): Array<{ warehouseId: string; count: number }> {
  const stats = getProductSyncStats(accountId)

  return Object.entries(stats.byWarehouse).map(([warehouseId, count]) => ({
    warehouseId,
    count
  }))
}

/**
 * Get list of integrations with products
 */
export function getIntegrationsWithProducts(accountId?: string): Array<{ integrationId: string; count: number }> {
  const stats = getProductSyncStats(accountId)

  return Object.entries(stats.byIntegration).map(([integrationId, count]) => ({
    integrationId,
    count
  }))
}
