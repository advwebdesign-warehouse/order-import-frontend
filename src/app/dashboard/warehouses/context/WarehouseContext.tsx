//file path: app/dashboard/warehouses/context/WarehouseContext.tsx

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Warehouse, DEFAULT_ORDER_STATUS_SETTINGS } from '../utils/warehouseTypes'

// Mock data
const mockWarehouses: Warehouse[] = [
  {
    id: '1',
    name: 'New York Warehouse',
    code: 'NY-01',
    description: 'Main distribution center',
    address: {
      address1: '123 Industrial Blvd',
      address2: 'Suite 100',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'United States',
      countryCode: 'US'
    },
    status: 'active',
    isDefault: true,
    contactInfo: {
      managerName: 'John Smith',
      phone: '+1 (555) 123-4567',
      email: 'john.smith@company.com'
    },
    settings: {
      allowBackorders: false,
      trackInventory: true,
      autoFulfill: true,
      priority: 1,
      orderStatusSettings: DEFAULT_ORDER_STATUS_SETTINGS
    },
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    productCount: 150,
    // NEW: Return address fields
    useDifferentReturnAddress: false,
    returnAddress: undefined
  },
  {
    id: '2',
    name: 'Los Angeles Warehouse',
    code: 'LA-01',
    description: 'West coast fulfillment center',
    address: {
      address1: '456 Logistics Drive',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90210',
      country: 'United States',
      countryCode: 'US'
    },
    status: 'active',
    isDefault: false,
    contactInfo: {
      managerName: 'Sarah Johnson',
      phone: '+1 (555) 987-6543',
      email: 'sarah.johnson@company.com'
    },
    settings: {
      allowBackorders: true,
      trackInventory: true,
      autoFulfill: false,
      priority: 2,
      orderStatusSettings: {
        ...DEFAULT_ORDER_STATUS_SETTINGS,
        displayText: 'pending shipments',
        toShipStatuses: ['PENDING', 'PROCESSING', 'PICKING', 'PACKING']
      }
    },
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    productCount: 85,
    // NEW: Return address fields
    useDifferentReturnAddress: false,
    returnAddress: undefined
  },
  {
    id: '3',
    name: 'Chicago Warehouse',
    code: 'CHI-01',
    description: 'Midwest distribution hub',
    address: {
      address1: '789 Commerce Street',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      country: 'United States',
      countryCode: 'US'
    },
    status: 'active',
    isDefault: false,
    contactInfo: {
      managerName: 'Mike Wilson',
      phone: '+1 (555) 555-0123',
      email: 'mike.wilson@company.com'
    },
    settings: {
      allowBackorders: false,
      trackInventory: true,
      autoFulfill: true,
      priority: 3,
      orderStatusSettings: {
        ...DEFAULT_ORDER_STATUS_SETTINGS,
        displayText: 'orders awaiting fulfillment',
        excludedStatuses: ['CANCELLED', 'RETURNED']
      }
    },
    createdAt: '2025-03-01T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    productCount: 120,
    // NEW: Return address fields
    useDifferentReturnAddress: false,
    returnAddress: undefined
  }
]

