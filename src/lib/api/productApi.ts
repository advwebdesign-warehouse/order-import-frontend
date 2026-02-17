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
   * If warehouseId is provided, only removes inventory from that warehouse
   * (and deletes the product entirely if no warehouse entries remain).
   * If warehouseId is not provided, deletes products entirely from all warehouses.
   * @param productIds - Array of product IDs to delete
   * @param warehouseId - Optional warehouse ID for warehouse-specific removal
   * @returns Object with deletedCount, removedFromWarehouseCount, and notFoundCount
   */
  static async bulkDeleteProducts(productIds: string[], warehouseId?: string) {
    return apiRequest('/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ productIds, warehouseId })
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
   * Update warehouse-specific inventory
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

  /**
   * Update product SKU
   * Convenience method for updating just the SKU field
   * @param productId - Product ID
   * @param newSku - New SKU value
   * @returns Updated product
   */
  static async updateProductSku(productId: string, newSku: string) {
    console.log(`[ProductAPI] Updating SKU for product ${productId} to: ${newSku}`)
    return this.updateProduct(productId, { sku: newSku })
  }

  /**
   * Update product name
   * Convenience method for updating just the product name
   * @param productId - Product ID
   * @param newName - New product name
   * @returns Updated product
   */
  static async updateProductName(productId: string, newName: string) {
    console.log(`[ProductAPI] Updating name for product ${productId} to: ${newName}`)
    return this.updateProduct(productId, { name: newName })
  }

  /**
   * Update product quantity
   * Convenience method for updating just the stock quantity
   * @param productId - Product ID
   * @param newQuantity - New stock quantity
   * @returns Updated product
   */
  static async updateProductQuantity(productId: string, newQuantity: number) {
    console.log(`[ProductAPI] Updating quantity for product ${productId} to: ${newQuantity}`)
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
  static async updateProductPrice(productId: string, newPrice: number, newComparePrice?: number | null) {
    console.log(`[ProductAPI] Updating price for product ${productId} to: ${newPrice}`)
    const updates: any = { price: newPrice }
    if (newComparePrice !== undefined) {
      updates.comparePrice = newComparePrice
    }
    return this.updateProduct(productId, updates)
  }
}
