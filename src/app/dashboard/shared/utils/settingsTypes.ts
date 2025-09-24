//file path: app/dashboard/shared/utils/settingsTypes.ts
export interface PaginationSettings {
  ordersPerPage: number
  productsPerPage: number
  showPaginationInfo: boolean
  showJumpToPage: boolean
}

export interface DisplaySettings {
  dateFormat: 'US' | 'EU' | 'ISO'
  timeFormat: '12h' | '24h'
  currency: string
  currencyPosition: 'before' | 'after'
  thousandsSeparator: ',' | '.' | ' '
  decimalSeparator: '.' | ','
  decimalPlaces: number
  showCurrencySymbol: boolean
}

export interface InventorySettings {
  manageStock: boolean
  trackQuantity: boolean
  showStockWarnings: boolean
  lowStockThreshold: number
  enableBackorders: boolean
  autoUpdateStock: boolean
}

export interface TableSettings {
  enableColumnReordering: boolean
  enableColumnResizing: boolean
  saveColumnState: boolean
  showRowNumbers: boolean
  alternateRowColors: boolean
  compactMode: boolean
  stickyHeaders: boolean
}

export interface FilterSettings {
  rememberFilters: boolean
  showFilterCount: boolean
  enableQuickFilters: boolean
  defaultDateRange: string
  autoApplyFilters: boolean
}

export interface ExportSettings {
  defaultExportFormat: 'csv' | 'xlsx' | 'json'
  includeHeaders: boolean
  includeHiddenColumns: boolean
  dateFormat: string
  filename: string
}

export interface NotificationSettings {
  showSuccessMessages: boolean
  showErrorMessages: boolean
  autoHideNotifications: boolean
  notificationDuration: number
  enableSound: boolean
}

export interface PerformanceSettings {
  enableVirtualization: boolean
  lazyLoading: boolean
  cacheSize: number
  enablePreloading: boolean
  maxSearchResults: number
}

export interface UserSettings {
  pagination: PaginationSettings
  display: DisplaySettings
  inventory: InventorySettings
  table: TableSettings
  filters: FilterSettings
  export: ExportSettings
  notifications: NotificationSettings
  performance: PerformanceSettings
}

// Default settings - UPDATED: manageStock is now false by default
export const DEFAULT_USER_SETTINGS: UserSettings = {
  pagination: {
    ordersPerPage: 20,
    productsPerPage: 20,
    showPaginationInfo: true,
    showJumpToPage: true
  },
  display: {
    dateFormat: 'US',
    timeFormat: '12h',
    currency: 'USD',
    currencyPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    decimalPlaces: 2,
    showCurrencySymbol: true
  },
  inventory: {
    manageStock: false, // CHANGED: Set to false by default
    trackQuantity: true,
    showStockWarnings: true,
    lowStockThreshold: 10,
    enableBackorders: false,
    autoUpdateStock: true
  },
  table: {
    enableColumnReordering: true,
    enableColumnResizing: false,
    saveColumnState: true,
    showRowNumbers: false,
    alternateRowColors: true,
    compactMode: false,
    stickyHeaders: true
  },
  filters: {
    rememberFilters: true,
    showFilterCount: true,
    enableQuickFilters: true,
    defaultDateRange: '',
    autoApplyFilters: true
  },
  export: {
    defaultExportFormat: 'csv',
    includeHeaders: true,
    includeHiddenColumns: false,
    dateFormat: 'MM/dd/yyyy',
    filename: 'export-{date}'
  },
  notifications: {
    showSuccessMessages: true,
    showErrorMessages: true,
    autoHideNotifications: true,
    notificationDuration: 5000,
    enableSound: false
  },
  performance: {
    enableVirtualization: false,
    lazyLoading: true,
    cacheSize: 100,
    enablePreloading: false,
    maxSearchResults: 1000
  }
}

export const PAGINATION_OPTIONS = [
  { value: 10, label: '10 items per page' },
  { value: 20, label: '20 items per page' },
  { value: 50, label: '50 items per page' },
  { value: 100, label: '100 items per page' },
  { value: 200, label: '200 items per page' }
]

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
  { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' }
]
