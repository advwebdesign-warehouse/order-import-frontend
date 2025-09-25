//file path: app/dashboard/settings/components/shared/TabNavigation.tsx
'use client'

import { SettingsTab } from '../../types'

interface TabNavigationProps {
  tabs: SettingsTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <>
      <div className="sm:hidden">
        {/* Mobile dropdown */}
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block">
        {/* Desktop tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium`}
                >
                  <Icon className={`${
                    activeTab === tab.id
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } -ml-0.5 mr-2 h-5 w-5`} />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}