interface WarehouseContextType {
  warehouses: Warehouse[]
  loading: boolean
  error: string | null
  addWarehouse: (warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Warehouse>
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => Promise<void>
  deleteWarehouse: (id: string) => Promise<void>
  getDefaultWarehouse: () => Warehouse | null
  getActiveWarehouses: () => Warehouse[]
  refetchWarehouses: () => Promise<void>
  resetToMockData: () => void
  updateWarehouseOrderSettings: (id: string, orderStatusSettings: Partial<Warehouse['settings']['orderStatusSettings']>) => Promise<void>
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined)

interface WarehouseProviderProps {
  children: ReactNode
}

export function WarehouseProvider({ children }: WarehouseProviderProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to update localStorage with client-side check
  const updateLocalStorage = (newWarehouses: Warehouse[]) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('warehouses', JSON.stringify(newWarehouses))
    } catch (err) {
      console.error('Failed to update localStorage:', err)
    }
  }

  // Migrate existing warehouses to include order status settings and return address fields
  const migrateWarehouseData = (warehouses: Warehouse[]): Warehouse[] => {
    return warehouses.map(warehouse => ({
      ...warehouse,
      settings: {
        ...warehouse.settings,
        orderStatusSettings: warehouse.settings.orderStatusSettings || DEFAULT_ORDER_STATUS_SETTINGS
      },
      // NEW: Ensure return address fields exist
      useDifferentReturnAddress: warehouse.useDifferentReturnAddress ?? false,
      returnAddress: warehouse.returnAddress ?? undefined
    }))
  }

  // Load warehouses from localStorage or use mock data
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if we're on client side
        if (typeof window === 'undefined') {
          setWarehouses(mockWarehouses)
          setLoading(false)
          return
        }

        // Try to load from localStorage first
        const storedWarehouses = localStorage.getItem('warehouses')
        if (storedWarehouses) {
          const parsed = JSON.parse(storedWarehouses)
          // Migrate data to include order status settings and return address fields if missing
          const migratedWarehouses = migrateWarehouseData(parsed)
          setWarehouses(migratedWarehouses)
          // Update localStorage with migrated data
          updateLocalStorage(migratedWarehouses)
        } else {
          // If no stored data, use mock data and save it
          setWarehouses(mockWarehouses)
          updateLocalStorage(mockWarehouses)
        }

        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err) {
        console.error('Error loading warehouses:', err)
        setError('Failed to load warehouses')
        // Fallback to mock data on error
        setWarehouses(mockWarehouses)
      } finally {
        setLoading(false)
      }
    }

    loadWarehouses()
  }, [])

  // Add new warehouse
  const addWarehouse = async (warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> => {
    try {
      const newWarehouse: Warehouse = {
        ...warehouseData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        productCount: 0,
        settings: {
          ...warehouseData.settings,
          orderStatusSettings: warehouseData.settings.orderStatusSettings || DEFAULT_ORDER_STATUS_SETTINGS
        },
        // NEW: Ensure return address fields are included
        useDifferentReturnAddress: warehouseData.useDifferentReturnAddress ?? false,
        returnAddress: warehouseData.returnAddress ?? undefined
      }

      const updatedWarehouses = [...warehouses, newWarehouse]
      setWarehouses(updatedWarehouses)
      updateLocalStorage(updatedWarehouses)

      return newWarehouse
    } catch (err) {
      console.error('Error adding warehouse:', err)
      throw new Error('Failed to add warehouse')
    }
  }

  // Update existing warehouse
  const updateWarehouse = async (id: string, updates: Partial<Warehouse>) => {
    try {
      const updatedWarehouses = warehouses.map(warehouse =>
        warehouse.id === id
          ? { ...warehouse, ...updates, updatedAt: new Date().toISOString() }
          : warehouse
      )
      setWarehouses(updatedWarehouses)
      updateLocalStorage(updatedWarehouses)
    } catch (err) {
      console.error('Error updating warehouse:', err)
      throw new Error('Failed to update warehouse')
    }
  }

  // Update warehouse order status settings specifically
  const updateWarehouseOrderSettings = async (id: string, orderStatusSettings: Partial<Warehouse['settings']['orderStatusSettings']>) => {
    try {
      const updatedWarehouses = warehouses.map(warehouse =>
        warehouse.id === id
          ? {
              ...warehouse,
              settings: {
                ...warehouse.settings,
                orderStatusSettings: {
                  ...warehouse.settings.orderStatusSettings,
                  ...orderStatusSettings
                }
              },
              updatedAt: new Date().toISOString()
            }
          : warehouse
      )
      setWarehouses(updatedWarehouses)
      updateLocalStorage(updatedWarehouses)
    } catch (err) {
      console.error('Error updating warehouse order settings:', err)
      throw new Error('Failed to update warehouse order settings')
    }
  }

  // Delete warehouse
  const deleteWarehouse = async (id: string) => {
    try {
      const warehouseToDelete = warehouses.find(w => w.id === id)

      if (warehouseToDelete?.isDefault) {
        throw new Error('Cannot delete the default warehouse')
      }

      const updatedWarehouses = warehouses.filter(w => w.id !== id)
      setWarehouses(updatedWarehouses)
      updateLocalStorage(updatedWarehouses)
    } catch (err) {
      console.error('Error deleting warehouse:', err)
      throw new Error('Failed to delete warehouse')
    }
  }

  // Get default warehouse
  const getDefaultWarehouse = (): Warehouse | null => {
    return warehouses.find(w => w.isDefault) || null
  }

  // Get active warehouses
  const getActiveWarehouses = (): Warehouse[] => {
    return warehouses.filter(w => w.status === 'active')
  }

  // Refresh warehouses data
  const refetchWarehouses = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Check if we're on client side
    if (typeof window !== 'undefined') {
      // Reload from localStorage or use fresh mock data
      const storedWarehouses = localStorage.getItem('warehouses')
      if (storedWarehouses) {
        const parsed = JSON.parse(storedWarehouses)
        const migratedWarehouses = migrateWarehouseData(parsed)
        setWarehouses(migratedWarehouses)
      } else {
        setWarehouses([...mockWarehouses])
        updateLocalStorage(mockWarehouses)
      }
    } else {
      setWarehouses([...mockWarehouses])
    }
    setLoading(false)
  }

  // Reset to original mock data (useful for testing)
  const resetToMockData = () => {
    setWarehouses(mockWarehouses)
    updateLocalStorage(mockWarehouses)
  }

  const value: WarehouseContextType = {
    warehouses,
    loading,
    error,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    getDefaultWarehouse,
    getActiveWarehouses,
    refetchWarehouses,
    resetToMockData,
    updateWarehouseOrderSettings
  }

  return (
    <WarehouseContext.Provider value={value}>
      {children}
    </WarehouseContext.Provider>
  )
}

// Custom hook to use the warehouse context
export function useWarehouses() {
  const context = useContext(WarehouseContext)
  if (context === undefined) {
    throw new Error('useWarehouses must be used within a WarehouseProvider')
  }
  return context
}

export default WarehouseContext
