//file path: src/lib/api/storeApi.ts

import { apiRequest } from './baseApi'

export class StoreAPI {
  static async getStores() {
    return apiRequest('/stores')
  }

  static async createStore(data: any) {
    return apiRequest('/stores', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  static async updateStore(storeId: string, updates: any) {
    return apiRequest(`/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    })
  }

  static async deleteStore(storeId: string) {
    return apiRequest(`/stores/${storeId}`, {
      method: 'DELETE'
    })
  }
}
