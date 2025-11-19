//file path: src/app/services/settingsApi.ts

import { apiRequest } from '@/lib/api/baseApi'

export interface NotificationSettings {
  notificationEmail: string
  dailySummary: boolean
  weeklySummary: boolean
}

export interface FulfillmentSettings {
  statuses?: any[]
  [key: string]: any
}

export interface AppSettings {
  notifications: NotificationSettings
  fulfillment?: FulfillmentSettings
  general?: any
}

export const settingsApi = {
  /**
   * Get current account settings
   */
  async getSettings(): Promise<AppSettings> {
    return apiRequest('/settings')
  },

  /**
   * Update all settings
   */
  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
    return response.settings
  },

  /**
   * Update only notification settings
   */
  async updateNotificationSettings(notifications: NotificationSettings): Promise<AppSettings> {
    const response = await apiRequest('/settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(notifications)
    })
    return response.settings
  },

  /**
   * Update only fulfillment settings
   */
  async updateFulfillmentSettings(fulfillment: FulfillmentSettings): Promise<AppSettings> {
    const response = await apiRequest('/settings/fulfillment', {
      method: 'PUT',
      body: JSON.stringify(fulfillment)
    })
    return response.settings
  },

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<void> {
    await apiRequest('/settings', {
      method: 'DELETE'
    })
  }
}
