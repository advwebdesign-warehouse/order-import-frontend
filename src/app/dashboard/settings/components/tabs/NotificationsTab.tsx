//file path: app/dashboard/settings/components/tabs/NotificationsTab.tsx
'use client'

import { BellIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline'

interface NotificationSettings {
  notificationEmail: string
  dailySummary: boolean
  weeklySummary: boolean
}

interface NotificationsTabProps {
  settings: NotificationSettings
  onChange: (updates: Partial<NotificationSettings>) => void
}

export default function NotificationsTab({ settings, onChange }: NotificationsTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
        <p className="mt-1 text-sm text-gray-600">
          Configure email notifications and summary reports.
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Email */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Notification Email</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => onChange({ notificationEmail: e.target.value })}
              placeholder="admin@example.com"
              className="mt-1 block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Where all notification emails will be sent
            </p>
          </div>
        </div>

        {/* Summary Reports - Coming Soon */}
        <div className="pb-6">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-sm font-medium text-gray-900">Summary Reports</h4>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <ClockIcon className="h-3 w-3" />
              Coming Soon
            </span>
          </div>

          <div className="space-y-3 opacity-60">
            <label className="flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={false}
                disabled={true}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-gray-500">Daily summary (sent at 9 AM)</span>
            </label>

            <label className="flex items-center cursor-not-allowed">
              <input
                type="checkbox"
                checked={false}
                disabled={true}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed"
              />
              <span className="ml-2 text-sm text-gray-500">Weekly summary (sent Monday mornings)</span>
            </label>
          </div>
        </div>

        {/* Info Alert */}
        <div className="rounded-md bg-blue-50 p-4">
          <div className="flex">
            <EnvelopeIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Email Notifications Active</h4>
              <p className="mt-1 text-sm text-blue-700">
                {settings.notificationEmail
                  ? `Notifications will be sent to ${settings.notificationEmail}`
                  : 'Please enter an email address to receive notifications'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Features */}
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <ClockIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">More Features Coming Soon</h4>
              <div className="mt-1 text-sm text-yellow-700">
                <p>We're working on additional notification features including:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Low stock alerts</li>
                  <li>Custom alert rules</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
