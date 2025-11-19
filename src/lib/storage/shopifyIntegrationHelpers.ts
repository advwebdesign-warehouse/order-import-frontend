//file path: src/lib/storage/shopifyIntegrationHelpers.ts

import { getAccountIntegrations, saveAccountIntegrations } from './integrationStorage'

/**
 * Get all Shopify integrations
 * ✅ FIXED: Made accountId required (removed getCurrentAccountId dependency)
 */
export async function getShopifyIntegrations(accountId: string) {
  const settings = await getAccountIntegrations()

  if (!settings) return []

  return settings.integrations.filter(
    (int: any) => int.provider === 'shopify' || int.name?.toLowerCase().includes('shopify')
  )
}

/**
 * Get integration by shop domain
 */
export async function getIntegrationByShop(shop: string, accountId: string) {
  const integrations = await getShopifyIntegrations(accountId)
  return integrations.find((int: any) =>
    int.config?.storeUrl === shop &&
    (int.status === 'connected' || int.enabled)
  ) || null
}

/**
 * Get integration by ID
 */
export async function getIntegrationById(integrationId: string, accountId: string) {
  const settings = await getAccountIntegrations()

  if (!settings) return null

  return settings.integrations.find((int: any) => int.id === integrationId) || null
}

/**
 * Update integration config
 */
export async function updateIntegrationConfig(integrationId: string, newConfig: any, accountId?: string) {
  const settings = await getAccountIntegrations()

  if (!settings) return false

  const integrationIndex = settings.integrations.findIndex((int: any) => int.id === integrationId)

  if (integrationIndex === -1) return false

  settings.integrations[integrationIndex] = {
    ...settings.integrations[integrationIndex],
    config: newConfig,
    lastUpdated: new Date().toISOString()
  }

  await saveAccountIntegrations(settings)
  return true
}

/**
 * Save new integration
 */
export async function saveIntegration(integration: any, accountId: string) {
  const settings = await getAccountIntegrations() || {
    integrations: [],
    lastUpdated: new Date().toISOString(),
    accountId
  }

  // Check if integration already exists
  const existingIndex = settings.integrations.findIndex((int: any) => int.id === integration.id)

  if (existingIndex >= 0) {
    settings.integrations[existingIndex] = integration
  } else {
    settings.integrations.push(integration)
  }

  await saveAccountIntegrations(settings)
}

/**
 * Get all connected Shopify stores
 * ✅ FIXED: Returns all connected stores (accountId is managed by API)
 */
 export async function getConnectedShopifyStores() {
   const settings = await getAccountIntegrations()

   if (!settings) return []

   return settings.integrations.filter((int: any) =>
     (int.provider === 'shopify' || int.name?.toLowerCase().includes('shopify')) &&
     (int.status === 'connected' || int.enabled)
   )
 }
