//file path: app/services/storeApi.ts

import { apiRequest } from '@/lib/api/baseApi'
import { Store } from '@/app/dashboard/stores/utils/storeTypes'

/**
 * ✅ UPDATED FOR HTTPONLY COOKIES
 *
 * Changed from localStorage token management to httpOnly cookies
 * Now uses apiRequest from baseApi.ts which automatically includes cookies
 */

class StoreApiService {
  // Get all stores for the authenticated account
  async getStores(): Promise<Store[]> {
    return apiRequest('/stores')
  }

  // Create a new store
  async createStore(storeData: Partial<Store>): Promise<Store> {
    return apiRequest('/stores', {
      method: 'POST',
      body: JSON.stringify(storeData),
    })
  }

  // Update an existing store
  async updateStore(storeId: string, storeData: Partial<Store>): Promise<Store> {
    return apiRequest(`/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    })
  }

  // Delete a store
  async deleteStore(storeId: string): Promise<void> {
    return apiRequest(`/stores/${storeId}`, {
      method: 'DELETE',
    })
  }

  // Get a single store by ID
  async getStoreById(storeId: string): Promise<Store> {
    return apiRequest(`/stores/${storeId}`)
  }
}

export const storeApi = new StoreApiService()
