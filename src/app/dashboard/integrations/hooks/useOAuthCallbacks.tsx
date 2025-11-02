//file path: src/app/dashboard/integrations/hooks/useOAuthCallbacks.tsx

'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Integration, UPSIntegration, ShopifyIntegration } from '../types/integrationTypes'
import { getCurrentAccountId, getAccountIntegrations } from '@/lib/storage/integrationStorage'

interface UseOAuthCallbacksProps {
  settings: any
  selectedStoreId: string
  stores: any[] // ✅ ADD: Pass stores from parent
  updateIntegration: (id: string, data: any) => void
  addIntegration: (integration: Integration) => boolean
  setNotification: (notification: any) => void
  setTestResults: (fn: (prev: any) => any) => void
}

export function useOAuthCallbacks({
  settings,
  selectedStoreId,
  stores,
  updateIntegration,
  addIntegration,
  setNotification,
  setTestResults
}: UseOAuthCallbacksProps) {
  const searchParams = useSearchParams()

  // ✅ Refs for callback protection
  const upsCallbackProcessed = useRef(false)
  const shopifyCallbackProcessed = useRef(false)

  // UPS OAuth Callback
  useEffect(() => {
    // Skip if already processed
    if (upsCallbackProcessed.current) {
      return
    }

    const upsSuccess = searchParams.get('ups_success')
    const upsAccount = searchParams.get('ups_account')
    const upsEnv = searchParams.get('ups_env')
    const upsAccessToken = searchParams.get('ups_access_token')
    const upsRefreshToken = searchParams.get('ups_refresh_token')
    const upsExpiresIn = searchParams.get('ups_expires_in')
    const upsStoreId = searchParams.get('ups_store_id')
    const upsError = searchParams.get('ups_error')
    const upsErrorDescription = searchParams.get('ups_error_description')

    // Only process if UPS OAuth params present
    if (!upsSuccess && !upsError) {
      return
    }

    // Mark as processed immediately
    upsCallbackProcessed.current = true

    if (upsError) {
      console.error('[UPS OAuth] Error:', upsError, upsErrorDescription)
      setNotification({
        show: true,
        type: 'error',
        title: 'UPS Connection Failed',
        message: upsErrorDescription || upsError
      })
      window.history.replaceState({}, '', '/dashboard/integrations')
      setTimeout(() => {
        upsCallbackProcessed.current = false
      }, 1000)
      return
    }

    // ✅ FIX: Validate we have the storeId from URL params
    if (upsSuccess && upsAccessToken && upsRefreshToken && upsAccount && upsEnv && upsStoreId) {
      console.log('[UPS OAuth] ✅ Connection successful, saving integration...')
      console.log('[UPS OAuth] Using store ID from URL:', upsStoreId)

      const upsIntegration = settings.integrations.find(
        (i: Integration) => i.name === 'UPS' && i.storeId === upsStoreId
      )

      console.log('[UPS OAuth] Found existing integration:', upsIntegration ? 'YES' : 'NO')

      const integrationData = {
        config: {
          accountNumber: upsAccount,
          accessToken: upsAccessToken,
          refreshToken: upsRefreshToken,
          tokenExpiry: new Date(Date.now() + parseInt(upsExpiresIn || '3600') * 1000).toISOString(),
          environment: upsEnv as 'sandbox' | 'production',
          apiUrl: upsEnv === 'production'
            ? 'https://onlinetools.ups.com'
            : 'https://wwwcie.ups.com'
        },
        status: 'connected' as const,
        enabled: true,
        connectedAt: new Date().toISOString()
      }

      if (upsIntegration) {
        console.log('[UPS OAuth] Updating existing integration:', upsIntegration.id)
        updateIntegration(upsIntegration.id, integrationData)
      } else {
        console.log('[UPS OAuth] Creating new integration for store:', upsStoreId)
        const newIntegration: UPSIntegration = {
          id: `ups-${upsStoreId}-${Date.now()}`,
          name: 'UPS',
          type: 'shipping',
          storeId: upsStoreId,
          description: 'Generate shipping labels, calculate rates, and track packages with UPS',
          icon: '/logos/ups-logo.svg',
          features: {
            labelGeneration: true,
            rateCalculation: true,
            addressValidation: true,
            tracking: true,
            pickupScheduling: true
          },
          ...integrationData
        }
        const success = addIntegration(newIntegration)
        console.log('[UPS OAuth] Add integration result:', success ? 'SUCCESS' : 'FAILED')
      }

      setNotification({
        show: true,
        type: 'success',
        title: 'UPS Connected',
        message: 'UPS integration connected successfully!'
      })

      setTestResults(prev => ({
        ...prev,
        ups: { success: true, message: '✅ UPS connected successfully!' }
      }))

      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          ups: null
        }))
      }, 5000)

      console.log('[UPS OAuth] ✅ Integration setup complete!')
      window.history.replaceState({}, '', '/dashboard/integrations')
      setTimeout(() => {
        upsCallbackProcessed.current = false
      }, 1000)
    } else if (upsSuccess) {
      // ✅ FIX: Handle case where storeId is missing
      console.error('[UPS OAuth] ❌ Missing required parameters (possibly storeId)')
      setNotification({
        show: true,
        type: 'error',
        title: 'UPS Connection Failed',
        message: 'Missing store information. Please try again.'
      })
      window.history.replaceState({}, '', '/dashboard/integrations')
      setTimeout(() => {
        upsCallbackProcessed.current = false
      }, 1000)
    }
  }, [searchParams, settings, updateIntegration, addIntegration, setNotification, setTestResults])

  // ✅ UPDATED: Shopify OAuth callback with automatic sync
  useEffect(() => {
    // Skip if already processed
    if (shopifyCallbackProcessed.current) {
      return
    }

    const shopifyAuth = searchParams.get('shopify_auth')
    const shop = searchParams.get('shop')
    const accessToken = searchParams.get('access_token')
    const storeIdParam = searchParams.get('store_id')
    const errorParam = searchParams.get('error')

    // Only process if we have OAuth params
    if (!shopifyAuth && !errorParam) {
      return
    }

    // Mark as processed immediately to prevent duplicates
    shopifyCallbackProcessed.current = true

    // Handle error
    if (shopifyAuth === 'error' || errorParam) {
      console.error('[Shopify OAuth] Error:', errorParam)
      setNotification({
        show: true,
        type: 'error',
        title: 'Shopify Connection Failed',
        message: errorParam || 'Failed to connect to Shopify'
      })
      window.history.replaceState({}, '', '/dashboard/integrations')
      setTimeout(() => {
        shopifyCallbackProcessed.current = false
      }, 1000)
      return
    }

    // Handle success
    if (shopifyAuth === 'success' && shop && accessToken) {
      console.log('[Shopify OAuth] ✅ Connection successful, saving integration...')

      const integrationStoreId = storeIdParam || selectedStoreId

      if (!integrationStoreId) {
        console.error('[Shopify OAuth] No store ID available')
        setNotification({
          show: true,
          type: 'error',
          title: 'Store Required',
          message: 'Please select a store before connecting Shopify'
        })
        window.history.replaceState({}, '', '/dashboard/integrations')
        setTimeout(() => {
          shopifyCallbackProcessed.current = false
        }, 1000)
        return
      }

      // Read fresh data from localStorage
      const aid = getCurrentAccountId()
      const freshSettings = getAccountIntegrations(aid) || settings

      // Check if integration already exists
      const existingIntegration = freshSettings.integrations.find(
        (i: Integration) => i.name === 'Shopify' && i.storeId === integrationStoreId
      )

      let integrationId: string

      if (existingIntegration) {
        // Update existing integration
        updateIntegration(existingIntegration.id, {
          config: {
            storeUrl: shop,
            accessToken: accessToken,
          },
          status: 'connected',
          enabled: true,
          connectedAt: new Date().toISOString()
        })
        integrationId = existingIntegration.id
        console.log('[Shopify OAuth] Updated existing integration:', integrationId)
      } else {
        // Create new integration
        const timestamp = Date.now()
        integrationId = `shopify-${integrationStoreId}-${timestamp}`

        const newIntegration: ShopifyIntegration = {
          id: integrationId,
          name: 'Shopify',
          type: 'ecommerce',
          status: 'connected',
          enabled: true,
          storeId: integrationStoreId,
          description: 'Sync orders, products, and inventory with your Shopify store',
          icon: '/logos/shopify-logo.svg',
          config: {
            storeUrl: shop,
            accessToken: accessToken,
          },
          connectedAt: new Date().toISOString(),
          features: {
            orderSync: true,
            productSync: true,
            inventorySync: true,
            fulfillmentSync: true,
          }
        }

        addIntegration(newIntegration)
        console.log('[Shopify OAuth] Created new integration:', integrationId)
      }

      // ✅ NEW: Show initial success notification
      setNotification({
        show: true,
        type: 'success',
        title: 'Shopify Connected',
        message: `Successfully connected to ${shop}. Starting automatic sync...`
      })

      // ✅ NEW: Trigger automatic sync in background
      setTimeout(async () => {
        try {
          // Dynamically import the service (avoid SSR issues)
          const { ShopifyService } = await import('@/lib/shopify/shopifyService')

          // Get the store name
          const store = stores.find((s: any) => s.id === integrationStoreId)
          const storeName = store?.name || store?.storeName || 'Unknown Store'
          const warehouseId  = store?.warehouseConfig?.defaultWarehouseId

          // Get the integration
          const integration = (freshSettings.integrations.find(
            (i: Integration) => i.id === integrationId
          ) || {
            id: integrationId,
            config: { storeUrl: shop, accessToken: accessToken },
            storeId: integrationStoreId
          }) as any

          // Trigger auto-sync
          await ShopifyService.autoSyncOnConnection(
            integration,
            storeName,
            warehouseId,
            aid,
            (message) => {
              console.log('[Auto-Sync]', message)
            }
          )

          // Update integration with lastSyncAt
          updateIntegration(integrationId, {
            lastSyncAt: new Date().toISOString()
          })

          // Show final success notification
          setNotification({
            show: true,
            type: 'success',
            title: 'Sync Complete',
            message: '✅ Successfully synced orders and products from Shopify'
          })
        } catch (error: any) {
          console.error('[Auto-Sync] Error:', error)
          setNotification({
            show: true,
            type: 'warning',
            title: 'Sync Incomplete',
            message: 'Connected successfully, but automatic sync encountered issues. Please refresh to sync manually.'
          })
        }
      }, 1000)

      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/integrations')
      console.log('[Shopify OAuth] ✅ Integration setup complete!')

      // Reset processed flag after a delay
      setTimeout(() => {
        shopifyCallbackProcessed.current = false
      }, 1000)
    }
  }, [searchParams, settings, selectedStoreId, stores, updateIntegration, addIntegration, setNotification, setTestResults])

}
