// File: app/dashboard/products/utils/productUtils.ts

import { Product } from './productTypes'
import { getCurrentUserId } from '@/lib/storage/userStorage'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import { Store } from '../../stores/utils/storeTypes'

export function generateSKU(baseName: string, variant?: { [key: string]: string }): string {
  // Remove special characters and spaces, convert to uppercase
  let sku = baseName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toUpperCase()
    .substring(0, 10)

  if (variant) {
    Object.values(variant).forEach(value => {
      const variantCode = value
        .substring(0, 2)
        .toUpperCase()
      sku += `-${variantCode}`
    })
  }

  return sku
}

export function calculateMargin(costPrice: number, sellPrice: number): number {
  if (costPrice === 0) return 0
  return ((sellPrice - costPrice) / sellPrice) * 100
}

export function calculateMarkup(costPrice: number, sellPrice: number): number {
  if (costPrice === 0) return 0
  return ((sellPrice - costPrice) / costPrice) * 100
}

export function isLowStock(product: Product): boolean {
  if (!product.trackQuantity) return false
  const threshold = product.stockThreshold || 10
  return product.stockQuantity <= threshold && product.stockQuantity > 0
}

export function isOutOfStock(product: Product): boolean {
  if (!product.trackQuantity) return false
  return product.stockQuantity === 0
}

// Fixed getUserId function with client-side check
export function getUserId(): string {
  return getCurrentUserId()
}

export function generateStorageKeys(userId: string) {
  return {
    sortConfig: `products_sort_${userId}`,
    columns: `products_columns_${userId}`,
    filters: `products_filters_${userId}`,
    showFilters: `products_show_filters_${userId}`,
  }
}
/**
 * Get the main image URL for a product
 */
 export function getMainImage(product: Product): string | null {
   // If product has images array, return the first one's URL
   if (product.images && product.images.length > 0) {
     return product.images[0].url || null
   }

   // No image found
   return null
 }

/**
 * Get stock level information for a product
 */
export function getStockLevel(product: Product): {
  level: string;
  color: string;
  quantity: number;
} {
  if (!product.trackQuantity) {
    return {
      level: 'Not Tracked',
      color: 'text-gray-500',
      quantity: 0
    }
  }

  const quantity = product.stockQuantity || 0
  const threshold = product.stockThreshold || 10

  if (quantity === 0) {
    return {
      level: 'Out of Stock',
      color: 'text-red-600',
      quantity
    }
  } else if (quantity <= threshold) {
    return {
      level: 'Low Stock',
      color: 'text-yellow-600',
      quantity
    }
  } else {
    return {
      level: 'In Stock',
      color: 'text-green-600',
      quantity
    }
  }
}

/**
 * Format stock status for display
 */
export function formatStockStatus(product: Product): string {
  if (!product.trackQuantity) {
    return 'Not Tracked'
  }

  const quantity = product.stockQuantity || 0
  const threshold = product.stockThreshold || 10

  if (quantity === 0) {
    return 'Out of Stock'
  } else if (quantity <= threshold) {
    return 'Low Stock'
  } else {
    return 'In Stock'
  }
}

/**
 * Format product type for display
 */
export function formatProductType(type: string): string {
  switch (type) {
    case 'simple':
      return 'Simple'
    case 'variable':
      return 'Variable'
    case 'variant':
      return 'Variant'
    case 'grouped':
      return 'Grouped'
    case 'external':
      return 'External'
    case 'bundle':
      return 'Bundle'
    default:
      return type || 'Simple'
  }
}

/**
 * Format visibility for display
 */
export function formatVisibility(visibility: string): string {
  switch (visibility) {
    case 'public':
      return 'Public'
    case 'private':
      return 'Private'
    case 'hidden':
      return 'Hidden'
    case 'draft':
      return 'Draft'
    default:
      return visibility || 'Public'
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount || 0)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================================
// WAREHOUSE & STORE NAME RESOLUTION (Pure functions - no data modification)
// ============================================================================

/**
 * Get warehouse name from warehouse ID
 * Returns current warehouse name, or fallback if not found
 */
export function getWarehouseName(
  warehouseId: string | undefined,
  warehouses: Warehouse[]
): string {
  if (!warehouseId) return '-'

  const warehouse = warehouses.find(w => w.id === warehouseId)
  return warehouse?.name || 'Unknown Warehouse'
}

/**
 * Get store name from store ID
 * Returns current store name, or fallback if not found
 */
export function getStoreName(
  storeId: string | undefined,
  stores: Store[]
): string {
  if (!storeId) return 'Unknown Store'

  const store = stores.find(s => s.id === storeId)
  return store?.storeName || 'Unknown Store'
}

/**
 * Get unique warehouses from products list
 * Returns array of {id, name} objects for warehouse filters
 */
export function getUniqueWarehousesFromProducts(
  products: Product[],
  warehouses: Warehouse[]
): Array<{ id: string; name: string }> {
  const warehouseMap = new Map<string, string>()

  products.forEach(product => {
    if (product.warehouseId) {
      const name = getWarehouseName(product.warehouseId, warehouses)
      warehouseMap.set(product.warehouseId, name)
    }
  })

  return Array.from(warehouseMap.entries()).map(([id, name]) => ({ id, name }))
}

/**
 * Get unique stores from products list
 * Returns array of {id, name} objects for store filters
 */
export function getUniqueStoresFromProducts(
  products: Product[],
  stores: Store[]
): Array<{ id: string; name: string }> {
  const storeMap = new Map<string, string>()

  products.forEach(product => {
    if (product.storeId) {
      const name = getStoreName(product.storeId, stores)
      storeMap.set(product.storeId, name)
    }
  })

  return Array.from(storeMap.entries()).map(([id, name]) => ({ id, name }))
}
