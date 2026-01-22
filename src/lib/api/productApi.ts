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
   * Bulk delete multiple products in a single request
   * @param productIds - Array of product IDs to delete
   * @returns Object with deletedCount and notFoundCount
   */
  static async bulkDeleteProducts(productIds: string[]) {
    return apiRequest('/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ productIds })
    })
  }

  /**
   * Import products from an e-commerce integration
   * @param integrationId - Integration ID to import from
   * @param options - Import options (warehouse destination, update existing, etc.)
   * @returns Import result with count and warehouse info
   */
  static async importProducts(integrationId: string, options: any) {
    return apiRequest(`/products/import/${integrationId}`, {
      method: 'POST',
      body: JSON.stringify(options)
    })
  }

  /**
   * ✅ NEW: Update warehouse-specific inventory
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   * @param quantity - New quantity for this warehouse
   * @returns Updated inventory record
   */
  static async updateWarehouseInventory(productId: string, warehouseId: string, quantity: number) {
    return apiRequest(`/products/${productId}/warehouse/${warehouseId}/inventory`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    })
  }
}
