//file path: app/dashboard/settings/components/tabs/PerformanceTab.tsx
'use client'

import { UserSettings } from '../../../shared/utils/settingsTypes'

interface PerformanceTabProps {
  settings: UserSettings
  onChange: (section: keyof UserSettings, key: string, value: any) => void
}

export default function PerformanceTab({ settings, onChange }: PerformanceTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h3 className="text-lg font-medium text-gray-900">Performance Settings</h3>
      <p className="text-sm text-gray-600">Optimize application performance and loading.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Performance tuning options coming soon. This will include lazy loading preferences, cache settings, and data fetching optimization.
          </p>
        </div>
      </div>
    </div>
  )
}
