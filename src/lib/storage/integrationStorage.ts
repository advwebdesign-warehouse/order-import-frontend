//file path: src/lib/storage/integrationStorage.ts

import { IntegrationSettings } from '@/app/dashboard/integrations/types/integrationTypes'

const INTEGRATION_STORAGE_PREFIX = 'orderSync_integrations_'

const DEFAULT_SETTINGS: IntegrationSettings = {
  integrations: [], // ✅ Start with empty array - users add via Browse
  lastUpdated: new Date().toISOString(),  // <-- Changed from lastSyncedAt
  accountId: 'default'
}

/**
 * Get account ID from session/auth
 * Account-level storage allows teams to share integrations
 */
export function getCurrentAccountId(): string {
  if (typeof window === 'undefined') return 'default_account'

  try {
    // First, try to get account from localStorage
    const account = localStorage.getItem('account')
    if (account) {
      const parsed = JSON.parse(account)
      return parsed.id || parsed.accountId || 'default_account'
    }

    // Fallback: Try to get from user object
    const user = localStorage.getItem('user')
    if (user) {
      const parsed = JSON.parse(user)
      return parsed.accountId || parsed.account?.id || 'default_account'
    }
  } catch (error) {
    console.error('Error getting account ID:', error)
  }

  return 'default_account'
}

/**
 * DEPRECATED: Use getCurrentAccountId() instead
 * Kept for backwards compatibility
 */
export function getCurrentUserId(): string {
  console.warn('getCurrentUserId() is deprecated. Use getCurrentAccountId() for integrations.')
  return getCurrentAccountId()
}

/**
 * Get integration settings for a specific account
 */
export function getAccountIntegrations(accountId?: string): IntegrationSettings | null {
  if (typeof window === 'undefined') return null

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${INTEGRATION_STORAGE_PREFIX}${aid}`

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading account integrations:', error)
  }

  return null
}

/**
 * DEPRECATED: Use getAccountIntegrations() instead
 */
export function getUserIntegrations(userId?: string): IntegrationSettings | null {
  console.warn('getUserIntegrations() is deprecated. Use getAccountIntegrations() instead.')
  return getAccountIntegrations(userId)
}

/**
 * Save integration settings for a specific account
 */
export function saveAccountIntegrations(settings: IntegrationSettings, accountId?: string): void {
  if (typeof window === 'undefined') return

  const aid = accountId || getCurrentAccountId()
  const storageKey = `${INTEGRATION_STORAGE_PREFIX}${aid}`

  try {
    localStorage.setItem(storageKey, JSON.stringify({
      ...settings,
      accountId: aid,
      lastUpdated: new Date().toISOString()
    }))
    console.log(`[Storage] Saved integrations for account: ${aid}`)
  } catch (error) {
    console.error('Error saving account integrations:', error)
  }
}

/**
 * DEPRECATED: Use saveAccountIntegrations() instead
 */
export function saveUserIntegrations(settings: IntegrationSettings, userId?: string): void {
  console.warn('saveUserIntegrations() is deprecated. Use saveAccountIntegrations() instead.')
  saveAccountIntegrations(settings, userId)
}

/**
 * Get USPS credentials for a specific account
 */
export function getAccountUSPSCredentials(accountId?: string): {
  consumerKey: string
  consumerSecret: string
  apiUrl: string
  environment: 'sandbox' | 'production'
} | null {
  const aid = accountId || getCurrentAccountId()
  const integrations = getAccountIntegrations(aid)

  if (!integrations) return null

  const uspsIntegration = integrations.integrations.find(i => i.id === 'usps' && i.enabled)

  if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
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
 * DEPRECATED: Use getAccountUSPSCredentials() instead
 */
export function getUserUSPSCredentials(userId?: string) {
  console.warn('getUserUSPSCredentials() is deprecated. Use getAccountUSPSCredentials() instead.')
  return getAccountUSPSCredentials(userId)
}

/**
 * Get UPS credentials for a specific account
 */
export function getAccountUPSCredentials(accountId?: string): {
  accountNumber: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: string
  apiUrl: string
  environment: 'sandbox' | 'production'
} | null {
  const aid = accountId || getCurrentAccountId()
  const integrations = getAccountIntegrations(aid)

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
 * DEPRECATED: Use getAccountUPSCredentials() instead
 */
export function getUserUPSCredentials(userId?: string) {
  console.warn('getUserUPSCredentials() is deprecated. Use getAccountUPSCredentials() instead.')
  return getAccountUPSCredentials(userId)
}

/**
 * Check if account has any enabled shipping integrations
 */
export function hasShippingIntegration(accountId?: string): boolean {
  const integrations = getAccountIntegrations(accountId)

  if (!integrations) return false

  return integrations.integrations.some(
    integration => integration.type === 'shipping' && integration.enabled
  )
}

/**
 * Get all enabled shipping carriers for an account
 */
export function getEnabledShippingCarriers(accountId?: string): string[] {
  const integrations = getAccountIntegrations(accountId)

  if (!integrations) return []

  return integrations.integrations
    .filter(integration => integration.type === 'shipping' && integration.enabled)
    .map(integration => integration.name)
}

/**
 * Get credentials for any shipping carrier
 */
export function getShippingCarrierCredentials(
  carrierName: string,
  accountId?: string
): any | null {
  const aid = accountId || getCurrentAccountId()
  const integrations = getAccountIntegrations(aid)

  if (!integrations) return null

  const carrierIntegration = integrations.integrations.find(
    i => i.name === carrierName && i.type === 'shipping' && i.enabled
  )

  if (carrierIntegration) {
    return carrierIntegration.config
  }

  return null
}
/**
 * Get all accounts with USPS integration
 * In production with database, this would query all accounts
 * In browser with localStorage, we can only access current account
 */
export function getAllAccountsWithUSPS(): Array<{
  accountId: string
  credentials: {
    consumerKey: string
    consumerSecret: string
    environment: 'sandbox' | 'production'
    apiUrl: string
  }
}> {
  if (typeof window === 'undefined') return []

  const accounts: Array<{
    accountId: string
    credentials: {
      consumerKey: string
      consumerSecret: string
      environment: 'sandbox' | 'production'
      apiUrl: string
    }
  }> = []

  // In browser, we can only access current account
  const currentAccountId = getCurrentAccountId()
  const integrations = getAccountIntegrations(currentAccountId)

  if (!integrations) return []

  const uspsIntegration = integrations.integrations.find(
    i => i.id === 'usps' && i.enabled && i.type === 'shipping' && i.name === 'USPS'
  )

  if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
    const config = uspsIntegration.config as {
      consumerKey: string
      consumerSecret: string
      environment: 'sandbox' | 'production'
      apiUrl: string
    }

    accounts.push({
      accountId: currentAccountId,
      credentials: {
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
        environment: config.environment,
        apiUrl: config.apiUrl
      }
    })
  }

  return accounts
}
