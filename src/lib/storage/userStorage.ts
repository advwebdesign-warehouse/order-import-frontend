//file path: src/lib/storage/userStorage.ts

/**
 * User-level storage utilities
 * Used for UI preferences like column visibility, sort order, filters, etc.
 * This data is specific to individual users, not shared across the account
 */

/**
 * Get current user ID for UI preferences
 * This is different from accountId - userId is for personal UI settings only
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'user_ssr_fallback'

  try {
    let id = localStorage.getItem('userId')
    if (!id) {
      // Generate a unique user ID
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', id)
      console.log('[UserStorage] Created new userId:', id)
    }
    return id
  } catch (error) {
    console.warn('localStorage not available:', error)
    return 'user_fallback_' + Math.random().toString(36).substr(2, 9)
  }
}

/**
 * Generate storage keys for user-specific UI preferences
 */
export function generateUserStorageKeys(prefix: string, userId?: string) {
  const uid = userId || getCurrentUserId()
  return {
    columns: `${prefix}_columns_${uid}`,
    sort: `${prefix}_sort_${uid}`,
    filters: `${prefix}_filters_${uid}`,
    showFilters: `${prefix}_showFilters_${uid}`,
    pagination: `${prefix}_pagination_${uid}`,
  }
}
