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
import { storeApi } from '@/app/services/storeApi'
import { WarehouseAPI } from '@/lib/api/warehouseApi'
import { IntegrationAPI } from '@/lib/api/integrationApi'  // ✅ Import IntegrationAPI
import Notification from '@/app/dashboard/shared/components/Notification'
import WarehouseRequiredWarning from './components/WarehouseRequiredWarning'
import { checkStoreWarehouseById } from './utils/storeWarehouseUtils'
import { withAuth } from '@/app/dashboard/shared/components/withAuth'

// ✅ LocalStorage key for persisting selected store (UI preference only - NOT data)
const SELECTED_STORE_KEY = 'integrations_selected_store_id'

interface IntegrationsContentProps {
  accountId: string // ✅ Now guaranteed to be valid by withAuth
}

function IntegrationsContent({ accountId }: IntegrationsContentProps) {
  const searchParams = useSearchParams()

  // Core integration state - ✅ accountId now comes from props
  const {
    integrations,
    loading: integrationsLoading,
    updateIntegration,
    testIntegration,
    addIntegration,
    removeIntegration,
    error: integrationsError
  } = useIntegrations()

  // Store state
  const [stores, setStores] = useState<any[]>([])
  const [storesLoading, setStoresLoading] = useState(true)
  const [storesError, setStoresError] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [hasWarehouses, setHasWarehouses] = useState<boolean>(true)

  // ✅ Warehouse state
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [warehousesLoading, setWarehousesLoading] = useState(true)
  const [warehousesError, setWarehousesError] = useState<string | null>(null)

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

  // ✅ Syncing state
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

  // ✅ No more accountId validation needed - withAuth guarantees it's valid
  // OAuth callbacks hook
  useOAuthCallbacks({
    accountId, // ✅ No more non-null assertion needed
    integrations,
    selectedStoreId,
    stores,
    updateIntegration,
    addIntegration,
    setNotification,
    setTestResults
  })

  // Integration handlers hook
  const { handleSaveShopify, handleSaveUsps, handleSaveUps } = useIntegrationHandlers({
    accountId, // ✅ No more non-null assertion needed
    integrations,
    selectedStoreId,
    updateIntegration,
    addIntegration,
    setNotification,
    setShowShopifyModal,
    setShowUspsModal,
    setShowUpsModal
  })

  // Load stores from API on mount
  useEffect(() => {
    loadStores()
  }, [])

  // ✅ Load warehouses when accountId is available
  useEffect(() => {
    if (accountId) {
      loadWarehouses()
    }
  }, [accountId])

  /**
   * Load stores from API
   */
  const loadStores = async () => {
    try {
      setStoresLoading(true)
      setStoresError(null)

      console.log('[Integrations Page] 🔄 Loading stores from API...')
      const loadedStores = await storeApi.getStores()

      console.log('[Integrations Page] ✅ Loaded', loadedStores.length, 'stores')
      setStores(loadedStores)

      // Check for store ID from OAuth callbacks or localStorage
      const storeParam = searchParams.get('store')
      const upsStoreId = searchParams.get('ups_store_id')
      const shopifyStoreId = searchParams.get('store_id')
      const storedStoreId = localStorage.getItem(SELECTED_STORE_KEY) // UI preference only

      // Priority order: explicit store param > OAuth callback store > localStorage > default to first store
      const urlStoreId = storeParam || upsStoreId || shopifyStoreId
      const targetStoreId = urlStoreId || storedStoreId

      if (targetStoreId && loadedStores.some(s => s.id === targetStoreId)) {
        console.log('[Integrations Page] Setting selected store:', targetStoreId,
          urlStoreId ? '(from URL)' : storedStoreId ? '(from localStorage)' : '')
        setSelectedStoreId(targetStoreId)
      } else if (loadedStores.length > 0 && !selectedStoreId) {
        console.log('[Integrations Page] Defaulting to first store:', loadedStores[0].id)
        setSelectedStoreId(loadedStores[0].id)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stores'
      console.error('[Integrations Page] ❌ Error loading stores:', errorMessage)
      setStoresError(errorMessage)
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to load stores',
        message: errorMessage
      })
    } finally {
      setStoresLoading(false)
    }
  }

  /**
   * ✅ Load warehouses from API
   */
  const loadWarehouses = async () => {
    try {
      setWarehousesLoading(true)
      setWarehousesError(null)

      console.log('[Integrations Page] 🔄 Loading warehouses from API...')
      const loadedWarehouses = await WarehouseAPI.getAllWarehouses()

      console.log('[Integrations Page] ✅ Loaded', loadedWarehouses.length, 'warehouses')
      setWarehouses(loadedWarehouses)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load warehouses'
      console.error('[Integrations Page] ❌ Error loading warehouses:', errorMessage)
      setWarehousesError(errorMessage)
      // Don't show error notification for warehouses - it's optional
      setWarehouses([])
    } finally {
      setWarehousesLoading(false)
    }
  }

  // ✅ Check warehouses when store changes (async call)
  useEffect(() => {
    if (selectedStoreId) {
      console.log('[Integrations Page] Checking warehouses for store:', selectedStoreId)

      // Make async call to check warehouses
      // API automatically scopes to authenticated user's account
      checkStoreWarehouseById(selectedStoreId).then(check => {
        console.log('[Integrations Page] Warehouse check result:', {
          storeId: selectedStoreId,
          storeName: check.store?.storeName,
          hasWarehouses: check.hasWarehouses,
          hasRegionRouting: check.hasRegionRouting
        })
        setHasWarehouses(check.hasWarehouses)
      }).catch(error => {
        console.error('[Integrations Page] Error checking warehouses:', error)
        setHasWarehouses(true) // Default to true on error
      })
    } else {
      console.log('[Integrations Page] No store selected, defaulting hasWarehouses to true')
      setHasWarehouses(true)
    }
  }, [selectedStoreId])

  // Persist selected store to localStorage whenever it changes
  useEffect(() => {
    if (selectedStoreId) {
      console.log('[Integrations Page] Persisting selected store to localStorage (UI preference):', selectedStoreId)
      localStorage.setItem(SELECTED_STORE_KEY, selectedStoreId)
    }
  }, [selectedStoreId])

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

  // ✅ Filter integrations by selected store using integrations from hook
  const filteredIntegrations = selectedStoreId
    ? integrations.filter((i: Integration) => i.storeId === selectedStoreId)
    : integrations

  // Separate integrations by type
  const shippingIntegrations = filteredIntegrations.filter((i: Integration) => i.type === 'shipping')
  const ecommerceIntegrations = filteredIntegrations.filter((i: Integration) => i.type === 'ecommerce')

  // Calculate stats
  const connectedCount = filteredIntegrations.filter((i: Integration) => i.status === 'connected').length
  const disconnectedCount = filteredIntegrations.filter((i: Integration) => i.status === 'disconnected').length
  const errorCount = filteredIntegrations.filter((i: Integration) => i.status === 'error').length
  const needsAttentionCount = disconnectedCount + errorCount

  // Handler functions
  const handleAddIntegration = (integrationId: string) => {
    console.log('[handleAddIntegration] Opening config for:', integrationId)

    // Open the appropriate configuration modal based on the integration ID
    switch (integrationId.toLowerCase()) {
      case 'shopify':
        setShowShopifyModal(true)
        break
      case 'usps':
        setShowUspsModal(true)
        break
      case 'ups':
        setShowUpsModal(true)
        break
      case 'woocommerce':
      case 'etsy':
      case 'ebay':
        // For integrations without modals yet, show info message
        setNotification({
          show: true,
          type: 'info',
          title: `${integrationId.charAt(0).toUpperCase() + integrationId.slice(1)} Integration`,
          message: `${integrationId.charAt(0).toUpperCase() + integrationId.slice(1)} configuration modal coming soon!`
        })
        break
      default:
        setNotification({
          show: true,
          type: 'warning',
          title: 'Unknown Integration',
          message: `No configuration available for ${integrationId}`
        })
    }

    setShowBrowseModal(false)
  }

  const handleToggleEnabled = async (integration: Integration) => {
    try {
      await updateIntegration(integration.id, {
        enabled: !integration.enabled
      })
      setNotification({
        show: true,
        type: 'success',
        title: integration.enabled ? 'Integration disabled' : 'Integration enabled',
        message: `${integration.name} has been ${integration.enabled ? 'disabled' : 'enabled'}`
      })
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to update integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Handle disconnect integration
   */
  const handleDisconnect = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      return
    }

    try {
      await updateIntegration(integration.id, {
        status: 'disconnected',
        enabled: false
      })
      setNotification({
        show: true,
        type: 'info',
        title: 'Integration disconnected',
        message: `${integration.name} has been disconnected`
      })
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to disconnect integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleDelete = async (integration: Integration) => {
    if (!confirm(`Are you sure you want to delete the ${integration.name} integration?`)) {
      return
    }

    console.log('[Integrations Page] Deleting:', integration.id)

    try {
      await removeIntegration(integration.id, integration.storeId)
      setNotification({
        show: true,
        type: 'success',
        title: 'Integration deleted',
        message: `${integration.name} has been deleted`
      })
    } catch (error) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to delete integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const handleTest = async (integration: Integration): Promise<boolean> => {
    try {
      setTestingId(integration.id)
      setTestResults(prev => ({ ...prev, [integration.id]: null }))

      const result = await testIntegration(integration)

      setTestResults(prev => ({
        ...prev,
        [integration.id]: {
          success: result.success,
          message: result.message || (result.success ? 'Connection successful' : 'Connection failed')
        }
      }))

      // Auto-clear test results after 5 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [integration.id]: null }))
      }, 5000)
      return result.success
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [integration.id]: {
          success: false,
          message: error instanceof Error ? error.message : 'Test failed'
        }
      }))

      // Auto-clear test results after 5 seconds
      setTimeout(() => {
        setTestResults(prev => ({ ...prev, [integration.id]: null }))
      }, 5000)
      return false
    } finally {
      setTestingId(null)
    }
  }

  // Helper to create test handler for modals (returns the object type they expect)
  const createModalTestHandler = (integration: Integration) => {
    return async (): Promise<{ success: boolean; message: string }> => {
      try {
        setTestingId(integration.id)
        const result = await testIntegration(integration)

        return {
          success: result.success,
          message: result.message || (result.success ? 'Connection successful' : 'Connection failed')
        }
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Test failed'
        }
      } finally {
        setTestingId(null)
      }
    }
  }

  /**
   * ✅ UPDATED: Shopify sync handler - Uses IntegrationAPI directly
   * Now calls backend API with fullSync: false (incremental sync)
   */
  const handleShopifySync = async (
    integrationId: string,
    onProgress?: (stage: 'starting' | 'products' | 'orders' | 'complete') => void
  ) => {
    const shopifyIntegration = integrations.find(
      (i: Integration) => i.id === integrationId
    )

    if (!shopifyIntegration) {
      throw new Error('Shopify integration not found')
    }

    setSyncingId(shopifyIntegration.id)

    try {
      console.log('[handleShopifySync] 🔄 Starting Shopify sync via IntegrationAPI...')
      console.log('[handleShopifySync] Store ID:', selectedStoreId)
      console.log('[handleShopifySync] fullSync: false (incremental)')

      // Stage 1: Starting
      onProgress?.('starting')

      // Show initial notification
      setNotification({
        show: true,
        type: 'info',
        title: 'Sync Started',
        message: 'Synchronizing orders and products from Shopify...'
      })

      // Stage 2: Syncing products
      onProgress?.('products')

      // ✅ FIXED: Call backend API directly with fullSync: false
      // This ensures incremental sync and field preservation
      const result = await IntegrationAPI.syncShopify({
        storeId: selectedStoreId,
        syncType: 'orders',
        fullSync: false  // ✅ CRITICAL: Always use incremental sync
      })

      // Stage 3: Syncing orders
      onProgress?.('orders')

      // Update integration with last sync time
      await updateIntegration(shopifyIntegration.id, {
        lastSyncAt: new Date().toISOString()
      })

      // Stage 4: Complete
      onProgress?.('complete')

      console.log('[handleShopifySync] ✅ Sync completed:', result)

      // Show success notification with details
      const data = result?.data || {}
      setNotification({
        show: true,
        type: 'success',
        title: 'Sync Complete',
        message: `Synced ${data.orders || 0} orders (${data.ordersNew || 0} new, ${data.ordersUpdated || 0} updated) and ${data.products || 0} products`
      })
    } catch (error: any) {
      console.error('[handleShopifySync] ❌ Error:', error)
      onProgress?.('complete') // Reset progress

      setNotification({
        show: true,
        type: 'error',
        title: 'Sync Failed',
        message: error.message || 'Failed to sync with Shopify'
      })

      throw error
    } finally {
      setSyncingId(null)
    }
  }

  // Loading state
  if (integrationsLoading || storesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (integrationsError || storesError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{integrationsError || storesError}</p>
          <button
            onClick={() => {
              loadStores()
              window.location.reload()
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retry
          </button>
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
            Connect your e-commerce platforms and shipping carriers
          </p>
        </div>
        {selectedStoreId && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              onClick={() => setShowBrowseModal(true)}
              disabled={!hasWarehouses}
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

      {selectedStoreId && !hasWarehouses && (
        <div className="mb-6">
          <WarehouseRequiredWarning
            storeName={getSelectedStoreName()}
            storeId={selectedStoreId}
          />
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

                {/* TEST RESULTS DISPLAY */}
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

                {/* TEST RESULTS DISPLAY */}
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
          integrations.find((i: Integration) => i.name === 'USPS' && i.storeId === selectedStoreId) || {
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
        onTest={() => createModalTestHandler(integrations.find((i: Integration) => i.name === 'USPS' && i.storeId === selectedStoreId)!)()}
        isTesting={testingId === integrations.find((i: Integration) => i.name === 'USPS' && i.storeId === selectedStoreId)?.id}
      />

      {/* UPS Config Modal */}
      <UPSConfigModal
        isOpen={showUpsModal}
        onClose={() => setShowUpsModal(false)}
        integration={
          integrations.find((i: Integration) => i.name === 'UPS' && i.storeId === selectedStoreId) || {
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
          integrations.find((i: Integration) => i.name === 'UPS' && i.storeId === selectedStoreId)!
        )()}
        isTesting={testingId === integrations.find((i: Integration) => i.name === 'UPS' && i.storeId === selectedStoreId)?.id}
      />

      {/* Shopify Config Modal */}
      <ShopifyConfigModal
        isOpen={showShopifyModal}
        onClose={() => setShowShopifyModal(false)}
        onSave={handleSaveShopify}
        existingIntegration={
          integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId) as any
        }
        selectedStoreId={selectedStoreId}
        warehouses={warehouses}
        allIntegrations={integrations}
        onTest={() => createModalTestHandler(
          integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)!
        )()}
        isTesting={testingId === integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)?.id}
        onSync={async (progressCallback) => {
          const shopifyIntegration = integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)
          if (shopifyIntegration) {
            await handleShopifySync(shopifyIntegration.id, progressCallback)
          }
        }}
        isSyncing={syncingId === integrations.find((i: Integration) => i.name === 'Shopify' && i.storeId === selectedStoreId)?.id}
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

// ✅ Wrap with Suspense first, then with withAuth
function IntegrationsPageWithSuspense({ accountId }: IntegrationsContentProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <IntegrationsContent accountId={accountId} />
    </Suspense>
  )
}

// ✅ Export the wrapped component with withAuth HOC
export default withAuth(IntegrationsPageWithSuspense, {
  loadingMessage: "Loading integrations...",
  errorTitle: "Unable to load integrations",
  errorMessage: "Please check your authentication and try again."
})
