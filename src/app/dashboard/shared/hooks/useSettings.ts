// File: app/dashboard/shared/hooks/useSettings.ts

import { useState, useEffect } from 'react'
import { UserSettings, DEFAULT_USER_SETTINGS } from '../utils/settingsTypes'

const SETTINGS_STORAGE_KEY = 'orderSync_userSettings'

// Helper function to merge settings with defaults
function mergeWithDefaults(saved: any, defaults: UserSettings): UserSettings {
  const merged = { ...defaults }

  if (saved && typeof saved === 'object') {
    Object.keys(defaults).forEach(section => {
      if (saved[section] && typeof saved[section] === 'object') {
        merged[section as keyof UserSettings] = {
          ...defaults[section as keyof UserSettings],
          ...saved[section]
        }
      }
    })
  }

  return merged
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        // Merge with defaults to handle new settings that might have been added
        const mergedSettings = mergeWithDefaults(parsed, DEFAULT_USER_SETTINGS)
        setSettings(mergedSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      // If there's an error, reset to defaults
      setSettings(DEFAULT_USER_SETTINGS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage whenever they change
  const updateSettings = (newSettings: UserSettings) => {
    try {
      setSettings(newSettings)

      // Only save to localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Reset all settings to defaults
  const resetSettings = () => {
    try {
      setSettings(DEFAULT_USER_SETTINGS)

      // Only save to localStorage on client side
      if (typeof window !== 'undefined') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_USER_SETTINGS))
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
    }
  }

  // Update a specific setting
  const updateSetting = <T extends keyof UserSettings>(
    section: T,
    key: keyof UserSettings[T],
    value: UserSettings[T][keyof UserSettings[T]]
  ) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    }
    updateSettings(newSettings)
  }

  // Get a specific setting
  const getSetting = <T extends keyof UserSettings>(
    section: T,
    key: keyof UserSettings[T]
  ): UserSettings[T][keyof UserSettings[T]] => {
    return settings[section][key]
  }

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    updateSetting,
    getSetting
  }
}
