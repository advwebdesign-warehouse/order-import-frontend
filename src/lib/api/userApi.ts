//file path: src/lib/api/userApi.ts

import { apiRequest } from './baseApi'

export interface UserPreferences {
  id: string
  userId: string
  accountId: string

  // Order page preferences
  orderFilters?: any
  orderColumns?: any
  orderSortConfig?: any
  showOrderFilters?: boolean

  // ✅ NEW: Product page preferences
  productFilters?: any
  productColumns?: any
  productSortConfig?: any
  showProductFilters?: boolean

  createdAt: string
  updatedAt: string
}

export class UserAPI {
  /**
   * Get current user info
   */
  static async getCurrentUser() {
    return apiRequest('/users/current')
  }

  /**
   * Get user preferences (synced across devices)
   */
  static async getPreferences(): Promise<UserPreferences> {
    return apiRequest('/users/preferences')
  }

  /**
   * Update user preferences (full update)
   */
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiRequest('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    })
  }

  /**
   * Update specific preference field (partial update)
   * More efficient for single field updates
   */
  static async updatePreferenceField(field: string, value: any): Promise<UserPreferences> {
    return apiRequest(`/users/preferences/${field}`, {
      method: 'PATCH',
      body: JSON.stringify({ value })
    })
  }

  /**
   * Reset preferences to defaults
   */
  static async resetPreferences(): Promise<{ success: boolean; message: string }> {
    return apiRequest('/users/preferences', {
      method: 'DELETE'
    })
  }
}
