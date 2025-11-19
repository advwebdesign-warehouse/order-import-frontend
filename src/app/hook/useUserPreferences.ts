//file path: app/hooks/useUserPreferences.ts

import { useState, useEffect, useCallback } from 'react'
import { UserAPI, UserPreferences } from '@/lib/api/userApi'

/**
 * Hybrid User Preferences Hook
 *
 * Strategy:
 * 1. Primary: Backend database (synced across all devices)
 * 2. Cache: localStorage (fast access, fallback when offline)
 *
 * Benefits:
 * ✅ Synced across devices (desktop, mobile, tablet)
 * ✅ Survives browser data clearing
 * ✅ Fast performance (localStorage cache)
 * ✅ Works offline (uses last cached data)
 */

const CACHE_KEY_PREFIX = 'user_preferences_'

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null
  loading: boolean
  error: string | null
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  updateField: (field: string, value: any) => Promise<void>
  resetPreferences: () => Promise<void>
  refreshPreferences: () => Promise<void>
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get cache key for current user
   * Note: userId comes from backend after auth, so we cache by a generic key
   * and update it once we know the userId
   */
  const getCacheKey = useCallback((userId?: string) => {
    return userId ? `${CACHE_KEY_PREFIX}${userId}` : `${CACHE_KEY_PREFIX}temp`
  }, [])

  /**
   * Load preferences from localStorage cache
   */
  const loadFromCache = useCallback((userId?: string): UserPreferences | null => {
    if (typeof window === 'undefined') return null

    try {
      const cached = localStorage.getItem(getCacheKey(userId))
      if (cached) {
        return JSON.parse(cached)
      }
    } catch (error) {
      console.warn('[Preferences] Failed to load from cache:', error)
    }

    return null
  }, [getCacheKey])

  /**
   * Save preferences to localStorage cache
   */
  const saveToCache = useCallback((prefs: UserPreferences) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(getCacheKey(prefs.userId), JSON.stringify(prefs))

      // Clean up any temp cache
      localStorage.removeItem(getCacheKey())
    } catch (error) {
      console.warn('[Preferences] Failed to save to cache:', error)
    }
  }, [getCacheKey])

  /**
   * Load preferences from backend
   */
  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try cache first for instant load
      const cached = loadFromCache()
      if (cached) {
        setPreferences(cached)
      }

      // Then load from backend (source of truth)
      const backendPrefs = await UserAPI.getPreferences()

      // Update state and cache
      setPreferences(backendPrefs)
      saveToCache(backendPrefs)

      console.log('[Preferences] Loaded from backend:', backendPrefs.userId)
    } catch (err: any) {
      console.error('[Preferences] Error loading preferences:', err)
      setError(err.message || 'Failed to load preferences')

      // Keep using cached data if backend fails
      if (!preferences) {
        const cached = loadFromCache()
        if (cached) {
          setPreferences(cached)
          console.log('[Preferences] Using cached preferences (backend unavailable)')
        }
      }
    } finally {
      setLoading(false)
    }
  }, [loadFromCache, saveToCache, preferences])

  /**
   * Update preferences (full update)
   */
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      // Optimistic update - update local state immediately
      setPreferences(prev => {
        if (!prev) return null
        const updated = { ...prev, ...updates }
        saveToCache(updated)
        return updated
      })

      // Save to backend
      const updated = await UserAPI.updatePreferences(updates)

      // Update with backend response (in case backend modified anything)
      setPreferences(updated)
      saveToCache(updated)

      console.log('[Preferences] Updated preferences on backend')
    } catch (err: any) {
      console.error('[Preferences] Error updating preferences:', err)

      // Revert optimistic update on error
      await loadPreferences()

      throw err
    }
  }, [saveToCache, loadPreferences])

  /**
   * Update single preference field (more efficient)
   */
  const updateField = useCallback(async (field: string, value: any) => {
    try {
      // Optimistic update
      setPreferences(prev => {
        if (!prev) return null
        const updated = { ...prev, [field]: value }
        saveToCache(updated)
        return updated
      })

      // Save to backend
      const updated = await UserAPI.updatePreferenceField(field, value)

      // Update with backend response
      setPreferences(updated)
      saveToCache(updated)

      console.log(`[Preferences] Updated ${field} on backend`)
    } catch (err: any) {
      console.error(`[Preferences] Error updating ${field}:`, err)

      // Revert optimistic update on error
      await loadPreferences()

      throw err
    }
  }, [saveToCache, loadPreferences])

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async () => {
    try {
      await UserAPI.resetPreferences()

      // Clear cache
      if (preferences?.userId) {
        localStorage.removeItem(getCacheKey(preferences.userId))
      }

      // Reload from backend (will create new defaults)
      await loadPreferences()

      console.log('[Preferences] Reset to defaults')
    } catch (err: any) {
      console.error('[Preferences] Error resetting preferences:', err)
      throw err
    }
  }, [preferences, getCacheKey, loadPreferences])

  /**
   * Manually refresh preferences from backend
   */
  const refreshPreferences = useCallback(async () => {
    await loadPreferences()
  }, [loadPreferences])

  // Load preferences on mount
  useEffect(() => {
    loadPreferences()
  }, []) // Only run once on mount

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    updateField,
    resetPreferences,
    refreshPreferences
  }
}
