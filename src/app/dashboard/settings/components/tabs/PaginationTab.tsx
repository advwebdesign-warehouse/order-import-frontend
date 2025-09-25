//file path: app/dashboard/settings/components/tabs/PaginationTab.tsx
'use client'

import { UserSettings, PAGINATION_OPTIONS } from '../../../shared/utils/settingsTypes'

interface PaginationTabProps {
  settings: UserSettings
  onChange: (section: keyof UserSettings, key: string, value: any) => void
}

export default function PaginationTab({ settings, onChange }: PaginationTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Pagination Settings</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Orders per page</label>
            <select
              value={settings.pagination.ordersPerPage}
              onChange={(e) => onChange('pagination', 'ordersPerPage', parseInt(e.target.value))}
              className="mt-1 block w-32 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {PAGINATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Products per page</label>
            <select
              value={settings.pagination.productsPerPage}
              onChange={(e) => onChange('pagination', 'productsPerPage', parseInt(e.target.value))}
              className="mt-1 block w-32 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {PAGINATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.pagination.showPaginationInfo}
              onChange={(e) => onChange('pagination', 'showPaginationInfo', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show pagination info</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.pagination.showJumpToPage}
              onChange={(e) => onChange('pagination', 'showJumpToPage', e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show jump to page</span>
          </label>
        </div>
      </div>
    </div>
  )
}
