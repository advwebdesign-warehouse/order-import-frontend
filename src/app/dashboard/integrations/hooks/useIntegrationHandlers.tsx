//file path: src/app/dashboard/integrations/hooks/useIntegrationHandlers.tsx

'use client'

import { ShopifyIntegration, USPSIntegration, UPSIntegration } from '../types/integrationTypes'

interface UseIntegrationHandlersProps {
  settings: any
  selectedStoreId: string
  updateIntegration: (id: string, data: any) => void
  addIntegration: (integration: any) => void
  setNotification: (notification: any) => void
  setShowShopifyModal: (show: boolean) => void
  setShowUspsModal: (show: boolean) => void
  setShowUpsModal: (show: boolean) => void
}

export function useIntegrationHandlers({
  settings,
  selectedStoreId,
  updateIntegration,
  addIntegration,
  setNotification,
  setShowShopifyModal,
  setShowUspsModal,
  setShowUpsModal
}: UseIntegrationHandlersProps) {

  // Shopify Save Handler
  const handleSaveShopify = (data: Partial<ShopifyIntegration>) => {
    const timestamp = Date.now()

    const existingShopify = settings.integrations.find(
      (i: any) => i.name === 'Shopify' && i.storeId === selectedStoreId
    )

    // ✅ FIX: Check if this is a disconnect request
    const isDisconnecting = data.status === 'disconnected'

    if (existingShopify) {
      console.log(`[handleSaveShopify] ${isDisconnecting ? 'Disconnecting' : 'Updating'} existing Shopify integration`)

      // ✅ FIX: For disconnect, explicitly set all disconnect properties
      if (isDisconnecting) {
        updateIntegration(existingShopify.id, {
          status: 'disconnected',
          enabled: false,
          config: {
            ...existingShopify.config,
            accessToken: '', // Clear sensitive data
          }
        })
      } else {
        // For normal updates, merge with defaults
        updateIntegration(existingShopify.id, {
          status: 'connected',
          enabled: true,
          ...data,
        })
      }
    } else {
      if (isDisconnecting) {
        console.warn('[handleSaveShopify] Attempted to disconnect non-existent integration')
        return
      }

      console.log('[handleSaveShopify] Creating new Shopify integration')
      const newIntegration: ShopifyIntegration = {
        id: `shopify-${selectedStoreId}-${timestamp}`,
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        enabled: true,
        storeId: selectedStoreId,
        description: 'Sync orders and inventory with your Shopify store',
        icon: '/logos/shopify-logo.svg',
        connectedAt: new Date().toISOString(),
        config: {
          storeUrl: '',
          accessToken: ''
        },
        features: {
          orderSync: true,
          productSync: true,
          inventorySync: true,
          fulfillmentSync: true
        },
        ...data,
      }

      addIntegration(newIntegration)
    }

    setShowShopifyModal(false)

    // ✅ FIX: Show appropriate notification based on action
    setNotification({
      show: true,
      type: 'success',
      title: isDisconnecting ? 'Shopify Disconnected' : 'Shopify Connected',
      message: isDisconnecting
        ? 'Shopify integration has been disconnected.'
        : 'Shopify integration successfully connected!'
    })
  }

  // USPS Save Handler
  const handleSaveUsps = (data: Partial<USPSIntegration>) => {
    const timestamp = Date.now()

    const existingUsps = settings.integrations.find(
      (i: any) => i.name === 'USPS' && i.storeId === selectedStoreId
    )

    // ✅ FIX: Check if this is a disconnect request
    const isDisconnecting = data.status === 'disconnected'

    if (existingUsps) {
      console.log(`[handleSaveUsps] ${isDisconnecting ? 'Disconnecting' : 'Updating'} existing USPS integration`)

      // ✅ FIX: For disconnect, explicitly set all disconnect properties
      if (isDisconnecting) {
        updateIntegration(existingUsps.id, {
          status: 'disconnected',
          enabled: false,
          config: {
            ...existingUsps.config,
            consumerKey: '', // Clear sensitive data
            consumerSecret: '',
          }
        })
      } else {
        updateIntegration(existingUsps.id, {
          status: 'connected',
          enabled: true,
          ...data,
        })
      }
    } else {
      if (isDisconnecting) {
        console.warn('[handleSaveUsps] Attempted to disconnect non-existent integration')
        return
      }

      console.log('[handleSaveUsps] Creating new USPS integration')
      const newIntegration: USPSIntegration = {
        id: `usps-${selectedStoreId}-${timestamp}`,
        name: 'USPS',
        type: 'shipping',
        status: 'connected',
        enabled: true,
        storeId: selectedStoreId,
        description: 'Generate shipping labels, calculate rates, and track packages with USPS',
        icon: '/logos/usps-logo.svg',
        connectedAt: new Date().toISOString(),
        config: {
          consumerKey: '',
          consumerSecret: '',
          environment: 'sandbox',
          apiUrl: 'https://apis-tem.usps.com'
        },
        features: {
          labelGeneration: true,
          rateCalculation: true,
          addressValidation: true,
          tracking: true
        },
        ...data,
      }

      addIntegration(newIntegration)
    }

    setShowUspsModal(false)

    // ✅ FIX: Show appropriate notification based on action
    setNotification({
      show: true,
      type: 'success',
      title: isDisconnecting ? 'USPS Disconnected' : 'USPS Connected',
      message: isDisconnecting
        ? 'USPS integration has been disconnected.'
        : 'USPS integration successfully configured!'
    })
  }

  // UPS Save Handler
  const handleSaveUps = (data: Partial<UPSIntegration>) => {
    const timestamp = Date.now()

    // Check if we have OAuth tokens (meaning OAuth completed successfully)
    const hasOAuthTokens = !!(data.config as any)?.accessToken
    // ✅ FIX: Check if this is a disconnect request
    const isDisconnecting = data.status === 'disconnected'

    const existingUps = settings.integrations.find(
      (i: any) => i.name === 'UPS' && i.storeId === selectedStoreId
    )

    if (existingUps) {
      console.log(`[handleSaveUps] ${isDisconnecting ? 'Disconnecting' : 'Updating'} existing UPS integration`)

      // ✅ FIX: For disconnect, explicitly set all disconnect properties
      if (isDisconnecting) {
        updateIntegration(existingUps.id, {
          status: 'disconnected',
          enabled: false,
          config: {
            ...existingUps.config,
            accessToken: '', // Clear sensitive data
            refreshToken: '',
          }
        })
      } else {
        updateIntegration(existingUps.id, {
          status: hasOAuthTokens ? 'connected' : 'disconnected',
          enabled: hasOAuthTokens,
          ...data,
        })
      }
    } else {
      if (isDisconnecting) {
        console.warn('[handleSaveUps] Attempted to disconnect non-existent integration')
        return
      }

      console.log('[handleSaveUps] Creating new UPS integration')
      const newIntegration: UPSIntegration = {
        id: `ups-${selectedStoreId}-${timestamp}`,
        name: 'UPS',
        type: 'shipping',
        status: hasOAuthTokens ? 'connected' : 'disconnected',
        enabled: false,
        storeId: selectedStoreId,
        description: 'Generate shipping labels, calculate rates, and track packages with UPS',
        icon: '/logos/ups-logo.svg',
        connectedAt: hasOAuthTokens ? new Date().toISOString() : undefined,
        config: {
          accountNumber: '',
          environment: 'sandbox',
          apiUrl: 'https://wwwcie.ups.com'
        },
        features: {
          labelGeneration: true,
          rateCalculation: true,
          addressValidation: true,
          tracking: true,
          pickupScheduling: true
        },
        ...data,
      }

      addIntegration(newIntegration)
    }

    setShowUpsModal(false)

    // ✅ FIX: Show appropriate notification based on action
    if (isDisconnecting) {
      setNotification({
        show: true,
        type: 'success',
        title: 'UPS Disconnected',
        message: 'UPS integration has been disconnected.'
      })
    } else if (hasOAuthTokens) {
      setNotification({
        show: true,
        type: 'success',
        title: 'UPS Connected',
        message: 'UPS integration successfully configured!'
      })
    }
  }

  return {
    handleSaveShopify,
    handleSaveUsps,
    handleSaveUps
  }
}
