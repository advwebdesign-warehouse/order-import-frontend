//file path: src/app/dashboard/integrations/hooks/useIntegrationHandlers.tsx

'use client'

import { IntegrationFactory } from '@/lib/integrations/integrationFactory'
import { Integration, ShopifyIntegration, USPSIntegration, UPSIntegration } from '../types/integrationTypes'

// ✅ FIXED: Updated interface with proper Integration import
interface UseIntegrationHandlersProps {
  accountId: string
  integrations: Integration[]
  selectedStoreId: string
  updateIntegration: (id: string, data: Partial<Integration>) => void
  addIntegration: (integration: any) => void
  setNotification: (notification: any) => void
  setShowShopifyModal: (show: boolean) => void
  setShowUspsModal: (show: boolean) => void
  setShowUpsModal: (show: boolean) => void
}

export function useIntegrationHandlers({
  accountId,
  integrations,
  selectedStoreId,
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

    // Use integrations array directly
    const existingIntegration = integrations.find(
      (i: Integration) => i.name === integrationName && i.storeId === selectedStoreId
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
          } as any // ✅ Type assertion to handle dynamic config clearing
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
        id: `${integrationName.toLowerCase()}-${selectedStoreId}`,
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
  const handleSaveShopify = async (data: Partial<ShopifyIntegration>): Promise<void> => {
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
