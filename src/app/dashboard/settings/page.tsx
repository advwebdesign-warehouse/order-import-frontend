//file path: app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { AppSettings } from './types'
import { withAuth } from '@/app/dashboard/shared/components/withAuth'
import { settingsApi } from '@/app/services/settingsApi'

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

interface SettingsPageContentProps {
  accountId: string // ✅ Guaranteed to be valid by withAuth
}

function SettingsPageContent({ accountId }: SettingsPageContentProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState('fulfillment')
  const [hasChanges, setHasChanges] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ✅ Load settings from backend on mount
  useEffect(() => {
    loadSettings()
  }, [accountId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const loadedSettings = await settingsApi.getSettings()
      setSettings(loadedSettings)
    } catch (error) {
      console.error('[Settings Page] Error loading settings:', error)
      // Keep default settings on error
    } finally {
      setLoading(false)
    }
  }

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

  const handleSaveSettings = async () => {
    try {
      setSaving(true)

      // ✅ Save to backend
      await settingsApi.updateSettings(settings)

      setHasChanges(false)
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      console.error('[Settings Page] Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetSection = (section: keyof AppSettings) => {
    const newSettings = {
      ...settings,
      [section]: DEFAULT_SETTINGS[section]
    }
    setSettings(newSettings)
    setHasChanges(true)
  }

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        setSaving(true)

        // ✅ Reset on backend
        await settingsApi.resetSettings()

        // Reload settings from backend to get fresh defaults
        await loadSettings()

        setHasChanges(false)
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } catch (error) {
        console.error('[Settings Page] Error resetting settings:', error)
        alert('Failed to reset settings. Please try again.')
      } finally {
        setSaving(false)
      }
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'fulfillment':
        // Fulfillment tab handles its own saving, don't pass onChanges
        return <FulfillmentTab />
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

  // Only show save button for non-auto-save tabs
  const showSaveButton = activeTab !== 'fulfillment' && hasChanges

  // ✅ Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        hasChanges={showSaveButton}
        onSave={handleSaveSettings}
        onResetAll={handleResetAll}
        hideResetAll={activeTab === 'fulfillment'} // Hide reset all for fulfillment tab
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

// ✅ Export the wrapped component with withAuth HOC
export default withAuth(SettingsPageContent, {
  loadingMessage: "Loading settings...",
  errorTitle: "Unable to load settings",
  errorMessage: "Please check your authentication and try again."
})
