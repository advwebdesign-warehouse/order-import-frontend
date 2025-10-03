//file path: app/dashboard/settings/types.ts

export interface FulfillmentStatus {
  id: string
  order: number           // ✅ Changed from sortOrder
  label: string
  code: string            // ✅ Changed from value
  color: string
  needsShipping: boolean
  needsPicking: boolean
  type: 'system' | 'custom'  // ✅ Changed from isSystem: boolean
  isEditable: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ColorOption {
  value: string
  label: string
  preview?: string
}

export interface SettingsTab {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export interface NotificationSettings {
  notificationEmail: string
  dailySummary: boolean
  weeklySummary: boolean
}

export interface AppSettings {
  notifications: NotificationSettings
}
