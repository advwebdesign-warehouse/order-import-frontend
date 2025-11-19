//file path: src/lib/storage/integrationStorage.ts

import { IntegrationSettings } from '@/app/dashboard/integrations/types/integrationTypes'
import { IntegrationAPI } from '@/lib/api/integrationApi'

/**
 * Get account integrations from API
 */
export async function getAccountIntegrations(): Promise<IntegrationSettings | null> {
  try {
    return await IntegrationAPI.getAccountIntegrations()
  } catch (error) {
    console.error('[Integration Storage] Error fetching integrations:', error)
    return null
  }
}

/**
 * Save integration settings to API
 */
export async function saveAccountIntegrations(settings: IntegrationSettings): Promise<void> {
  try {
    await IntegrationAPI.saveIntegration(settings)
  } catch (error) {
    console.error('[Integration Storage] Error saving integrations:', error)
    throw error
  }
}

/**
 * Get USPS credentials
 */
export async function getAccountUSPSCredentials(): Promise<{
  consumerKey: string
  consumerSecret: string
  apiUrl: string
  environment: 'sandbox' | 'production'
} | null> {
  const integrations = await getAccountIntegrations()
  if (!integrations) return null

  const uspsIntegration = integrations.integrations.find(i => i.id === 'usps' && i.enabled)

  if (uspsIntegration?.type === 'shipping' && uspsIntegration.name === 'USPS') {
    const config = uspsIntegration.config as any
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
 * Get UPS credentials
 */
export async function getAccountUPSCredentials(): Promise<{
  accountNumber: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: string
  apiUrl: string
  environment: 'sandbox' | 'production'
} | null> {
  const integrations = await getAccountIntegrations()
  if (!integrations) return null

  const upsIntegration = integrations.integrations.find(i => i.id === 'ups' && i.enabled)

  if (upsIntegration?.type === 'shipping' && upsIntegration.name === 'UPS') {
    const config = upsIntegration.config as any
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
 * Check if account has shipping integration
 */
export async function hasShippingIntegration(): Promise<boolean> {
  const integrations = await getAccountIntegrations()
  if (!integrations) return false

  return integrations.integrations.some(
    integration => integration.type === 'shipping' && integration.enabled
  )
}

/**
 * Get enabled shipping carriers
 */
export async function getEnabledShippingCarriers(): Promise<string[]> {
  const integrations = await getAccountIntegrations()
  if (!integrations) return []

  return integrations.integrations
    .filter(integration => integration.type === 'shipping' && integration.enabled)
    .map(integration => integration.name)
}
