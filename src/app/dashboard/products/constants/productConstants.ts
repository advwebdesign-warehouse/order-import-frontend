//file path: app/dashboard/products/components/productConstants.tsx

import { ProductColumnConfig, ProductFilterState, ProductSortState } from '../utils/productTypes'

export const PRODUCT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  draft: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-red-100 text-red-800',
} as const

export const STOCK_STATUS_COLORS = {
  in_stock: 'bg-green-100 text-green-800',
  out_of_stock: 'bg-red-100 text-red-800',
  low_stock: 'bg-yellow-100 text-yellow-800',
  backorder: 'bg-blue-100 text-blue-800',
} as const

export const PRODUCT_TYPE_COLORS = {
  simple: 'bg-blue-100 text-blue-800',
  variant: 'bg-purple-100 text-purple-800',
  bundle: 'bg-orange-100 text-orange-800',
  configurable: 'bg-indigo-100 text-indigo-800',
} as const

export const VISIBILITY_COLORS = {
  visible: 'bg-green-100 text-green-800',
  hidden: 'bg-gray-100 text-gray-800',
  catalog: 'bg-blue-100 text-blue-800',
  search: 'bg-purple-100 text-purple-800',
} as const

// ✅ UPDATED: Added platform and store columns (visible by default)
export const DEFAULT_PRODUCT_COLUMNS: ProductColumnConfig[] = [
  { id: 'select', field: 'select', label: '', sortable: false, visible: true },
  { id: 'image', field: 'image', label: 'Image', sortable: false, visible: true },
  { id: 'sku', field: 'sku', label: 'SKU', sortable: true, visible: true },
  { id: 'name', field: 'name', label: 'Product Name', sortable: true, visible: true },
  { id: 'type', field: 'type', label: 'Type', sortable: true, visible: true },
  { id: 'status', field: 'status', label: 'Status', sortable: true, visible: true },
  { id: 'platform', field: 'platform', label: 'Platform', sortable: true, visible: true },
  { id: 'store', field: 'store', label: 'Store', sortable: true, visible: true },
  { id: 'stockStatus', field: 'stockStatus', label: 'Stock', sortable: true, visible: true },
  { id: 'stockQuantity', field: 'stockQuantity', label: 'Quantity', sortable: true, visible: true },
  { id: 'price', field: 'price', label: 'Price', sortable: true, visible: true },
  { id: 'variants', field: 'variants', label: 'Variants', sortable: false, visible: true },
  { id: 'updatedAt', field: 'updatedAt', label: 'Updated', sortable: true, visible: true },
  { id: 'actions', field: 'actions', label: 'Actions', sortable: false, visible: true },

  // Hidden columns (available but not shown by default)
  { id: 'visibility', field: 'visibility', label: 'Visibility', sortable: true, visible: false },
  { id: 'comparePrice', field: 'comparePrice', label: 'Compare Price', sortable: true, visible: false },
  { id: 'costPrice', field: 'costPrice', label: 'Cost Price', sortable: true, visible: false },
  { id: 'category', field: 'category', label: 'Category', sortable: true, visible: false },
  { id: 'vendor', field: 'vendor', label: 'Vendor', sortable: true, visible: false },
  { id: 'brand', field: 'brand', label: 'Brand', sortable: true, visible: false },
  { id: 'weight', field: 'weight', label: 'Weight', sortable: true, visible: false },
  { id: 'barcode', field: 'barcode', label: 'Barcode', sortable: true, visible: false },
  { id: 'parentName', field: 'parentName', label: 'Parent Product', sortable: true, visible: false },
  { id: 'createdAt', field: 'createdAt', label: 'Created', sortable: true, visible: false },
  { id: 'publishedAt', field: 'publishedAt', label: 'Published', sortable: true, visible: false },
  { id: 'tags', field: 'tags', label: 'Tags', sortable: false, visible: false },
]

export const DEFAULT_PRODUCT_FILTERS: ProductFilterState = {
  search: '',
  status: '',
  visibility: '',
  type: '',
  stockStatus: '',
  category: '',
  vendor: '',
  brand: '',
  priceMin: '',
  priceMax: '',
  tags: [],
  hasVariants: '',
  parentOnly: false,
  includeVariants: true,
  warehouseId: '',
  platform: '',
  storeId: '',
}

export const DEFAULT_PRODUCT_SORT: ProductSortState = {
  field: 'updatedAt',
  direction: 'desc'
}

export const PRODUCTS_PER_PAGE = 20

export const STOCK_THRESHOLD_WARNING = 10
export const STOCK_THRESHOLD_CRITICAL = 5
