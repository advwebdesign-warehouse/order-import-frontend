//file path: src/lib/api/productApi.ts

import { apiRequest } from './baseApi'

export class ProductAPI {
  static async getProducts() {
    return apiRequest('/products')
  }

  static async saveProducts(products: any[]) {
    return apiRequest('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products })
    })
  }

  static async getProductBySku(sku: string) {
    return apiRequest(`/products/sku/${sku}`)
  }

  static async updateProduct(productId: string, updates: any) {
    return apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  static async deleteProduct(productId: string) {
    return apiRequest(`/products/${productId}`, {
      method: 'DELETE'
    })
  }

  /**
   * ✅ NEW: Bulk delete multiple products in a single request
   * @param productIds - Array of product IDs to delete
   * @returns Object with deletedCount and notFoundCount
   */
  static async bulkDeleteProducts(productIds: string[]) {
    return apiRequest('/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ productIds })
    })
  }
}
