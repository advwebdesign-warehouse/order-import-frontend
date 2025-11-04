//file path: app/dashboard/products/hooks/useProducts.tsx

import { useState, useEffect } from 'react'
import { Product } from '../utils/productTypes'
import {
  getProductsFromStorage,
  getProductsByWarehouse,
  getProductsByPlatform,
  getProductsByStore,
  getProductsByIntegration,
  getProductIntegrationDetails
} from '@/lib/storage/productStorage'
import { getCurrentAccountId } from '@/lib/storage/integrationStorage'

export function useProducts(warehouseId?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        const accountId = getCurrentAccountId()

        await new Promise(resolve => setTimeout(resolve, 500))

        let filteredProducts: Product[]

        if (warehouseId) {
          // Filter by warehouse (checks warehouseStock array)
          filteredProducts = getProductsByWarehouse(warehouseId, accountId)
        } else {
          // Get all products
          filteredProducts = getProductsFromStorage(accountId)
        }

        setProducts(filteredProducts)
        setError(null)
      } catch (err) {
        setError('Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [warehouseId])

  const refetchProducts = async () => {
    setLoading(true)

    try {
      const accountId = getCurrentAccountId()

      await new Promise(resolve => setTimeout(resolve, 300))

      let filteredProducts: Product[]

      if (warehouseId) {
        // Filter by warehouse (checks warehouseStock array)
        filteredProducts = getProductsByWarehouse(warehouseId)
      } else {
        // Get all products
        filteredProducts = getProductsFromStorage(accountId)
      }

      setProducts([...filteredProducts]) // Force re-render with fresh data
    } catch (err) {
      console.error('Error refetching products:', err)
      setError('Failed to refetch products')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get products by warehouse ID
   * Checks the warehouseStock array to see if product exists in that warehouse
   */
  const getProductsByWarehouseId = (targetWarehouseId: string): Product[] => {
    const accountId = getCurrentAccountId()
    return getProductsByWarehouse(targetWarehouseId, accountId)
  }

  /**
   * Get warehouse stock for a specific product and warehouse
   */
  const getWarehouseStock = (productId: string, targetWarehouseId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.warehouseStock?.find(stock => stock.warehouseId === targetWarehouseId)
  }

  /**
   * Get products by platform name (e.g., 'Shopify', 'WooCommerce')
   * Looks up integrations to find matching platform
   */
  const getProductsByPlatformName = (platform: string): Product[] => {
    const accountId = getCurrentAccountId()
    return getProductsByPlatform(platform, accountId)
  }

  /**
   * Get products by store ID
   * Looks up integrations to find matching store
   */
  const getProductsByStoreId = (storeId: string): Product[] => {
    const accountId = getCurrentAccountId()
    return getProductsByStore(storeId, accountId)
  }

  /**
   * Get products by integration ID
   */
  const getProductsByIntegrationId = (integrationId: string): Product[] => {
    const accountId = getCurrentAccountId()
    return getProductsByIntegration(integrationId, accountId)
  }

  /**
   * Get integration details for a product (platform, store, etc.)
   */
  const getIntegrationDetails = (product: Product) => {
    const accountId = getCurrentAccountId()
    return getProductIntegrationDetails(product, accountId)
  }

  /**
   * Get platform name for a product by looking up its integration
   */
  const getProductPlatform = (product: Product): string | null => {
    const details = getIntegrationDetails(product)
    return details?.platform || null
  }

  /**
   * Get store ID for a product by looking up its integration
   */
  const getProductStoreId = (product: Product): string | null => {
    const details = getIntegrationDetails(product)
    return details?.storeId || null
  }

  /**
   * Check if product exists in a specific warehouse
   */
  const isProductInWarehouse = (productId: string, targetWarehouseId: string): boolean => {
    const product = products.find(p => p.id === productId)
    return product?.warehouseStock?.some(stock => stock.warehouseId === targetWarehouseId) || false
  }

  /**
   * Get all warehouses where this product exists
   */
  const getProductWarehouses = (productId: string): string[] => {
    const product = products.find(p => p.id === productId)
    return product?.warehouseStock?.map(stock => stock.warehouseId) || []
  }

  return {
    products,
    loading,
    error,
    refetchProducts,
    // Warehouse functions
    getProductsByWarehouse: getProductsByWarehouseId,
    getWarehouseStock,
    isProductInWarehouse,
    getProductWarehouses,
    // Integration/Platform/Store functions
    getProductsByPlatform: getProductsByPlatformName,
    getProductsByStore: getProductsByStoreId,
    getProductsByIntegration: getProductsByIntegrationId,
    getIntegrationDetails,
    getProductPlatform,
    getProductStoreId
  }
}
