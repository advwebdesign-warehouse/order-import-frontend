//file path: src/lib/storage/shopifyIntegrationHelpers.ts

import { getAccountIntegrations, saveAccountIntegrations, getCurrentAccountId } from './integrationStorage'

/**
 * Get all Shopify integrations
 */
export function getShopifyIntegrations(accountId?: string) {
  const aid = accountId || getCurrentAccountId()
  const settings = getAccountIntegrations(aid)

  if (!settings) return []

  return settings.integrations.filter(
    (int: any) => int.provider === 'shopify' || int.name?.toLowerCase().includes('shopify')
  )
}

/**
 * Get integration by shop domain
 */
export function getIntegrationByShop(shop: string, accountId?: string) {
  const integrations = getShopifyIntegrations(accountId)
  return integrations.find((int: any) =>
    int.config?.storeUrl === shop &&
    (int.status === 'connected' || int.enabled)
  ) || null
}

/**
 * Get integration by ID
 */
export function getIntegrationById(integrationId: string, accountId?: string) {
  const aid = accountId || getCurrentAccountId()
  const settings = getAccountIntegrations(aid)

  if (!settings) return null

  return settings.integrations.find((int: any) => int.id === integrationId) || null
}

/**
 * Update integration config
 */
export function updateIntegrationConfig(integrationId: string, newConfig: any, accountId?: string) {
  const aid = accountId || getCurrentAccountId()
  const settings = getAccountIntegrations(aid)

  if (!settings) return false

  const integrationIndex = settings.integrations.findIndex((int: any) => int.id === integrationId)

  if (integrationIndex === -1) return false

  settings.integrations[integrationIndex] = {
    ...settings.integrations[integrationIndex],
    config: newConfig,
    lastUpdated: new Date().toISOString()
  }

  saveAccountIntegrations(settings, aid)
  return true
}

/**
 * Save new integration
 */
export function saveIntegration(integration: any, accountId?: string) {
  const aid = accountId || getCurrentAccountId()
  const settings = getAccountIntegrations(aid) || {
    integrations: [],
    lastUpdated: new Date().toISOString(),
    accountId: aid
  }

  // Check if integration already exists
  const existingIndex = settings.integrations.findIndex((int: any) => int.id === integration.id)

  if (existingIndex >= 0) {
    settings.integrations[existingIndex] = integration
  } else {
    settings.integrations.push(integration)
  }

  saveAccountIntegrations(settings, aid)
}

/**
 * Get all connected Shopify stores
 */
export function getConnectedShopifyStores(accountId?: string) {
  return getShopifyIntegrations(accountId).filter((int: any) =>
    int.status === 'connected' || int.enabled
  )
}
