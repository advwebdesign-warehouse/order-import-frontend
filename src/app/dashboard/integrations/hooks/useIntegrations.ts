//file path: src/app/dashboard/integrations/hooks/useIntegrations.ts

/**
 * ✅ Now uses IntegrationAPI methods for all test integrations
 *
 * Changed from direct fetch() calls to IntegrationAPI methods:
 * - testUSPS() → Uses IntegrationAPI.testUSPS()
 * - testUPS() → Uses IntegrationAPI.testUPS()
 * - testShopify() → Uses IntegrationAPI.testShopify()
 * - testWooCommerce() → Uses IntegrationAPI.testWooCommerce()
 * - testEtsy() → Uses IntegrationAPI.testEtsy()
 *
 * Benefits:
 * - All API logic centralized in integrationApi.ts
 * - Automatic httpOnly cookie authentication via apiRequest
 * - Better separation of concerns (hooks = state, api = network)
 * - More maintainable and reusable
 */

'use client'

import { useState, useEffect, useCallback, useRef  } from 'react'
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

  // ✅ NEW: Ref to track integrations immediately (no waiting for re-render)
  const integrationsRef = useRef<Integration[]>([])

  // ✅ Keep ref in sync with state
  useEffect(() => {
    integrationsRef.current = integrations
  }, [integrations])

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
   * ✅ Update integration with ref fallback
   */
  const updateIntegration = async (integrationId: string, partialData: any) => {
    try {
      console.log('[updateIntegration] 🔄 Updating integration:', integrationId)

      // ✅ Check BOTH state AND ref
      let existingIntegration = integrations.find(i => i.id === integrationId)
                             || integrationsRef.current.find(i => i.id === integrationId)

      if (!existingIntegration) {
        throw new Error(`Integration not found: ${integrationId}`)
      }

      // ✅ Build the data to send to API - ONLY partial data, not full merge
      // This prevents stale frontend data from overwriting newer backend data
      const apiUpdateData: any = { ...partialData }

      // ✅ Deep merge config if provided (only the config object, not full integration)
      if (partialData.config) {
        apiUpdateData.config = {
          ...existingIntegration.config,
          ...partialData.config
        }
      }

      // ✅ Deep merge routingConfig if provided (only routingConfig, not full integration)
      // Use 'in' operator and type assertions to handle union types safely)
      if ('routingConfig' in partialData && (partialData as any).routingConfig) {
        (apiUpdateData as any).routingConfig = {
          ...(existingIntegration as any).routingConfig,
          ...(partialData as any).routingConfig,
          // Use new assignments if provided, otherwise keep existing
          assignments: (partialData as any).routingConfig.assignments !== undefined
            ? (partialData as any).routingConfig.assignments
            : (existingIntegration as any).routingConfig?.assignments || []
        }
      }

      // ✅ CRITICAL: Log ALL data being sent, including inventory fields
      console.log('[updateIntegration] 📦 API update data:', {
        hasConfig: !!apiUpdateData.config,
        hasRoutingConfig: !!(apiUpdateData as any).routingConfig,
        routingMode: (apiUpdateData as any).routingConfig?.mode,
        assignmentsCount: (apiUpdateData as any).routingConfig?.assignments?.length || 0,
        // ✅ NEW: Log inventory fields explicitly
        inventorySync: (apiUpdateData as any).inventorySync,
        syncDirection: (apiUpdateData as any).syncDirection,
        managesInventory: (apiUpdateData as any).managesInventory,
        allKeys: Object.keys(apiUpdateData)
      })

      // ✅ CRITICAL FIX: Send ONLY partial data to API, not full merged object
      // This prevents race conditions where stale frontend data overwrites newer backend data
      await IntegrationAPI.updateIntegration(integrationId, apiUpdateData)

      // ✅ After successful API call, update local state optimistically
      // Build full merged object for local state only
      const updatedIntegration = {
        ...existingIntegration,
        ...partialData,
        config: apiUpdateData.config || existingIntegration.config,
        routingConfig: (apiUpdateData as any).routingConfig || (existingIntegration as any).routingConfig
      } as Integration

      // Update both state and ref
      setIntegrations(prev => prev.map(i => i.id === integrationId ? updatedIntegration : i))
      integrationsRef.current = integrationsRef.current.map(i =>
        i.id === integrationId ? updatedIntegration : i
      )

      console.log('[updateIntegration] ✅ Integration updated successfully')
      return { success: true }

    } catch (err) {
      console.error('[updateIntegration] ❌ Error:', err)

      return {
        success: false,
        message: err instanceof Error ? err.message : 'Failed to update integration'
      }
    }
  }

  /**
   * ✅ Add integration and update ref immediately
   */
  const addIntegration = async (integration: any) => {
    // 🔍 FIRST THING: Log parameter as received (JSON snapshot!)
    console.log('[addIntegration] 🎯 Parameter AS RECEIVED (JSON snapshot):', JSON.parse(JSON.stringify({
      type: integration.type,
      typeType: typeof integration.type,
      provider: integration.provider,
      providerType: typeof integration.provider,
      name: integration.name,
      allKeys: Object.keys(integration)
    })))

    try {
      console.log('[addIntegration] 🔍 Validating integration data...')
      console.log('[addIntegration] Data check:', {
        name: integration.name,
        nameType: typeof integration.name,
        nameValid: !!integration.name && typeof integration.name === 'string',

        type: integration.type,
        typeType: typeof integration.type,
        typeValid: ['ecommerce', 'shipping', 'accounting'].includes(integration.type),

        provider: integration.provider,
        providerType: typeof integration.provider,
        providerValid: !!integration.provider && typeof integration.provider === 'string',

        hasConfig: !!integration.config,
        configType: typeof integration.config,
        configIsObject: typeof integration.config === 'object' && !Array.isArray(integration.config),
        configKeys: integration.config ? Object.keys(integration.config) : 'NO CONFIG',

        storeId: integration.storeId,
        accountId: integration.accountId,

        allKeys: Object.keys(integration),
        fullData: integration  // ✅ Log everything for debugging
      })

      // ✅ Validate before sending
      if (!integration.name || typeof integration.name !== 'string') {
        throw new Error('Validation failed: name must be a non-empty string')
      }
      if (!integration.type || typeof integration.type !== 'string') {
        throw new Error('Validation failed: type must be a non-empty string')
      }
      if (!['ecommerce', 'shipping', 'accounting'].includes(integration.type)) {
        throw new Error(`Validation failed: type must be 'ecommerce', 'shipping', or 'accounting' (got: '${integration.type}')`)
      }
      if (!integration.provider || typeof integration.provider !== 'string') {
        throw new Error('Validation failed: provider must be a non-empty string')
      }
      if (!integration.config || typeof integration.config !== 'object' || Array.isArray(integration.config)) {
        throw new Error('Validation failed: config must be an object (not null, not array)')
      }

      console.log('[addIntegration] ✅ Validation passed')
      console.log('[addIntegration] 🔄 Adding integration:', integration.name, 'for store:', integration.storeId)

      // Check if integration already exists
      const existingIndex = integrations.findIndex(
        i => i.name === integration.name && i.storeId === integration.storeId
      )

      if (existingIndex >= 0) {
        console.log('[addIntegration] ⚠️ Integration already exists, updating instead')
        const updated = integrations.map((i, index) =>
          index === existingIndex ? { ...i, ...integration } : i
        )
        setIntegrations(updated)
        integrationsRef.current = updated // ✅ Update ref too

        const savedIntegration = await IntegrationAPI.saveIntegration(integration)
        console.log('[addIntegration] ✅ Integration updated with ID:', savedIntegration.id)

        return { success: true, integration: savedIntegration }
      }

      // ✅ Save to API FIRST
      const savedIntegration = await IntegrationAPI.saveIntegration(integration)
      console.log('[addIntegration] ✅ Integration saved with ID:', savedIntegration.id)

      // Now add to state with the correct ID from backend
      const integrationWithCorrectId = { ...integration, id: savedIntegration.id }

      // ✅ Update BOTH state and ref
      setIntegrations(prev => {
        const exists = prev.find(i => i.id === savedIntegration.id)
        if (exists) {
          console.log('[addIntegration] ⚠️ Integration already in state, updating')
          return prev.map(i => i.id === savedIntegration.id ? integrationWithCorrectId : i)
        }
        return [...prev, integrationWithCorrectId]
      })

      // ✅ Update ref immediately (no waiting for re-render)
      const exists = integrationsRef.current.find(i => i.id === savedIntegration.id)
      if (exists) {
        integrationsRef.current = integrationsRef.current.map(i =>
          i.id === savedIntegration.id ? integrationWithCorrectId : i
        )
      } else {
        integrationsRef.current = [...integrationsRef.current, integrationWithCorrectId]
      }

      console.log('[addIntegration] ✅ Added to state and ref with ID:', savedIntegration.id)

      return { success: true, integration: integrationWithCorrectId }

    } catch (err) {
      console.error('[addIntegration] ❌ Error:', err)

      // ✅ Enhanced error details
      if (err instanceof Error) {
        console.error('[addIntegration] Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack?.split('\n').slice(0, 5).join('\n')  // First 5 lines of stack
        })
      }

      // ✅ Log what data failed
      console.error('[addIntegration] Failed integration data:', {
        name: integration.name,
        type: integration.type,
        provider: integration.provider,
        hasConfig: !!integration.config,
        configKeys: integration.config ? Object.keys(integration.config) : 'none'
      })

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
        const result = await IntegrationAPI.testUSPS({
          storeId: integration.storeId
        })

        if (result.success) {
          return { success: true, message: result.message || 'USPS connection successful!' }
        } else {
          return { success: false, message: result.message || 'USPS connection failed' }
        }
      }

      // Handle UPS integration test
      if (integration.name === 'UPS' && integration.type === 'shipping') {
        const result = await IntegrationAPI.testUPS({
          storeId: integration.storeId
        })

        if (result.success) {
          return { success: true, message: result.message || 'UPS connection successful!' }
        } else {
          return { success: false, message: result.message || 'UPS connection failed' }
        }
      }

      // Handle Shopify integration test
      if (integration.name === 'Shopify' && integration.type === 'ecommerce') {
        const shopifyIntegration = integration as ShopifyIntegration

        const result = await IntegrationAPI.testShopify({
          storeUrl: shopifyIntegration.config.storeUrl,
          accessToken: shopifyIntegration.config.accessToken
        })

        if (result.success === true) {
          return { success: true, message: result.message || 'Shopify connection successful!' }
        } else {
          return { success: false, message: result.message || result.error || 'Shopify connection failed' }
        }
      }

      // Handle WooCommerce integration test
      if (integration.name === 'WooCommerce' && integration.type === 'ecommerce') {
        const wooIntegration = integration as WooCommerceIntegration

        const result = await IntegrationAPI.testWooCommerce({
          storeUrl: wooIntegration.config.storeUrl,
          consumerKey: wooIntegration.config.consumerKey,
          consumerSecret: wooIntegration.config.consumerSecret
        })

        if (result.success === true) {
          return { success: true, message: result.message || 'WooCommerce connection successful!' }
        } else {
          return { success: false, message: result.message || 'WooCommerce connection failed' }
        }
      }

      // Handle Etsy integration test
      if (integration.name === 'Etsy' && integration.type === 'ecommerce') {
        const etsyIntegration = integration as EtsyIntegration

        const result = await IntegrationAPI.testEtsy({
          apiKey: etsyIntegration.config.apiKey,
          sharedSecret: etsyIntegration.config.sharedSecret
        })

        if (result.success) {
          return { success: true, message: result.message || 'Etsy connection successful!' }
        } else {
          return { success: false, message: result.message || 'Etsy connection failed' }
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
