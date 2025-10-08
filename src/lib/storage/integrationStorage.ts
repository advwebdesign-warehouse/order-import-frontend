//file path: src/lib/storage/integrationStorage.ts

import { IntegrationSettings } from '@/app/dashboard/integrations/types/integrationTypes'

const INTEGRATION_STORAGE_PREFIX = 'orderSync_integrations_'

/**
 * Get user ID from session/auth
 */
export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'default_user'

  try {
    const user = localStorage.getItem('user')
    if (user) {
      const parsed = JSON.parse(user)
      return parsed.id || parsed.email || 'default_user'
    }
  } catch (error) {
    console.error('Error getting user ID:', error)
  }

  return 'default_user'
}

/**
 * Get integration settings for a specific user
 */
export function getUserIntegrations(userId?: string): IntegrationSettings | null {
  if (typeof window === 'undefined') return null

  const uid = userId || getCurrentUserId()
  const storageKey = `${INTEGRATION_STORAGE_PREFIX}${uid}`

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading user integrations:', error)
  }

  return null
}

/**
 * Save integration settings for a specific user
 */
export function saveUserIntegrations(settings: IntegrationSettings, userId?: string): void {
  if (typeof window === 'undefined') return

  const uid = userId || getCurrentUserId()
  const storageKey = `${INTEGRATION_STORAGE_PREFIX}${uid}`

  try {
    localStorage.setItem(storageKey, JSON.stringify({
      ...settings,
      userId: uid,
      lastUpdated: new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error saving user integrations:', error)
  }
}

/**
 * Get USPS credentials for a specific user
 */
 /**
  * Get USPS credentials for a specific user
  */
 export function getUserUSPSCredentials(userId?: string): { userId: string; apiUrl: string } | null {
   const uid = userId || getCurrentUserId()
   const integrations = getUserIntegrations(uid)

   if (!integrations) return null

   const uspsIntegration = integrations.integrations.find(i => i.id === 'usps' && i.enabled)

   if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
     return {
       userId: uid,  // Use the userId parameter, not from config
       apiUrl: uspsIntegration.config.apiUrl
     }
   }

   return null
 }

 /**
  * Get all users who have USPS integration enabled
  */
 export function getAllUsersWithUSPS(): Array<{
   userId: string
   credentials: {
     consumerKey: string
     consumerSecret: string
     environment: 'sandbox' | 'production'
   }
 }> {
   if (typeof window === 'undefined') return []

   const users: Array<{
     userId: string
     credentials: {
       consumerKey: string
       consumerSecret: string
       environment: 'sandbox' | 'production'
     }
   }> = []

   // In browser, we can only access current user's data
   const currentUserId = getCurrentUserId()
   const integrations = getUserIntegrations(currentUserId)

   if (!integrations) return []

   const uspsIntegration = integrations.integrations.find(
     i => i.id === 'usps' && i.enabled && i.type === 'shipping' && i.name === 'USPS'
   )

   if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
     // Type assertion to tell TypeScript this is specifically a USPS integration
     const config = uspsIntegration.config as {
       consumerKey: string
       consumerSecret: string
       environment: 'sandbox' | 'production'
       apiUrl: string
     }

     users.push({
       userId: currentUserId,
       credentials: {
         consumerKey: config.consumerKey,
         consumerSecret: config.consumerSecret,
         environment: config.environment
       }
     })
   }

   return users
 }
