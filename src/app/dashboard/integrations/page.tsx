//file path: src/app/dashboard/integrations/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useIntegrations } from './hooks/useIntegrations'
import { useOAuthCallbacks } from './hooks/useOAuthCallbacks'
import { useIntegrationHandlers } from './hooks/useIntegrationHandlers'
import { useIntegrationModals } from './hooks/useIntegrationModals'
import IntegrationCard from './components/IntegrationCard'
import USPSConfigModal from './components/USPSConfigModal'
import UPSConfigModal from './components/UPSConfigModal'
import ShopifyConfigModal from './components/ShopifyConfigModal'
import StoreSelector from './components/StoreSelector'
import BrowseIntegrationsModal from './components/BrowseIntegrationsModal'
import { Integration } from './types/integrationTypes'
import { getStoresFromStorage } from '../../../app/dashboard/stores/utils/storeStorage'
import Notification from '@/app/dashboard/shared/components/Notification'

function IntegrationsContent() {
  const searchParams = useSearchParams()

  // Core integration state
  const { settings, loading, updateIntegration, testIntegration, addIntegration, removeIntegration, accountId } = useIntegrations()

  // Store state
  const [stores, setStores] = useState<any[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message?: string
  }>({
    show: false,
    type: 'success',
    title: ''
  })

  // Test results state
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } | null }>({})
  const [testingId, setTestingId] = useState<string | null>(null)

  // ✅ NEW: Syncing state
  const [syncingId, setSyncingId] = useState<string | null>(null)

  // Modal management hook
  const {
    selectedIntegration,
    showShopifyModal,
    showUspsModal,
    showUpsModal,
    showBrowseModal,
    setSelectedIntegration,
    setShowShopifyModal,
    setShowUspsModal,
    setShowUpsModal,
    setShowBrowseModal,
    openConfigModal,
    handleConfigureClick
  } = useIntegrationModals()

  // OAuth callbacks hook
  useOAuthCallbacks({
    settings,
    selectedStoreId,
    stores,
    updateIntegration,
    addIntegration,
    setNotification,
    setTestResults
  })

  // Integration handlers hook
  const { handleSaveShopify, handleSaveUsps, handleSaveUps } = useIntegrationHandlers({
    settings,
    selectedStoreId,
    accountId,
    updateIntegration,
    addIntegration,
    setNotification,
    setShowShopifyModal,
    setShowUspsModal,
    setShowUpsModal
  })

  // Load stores on mount
  useEffect(() => {
    const loadedStores = getStoresFromStorage()
    setStores(loadedStores)

    // ✅ FIX: Check for store ID from OAuth callbacks
    const storeParam = searchParams.get('store')
    const upsStoreId = searchParams.get('ups_store_id')
    const shopifyStoreId = searchParams.get('store_id')

    // Priority order: explicit store param > OAuth callback store > default to first store
    const targetStoreId = storeParam || upsStoreId || shopifyStoreId

    if (targetStoreId && loadedStores.some(s => s.id === targetStoreId)) {
      console.log('[Integrations Page] Setting selected store from URL:', targetStoreId)
      setSelectedStoreId(targetStoreId)
    } else if (loadedStores.length > 0 && !selectedStoreId) {
      console.log('[Integrations Page] Defaulting to first store:', loadedStores[0].id)
      setSelectedStoreId(loadedStores[0].id)
    }
  }, [searchParams])

  // Handle store change
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId)
  }

  // Get selected store name
  const getSelectedStoreName = () => {
    if (!selectedStoreId) return ''
    const store = stores.find(s => s.id === selectedStoreId)
    return store?.name || store?.storeName || store?.companyName || ''
  }

  // Filter integrations by selected store
  const filteredIntegrations = selectedStoreId
    ? settings.integrations.filter((i: Integration) => i.storeId === selectedStoreId)
    : settings.integrations

  // Separate integrations by type
  const shippingIntegrations = filteredIntegrations.filter((i: Integration) => i.type === 'shipping')
  const ecommerceIntegrations = filteredIntegrations.filter((i: Integration) => i.type === 'ecommerce')

  // Calculate stats
  const connectedCount = filteredIntegrations.filter((i: Integration) => i.status === 'connected').length
  const disconnectedCount = filteredIntegrations.filter((i: Integration) => i.status === 'disconnected').length
  const needsAttentionCount = filteredIntegrations.filter((i: Integration) => i.status === 'error').length

  // Handle adding integration from browse modal
  const handleAddIntegration = (integrationId: string) => {
    if (!selectedStoreId) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Store Required',
        message: 'Please select a store before adding an integration.'
      })
      return
    }

    const comingSoonIntegrations = ['woocommerce', 'etsy', 'ebay', 'walmart', 'fedex', 'dhl']

    if (comingSoonIntegrations.includes(integrationId)) {
      setNotification({
        show: true,
        type: 'info',
        title: 'Coming Soon',
        message: 'This integration is coming soon!'
      })
      setShowBrowseModal(false)
      return
    }

    setShowBrowseModal(false)
    setTimeout(() => openConfigModal(integrationId), 200)
  }

  // Handle toggle enabled
  const handleToggleEnabled = (integration: Integration) => {
    updateIntegration(integration.id, { enabled: !integration.enabled })

    setNotification({
      show: true,
      type: 'info',
      title: integration.enabled ? 'Integration Disabled' : 'Integration Enabled',
      message: `${integration.name} has been ${integration.enabled ? 'disabled' : 'enabled'}.`
    })
  }

  // Handle disconnect
  const handleDisconnect = (integration: Integration) => {
    updateIntegration(integration.id, {
      status: 'disconnected',
      enabled: false,
      config: integration.type === 'shipping' ? {
        ...(integration.config as any),
        accessToken: undefined,
        tokenExpiry: undefined
      } : integration.config
    })

    setNotification({
      show: true,
      type: 'info',
      title: 'Integration Disconnected',
      message: `${integration.name} has been disconnected.`
    })
  }

  // Handle test
  const handleTest = async (integration: Integration): Promise<boolean> => {
    setTestingId(integration.id)
    setTestResults(prev => ({ ...prev, [integration.id]: null }))

    try {
      const result = await testIntegration(integration.id)
      setTestResults(prev => ({
        ...prev,
        [integration.id]: result
      }))

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          [integration.id]: null
        }))
      }, 5000)

      return result.success
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [integration.id]: { success: false, message: 'Test failed' }
      }))

      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          [integration.id]: null
        }))
      }, 5000)

      return false
    } finally {
      setTestingId(null)
    }
  }

  // ✅ Simplified - no need for fresh reads
  const handleShopifySync = async (onProgress?: (stage: 'starting' | 'products' | 'orders' | 'complete') => void) => {
    const shopifyIntegration = settings.integrations.find(
      (i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId
    )

    if (!shopifyIntegration) {
      throw new Error('Shopify integration not found')
    }

    setSyncingId(shopifyIntegration.id)

    try {
      console.log('[handleShopifySync] Starting Shopify sync...')

      // Stage 1: Starting
      onProgress?.('starting')

      // Get the store warehouse
      const store = stores.find((s: any) => s.id === selectedStoreId)
      const warehouseId = store?.warehouseConfig?.defaultWarehouseId

      if (!warehouseId) {
        throw new Error('No warehouse configured for this store')
      }

      // Dynamically import ShopifyService
      const { ShopifyService } = await import('@/lib/shopify/shopifyService')

      console.log('[handleShopifySync] Starting sync for store:', selectedStoreId, 'warehouse:', warehouseId)

      // Show initial notification
      setNotification({
        show: true,
        type: 'info',
        title: 'Sync Started',
        message: 'Synchronizing orders and products from Shopify...'
      })

      // Stage 2: Syncing products
      onProgress?.('products')

      // Small delay to show the progress
      await new Promise(resolve => setTimeout(resolve, 800))

      // Stage 3: Syncing orders
      onProgress?.('orders')

      // Trigger sync with the integration we already have
      await ShopifyService.autoSyncOnConnection(
        shopifyIntegration as any,
        warehouseId,
        accountId,
        (message) => {
          console.log('[Shopify Sync]', message)
        }
      )

      // Update integration
      updateIntegration(shopifyIntegration.id, {
        lastSyncAt: new Date().toISOString()
      })

      console.log('[handleShopifySync] ✅ Sync completed successfully')

      // Stage 4: Complete
      onProgress?.('complete')

      setNotification({
        show: true,
        type: 'success',
        title: 'Sync Complete',
        message: '✅ Successfully synced orders and products from Shopify'
      })
    } catch (error: any) {
      console.error('[handleShopifySync] Error:', error)

      setNotification({
        show: true,
        type: 'error',
        title: 'Sync Failed',
        message: error.message || 'Failed to sync Shopify data. Please try again.'
      })
      throw error
    } finally {
      setSyncingId(null)
    }
  }

  const createModalTestHandler = (integration: Integration) => {
    return async (): Promise<{ success: boolean; message: string }> => {
      try {
        const result = await testIntegration(integration.id)
        return {
          success: result.success,
          message: result.success
            ? ` ${integration.name} connection test successful!`
            : ` ${integration.name} connection test failed. Please check your credentials.`
        }
      } catch (error) {
        console.error('Test connection error:', error)
        return {
          success: false,
          message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  // Handle delete
  const handleDelete = (integration: Integration) => {
    removeIntegration(integration.id)

    setNotification({
      show: true,
      type: 'success',
      title: 'Integration Deleted',
      message: `${integration.name} has been removed.`
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with Browse Button */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Integrations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Connect your tools and services to streamline your workflow
          </p>
        </div>
        {selectedStoreId && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => setShowBrowseModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Browse Integrations
            </button>
          </div>
        )}
      </div>

      {/* Store Selector - Matching Orders Page Layout */}
      {stores.length > 0 && (
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Store</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedStoreId && getSelectedStoreName()
                    ? `Showing integrations for ${getSelectedStoreName()}`
                    : 'Select a store to view integrations'
                  }
                </p>
              </div>
              <div className="w-64">
                <StoreSelector
                  stores={stores}
                  selectedStoreId={selectedStoreId}
                  onStoreChange={handleStoreChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Store Selected */}
      {!selectedStoreId && stores.length > 0 && (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              Please select a store to view and manage integrations.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {selectedStoreId && filteredIntegrations.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
          {/* Connected */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Connected</dt>
                    <dd className="text-lg font-semibold text-gray-900">{connectedCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Disconnected */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Disconnected</dt>
                    <dd className="text-lg font-semibold text-gray-900">{disconnectedCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Needs Attention</dt>
                    <dd className="text-lg font-semibold text-gray-900">{needsAttentionCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E-commerce Platforms Section */}
      {selectedStoreId && ecommerceIntegrations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            E-commerce Platforms
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ecommerceIntegrations.map((integration) => (
              <div key={integration.id}>
                <IntegrationCard
                  integration={integration}
                  onConfigure={() => handleConfigureClick(integration)}
                  onToggle={() => handleToggleEnabled(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                  onTest={() => handleTest(integration)}
                  onDelete={() => handleDelete(integration)}
                  isTesting={testingId === integration.id}
                  storeName={stores.find(s => s.id === integration.storeId)?.name}
                />

                {/* ✅ TEST RESULTS DISPLAY */}
                {testResults[integration.id] && (
                  <div
                    className={`mt-2 px-4 py-2 rounded-md text-sm font-medium ${
                      testResults[integration.id]?.success
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {testResults[integration.id]?.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shipping Carriers Section */}
      {selectedStoreId && shippingIntegrations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Shipping & Logistics
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shippingIntegrations.map((integration) => (
              <div key={integration.id}>
                <IntegrationCard
                  integration={integration}
                  onConfigure={() => handleConfigureClick(integration)}
                  onToggle={() => handleToggleEnabled(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                  onTest={() => handleTest(integration)}
                  onDelete={() => handleDelete(integration)}
                  isTesting={testingId === integration.id}
                  storeName={stores.find(s => s.id === integration.storeId)?.name}
                />

                {/* ✅ TEST RESULTS DISPLAY */}
                {testResults[integration.id] && (
                  <div
                    className={`mt-2 px-4 py-2 rounded-md text-sm font-medium ${
                      testResults[integration.id]?.success
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {testResults[integration.id]?.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Integrations */}
      {selectedStoreId && filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No integrations</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first integration.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowBrowseModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Integration
            </button>
          </div>
        </div>
      )}

      {/* Browse Integrations Modal */}
      <BrowseIntegrationsModal
        isOpen={showBrowseModal}
        onClose={() => setShowBrowseModal(false)}
        onAddIntegration={handleAddIntegration}
        existingIntegrationIds={filteredIntegrations.map((i: Integration) => i.name.toLowerCase())}
        selectedStoreId={selectedStoreId}
      />

      {/* USPS Config Modal */}
      <USPSConfigModal
        isOpen={showUspsModal}
        onClose={() => setShowUspsModal(false)}
        integration={
          settings.integrations.find((i: Integration) => i.name === 'USPS' && i.storeId === selectedStoreId) || {
            id: `usps-${selectedStoreId}-new`,
            name: 'USPS',
            type: 'shipping',
            status: 'disconnected',
            enabled: false,
            storeId: selectedStoreId,
            config: {
              consumerKey: '',
              consumerSecret: '',
              environment: 'sandbox',
              apiUrl: 'https://apis-tem.usps.com'
            }
          } as any
        }
        onSave={(id, config) => handleSaveUsps({ config })}
        selectedStoreId={selectedStoreId}
        onTest={() => createModalTestHandler(settings.integrations.find((i: Integration) => i.name === 'USPS' && i.storeId === selectedStoreId)!)()}
        isTesting={testingId === settings.integrations.find((i: Integration) => i.name === 'USPS' && i.storeId === selectedStoreId)?.id}
      />

      {/* UPS Config Modal */}
      <UPSConfigModal
        isOpen={showUpsModal}
        onClose={() => setShowUpsModal(false)}
        integration={
          settings.integrations.find((i: Integration) => i.name === 'UPS' && i.storeId === selectedStoreId) || {
            id: `ups-${selectedStoreId}-new`,
            name: 'UPS',
            type: 'shipping',
            status: 'disconnected',
            enabled: false,
            storeId: selectedStoreId,
            config: {
              accountNumber: '',
              environment: 'sandbox',
              apiUrl: 'https://wwwcie.ups.com'
            }
          } as any
        }
        onSave={(id, config) => handleSaveUps({ config })}
        onTest={() => createModalTestHandler(
          settings.integrations.find((i: Integration) => i.name === 'UPS' && i.storeId === selectedStoreId)!
        )()}
        isTesting={testingId === settings.integrations.find((i: Integration) => i.name === 'UPS' && i.storeId === selectedStoreId)?.id}
      />

      {/* Shopify Config Modal */}
      <ShopifyConfigModal
        isOpen={showShopifyModal}
        onClose={() => setShowShopifyModal(false)}
        onSave={handleSaveShopify}
        existingIntegration={
          settings.integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId) as any
        }
        selectedStoreId={selectedStoreId}
        onTest={() => createModalTestHandler(
          settings.integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)!
        )()}
        isTesting={testingId === settings.integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)?.id}
        onSync={handleShopifySync}
        isSyncing={syncingId === settings.integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)?.id}
      />

      {/* Notification */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <IntegrationsContent />
    </Suspense>
  )
}
