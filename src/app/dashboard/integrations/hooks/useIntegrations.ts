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
        console.log(`[smartMergeBoxes] ⚠️  Skipping API box "${apiBox.name}" - user has customized version`)
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

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        console.log('[useIntegrations] Synced', servicesData.count, 'services from API')

        // Apply smart merge to all warehouses
        warehouses.forEach((warehouse: any) => {
          smartMergeServices(warehouse.id, servicesData.services)
        })
      } else {
        console.error('[useIntegrations] Services sync failed:', await servicesResponse.text())
      }

      // Sync boxes
      console.log('[useIntegrations] Syncing boxes...')
      const boxesResponse = await fetch('/api/shipping/boxes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: ['USPS'],
          credentials: {
            consumerKey: config.consumerKey,
            consumerSecret: config.consumerSecret,
            environment: config.environment
          }
        })
      })

      if (boxesResponse.ok) {
        const boxesData = await boxesResponse.json()
        console.log('[useIntegrations] Synced', boxesData.count, 'boxes from API')

        // Apply smart merge to all warehouses
        warehouses.forEach((warehouse: any) => {
          smartMergeBoxes(warehouse.id, boxesData.boxes)
        })
      } else {
        console.error('[useIntegrations] Boxes sync failed:', await boxesResponse.text())
      }

      console.log('[useIntegrations] Auto-sync complete!')

    } catch (error) {
      console.error('[useIntegrations] Auto-sync failed:', error)
    }
  }

  const updateIntegration = (integrationId: string, updates: Partial<Integration>) => {
    const newSettings = {
      ...settings,
      integrations: settings.integrations.map(integration => {
        if (integration.id === integrationId) {
          return { ...integration, ...updates } as Integration
        }
        return integration
      })
    }

    // Auto-sync boxes when USPS integration is saved with credentials
    if (integrationId === 'usps' && updates.config) {
      // Type guard: check if this is a USPS config
      const config = updates.config
      if ('consumerKey' in config && 'consumerSecret' in config) {
        const uspsConfig = config as {
          consumerKey: string
          consumerSecret: string
          environment: 'sandbox' | 'production'
          apiUrl: string
        }

        // Only sync if we have valid credentials
        if (uspsConfig.consumerKey && uspsConfig.consumerSecret) {
          console.log('[useIntegrations] USPS integration saved, triggering auto-sync...')

          // Run sync asynchronously
          setTimeout(async () => {
            try {
              const response = await fetch('/api/shipping/boxes/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  carriers: ['USPS'],
                  credentials: {
                    consumerKey: uspsConfig.consumerKey,
                    consumerSecret: uspsConfig.consumerSecret,
                    environment: uspsConfig.environment,
                    apiUrl: uspsConfig.apiUrl
                  }
                })
              })

              if (response.ok) {
                const data = await response.json()
                console.log(`[useIntegrations] ✅ Auto-synced ${data.count} USPS boxes`)

                if (data.boxes && data.boxes.length > 0) {
                  const existingBoxes = localStorage.getItem('shipping_boxes')
                  const parsed = existingBoxes ? JSON.parse(existingBoxes) : []
                  const customBoxes = parsed.filter((box: any) => box.boxType === 'custom')
                  const updated = [...customBoxes, ...data.boxes]

                  localStorage.setItem('shipping_boxes', JSON.stringify(updated))
                  console.log('[useIntegrations] ✅ Boxes stored in localStorage')
                }
              } else {
                console.warn('[useIntegrations] Failed to auto-sync boxes:', await response.text())
              }
            } catch (error) {
              console.error('[useIntegrations] Error auto-syncing boxes:', error)
            }
          }, 500)
        }
      }
    }

    return saveSettings(newSettings)
  }

  const getIntegration = (integrationId: string): Integration | undefined => {
    return settings.integrations.find(i => i.id === integrationId)
  }

  const getIntegrationsByType = (type: Integration['type']): Integration[] => {
    return settings.integrations.filter(i => i.type === type)
  }

  const testIntegration = async (integrationId: string): Promise<boolean> => {
    const integration = getIntegration(integrationId)
    if (!integration) return false

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
        return response.ok
      } catch (error) {
        console.error('USPS integration test failed:', error)
        return false
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
        return response.ok
      } catch (error) {
        console.error('UPS integration test failed:', error)
        return false
      }
    }

    // Handle Shopify integration test
    if (integration.name === 'Shopify' && integration.type === 'ecommerce') {
      try {
        console.log('[testIntegration] Testing Shopify connection...')

        // Type assertion: We know this is a Shopify integration
        const shopifyIntegration = integration as ShopifyIntegration

        const response = await fetch('/api/integrations/shopify/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopUrl: shopifyIntegration.config.shopUrl,
            accessToken: shopifyIntegration.config.accessToken
          })
        })

        const data = await response.json()
        console.log('[testIntegration] Shopify test result:', data)

        return data.success === true
      } catch (error) {
        console.error('Shopify integration test failed:', error)
        return false
      }
    }

    // Handle WooCommerce integration test (if you add it later)
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
        return data.success === true
      } catch (error) {
        console.error('WooCommerce integration test failed:', error)
        return false
      }
    }

    // Handle Etsy integration test (if you add it later)
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
            shopId: etsyIntegration.config.shopId
          })
        })

        const data = await response.json()
        return data.success === true
      } catch (error) {
        console.error('Etsy integration test failed:', error)
        return false
      }
    }

    // Unsupported integration type
    console.warn(`Test not implemented for integration: ${integration.name}`)
    return false
  }

  const addIntegration = (integration: Integration) => {
    const newSettings = {
      ...settings,
      integrations: [...settings.integrations, integration],
      lastUpdated: new Date().toISOString()
    }

    const success = saveSettings(newSettings)

    if (success) {
      // ✅ Update local state immediately
      setSettings(newSettings)
    }

    return success
  }

  const removeIntegration = (integrationId: string, storeId?: string) => {
    const newSettings = {
      ...settings,
      integrations: settings.integrations.filter(i => {
        // ✅ If storeId provided, only remove integration for THAT store
        if (storeId) {
          return !(i.id === integrationId && i.storeId === storeId)
        }
        // Otherwise remove all instances (fallback)
        return i.id !== integrationId
      }),
      lastUpdated: new Date().toISOString()
    }
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
    accountId, // Changed from userId
    updateIntegration,
    getIntegration,
    getIntegrationsByType,
    testIntegration,
    addIntegration,
    removeIntegration
  }
}
