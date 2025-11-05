//file path: src/app/dashboard/integrations/hooks/useIntegrationHandlers.tsx

'use client'

import { IntegrationFactory } from '@/lib/integrations/integrationFactory'
import { ShopifyIntegration, USPSIntegration, UPSIntegration } from '../types/integrationTypes'

interface UseIntegrationHandlersProps {
  settings: any
  selectedStoreId: string
  accountId: string
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
  accountId,
  updateIntegration,
  addIntegration,
  setNotification,
  setShowShopifyModal,
  setShowUspsModal,
  setShowUpsModal
}: UseIntegrationHandlersProps) {

  /**
   * Generic save handler using factory pattern
   * Works with ANY integration type
   */
  const handleSaveIntegration = (
    integrationName: string,
    data: any,
    modalSetter: (show: boolean) => void
  ) => {
    const timestamp = Date.now()

    const existingIntegration = settings.integrations.find(
      (i: any) => i.name === integrationName && i.storeId === selectedStoreId
    )

    const isDisconnecting = data.status === 'disconnected'

    if (existingIntegration) {
      console.log(`[handleSaveIntegration] ${isDisconnecting ? 'Disconnecting' : 'Updating'} ${integrationName}`)

      if (isDisconnecting) {
        // For disconnect, clear sensitive data
        updateIntegration(existingIntegration.id, {
          status: 'disconnected',
          enabled: false,
          config: {
            ...existingIntegration.config,
            ...Object.keys(existingIntegration.config).reduce((acc, key) => {
              // Clear sensitive fields
              if (key.includes('token') || key.includes('key') || key.includes('secret')) {
                acc[key] = ''
              }
              return acc
            }, {} as Record<string, any>)
          }
        })
      } else {
        // For normal updates
        updateIntegration(existingIntegration.id, {
          status: 'connected',
          enabled: true,
          ...data,
        })
      }
    } else {
      if (isDisconnecting) {
        console.warn(`[handleSaveIntegration] Attempted to disconnect non-existent ${integrationName}`)
        return
      }

      console.log(`[handleSaveIntegration] Creating new ${integrationName} integration`)

      // Create new integration
      const newIntegration = {
        id: `${integrationName.toLowerCase()}-${selectedStoreId}-${timestamp}`,
        name: integrationName,
        storeId: selectedStoreId,
        accountId: accountId,
        status: 'connected',
        enabled: true,
        connectedAt: new Date().toISOString(),
        ...data,
      }

      addIntegration(newIntegration)
    }

    modalSetter(false)

    // Show notification
    setNotification({
      show: true,
      type: 'success',
      title: isDisconnecting ? `${integrationName} Disconnected` : `${integrationName} Connected`,
      message: isDisconnecting
        ? `${integrationName} integration has been disconnected.`
        : `${integrationName} integration successfully connected!`
    })
  }

  /**
   * Test integration connection using factory
   */
  const testIntegration = async (integrationData: any) => {
    try {
      console.log(`[testIntegration] Testing ${integrationData.name}...`)

      // Create integration instance using factory
      const integration = IntegrationFactory.create({
        ...integrationData,
        accountId: accountId
      })

      if (!integration) {
        return {
          success: false,
          error: `${integrationData.name} integration not supported yet`
        }
      }

      // Test connection
      const result = await integration.testConnection()

      console.log(`[testIntegration] ${integrationData.name} test result:`, result)

      return result
    } catch (error: any) {
      console.error(`[testIntegration] ${integrationData.name} test failed:`, error)
      return {
        success: false,
        error: error.message || 'Connection test failed'
      }
    }
  }

  // Specific handlers for backward compatibility
  const handleSaveShopify = (data: Partial<ShopifyIntegration>) => {
    handleSaveIntegration('Shopify', data, setShowShopifyModal)
  }

  const handleSaveUsps = (data: Partial<USPSIntegration>) => {
    handleSaveIntegration('USPS', data, setShowUspsModal)
  }

  const handleSaveUps = (data: Partial<UPSIntegration>) => {
    handleSaveIntegration('UPS', data, setShowUpsModal)
  }

  return {
    handleSaveIntegration,
    testIntegration,
    handleSaveShopify,
    handleSaveUsps,
    handleSaveUps
  }
}
