//file path: app/dashboard/settings/components/shared/SettingsHeader.tsx
'use client'

import { CheckIcon } from '@heroicons/react/24/outline'

interface SettingsHeaderProps {
  hasChanges: boolean
  onSave: () => void
  onResetAll: () => void
  hideResetAll?: boolean
}

export default function SettingsHeader({ hasChanges, onSave, onResetAll, hideResetAll = false }: SettingsHeaderProps) {
  return (
    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure your preferences for orders, products, and general application behavior.
        </p>
      </div>
      <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex gap-2">
        {hasChanges && (
          <button
            onClick={onSave}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <CheckIcon className="h-4 w-4" />
            Save Changes
          </button>
        )}
        {!hideResetAll && (
          <button
            onClick={onResetAll}
            className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            Reset All
          </button>
        )}
      </div>
    </div>
  )
}
