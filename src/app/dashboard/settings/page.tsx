//file path: app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppSettings } from './types'

// Components
import SettingsHeader from './components/shared/SettingsHeader'
import SuccessMessage from './components/shared/SuccessMessage'
import TabNavigation from './components/shared/TabNavigation'

// Tab Components
import FulfillmentTab from './components/tabs/FulfillmentTab'
import NotificationsTab from './components/tabs/NotificationsTab'

import { SETTINGS_TABS } from './constants'

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    notificationEmail: '',
    dailySummary: false,
    weeklySummary: false
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState('fulfillment')
  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const handleSettingChange = (section: keyof AppSettings, updates: any) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        ...updates
      }
    }
    setSettings(newSettings)
    setHasChanges(true)
  }

  const handleSaveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings))
    setHasChanges(false)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 3000)
  }

  const handleResetSection = (section: keyof AppSettings) => {
    const newSettings = {
      ...settings,
      [section]: DEFAULT_SETTINGS[section]
    }
    setSettings(newSettings)
    setHasChanges(true)
  }

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      setSettings(DEFAULT_SETTINGS)
      localStorage.removeItem('appSettings')
      localStorage.removeItem('fulfillmentStatuses')
      setHasChanges(false)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'fulfillment':
        return <FulfillmentTab onChanges={setHasChanges} />
      case 'notifications':
        return (
          <NotificationsTab
            settings={settings.notifications}
            onChange={(updates) => handleSettingChange('notifications', updates)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        hasChanges={hasChanges}
        onSave={handleSaveSettings}
        onResetAll={handleResetAll}
      />

      {showSuccessMessage && <SuccessMessage />}

      <div className="mt-8">
        <TabNavigation
          tabs={SETTINGS_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="mt-8">
          {renderActiveTab()}

          {/* Section Reset Button - only show for non-fulfillment tabs */}
          {activeTab !== 'fulfillment' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleResetSection(activeTab as keyof AppSettings)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Reset {SETTINGS_TABS.find(t => t.id === activeTab)?.name} to defaults
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
