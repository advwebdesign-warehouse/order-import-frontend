//file path: app/dashboard/products/hooks/useProducts.tsx

import { useState, useEffect } from 'react'
import { Product } from '../utils/productTypes'
import { ProductAPI } from '@/lib/api/productApi'

export function useProducts(warehouseId?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // ✅ NEW: Mark as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ UPDATED: Only load products after mounting
  useEffect(() => {
    if (!mounted) {
      return // Skip during SSR
    }

    const fetchProducts = async () => {
      console.log('[useProducts] 🔄 Loading products from API...')
      setLoading(true)

    try {
      // ✅ UPDATED: Fetch from API (accountId handled by backend via auth token)
      const productsData = await ProductAPI.getProducts()

      let filteredProducts = productsData

      // Client-side filter by warehouse if needed
      if (warehouseId) {
        console.log('[useProducts] 🏭 Filtering by warehouse:', warehouseId)
        filteredProducts = productsData.filter((product: Product) =>
          product.warehouseStock?.some(stock => stock.warehouseId === warehouseId)
        )
      }

      console.log('[useProducts] ✅ Loaded products:', filteredProducts.length)
      setProducts(filteredProducts)
      setError(null)
    } catch (err) {
      console.error('[useProducts] ❌ Error fetching products:', err)
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  fetchProducts()
}, [mounted, warehouseId]) // ✅ Re-run when mounted or warehouse changes

  const refetchProducts = async () => {
    if (!mounted) {
      console.warn('[useProducts] ⚠️ Cannot refetch - not mounted yet')
      return
    }

    console.log('[useProducts] 🔄 Refetching products...')
    setLoading(true)

    try {
      // ✅ UPDATED: Fetch from API
      const productsData = await ProductAPI.getProducts()

      let filteredProducts = productsData

      // Client-side filter by warehouse if needed
      if (warehouseId) {
        filteredProducts = productsData.filter((product: Product) =>
          product.warehouseStock?.some(stock => stock.warehouseId === warehouseId)
        )
      }

      console.log('[useProducts] ✅ Refetched products:', filteredProducts.length)
      setProducts([...filteredProducts]) // Force re-render with fresh data
      setError(null)
    } catch (err) {
      console.error('[useProducts] ❌ Error refetching products:', err)
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
     return products.filter((product: Product) =>
       product.warehouseStock?.some(stock => stock.warehouseId === targetWarehouseId)
     )
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
   * Uses product storeId and integration data
   */
  const getProductsByPlatformName = (platform: string): Product[] => {
    // This would need integration data - for now, filter by product platform if available
    return products.filter(product => product.platform === platform)
  }

  /**
   * Get products by store ID
   */
  const getProductsByStoreId = (storeId: string): Product[] => {
    return products.filter(product => product.storeId === storeId)
  }

  /**
   * Get products by integration ID
   */
  const getProductsByIntegrationId = (integrationId: string): Product[] => {
    return products.filter(product => product.integrationId === integrationId)
  }

  /**
   * Get integration details for a product (platform, store, etc.)
   */
  const getIntegrationDetails = (product: Product) => {
    return {
      platform: product.platform,
      storeId: product.storeId,
      integrationId: product.integrationId
    }
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
