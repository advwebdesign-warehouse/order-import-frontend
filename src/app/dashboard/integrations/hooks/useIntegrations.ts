//file path: src/app/dashboard/integrations/hooks/useIntegrations.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Integration,
  ShopifyIntegration,
  WooCommerceIntegration,
  EtsyIntegration,
} from '../types/integrationTypes'
import { IntegrationAPI } from '@/lib/api/integrationApi'
import { AccountAPI } from '@/lib/api/accountApi'

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [accountId, setAccountId] = useState<string | null>(null) // Null during loading, string when loaded
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load account and integrations on mount
  useEffect(() => {
    loadAccountAndIntegrations()
  }, [])

  /**
   * Load current account from API and then load its integrations
   * No fallback - if API fails, we show error
   */
  const loadAccountAndIntegrations = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useIntegrations] 🔄 Loading account from API...')

      // Step 1: Get current account from API
      const accountData = await AccountAPI.getCurrentAccount()

      if (!accountData || !accountData.id) {
        throw new Error('No account found. Please log in again.')
      }

      console.log('[useIntegrations] ✅ Account loaded:', accountData.id)
      setAccountId(accountData.id) // Set accountId to valid string value

      // Step 2: Load integrations for this account
      console.log('[useIntegrations] 🔄 Loading integrations from API...')
      const integrationsData = await IntegrationAPI.getAccountIntegrations()

      console.log('[useIntegrations] ✅ Loaded', integrationsData.length, 'integrations')
      setIntegrations(integrationsData || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load account or integrations'
      console.error('[useIntegrations] ❌ Error:', errorMessage)
      setError(errorMessage)
      setIntegrations([])
      setAccountId(null) // Keep accountId as null on error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get a specific integration by ID and storeId (both required)
   */
  const getIntegration = useCallback((integrationId: string, storeId: string) => {
    return integrations.find(i => i.id === integrationId && i.storeId === storeId)
  }, [integrations])

  /**
   * Get all integrations of a specific type
   */
  const getIntegrationsByType = useCallback((type: string) => {
    return integrations.filter(i => i.type === type)
  }, [integrations])

  /**
   * Update an integration with partial data
   * Now accepts (id, partialData) like callers expect
   * Optimistic update with rollback on error
   */
  const updateIntegration = async (integrationId: string, partialData: Partial<Integration>) => {
    // Store previous state for rollback
    const previousIntegrations = [...integrations]

    try {
      console.log('[updateIntegration] 🔄 Updating integration:', integrationId)

      // Find the existing integration to merge with partial data
      const existingIntegration = integrations.find(i => i.id === integrationId)

      if (!existingIntegration) {
        throw new Error(`Integration not found: ${integrationId}`)
      }

      // Merge existing with partial data
      const updatedIntegration = {
        ...existingIntegration,
        ...partialData,
        // Ensure we don't lose nested config if only updating specific config fields
        config: partialData.config
          ? { ...existingIntegration.config, ...partialData.config }
          : existingIntegration.config
      } as Integration

      // Optimistic update
      const updated = integrations.map(i =>
        i.id === integrationId ? updatedIntegration : i
      )
      setIntegrations(updated)

      // Save to API (send full merged integration)
      await IntegrationAPI.updateIntegration(integrationId, updatedIntegration)

      console.log('[updateIntegration] ✅ Integration updated successfully')
      return { success: true }

    } catch (err) {
      console.error('[updateIntegration] ❌ Error:', err)

      // Rollback on error
      setIntegrations(previousIntegrations)

      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update integration'
      }
    }
  }

  /**
   * Add a new integration
   */
  const addIntegration = async (integration: Integration) => {
    // Store previous state for rollback
    const previousIntegrations = [...integrations]

    try {
      console.log('[addIntegration] 🔄 Adding integration:', integration.name, 'for store:', integration.storeId)

      // Check if integration already exists
      const existingIndex = integrations.findIndex(
        i => i.name === integration.name && i.storeId === integration.storeId
      )

      let updatedIntegrations: Integration[]

      if (existingIndex >= 0) {
        console.log('[addIntegration] ⚠️ Integration already exists, updating instead')
        // Update existing
        updatedIntegrations = integrations.map((i, index) =>
          index === existingIndex ? { ...i, ...integration } : i
        )
      } else {
        // Add new
        updatedIntegrations = [...integrations, integration]
      }

      // Optimistic update
      setIntegrations(updatedIntegrations)

      // Save to API
      const savedIntegration = await IntegrationAPI.saveIntegration(integration)

      console.log('[addIntegration] ✅ Integration saved with ID:', savedIntegration.id)

      // Update with the actual ID from API
      const finalIntegrations = updatedIntegrations.map(i =>
        i === integration ? { ...integration, id: savedIntegration.id } as Integration : i
      )
      setIntegrations(finalIntegrations)

      return { success: true, integration: savedIntegration }

    } catch (err) {
      console.error('[addIntegration] ❌ Error:', err)

      // Rollback on error
      setIntegrations(previousIntegrations)

      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to add integration'
      }
    }
  }

  /**
   * Remove an integration
   */
  const removeIntegration = async (integrationId: string, storeId: string) => {
    // Store previous state for rollback
    const previousIntegrations = [...integrations]

    try {
      console.log('[removeIntegration] 🔄 Removing integration:', integrationId, 'store:', storeId)

      // Optimistic update
      const updated = integrations.filter(i =>
        !(i.id === integrationId && i.storeId === storeId)
      )
      setIntegrations(updated)

      // Delete from API
      await IntegrationAPI.deleteIntegration(integrationId)

      console.log('[removeIntegration] ✅ Integration removed successfully')
      return { success: true }

    } catch (err) {
      console.error('[removeIntegration] ❌ Error:', err)

      // Rollback on error
      setIntegrations(previousIntegrations)

      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to remove integration'
      }
    }
  }

  /**
   * Test an integration connection
   */
  const testIntegration = async (integration: Integration) => {
    try {
      console.log('[testIntegration] 🧪 Testing integration:', integration.name)

      // Handle USPS integration test
      if (integration.name === 'USPS' && integration.type === 'shipping') {
        const response = await fetch('/api/shipping/usps/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: integration.storeId
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          return { success: true, message: data.message || 'USPS connection successful!' }
        } else {
          return { success: false, message: data.message || 'USPS connection failed' }
        }
      }

      // Handle UPS integration test
      if (integration.name === 'UPS' && integration.type === 'shipping') {
        const response = await fetch('/api/integrations/ups/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: integration.storeId
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          return { success: true, message: data.message || 'UPS connection successful!' }
        } else {
          return { success: false, message: data.message || 'UPS connection failed' }
        }
      }

      // Handle Shopify integration test
      if (integration.name === 'Shopify' && integration.type === 'ecommerce') {
        const shopifyIntegration = integration as ShopifyIntegration

        const response = await fetch('/api/integrations/shopify/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopUrl: shopifyIntegration.config.storeUrl,
            accessToken: shopifyIntegration.config.accessToken
          })
        })

        const data = await response.json()

        if (data.success === true) {
          return { success: true, message: data.message || 'Shopify connection successful!' }
        } else {
          return { success: false, message: data.message || data.error || 'Shopify connection failed' }
        }
      }

      // Handle WooCommerce integration test
      if (integration.name === 'WooCommerce' && integration.type === 'ecommerce') {
        const wooIntegration = integration as WooCommerceIntegration

        const response = await fetch('/api/integrations/woocommerce/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeUrl: wooIntegration.config.storeUrl,
            consumerKey: wooIntegration.config.consumerKey,
            consumerSecret: wooIntegration.config.consumerSecret
          })
        })

        const data = await response.json()

        if (data.success === true) {
          return { success: true, message: data.message || 'WooCommerce connection successful!' }
        } else {
          return { success: false, message: data.message || 'WooCommerce connection failed' }
        }
      }

      // Handle Etsy integration test
      if (integration.name === 'Etsy' && integration.type === 'ecommerce') {
        const etsyIntegration = integration as EtsyIntegration

        const response = await fetch('/api/integrations/etsy/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: etsyIntegration.config.apiKey,
            sharedSecret: etsyIntegration.config.sharedSecret
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          return { success: true, message: data.message || 'Etsy connection successful!' }
        } else {
          return { success: false, message: data.message || 'Etsy connection failed' }
        }
      }

      return {
        success: false,
        message: `Testing not yet implemented for ${integration.name}`
      }
    } catch (err) {
      console.error('[testIntegration] ❌ Error:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Integration test failed'
      }
    }
  }

  /**
   * Sync shipping services from carrier API to database
   * This merges API services with user preferences
   */
  const syncShippingServices = async (warehouseId: string, apiServices: any[]) => {
    try {
      console.log('[syncShippingServices] 🔄 Syncing services for warehouse:', warehouseId)

      // Get existing services from API
      const existingServices = await IntegrationAPI.getWarehouseServices(warehouseId)

      // Create map of existing services by unique key
      const existingMap = new Map()
      existingServices.forEach((svc: any) => {
        const key = `${svc.carrier}-${svc.serviceCode}`
        existingMap.set(key, svc)
      })

      // Merge API services with existing
      const merged = apiServices.map((apiSvc) => {
        const key = `${apiSvc.carrier}-${apiSvc.serviceCode}`
        const existing = existingMap.get(key)

        if (existing) {
          // Update existing service but preserve user's isActive choice
          return {
            ...apiSvc,
            id: existing.id,
            isActive: existing.isActive,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
          }
        }

        // New service
        return {
          ...apiSvc,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })

      // Save merged services to API
      await IntegrationAPI.saveWarehouseServices(warehouseId, merged)

      console.log(`[syncShippingServices] ✅ Synced ${merged.length} services`)
      return { success: true, count: merged.length }

    } catch (err) {
      console.error('[syncShippingServices] ❌ Error:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync services'
      }
    }
  }

  /**
   * Sync shipping boxes from carrier API to database
   * This intelligently merges API boxes with user customizations
   */
  const syncShippingBoxes = async (warehouseId: string, apiBoxes: any[]) => {
    try {
      console.log('[syncShippingBoxes] 🔄 Syncing boxes for warehouse:', warehouseId)

      // Get existing boxes from API
      const existingBoxes = await IntegrationAPI.getWarehouseBoxes(warehouseId)

      // Identify user-customized boxes
      const userCustomizedBoxes: any[] = []
      const uncustomizedBoxes: any[] = []

      existingBoxes.forEach((box: any) => {
        const hasRealDimensions = box.dimensions &&
          box.dimensions.length > 0 &&
          box.dimensions.width > 0 &&
          box.dimensions.height > 0

        const isVariableBox = box.isEditable === true ||
          box.needsDimensions === true ||
          box.code === 'PACKAGE_VARIABLE' ||
          box.code === 'PACKAGE_GROUND'

        const isUserCustomized =
          box.boxType === 'custom' ||
          (isVariableBox && hasRealDimensions) ||
          (isVariableBox && box.needsDimensions === false)

        if (isUserCustomized) {
          userCustomizedBoxes.push(box)
          console.log(`[syncShippingBoxes] User customized: ${box.name}`)
        } else {
          uncustomizedBoxes.push(box)
        }
      })

      console.log(`[syncShippingBoxes] Found ${userCustomizedBoxes.length} user-customized boxes, ${uncustomizedBoxes.length} uncustomized boxes`)

      // Create map of uncustomized boxes
      const uncustomizedBoxMap = new Map()
      uncustomizedBoxes.forEach((box: any) => {
        const key = box.carrierCode || box.name
        uncustomizedBoxMap.set(key, box)
      })

      // Create set of user-customized box codes
      const userBoxCodes = new Set(
        userCustomizedBoxes.map(b => b.carrierCode || b.name)
      )

      // Process API boxes
      const processedApiBoxes: any[] = []

      apiBoxes.forEach((apiBox) => {
        const key = apiBox.carrierCode || apiBox.name

        // If user has customized version, skip API box
        if (userBoxCodes.has(key)) {
          console.log(`[syncShippingBoxes] ⚠️ Skipping API box "${apiBox.name}" - user has customized version`)
          return
        }

        // Check if we have uncustomized version to update
        const existing = uncustomizedBoxMap.get(key)

        if (existing) {
          // Update uncustomized box with API data, preserve isActive
          processedApiBoxes.push({
            ...apiBox,
            id: existing.id,
            isActive: existing.isActive,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
          })
          console.log(`[syncShippingBoxes] ✓ Updated "${apiBox.name}" from API`)
        } else {
          // New box from API
          processedApiBoxes.push(apiBox)
          console.log(`[syncShippingBoxes] ✓ Added new "${apiBox.name}"`)
        }
      })

      // Combine: user-customized boxes (untouched) + processed API boxes
      const finalBoxes = [...userCustomizedBoxes, ...processedApiBoxes]

      // Save to API
      await IntegrationAPI.saveWarehouseBoxes(warehouseId, finalBoxes)

      console.log(`[syncShippingBoxes] ✅ Synced ${finalBoxes.length} boxes (${userCustomizedBoxes.length} user-customized, ${processedApiBoxes.length} from API)`)

      return {
        success: true,
        total: finalBoxes.length,
        userCustomized: userCustomizedBoxes.length,
        fromApi: processedApiBoxes.length
      }

    } catch (err) {
      console.error('[syncShippingBoxes] ❌ Error:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync boxes'
      }
    }
  }

  /**
   * Sync shipping presets from API to database
   */
  const syncShippingPresets = async (warehouseId: string, apiPresets: any[]) => {
    try {
      console.log('[syncShippingPresets] 🔄 Syncing presets for warehouse:', warehouseId)

      // Get existing presets from API
      const existingPresets = await IntegrationAPI.getWarehousePresets(warehouseId)

      // Create map of existing presets
      const existingMap = new Map()
      existingPresets.forEach((preset: any) => {
        const key = `${preset.carrier}-${preset.serviceName}`
        existingMap.set(key, preset)
      })

      // Merge API presets with existing
      const merged = apiPresets.map((apiPreset) => {
        const key = `${apiPreset.carrier}-${apiPreset.serviceName}`
        const existing = existingMap.get(key)

        if (existing) {
          // Update existing preset but preserve user changes
          return {
            ...apiPreset,
            id: existing.id,
            isActive: existing.isActive,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString()
          }
        }

        // New preset
        return {
          ...apiPreset,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })

      // Save merged presets to API
      await IntegrationAPI.saveWarehousePresets(warehouseId, merged)

      console.log(`[syncShippingPresets] ✅ Synced ${merged.length} presets`)
      return { success: true, count: merged.length }

    } catch (err) {
      console.error('[syncShippingPresets] ❌ Error:', err)
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync presets'
      }
    }
  }

  return {
    integrations,
    accountId, // null during loading, string when successfully loaded
    loading,
    error,

    // CRUD operations
    updateIntegration,
    addIntegration,
    removeIntegration,

    // Query operations
    getIntegration,
    getIntegrationsByType,

    // Test operations
    testIntegration,

    // Sync operations (for shipping integrations)
    syncShippingServices,
    syncShippingBoxes,
    syncShippingPresets,

    // Refresh data
    refresh: loadAccountAndIntegrations
  }
}
