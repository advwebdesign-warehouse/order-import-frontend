//file path: app/services/productApi.ts

import { Product } from '@/app/dashboard/products/utils/productTypes'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

class ProductApiService {
  private getAuthToken(): string | null {
    // Get token from localStorage or wherever you store it
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Get all products for the authenticated account
  async getProducts(): Promise<Product[]> {
    const result = await this.fetchWithAuth('/api/products')
    return result.products
  }

  // Create or update multiple products (bulk save)
  async saveProducts(products: Product[], accountId: string): Promise<Product[]> {
    const result = await this.fetchWithAuth('/api/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products, accountId }),
    })
    return result.products
  }

  // Update a single product
  async updateProduct(productId: string, productData: Partial<Product>): Promise<Product> {
    const result = await this.fetchWithAuth(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    })
    return result.product
  }

  // Delete a product
  async deleteProduct(productId: string): Promise<void> {
    await this.fetchWithAuth(`/api/products/${productId}`, {
      method: 'DELETE',
    })
  }

  // Delete products by integration
  async deleteProductsByIntegration(integrationId: string): Promise<void> {
    await this.fetchWithAuth('/api/products/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ integrationId }),
    })
  }

  // Get a single product by ID
  async getProductById(productId: string): Promise<Product> {
    const result = await this.fetchWithAuth(`/api/products/${productId}`)
    return result.product
  }

  // Get product by SKU
  async getProductBySku(sku: string): Promise<Product | null> {
    const result = await this.fetchWithAuth(`/api/products?sku=${sku}`)
    return result.product || null
  }
}

export const productApi = new ProductApiService()
