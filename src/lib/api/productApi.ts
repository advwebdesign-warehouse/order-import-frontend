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
}
