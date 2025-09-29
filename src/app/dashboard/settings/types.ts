//file path: app/dashboard/settings/types.ts
export interface FulfillmentStatus {
  id: string
  value: string
  label: string
  color: string
  needsShipping: boolean
  needsPicking: boolean
  isSystem: boolean
  sortOrder: number
}

export interface ColorOption {
  value: string
  label: string
  preview: string
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
