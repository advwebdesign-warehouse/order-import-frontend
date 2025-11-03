//file path: src/app/dashboard/integrations/hooks/useIntegrations.ts

'use client'

import { useState, useEffect } from 'react'
import {
  Integration,
  IntegrationSettings,
  DEFAULT_INTEGRATION_SETTINGS,
  ShopifyIntegration,
  WooCommerceIntegration,
  EtsyIntegration,
  EbayIntegration
} from '../types/integrationTypes'
import {
  getCurrentAccountId,
  getAccountIntegrations,
  saveAccountIntegrations
} from '@/lib/storage/integrationStorage'

export function useIntegrations() {
  const [settings, setSettings] = useState<IntegrationSettings>(DEFAULT_INTEGRATION_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const aid = getCurrentAccountId()
    setAccountId(aid)

    try {
      const accountSettings = getAccountIntegrations(aid)
      if (accountSettings) {
        setSettings(accountSettings)
      } else {
        const defaultSettings = {
          ...DEFAULT_INTEGRATION_SETTINGS,
          accountId: aid
        }
        setSettings(defaultSettings)
        saveAccountIntegrations(defaultSettings, aid)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = (newSettings: IntegrationSettings) => {
    try {
      saveAccountIntegrations(newSettings, accountId)
      setSettings(newSettings)
      return true
    } catch (error) {
      console.error('Error saving integrations:', error)
      return false
    }
  }

  // ✅ NEW - Smart merge for services (preserves user settings)
  const smartMergeServices = (warehouseId: string, apiServices: any[]) => {
    const storageKey = `shipping_services_${warehouseId}`
    const existing = localStorage.getItem(storageKey)
    const existingServices = existing ? JSON.parse(existing) : []

    // Create map of existing services by unique key
    const existingMap = new Map()
    existingServices.forEach((svc: any) => {
      const key = `${svc.carrier}-${svc.serviceCode}`
      existingMap.set(key, svc)
    })

    // Merge API services with existing
    const merged = apiServices.map((apiSvc, index) => {
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
        id: `${apiSvc.carrier.toLowerCase()}-${warehouseId}-${Date.now()}-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    localStorage.setItem(storageKey, JSON.stringify(merged))
    console.log(`[useIntegrations] Merged ${merged.length} services for warehouse ${warehouseId}`)
  }

  // ✅ FIXED - Smart merge for boxes (properly detects user customizations)
  const smartMergeBoxes = (warehouseId: string, apiBoxes: any[]) => {
    const storageKey = `shipping_boxes_${warehouseId}`
    const existing = localStorage.getItem(storageKey)
    const existingBoxes = existing ? JSON.parse(existing) : []

    // Identify truly user-customized boxes
    const userCustomizedBoxes: any[] = []
    const uncustomizedBoxes: any[] = []

    existingBoxes.forEach((box: any) => {
      // A box is "user-customized" if:
      // 1. It's a custom box type, OR
      // 2. It's a variable box AND user has set real dimensions (not 0x0x0)

      const hasRealDimensions = box.dimensions &&
        box.dimensions.length > 0 &&
        box.dimensions.width > 0 &&
        box.dimensions.height > 0

      const isVariableBox = box.isEditable === true ||
        box.needsDimensions === true ||
        box.code === 'PACKAGE_VARIABLE' ||
        box.code === 'PACKAGE_GROUND'

      const isUserCustomized =
        box.boxType === 'custom' || // Custom boxes are always user-created
        (isVariableBox && hasRealDimensions) || // Variable box with user-set dimensions
        (isVariableBox && box.needsDimensions === false) // Variable box marked as configured

      if (isUserCustomized) {
        userCustomizedBoxes.push(box)
        console.log(`[smartMergeBoxes] User customized: ${box.name}`)
      } else {
        uncustomizedBoxes.push(box)
      }
    })

    console.log(`[smartMergeBoxes] Found ${userCustomizedBoxes.length} user-customized boxes, ${uncustomizedBoxes.length} uncustomized boxes`)

    // Create map of uncustomized boxes by carrier code (these can be updated)
    const uncustomizedBoxMap = new Map()
    uncustomizedBoxes.forEach((box: any) => {
      const key = box.carrierCode || box.name
      uncustomizedBoxMap.set(key, box)
    })

    // Create set of user-customized box codes (these should never be replaced)
    const userBoxCodes = new Set(
      userCustomizedBoxes.map(b => b.carrierCode || b.name)
    )

    // Process API boxes
    const processedApiBoxes: any[] = []

    apiBoxes.forEach((apiBox) => {
      const key = apiBox.carrierCode || apiBox.name

      // CRITICAL: If user has a customized version of this box, DO NOT touch it
      if (userBoxCodes.has(key)) {
        console.log(`[smartMergeBoxes] ⚠️ Skipping API box "${apiBox.name}" - user has customized version`)
        return // Skip this API box entirely
      }

      // Check if we have an uncustomized version to update
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
        console.log(`[smartMergeBoxes] ✓ Updated "${apiBox.name}" from API`)
      } else {
        // New box from API - add it
        processedApiBoxes.push(apiBox)
        console.log(`[smartMergeBoxes] ✓ Added new "${apiBox.name}"`)
      }
    })

    // Combine: ALL user-customized boxes (untouched) + processed API boxes
    const merged = [...userCustomizedBoxes, ...processedApiBoxes]

    localStorage.setItem(storageKey, JSON.stringify(merged))
    console.log(`[smartMergeBoxes] ✅ Final: ${merged.length} total boxes (${userCustomizedBoxes.length} custom, ${processedApiBoxes.length} from API)`)
  }

  // ✅ NEW - Auto-sync services and boxes when USPS integration is saved
  const syncUSPSServicesAndBoxes = async (config: any) => {
    try {
      console.log('[useIntegrations] Starting auto-sync for USPS...')

      // Get all warehouses
      const warehousesStr = localStorage.getItem('warehouses')
      const warehouses = warehousesStr ? JSON.parse(warehousesStr) : []

      if (warehouses.length === 0) {
        console.log('[useIntegrations] No warehouses found, skipping sync')
        return
      }

      // Sync services
      console.log('[useIntegrations] Syncing services...')
      const servicesResponse = await fetch('/api/shipping/services/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: ['USPS'],
          credentials: {
            userId: config.consumerKey,
            apiKey: config.consumerSecret,
            apiUrl: config.environment === 'sandbox'
              ? 'https://apis-tem.usps.com'
              : 'https://apis.usps.com'
          }
        })
      })

      if (!servicesResponse.ok) {
        console.error('[useIntegrations] Failed to sync services')
        return
      }

      const servicesData = await servicesResponse.json()
      console.log('[useIntegrations] Services fetched:', servicesData.services?.length || 0)

      // Sync boxes
      console.log('[useIntegrations] Syncing boxes...')
      const boxesResponse = await fetch('/api/shipping/boxes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: ['USPS'],
          credentials: {
            userId: config.consumerKey,
            apiKey: config.consumerSecret,
            apiUrl: config.environment === 'sandbox'
              ? 'https://apis-tem.usps.com'
              : 'https://apis.usps.com'
          }
        })
      })

      if (!boxesResponse.ok) {
        console.error('[useIntegrations] Failed to sync boxes')
        return
      }

      const boxesData = await boxesResponse.json()
      console.log('[useIntegrations] Boxes fetched:', boxesData.boxes?.length || 0)

      // Apply smart merge for each warehouse
      if (servicesData.services && servicesData.services.length > 0) {
        warehouses.forEach((warehouse: any) => {
          smartMergeServices(warehouse.id, servicesData.services)
        })
      }

      if (boxesData.boxes && boxesData.boxes.length > 0) {
        warehouses.forEach((warehouse: any) => {
          smartMergeBoxes(warehouse.id, boxesData.boxes)
        })
      }

      console.log('[useIntegrations] ✅ Auto-sync complete!')
    } catch (error) {
      console.error('[useIntegrations] Error during auto-sync:', error)
    }
  }

  // 🔥 CRITICAL FIX: Read fresh data from localStorage before updating
  const updateIntegration = (integrationId: string, updates: Partial<Integration>) => {
    // ✅ FIX: Read fresh data from localStorage to avoid stale state
    const aid = getCurrentAccountId()
    const freshSettings = getAccountIntegrations(aid) || settings

    console.log('[updateIntegration] Fresh integrations count:', freshSettings.integrations.length)
    console.log('[updateIntegration] Updating integration:', integrationId, 'with:', Object.keys(updates))
    if (updates.config) {
      console.log('[updateIntegration] Config update detected, will deep-merge with existing config')
    }

    // Find the integration to update
    const integration = freshSettings.integrations.find(i => i.id === integrationId)

    if (!integration) {
      console.error('[updateIntegration] ❌ Integration not found:', integrationId)
      console.log('[updateIntegration] Available IDs:', freshSettings.integrations.map(i => i.id))
      return false
    }

    // ✅ FIX: Deep merge the config to prevent losing fields like storeUrl
    const newSettings = {
      ...freshSettings,
      integrations: freshSettings.integrations.map(i => {
        if (i.id === integrationId) {
          // Deep merge config if it exists in updates
          const mergedIntegration = { ...i, ...updates } as Integration
          if (updates.config && i.config) {
            mergedIntegration.config = { ...i.config, ...updates.config } as any
          }
          return mergedIntegration
        }
        return i
      }),
      lastUpdated: new Date().toISOString()
    }

    console.log('[updateIntegration] Updated integrations count:', newSettings.integrations.length)

    // ✅ Verify the updated integration has the config fields
    const updatedIntegration = newSettings.integrations.find(i => i.id === integrationId)
    if (updatedIntegration && 'config' in updatedIntegration) {
      console.log('[updateIntegration] Updated integration config keys:', Object.keys((updatedIntegration as any).config || {}))
    }

    // ✅ USPS auto-sync trigger
    if (integration?.name === 'USPS' && updates.config) {
      // Check if this is a meaningful config update (has credentials)
      const newConfig = { ...integration.config, ...updates.config }
      if (newConfig.consumerKey && newConfig.consumerSecret) {
        console.log('[updateIntegration] USPS credentials detected, triggering auto-sync...')

        // Trigger sync in background (don't block the save)
        setTimeout(() => {
          try {
            syncUSPSServicesAndBoxes(newConfig)
          } catch (error) {
            console.error('[updateIntegration] Error auto-syncing USPS:', error)
          }
        }, 500)
      }
    }

    // ✅ UPS auto-sync trigger (similar pattern)
    if (integration?.name === 'UPS' && updates.config) {
      const newConfig = { ...integration.config, ...updates.config }
      if (newConfig.accessToken) {
        console.log('[updateIntegration] UPS credentials detected, could trigger auto-sync here...')

        // You can add UPS sync logic here if needed
        setTimeout(() => {
          try {
            // syncUPSServicesAndBoxes(newConfig) if you implement it
          } catch (error) {
            console.error('[updateIntegration] Error auto-syncing boxes:', error)
          }
        }, 500)
      }
    }

    const success = saveSettings(newSettings)

    if (success) {
      console.log('[updateIntegration] ✅ Successfully updated integration')
    } else {
      console.error('[updateIntegration] ❌ Failed to save updates')
    }

    return success
  }

  const getIntegration = (integrationId: string, storeId?: string): Integration | undefined => {
    if (storeId) {
      return settings.integrations.find(i => i.id === integrationId && i.storeId === storeId)
    }
    return settings.integrations.find(i => i.id === integrationId)
  }

  const getIntegrationsByType = (type: 'shipping' | 'ecommerce' | 'warehouse' | 'accounting' | 'other', storeId?: string): Integration[] => {
    if (storeId) {
      return settings.integrations.filter(i => i.type === type && i.storeId === storeId)
    }
    return settings.integrations.filter(i => i.type === type)
  }

  const testIntegration = async (integrationId: string): Promise<{ success: boolean; message: string }> => {
    const integration = settings.integrations.find(i => i.id === integrationId)

    if (!integration) {
      return { success: false, message: 'Integration not found' }
    }

    // Handle USPS integration test
    if (integration.name === 'USPS' && integration.type === 'shipping') {
      try {
        const response = await fetch('/api/integrations/usps/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...integration.config,
            accountId: accountId
          })
        })

        if (response.ok) {
          return { success: true, message: 'USPS connection successful!' }
        } else {
          const error = await response.json()
          return { success: false, message: error.message || 'USPS connection failed' }
        }
      } catch (error) {
        console.error('USPS integration test failed:', error)
        return { success: false, message: error instanceof Error ? error.message : 'USPS test failed' }
      }
    }

    // Handle UPS integration test
    if (integration.name === 'UPS' && integration.type === 'shipping') {
      try {
        const response = await fetch('/api/integrations/ups/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...integration.config,
            accountId: accountId
          })
        })

        if (response.ok) {
          return { success: true, message: 'UPS connection successful!' }
        } else {
          const error = await response.json()
          return { success: false, message: error.message || 'UPS connection failed' }
        }
      } catch (error) {
        console.error('UPS integration test failed:', error)
        return { success: false, message: error instanceof Error ? error.message : 'UPS test failed' }
      }
    }

    // Handle Shopify integration test - using GraphQL
    if (integration.name === 'Shopify' && integration.type === 'ecommerce') {
      try {
        console.log('[testIntegration] Testing Shopify connection...')

        const shopifyIntegration = integration as ShopifyIntegration

        // ✅ FIX: Get fresh integration data from storage to ensure we have the latest storeUrl
        const aid = getCurrentAccountId()
        const freshSettings = getAccountIntegrations(aid)
        const freshIntegration = freshSettings?.integrations.find(
          i => i.id === shopifyIntegration.id && i.storeId === shopifyIntegration.storeId
        ) as ShopifyIntegration | undefined

        const storeUrl = freshIntegration?.config?.storeUrl || shopifyIntegration.config?.storeUrl
        const accessToken = freshIntegration?.config?.accessToken || shopifyIntegration.config?.accessToken

        console.log('[testIntegration] Shopify test data:', {
          integrationId: shopifyIntegration.id,
          storeId: shopifyIntegration.storeId,
          hasStoreUrl: !!storeUrl,
          hasAccessToken: !!accessToken,
          storeUrl: storeUrl ? storeUrl.substring(0, 20) + '...' : 'undefined'
        })

        if (!storeUrl || !accessToken) {
          console.error('[testIntegration] Missing credentials:', { hasStoreUrl: !!storeUrl, hasAccessToken: !!accessToken })
          return {
            success: false,
            message: 'Missing Shopify credentials. Please reconnect your store.'
          }
        }

        const response = await fetch('/api/integrations/shopify/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopUrl: storeUrl,  // ✅ Changed from storeUrl to shopUrl to match API expectation
            accessToken: accessToken
          })
        })

        const data = await response.json()
        console.log('[testIntegration] Shopify test result:', data)

        if (data.success === true) {
          return { success: true, message: data.message || 'Shopify connection successful!' }
        } else {
          return { success: false, message: data.message || data.error || 'Shopify connection failed' }
        }
      } catch (error) {
        console.error('Shopify integration test failed:', error)
        return { success: false, message: error instanceof Error ? error.message : 'Shopify test failed' }
      }
    }

    // Handle WooCommerce integration test
    if (integration.name === 'WooCommerce' && integration.type === 'ecommerce') {
      try {
        console.log('[testIntegration] Testing WooCommerce connection...')

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
      } catch (error) {
        console.error('WooCommerce integration test failed:', error)
        return { success: false, message: error instanceof Error ? error.message : 'WooCommerce test failed' }
      }
    }

    // Handle Etsy integration test
    if (integration.name === 'Etsy' && integration.type === 'ecommerce') {
      try {
        console.log('[testIntegration] Testing Etsy connection...')

        const etsyIntegration = integration as EtsyIntegration

        const response = await fetch('/api/integrations/etsy/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: etsyIntegration.config.apiKey,
            sharedSecret: etsyIntegration.config.sharedSecret,
            storeId: etsyIntegration.config.storeId
          })
        })

        const data = await response.json()
        if (data.success === true) {
          return { success: true, message: data.message || 'Etsy connection successful!' }
        } else {
          return { success: false, message: data.message || 'Etsy connection failed' }
        }
      } catch (error) {
        console.error('Etsy integration test failed:', error)
        return { success: false, message: error instanceof Error ? error.message : 'Etsy test failed' }
      }
    }

    // Unsupported integration type
    console.warn(`Test not implemented for integration: ${integration.name}`)
    return { success: false, message: `Test not implemented for ${integration.name}` }
  }

  // 🔥 CRITICAL FIX: Read fresh data from localStorage before adding
  const addIntegration = (integration: Integration) => {
    // Read fresh data from localStorage to avoid data loss
    const aid = getCurrentAccountId()
    const freshSettings = getAccountIntegrations(aid) || settings

    console.log('[addIntegration] Fresh integrations count:', freshSettings.integrations.length)
    console.log('[addIntegration] Current state count:', settings.integrations.length)
    console.log('[addIntegration] Adding integration:', integration.id, integration.name, 'for store:', integration.storeId)

    // Check if integration already exists
    const existingIndex = freshSettings.integrations.findIndex(
      i => i.id === integration.id || (i.name === integration.name && i.storeId === integration.storeId)
    )

    let updatedIntegrations
    if (existingIndex >= 0) {
      console.log('[addIntegration] Integration already exists, updating instead')
      // Update existing integration
      updatedIntegrations = freshSettings.integrations.map((i, index) =>
        index === existingIndex ? { ...i, ...integration } : i
      )
    } else {
      // Add new integration
      updatedIntegrations = [...freshSettings.integrations, integration]
    }

    const newSettings = {
      ...freshSettings,
      integrations: updatedIntegrations,
      lastUpdated: new Date().toISOString()
    }

    console.log('[addIntegration] New integrations count:', newSettings.integrations.length)
    console.log('[addIntegration] All integrations:', newSettings.integrations.map(i => ({ id: i.id, name: i.name, storeId: i.storeId })))

    const success = saveSettings(newSettings)

    if (success) {
      // ✅ Update local state immediately
      setSettings(newSettings)
      console.log('[addIntegration] ✅ Successfully saved integration')
    } else {
      console.error('[addIntegration] ❌ Failed to save integration')
    }

    return success
  }

  const removeIntegration = (integrationId: string, storeId?: string) => {
    // 🔥 CRITICAL FIX: Read fresh data from localStorage before removing
    const aid = getCurrentAccountId()
    const freshSettings = getAccountIntegrations(aid) || settings

    console.log('[removeIntegration] Fresh integrations count:', freshSettings.integrations.length)

    const newSettings = {
      ...freshSettings,
      integrations: freshSettings.integrations.filter(i => {
        // ✅ If storeId provided, only remove integration for THAT store
        if (storeId) {
          return !(i.id === integrationId && i.storeId === storeId)
        }
        // Otherwise remove all instances (fallback)
        return i.id !== integrationId
      }),
      lastUpdated: new Date().toISOString()
    }

    console.log('[removeIntegration] New integrations count:', newSettings.integrations.length)

    const success = saveSettings(newSettings)

    if (success) {
      // ✅ Update local state immediately
      setSettings(newSettings)
    }

    return success
  }

  return {
    settings,
    loading,
    accountId,
    updateIntegration,
    getIntegration,
    getIntegrationsByType,
    testIntegration,
    addIntegration,
    removeIntegration
  }
}
