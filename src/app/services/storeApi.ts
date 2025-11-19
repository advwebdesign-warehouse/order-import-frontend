//file path: app/services/storeApi.ts

import { Store } from '@/app/dashboard/stores/utils/storeTypes'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.advorderflow.com'

class StoreApiService {
  private getAuthToken(): string | null {
    // Get token from localStorage or wherever you store it
    return localStorage.getItem('authToken')
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = this.getAuthToken()

    if (!token) {
      throw new Error('No authentication token found')
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
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

  // Get all stores for the authenticated account
  async getStores(): Promise<Store[]> {
    return this.fetchWithAuth('/api/stores')
  }

  // Create a new store
  async createStore(storeData: Partial<Store>): Promise<Store> {
    return this.fetchWithAuth('/api/stores', {
      method: 'POST',
      body: JSON.stringify(storeData),
    })
  }

  // Update an existing store
  async updateStore(storeId: string, storeData: Partial<Store>): Promise<Store> {
    return this.fetchWithAuth(`/api/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    })
  }

  // Delete a store
  async deleteStore(storeId: string): Promise<void> {
    return this.fetchWithAuth(`/api/stores/${storeId}`, {
      method: 'DELETE',
    })
  }

  // Get a single store by ID
  async getStoreById(storeId: string): Promise<Store> {
    return this.fetchWithAuth(`/api/stores/${storeId}`)
  }
}

export const storeApi = new StoreApiService()
