//file path: app/services/productApi.ts

/**
 * Now uses httpOnly cookies via baseApi
 * Removed localStorage token authentication
 * Uses apiRequest for consistent authentication
 */

import { Product } from '@/app/dashboard/products/utils/productTypes'
import { apiRequest } from '@/lib/api/baseApi'

class ProductApiService {
  // Get all products for the authenticated account
  async getProducts(): Promise<Product[]> {
    const result = await apiRequest('/products')
    return result.products || result
  }

  // Create or update multiple products (bulk save)
  async saveProducts(products: Product[], accountId: string): Promise<Product[]> {
    const result = await apiRequest('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products, accountId }),
    })
    return result.products || result
  }

  // Update a single product
  async updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
    const result = await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
    return result.product || result
  }

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    })
  }

  // Delete products by integration
  async deleteProductsByIntegration(integrationId: string): Promise<void> {
    await apiRequest('/products/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ integrationId }),
    })
  }

  // Get a single product by ID
  async getProductById(productId: string): Promise<Product> {
    const result = await apiRequest(`/products/${productId}`)
    return result.product || result
  }

  // Get product by SKU
  async getProductBySku(sku: string): Promise<Product | null> {
    const result = await apiRequest(`/products?sku=${sku}`)
    return result.product || null
  }

/**
 * Update product SKU
 * Convenience method for updating just the SKU field
 * @param productId - Product ID
 * @param newSku - New SKU value
 * @returns Updated product
 */
  async updateProductSku(productId: string, newSku: string): Promise<Product> {
    console.log(`[ProductApiService] Updating SKU for product ${productId} to: ${newSku}`)
    return this.updateProduct(productId, { sku: newSku })
  }

/**
  * ✅ NEW: Update product name
  * Convenience method for updating just the product name
  * @param productId - Product ID
  * @param newName - New product name
  * @returns Updated product
  */
  async updateProductName(productId: string, newName: string): Promise<Product> {
    console.log(`[ProductApiService] Updating name for product ${productId} to: ${newName}`)
    return this.updateProduct(productId, { name: newName })
  }

/**
 * Update product quantity
 * Convenience method for updating just the stock quantity
 * @param productId - Product ID
 * @param newQuantity - New stock quantity
 * @returns Updated product
 */
  async updateProductQuantity(productId: string, newQuantity: number): Promise<Product> {
    console.log(`[ProductApiService] Updating quantity for product ${productId} to: ${newQuantity}`)
    return this.updateProduct(productId, { stockQuantity: newQuantity })
  }

/**
 * Update product price (and optionally compare-at price)
 * Backend handles Shopify sync automatically on price change detection
 * @param productId - Product ID
 * @param newPrice - New price value
 * @param newComparePrice - Optional new compare-at price (pass null to clear)
 * @returns Updated product
 */
  async updateProductPrice(productId: string, newPrice: number, newComparePrice?: number | null): Promise<Product> {
    console.log(`[ProductApiService] Updating price for product ${productId} to: ${newPrice}`)
    const updates: any = { price: newPrice }
    if (newComparePrice !== undefined) {
      updates.comparePrice = newComparePrice
    }
    return this.updateProduct(productId, updates)
  }
}

export const productApi = new ProductApiService()
