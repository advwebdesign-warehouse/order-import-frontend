//file path: src/app/dashboard/integrations/hooks/useIntegrations.ts

'use client'

import { useState, useEffect } from 'react'
import { Integration, IntegrationSettings, DEFAULT_INTEGRATION_SETTINGS } from '../types/integrationTypes'
import {
  getCurrentUserId,
  getUserIntegrations,
  saveUserIntegrations
} from '@/lib/storage/integrationStorage'  // ← FIXED: Changed from @/app/lib to @/lib

export function useIntegrations() {
  const [settings, setSettings] = useState<IntegrationSettings>(DEFAULT_INTEGRATION_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const uid = getCurrentUserId()
    setUserId(uid)

    try {
      const userSettings = getUserIntegrations(uid)
      if (userSettings) {
        setSettings(userSettings)
      } else {
        const defaultSettings = {
          ...DEFAULT_INTEGRATION_SETTINGS,
          userId: uid
        }
        setSettings(defaultSettings)
        saveUserIntegrations(defaultSettings, uid)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = (newSettings: IntegrationSettings) => {
    try {
      saveUserIntegrations(newSettings, userId)
      setSettings(newSettings)
      return true
    } catch (error) {
      console.error('Error saving integrations:', error)
      return false
    }
  }

  const updateIntegration = (integrationId: string, updates: Partial<Integration>) => {
      const newSettings: IntegrationSettings = {
        ...settings,
        integrations: settings.integrations.map(integration => {
          if (integration.id === integrationId) {
            // Properly merge updates while maintaining type
            return {
              ...integration,
              ...updates,
              config: {
                ...integration.config,
                ...(updates.config || {})
              }
            } as Integration
          }
          return integration
        }),
        lastUpdated: new Date().toISOString()
      }
      return saveSettings(newSettings)
    }

  const getIntegration = (integrationId: string): Integration | undefined => {
    return settings.integrations.find(i => i.id === integrationId)
  }

  const getIntegrationsByType = (type: Integration['type']): Integration[] => {
    return settings.integrations.filter(i => i.type === type)
  }

  const testIntegration = async (integrationId: string): Promise<boolean> => {
    const integration = getIntegration(integrationId)
    if (!integration) return false

    if (integration.id === 'usps' && integration.type === 'shipping') {
      try {
        const response = await fetch('/api/integrations/usps/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...integration.config,
            accountUserId: userId
          })
        })
        return response.ok
      } catch (error) {
        console.error('Integration test failed:', error)
        return false
      }
    }

    return false
  }

  const addIntegration = (integration: Integration) => {
    const newSettings = {
      ...settings,
      integrations: [...settings.integrations, integration]
    }
    return saveSettings(newSettings)
  }

  const removeIntegration = (integrationId: string) => {
    const newSettings = {
      ...settings,
      integrations: settings.integrations.filter(i => i.id !== integrationId)
    }
    return saveSettings(newSettings)
  }

  return {
    settings,
    loading,
    userId,
    updateIntegration,
    getIntegration,
    getIntegrationsByType,
    testIntegration,
    addIntegration,
    removeIntegration
  }
}
