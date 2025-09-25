//file path: app/dashboard/settings/components/tabs/TableTab.tsx
'use client'

import { UserSettings } from '../../../shared/utils/settingsTypes'

interface TableTabProps {
  settings: UserSettings
  onChange: (section: keyof UserSettings, key: string, value: any) => void
}

export default function TableTab({ settings, onChange }: TableTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h3 className="text-lg font-medium text-gray-900">Table Settings</h3>
      <p className="text-sm text-gray-600">Customize table behavior and appearance.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Table customization options coming soon. This will include column visibility, sorting preferences, row density, and more.
          </p>
        </div>
      </div>
    </div>
  )
}
