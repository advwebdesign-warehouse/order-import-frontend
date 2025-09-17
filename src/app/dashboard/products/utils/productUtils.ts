import { Product } from './productTypes'

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatStockStatus(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'In Stock'
    case 'out_of_stock':
      return 'Out of Stock'
    case 'low_stock':
      return 'Low Stock'
    case 'backorder':
      return 'Backorder'
    default:
      return status
  }
}

export function formatProductType(type: string): string {
  switch (type) {
    case 'simple':
      return 'Simple'
    case 'variant':
      return 'Variant'
    case 'bundle':
      return 'Bundle'
    case 'configurable':
      return 'Configurable'
    default:
      return type
  }
}

export function formatVisibility(visibility: string): string {
  switch (visibility) {
    case 'visible':
      return 'Visible'
    case 'hidden':
      return 'Hidden'
    case 'catalog':
      return 'Catalog Only'
    case 'search':
      return 'Search Only'
    default:
      return visibility
  }
}

export function getStockLevel(product: Product): 'critical' | 'low' | 'normal' | 'good' {
  if (!product.trackQuantity) return 'normal'

  const threshold = product.stockThreshold || 10
  const quantity = product.stockQuantity

  if (quantity === 0) return 'critical'
  if (quantity <= Math.floor(threshold * 0.5)) return 'critical'
  if (quantity <= threshold) return 'low'
  if (quantity <= threshold * 2) return 'normal'
  return 'good'
}

export function calculateTotalVariantStock(product: Product): number {
  if (!product.variants) return product.stockQuantity

  return product.variants.reduce((total, variant) => {
    return total + variant.stockQuantity
  }, 0)
}

export function getMainImage(product: Product): string | undefined {
  const mainImage = product.images.find(img => img.isMain)
  return mainImage?.url || product.images[0]?.url
}

export function getVariantDisplayName(product: Product): string {
  if (!product.variantAttributes || product.variantAttributes.length === 0) {
    return product.name
  }

  const attributes = product.variantAttributes
    .map(attr => attr.value)
    .join(' / ')

  return `${product.parentName || product.name} - ${attributes}`
}

export function groupProductsByParent(products: Product[]): { [key: string]: Product[] } {
  const grouped: { [key: string]: Product[] } = {}

  products.forEach(product => {
    const key = product.parentId || product.id
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(product)
  })

  return grouped
}

export function getParentProducts(products: Product[]): Product[] {
  return products.filter(product => !product.parentId)
}

export function getVariantProducts(products: Product[]): Product[] {
  return products.filter(product => product.parentId)
}

export function findProductById(products: Product[], id: string): Product | undefined {
  return products.find(product => product.id === id)
}

export function findProductsBySku(products: Product[], sku: string): Product[] {
  return products.filter(product =>
    product.sku.toLowerCase().includes(sku.toLowerCase())
  )
}

export function searchProducts(products: Product[], searchTerm: string): Product[] {
  const term = searchTerm.toLowerCase()

  return products.filter(product =>
    product.name.toLowerCase().includes(term) ||
    product.sku.toLowerCase().includes(term) ||
    (product.description && product.description.toLowerCase().includes(term)) ||
    (product.brand && product.brand.toLowerCase().includes(term)) ||
    (product.vendor && product.vendor.toLowerCase().includes(term)) ||
    product.tags.some(tag => tag.toLowerCase().includes(term)) ||
    (product.barcode && product.barcode.includes(term))
  )
}

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

export function getUserId(): string {
  let id = localStorage.getItem('userId')
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('userId', id)
  }
  return id
}

export function generateStorageKeys(userId: string) {
  return {
    sortConfig: `products_sort_${userId}`,
    columns: `products_columns_${userId}`,
    filters: `products_filters_${userId}`,
    showFilters: `products_show_filters_${userId}`,
  }
}
