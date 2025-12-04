//file path: app/services/productApi.ts

/**
 * ✅ UPDATED: Now uses httpOnly cookies via baseApi
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
}

export const productApi = new ProductApiService()
