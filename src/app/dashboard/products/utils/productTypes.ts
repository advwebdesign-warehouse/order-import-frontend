// File: app/dashboard/products/utils/productTypes.ts

export interface WarehouseStock {
  warehouseId: string
  stockQuantity: number
  reservedQuantity?: number
  availableQuantity?: number
  reorderPoint?: number
  maxStock?: number
  location?: string  // Shelf/bin location in warehouse
  lastUpdated?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  shortDescription?: string
  type: 'simple' | 'variant' | 'bundle' | 'configurable'
  status: 'active' | 'inactive' | 'draft' | 'archived'
  visibility: 'visible' | 'hidden' | 'catalog' | 'search'
  price: number
  comparePrice?: number
  costPrice?: number
  currency: string
  stockQuantity: number
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'backorder'
  stockThreshold?: number
  trackQuantity: boolean
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit?: 'cm' | 'in'
  }
  category?: string
  tags: string[]
  images: ProductImage[]
  variants?: ProductVariant[]
  parentId?: string
  parentSku?: string
  parentName?: string
  variantAttributes?: VariantAttribute[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
  vendor?: string
  brand?: string
  barcode?: string
  isbn?: string
  upc?: string
  mpn?: string
  metaTitle?: string
  metaDescription?: string
  seoSlug?: string
  // Warehouse support
  warehouseId?: string
  warehouseStock?: WarehouseStock[]
  // Store support
  storeId?: string
}

export interface ProductImage {
  id: string
  url: string
  altText?: string
  position: number
  isMain: boolean
}

export interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  comparePrice?: number
  stockQuantity: number
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'backorder'
  attributes: VariantAttribute[]
  image?: string
  barcode?: string
  weight?: number
}

export interface VariantAttribute {
  name: string
  value: string
  displayName?: string
}

export interface ProductFilterState {
  search: string
  status: string
  visibility: string
  type: string
  stockStatus: string
  category: string
  vendor: string
  brand: string
  priceMin: string
  priceMax: string
  tags: string[]
  hasVariants: string
  parentOnly: boolean
  includeVariants: boolean
  warehouseId?: string
}

export interface ProductSortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface ProductColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  level: number
}

export interface ProductWithRelations extends Product {
  parent?: Product
  children?: Product[]
  categoryInfo?: ProductCategory
}
