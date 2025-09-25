//file path: app/dashboard/settings/components/tabs/ExportTab.tsx
'use client'

import { UserSettings } from '../../../shared/utils/settingsTypes'

interface ExportTabProps {
  settings: UserSettings
  onChange: (section: keyof UserSettings, key: string, value: any) => void
}

export default function ExportTab({ settings, onChange }: ExportTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h3 className="text-lg font-medium text-gray-900">Export Settings</h3>
      <p className="text-sm text-gray-600">Set default export formats and options.</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Export configuration coming soon. This will include default file formats, column selection, and export scheduling options.
          </p>
        </div>
      </div>
    </div>
  )
}
