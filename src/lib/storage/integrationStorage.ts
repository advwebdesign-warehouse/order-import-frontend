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
 * FIXED: Now returns proper USPS API credentials
 */
export function getUserUSPSCredentials(userId?: string): {
  consumerKey: string
  consumerSecret: string
  apiUrl: string
  environment: 'sandbox' | 'production'
} | null {
  const uid = userId || getCurrentUserId()
  const integrations = getUserIntegrations(uid)

  if (!integrations) return null

  const uspsIntegration = integrations.integrations.find(i => i.id === 'usps' && i.enabled)

  if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
    // Type assertion to access USPS config
    const config = uspsIntegration.config as {
      consumerKey: string
      consumerSecret: string
      environment: 'sandbox' | 'production'
      apiUrl: string
    }

    return {
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      apiUrl: config.apiUrl,
      environment: config.environment
    }
  }

  return null
}

/**
 * Get UPS credentials for a specific user
 */
export function getUserUPSCredentials(userId?: string): {
  accountNumber: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: string
  apiUrl: string
  environment: 'sandbox' | 'production'
} | null {
  const uid = userId || getCurrentUserId()
  const integrations = getUserIntegrations(uid)

  if (!integrations) return null

  const upsIntegration = integrations.integrations.find(i => i.id === 'ups' && i.enabled)

  if (upsIntegration && upsIntegration.type === 'shipping' && upsIntegration.name === 'UPS') {
    const config = upsIntegration.config as {
      accountNumber: string
      accessToken?: string
      refreshToken?: string
      tokenExpiry?: string
      environment: 'sandbox' | 'production'
      apiUrl: string
    }

    return {
      accountNumber: config.accountNumber,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      tokenExpiry: config.tokenExpiry,
      apiUrl: config.apiUrl,
      environment: config.environment
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
    apiUrl: string
  }
}> {
  if (typeof window === 'undefined') return []

  const users: Array<{
    userId: string
    credentials: {
      consumerKey: string
      consumerSecret: string
      environment: 'sandbox' | 'production'
      apiUrl: string
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
        environment: config.environment,
        apiUrl: config.apiUrl
      }
    })
  }

  return users
}

/**
 * Get all users who have UPS integration enabled
 */
export function getAllUsersWithUPS(): Array<{
  userId: string
  credentials: {
    accountNumber: string
    accessToken?: string
    refreshToken?: string
    tokenExpiry?: string
    environment: 'sandbox' | 'production'
    apiUrl: string
  }
}> {
  if (typeof window === 'undefined') return []

  const users: Array<{
    userId: string
    credentials: {
      accountNumber: string
      accessToken?: string
      refreshToken?: string
      tokenExpiry?: string
      environment: 'sandbox' | 'production'
      apiUrl: string
    }
  }> = []

  const currentUserId = getCurrentUserId()
  const integrations = getUserIntegrations(currentUserId)

  if (!integrations) return []

  const upsIntegration = integrations.integrations.find(
    i => i.id === 'ups' && i.enabled && i.type === 'shipping' && i.name === 'UPS'
  )

  if (upsIntegration && upsIntegration.type === 'shipping' && upsIntegration.name === 'UPS') {
    const config = upsIntegration.config as {
      accountNumber: string
      accessToken?: string
      refreshToken?: string
      tokenExpiry?: string
      environment: 'sandbox' | 'production'
      apiUrl: string
    }

    users.push({
      userId: currentUserId,
      credentials: {
        accountNumber: config.accountNumber,
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
        tokenExpiry: config.tokenExpiry,
        environment: config.environment,
        apiUrl: config.apiUrl
      }
    })
  }

  return users
}

/**
 * NEW: Check if user has any enabled shipping integrations
 * Used to conditionally show the Shipping menu in navigation
 */
export function hasShippingIntegration(userId?: string): boolean {
  const integrations = getUserIntegrations(userId)

  if (!integrations) return false

  return integrations.integrations.some(
    integration => integration.type === 'shipping' && integration.enabled
  )
}

/**
 * NEW: Get all enabled shipping carriers for a user
 * Returns array of carrier names: ['USPS', 'UPS', 'FedEx', 'DHL']
 */
export function getEnabledShippingCarriers(userId?: string): string[] {
  const integrations = getUserIntegrations(userId)

  if (!integrations) return []

  return integrations.integrations
    .filter(integration => integration.type === 'shipping' && integration.enabled)
    .map(integration => integration.name)
}

/**
 * NEW: Get credentials for any shipping carrier
 * Generic function to get credentials for UPS, FedEx, DHL when added
 */
export function getShippingCarrierCredentials(
  carrierName: string,
  userId?: string
): any | null {
  const uid = userId || getCurrentUserId()
  const integrations = getUserIntegrations(uid)

  if (!integrations) return null

  const carrierIntegration = integrations.integrations.find(
    i => i.name === carrierName && i.type === 'shipping' && i.enabled
  )

  if (carrierIntegration) {
    return carrierIntegration.config
  }

  return null
}
