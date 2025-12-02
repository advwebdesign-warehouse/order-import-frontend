//file path: app/dashboard/warehouses/utils/warehouseTypes.ts

export interface Warehouse {
  id: string
  name: string
  code: string
  description?: string
  address: WarehouseAddress
  status: 'active' | 'inactive'
  isDefault: boolean
  contactInfo: WarehouseContact
  settings: WarehouseSettings
  layout?: WarehouseLayout
  createdAt: string
  updatedAt: string
  productCount?: number

  // Return address fields
  useDifferentReturnAddress?: boolean
  returnAddress?: WarehouseAddress
}

export interface WarehouseAddress {
  name?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
}

export interface WarehouseContact {
  managerName?: string
  phone?: string
  email?: string
}

export interface WarehouseSettings {
  allowBackorders: boolean
  trackInventory: boolean
  autoFulfill: boolean
  priority: number
  orderStatusSettings: OrderStatusSettings
}

export interface OrderStatusSettings {
  // Statuses that count as "orders to ship"
  toShipStatuses: string[]
  // Statuses that should be excluded/disregarded
  excludedStatuses: string[]
  // Statuses that are considered completed
  completedStatuses: string[]
  // Custom display text for the count
  displayText: string
  // Whether to show completed orders in the count (default: false)
  includeCompleted: boolean
}

export interface WarehouseProduct {
  id: string
  warehouseId: string
  productId: string
  stockQuantity: number
  reservedQuantity: number
  availableQuantity: number
  reorderPoint: number
  maxStock: number
  location?: string // Shelf/bin location
  structuredLocation?: StructuredLocation // Detailed location breakdown
  lastStockUpdate: string
}

export interface WarehouseFilterState {
  search: string
  status: string
  country: string
  hasLayout: boolean // Filter by layout presence
}

export interface WarehouseSortState {
  field: string
  direction: 'asc' | 'desc'
}

export interface WarehouseColumnConfig {
  id: string
  field: string
  label: string
  sortable: boolean
  visible: boolean
}

// Default order status settings
export const DEFAULT_ORDER_STATUS_SETTINGS: OrderStatusSettings = {
  toShipStatuses: ['PENDING', 'PROCESSING', 'ASSIGNED', 'PICKING', 'PACKING', 'READY_TO_SHIP'],
  excludedStatuses: ['CANCELLED'],
  completedStatuses: ['SHIPPED', 'DELIVERED'],
  displayText: 'orders to ship',
  includeCompleted: false
}

// Available order statuses for configuration
export const AVAILABLE_ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'ASSIGNED',
  'PICKING',
  'PACKING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'REFUNDED'
] as const

export type OrderStatus = typeof AVAILABLE_ORDER_STATUSES[number]

// Warehouse Layout Types
export interface WarehouseLayout {
  zones: Zone[]
  zonePositions?: {[key: string]: {x: number, y: number}} // Visual layout positions
  zoneDimensions?: {[key: string]: {width: number, height: number}} // Zone dimensions for resizing
  defaultLocationFormat: LocationFormat
  createdAt: string
  updatedAt: string
}

export interface Zone {
  id: string
  name: string
  code: string
  description?: string
  color?: string // For visual representation
  aisles: Aisle[]
  type: 'storage' | 'receiving' | 'shipping' | 'returns' | 'staging' | 'quality_control' | 'custom'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Aisle {
  id: string
  name: string
  code: string
  description?: string
  shelves: Shelf[]
  maxHeight?: number // in feet/meters
  width?: number
  length?: number
  unit?: 'feet' | 'meters'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Shelf {
  id: string
  name: string
  code: string
  level: number // 1 = bottom, 2 = second level, etc.
  bins: Bin[]
  maxWeight?: number
  weightUnit?: 'lbs' | 'kg'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Bin {
  id: string
  name: string
  code: string
  position: number // Position along the shelf
  capacity?: number
  currentStock?: number
  isActive: boolean
  reserved?: boolean
  reservedFor?: string // Product ID or order ID
  createdAt: string
  updatedAt: string
}

export interface LocationFormat {
  pattern: string // e.g., "{zone}-{aisle}-{shelf}-{bin}" = "A-01-2-03"
  separator: string
  includeZone: boolean
  includeAisle: boolean
  includeShelf: boolean
  includeBin: boolean
}

// Enhanced Product Location
export interface StructuredLocation {
  zoneId: string
  zoneName: string
  zoneCode: string
  aisleId: string
  aisleName: string
  aisleCode: string
  shelfId: string
  shelfName: string
  shelfCode: string
  shelfLevel: number
  binId: string
  binName: string
  binCode: string
  binPosition: number
  formattedLocation: string // Auto-generated based on format rules
}

// Layout Management Types
export interface LayoutStats {
  totalZones: number
  totalAisles: number
  totalShelves: number
  totalBins: number
  occupiedBins: number
  emptyBins: number
  utilizationRate: number
}

export interface LocationSuggestion {
  location: StructuredLocation
  distance?: number
  reason: string
  priority: 'high' | 'medium' | 'low'
}
