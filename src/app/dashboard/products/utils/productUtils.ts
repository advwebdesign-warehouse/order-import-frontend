// File: app/dashboard/products/utils/productUtils.ts

import { Product } from './productTypes'

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
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    // Return a default ID for server-side rendering
    return 'user_ssr_fallback'
  }

  try {
    let id = localStorage.getItem('userId')
    if (!id) {
      id = 'user_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', id)
    }
    return id
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available:', error)
    return 'user_fallback_' + Math.random().toString(36).substr(2, 9)
  }
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
  // If product has images array, return the first one
  if (product.images && product.images.length > 0) {
    return product.images[0].url || product.images[0]
  }

  // If product has a single image property
  if (product.image) {
    return product.image
  }

  // If product has imageUrl property
  if (product.imageUrl) {
    return product.imageUrl
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
