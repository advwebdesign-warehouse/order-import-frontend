//file path: src/app/dashboard/integrations/page.tsx

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useIntegrations } from './hooks/useIntegrations'
import IntegrationCard from './components/IntegrationCard'
import USPSConfigModal from './components/USPSConfigModal'
import UPSConfigModal from './components/UPSConfigModal'
import ShopifyConfigModal from './components/ShopifyConfigModal'
import StoreSelector from './components/StoreSelector'
import BrowseIntegrationsModal from './components/BrowseIntegrationsModal'
import { Integration, ShopifyIntegration } from './types/integrationTypes'
import { getCurrentAccountId, saveAccountIntegrations, getAccountIntegrations } from '@/lib/storage/integrationStorage'
import { getStoresFromStorage } from '../../../app/dashboard/stores/utils/storeStorage'
import Notification from '@/app/dashboard/shared/components/Notification'

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const { settings, loading, updateIntegration, testIntegration, addIntegration, removeIntegration } = useIntegrations()
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [showBrowseModal, setShowBrowseModal] = useState(false)
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } | null }>({})
  const [testingId, setTestingId] = useState<string | null>(null)

  // ✅ Store selector state
  const [stores, setStores] = useState<any[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')

  // ✅ NEW: Notification state
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

  // ✅ Load stores on mount and auto-select first store
  useEffect(() => {
    const loadedStores = getStoresFromStorage()
    setStores(loadedStores)

    // Auto-select first store if available
    if (loadedStores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(loadedStores[0].id)
    }
  }, [])

  // Handle UPS OAuth callback success
  useEffect(() => {
    const upsSuccess = searchParams.get('ups_success')
    const upsAccount = searchParams.get('ups_account')
    const upsEnv = searchParams.get('ups_env')
    const upsAccessToken = searchParams.get('ups_access_token')
    const upsRefreshToken = searchParams.get('ups_refresh_token')
    const upsExpiresIn = searchParams.get('ups_expires_in')
    const upsError = searchParams.get('ups_error')
    const upsErrorDescription = searchParams.get('ups_error_description')

    if (upsError) {
      console.error('[UPS OAuth] Error:', upsError, upsErrorDescription)
      setNotification({
        show: true,
        type: 'error',
        title: 'UPS Connection Failed',
        message: upsErrorDescription || upsError
      })
      window.history.replaceState({}, '', '/dashboard/integrations')
      return
    }

    if (upsSuccess && upsAccessToken && upsRefreshToken && upsAccount && upsEnv) {
      console.log('[UPS OAuth] ✅ Connection successful, saving integration...')

      updateIntegration('ups', {
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
        status: 'connected',
        enabled: true,
        connectedAt: new Date().toISOString()
      })

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

      window.history.replaceState({}, '', '/dashboard/integrations')
      console.log('[UPS OAuth] ✅ Integration setup complete!')
    }
  }, [searchParams])
  // Track if we've already processed the Shopify OAuth callback
    const shopifyCallbackProcessed = useRef(false)

    // Handle Shopify OAuth callback success
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

        // 🔥 CRITICAL FIX: Read fresh data from localStorage to prevent data loss
        const aid = getCurrentAccountId()
        const freshSettings = getAccountIntegrations(aid) || settings

        console.log('[Shopify OAuth] Current integrations count:', freshSettings.integrations.length)
        console.log('[Shopify OAuth] Integrations:', freshSettings.integrations.map(i => ({ id: i.id, name: i.name, storeId: i.storeId })))

        // Check if integration already exists for this store using FRESH data
        // ✅ Better approach: Check by name instead of ID prefix
        const existingIntegration = freshSettings.integrations.find(
          i => i.name === 'Shopify' && i.storeId === integrationStoreId
        )

        if (existingIntegration) {
          // Update existing integration
          updateIntegration(existingIntegration.id, {
            config: {
              shopUrl: shop,
              accessToken: accessToken,
            },
            status: 'connected',
            enabled: true,
            connectedAt: new Date().toISOString()
          })
          console.log('[Shopify OAuth] Updated existing integration:', existingIntegration.id)
        } else {
          // Create new integration
          const timestamp = Date.now()
          const newIntegration: ShopifyIntegration = {
            id: `shopify-${integrationStoreId}-${timestamp}`,
            name: 'Shopify',
            type: 'ecommerce',
            status: 'connected',
            enabled: true,
            storeId: integrationStoreId,
            description: 'Sync orders, products, and inventory with your Shopify store',
            icon: '/logos/shopify-logo.svg',
            config: {
              shopUrl: shop,
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
          console.log('[Shopify OAuth] Creating new integration:', newIntegration.id)
          console.log('[Shopify OAuth] ✅ Integration setup complete!')
        }

        setNotification({
          show: true,
          type: 'success',
          title: 'Shopify Connected',
          message: `Successfully connected to ${shop}`
        })

        setTestResults(prev => ({
          ...prev,
          [`shopify-${integrationStoreId}`]: {
            success: true,
            message: '✅ Shopify connected successfully!'
          }
        }))

        setTimeout(() => {
          setTestResults(prev => ({
            ...prev,
            [`shopify-${integrationStoreId}`]: null
          }))
        }, 5000)

        window.history.replaceState({}, '', '/dashboard/integrations')
        console.log('[Shopify OAuth] ✅ Integration setup complete!')
      }
    }, [searchParams])

  // ✅ Handle store change
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId)
  }

  // ✅ Filter integrations by selected store
  const filteredIntegrations = selectedStoreId
    ? settings.integrations.filter(i => i.storeId === selectedStoreId)
    : settings.integrations // Show all if no store selected

  console.log('[DEBUG] selectedStoreId:', selectedStoreId)
  console.log('[DEBUG] all integrations:', settings.integrations)
  console.log('[DEBUG] filteredIntegrations:', filteredIntegrations)

  // Separate integrations by type
  const shippingIntegrations = filteredIntegrations.filter(i => i.type === 'shipping')
  const ecommerceIntegrations = filteredIntegrations.filter(i => i.type === 'ecommerce')

  // ✅ FIXED: Handle adding integration from browse modal - with proper storeId
  const handleAddIntegration = (integrationId: string) => {
    console.log('[handleAddIntegration] Called with:', integrationId)
    console.log('[handleAddIntegration] selectedStoreId:', selectedStoreId)

    if (!selectedStoreId) {
      setNotification({
        show: true,
        type: 'warning',
        title: 'Store Required',
        message: 'Please select a store before adding an integration.'
      })
      return
    }

    // ✅ Define all integration templates
    const getNewIntegration = (id: string): Integration | null => {
      const timestamp = Date.now()
      const baseIntegrations: { [key: string]: any } = {
        usps: {
          id: `usps-${selectedStoreId}-${timestamp}`, // ✅ FIXED: Unique ID per store
          name: 'USPS',
          type: 'shipping',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId, // ✅ FIXED: Added storeId
          description: 'Generate shipping labels, calculate rates, and track packages with USPS',
          icon: '/logos/usps-logo.svg',
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
          }
        },
        ups: {
          id: `ups-${selectedStoreId}-${timestamp}`, // ✅ FIXED: Unique ID per store
          name: 'UPS',
          type: 'shipping',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId, // ✅ FIXED: Added storeId
          description: 'Generate shipping labels, calculate rates, and track packages with UPS',
          icon: '/logos/ups-logo.svg',
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
          }
        },
        shopify: {
          id: `shopify-${selectedStoreId}-${timestamp}`, // ✅ FIXED: Unique ID per store
          name: 'Shopify',
          type: 'ecommerce',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId, // ✅ FIXED: Added storeId
          description: 'Sync orders and inventory with your Shopify store',
          icon: '/logos/shopify-logo.svg',
          config: {
            shopUrl: '',
            apiKey: '',
            accessToken: ''
          },
          warehouseConfig: {
            defaultWarehouseId: '',
            enableRegionRouting: false
          }
        },
        woocommerce: {
          id: `woocommerce-${selectedStoreId}-${timestamp}`,
          name: 'WooCommerce',
          type: 'ecommerce',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId,
          description: 'Connect your WooCommerce store for seamless order management',
          icon: '/logos/woocommerce-logo.svg',
          config: {
            storeUrl: '',
            consumerKey: '',
            consumerSecret: ''
          },
          comingSoon: true
        },
        etsy: {
          id: `etsy-${selectedStoreId}-${timestamp}`,
          name: 'Etsy',
          type: 'ecommerce',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId,
          description: 'Sync your Etsy shop orders and listings',
          icon: '/logos/etsy-logo.svg',
          config: {
            apiKey: '',
            sharedSecret: '',
            shopId: ''
          },
          comingSoon: true
        },
        ebay: {
          id: `ebay-${selectedStoreId}-${timestamp}`,
          name: 'eBay',
          type: 'ecommerce',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId,
          description: 'Sync eBay listings and orders',
          icon: '/logos/ebay-logo.svg',
          config: {
            appId: '',
            certId: '',
            devId: '',
            token: ''
          },
          comingSoon: true
        },
        walmart: {
          id: `walmart-${selectedStoreId}-${timestamp}`,
          name: 'Walmart',
          type: 'ecommerce',
          status: 'disconnected',
          enabled: false,
          storeId: selectedStoreId,
          description: 'Integrate with Walmart Marketplace',
          icon: '/logos/walmart-logo.svg',
          config: {
            clientId: '',
            clientSecret: ''
          },
          comingSoon: true
        }
      }

      return baseIntegrations[id] || null
    }

    const newIntegration = getNewIntegration(integrationId)

    if (!newIntegration) {
      console.warn('[handleAddIntegration] Unrecognized integration:', integrationId)
      setNotification({
        show: true,
        type: 'error',
        title: 'Unknown Integration',
        message: `Integration "${integrationId}" is not recognized.`
      })
      return
    }

    // ✅ Check if coming soon
    if ((newIntegration as any).comingSoon) {
      setNotification({
        show: true,
        type: 'info',
        title: 'Coming Soon',
        message: `${newIntegration.name} integration is coming soon!`
      })
      setShowBrowseModal(false)
      return
    }

    console.log('[handleAddIntegration] Adding integration:', newIntegration)

    // ✅ Add integration (same flow for all integrations)
    const success = addIntegration(newIntegration)

    console.log('[handleAddIntegration] Add result:', success)

    if (success) {
      setNotification({
        show: true,
        type: 'success',
        title: 'Integration Added',
        message: `${newIntegration.name} integration added. Click "Configure" to set it up.`
      })
      setShowBrowseModal(false)
    } else {
      setNotification({
        show: true,
        type: 'error',
        title: 'Failed to Add',
        message: `Failed to add ${newIntegration.name} integration. Please try again.`
      })
    }
  }

  const handleConfigureClick = (integration: Integration) => {
    setSelectedIntegration(integration)

    // ✅ Route to correct modal based on integration name (better than ID prefix)
    if (integration.name === 'Shopify') {
      setShowShopifyModal(true)
    } else if (integration.name === 'USPS' || integration.name === 'UPS') {
      setShowConfigModal(true)
    }
  }

  const handleSaveConfig = (config: any) => {
    if (!selectedIntegration) return

    const updates: Partial<Integration> = {
      config,
      status: 'connected',
      connectedAt: new Date().toISOString()
    }

    updateIntegration(selectedIntegration.id, updates)

    setNotification({
      show: true,
      type: 'success',
      title: 'Configuration Saved',
      message: `${selectedIntegration.name} has been configured successfully.`
    })

    setShowConfigModal(false)
    setSelectedIntegration(null)
  }

  // ✅ Handle Shopify save - no warehouse config
  const handleSaveShopify = (integration: Partial<ShopifyIntegration>) => {
    console.log('[handleSaveShopify] Saving:', integration)

    if (!selectedIntegration) {
      console.error('[handleSaveShopify] No selected integration!')
      return
    }

    // ✅ Update existing integration (only config, no warehouse)
    const updates: Partial<Integration> = {
      config: integration.config,
      status: 'connected',
      connectedAt: integration.connectedAt || new Date().toISOString()
    }

    updateIntegration(selectedIntegration.id, updates)

    setNotification({
      show: true,
      type: 'success',
      title: 'Shopify Connected',
      message: 'Shopify integration configured successfully!'
    })

    setShowShopifyModal(false)
    setSelectedIntegration(null)
  }

  const handleToggleEnabled = (integration: Integration) => {
    updateIntegration(integration.id, { enabled: !integration.enabled })

    setNotification({
      show: true,
      type: 'info',
      title: integration.enabled ? 'Integration Disabled' : 'Integration Enabled',
      message: `${integration.name} has been ${integration.enabled ? 'disabled' : 'enabled'}.`
    })
  }

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

  const handleTestConnection = async (integration: Integration) => {
    setTestingId(integration.id)

    try {
      const success = await testIntegration(integration.id)

      setTestResults(prev => ({
        ...prev,
        [integration.id]: {
          success,
          message: success
            ? `✅ ${integration.name} connection test successful!`
            : `❌ ${integration.name} connection test failed. Please check your credentials.`
        }
      }))

      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          [integration.id]: null
        }))
      }, 5000)
    } catch (error) {
      console.error('Test connection error:', error)
      setTestResults(prev => ({
        ...prev,
        [integration.id]: {
          success: false,
          message: `❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }))

      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          [integration.id]: null
        }))
      }, 5000)
    } finally {
      setTestingId(null)
    }

    return testResults[integration.id]?.success || false
  }

  // ✅ Handle delete integration - Direct delete with notification
  const handleDeleteIntegration = (integration: Integration) => {
    const success = removeIntegration(integration.id, integration.storeId)

    if (success) {
      setNotification({
        show: true,
        type: 'success',
        title: 'Integration Deleted',
        message: `${integration.name} has been deleted successfully.`
      })
    } else {
      setNotification({
        show: true,
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete ${integration.name}. Please try again.`
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Connect your tools and services to streamline your workflow
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowBrowseModal(true)}
            disabled={!selectedStoreId}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={!selectedStoreId ? 'Please select a store first' : 'Browse available integrations'}
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Browse Integrations
          </button>
        </div>
      </div>

      {/* Store Selector Section */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Store
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {selectedStoreId
                ? 'Showing integrations for the selected store'
                : 'Please select a store to view its integrations'}
            </p>
          </div>
          <div className="w-full sm:w-64 mt-2 sm:mt-0">
            <StoreSelector
              stores={stores}
              selectedStoreId={selectedStoreId}
              onStoreChange={handleStoreChange}
              disabled={stores.length === 0}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Connected
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {filteredIntegrations.filter(i => i.status === 'connected').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Disconnected
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {filteredIntegrations.filter(i => i.status === 'disconnected').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Needs Attention
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {filteredIntegrations.filter(i => i.status === 'error').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Only show integrations if a store is selected */}
      {selectedStoreId && (
        <>
        {/* Shipping Integrations */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping & Logistics</h2>
          {shippingIntegrations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500">No shipping integrations added yet.</p>
              <p className="text-xs text-gray-400 mt-1">Click "Browse Integrations" to add USPS, UPS, or other carriers.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shippingIntegrations.map((integration) => {
                const store = stores.find(s => s.id === integration.storeId)
                const storeName = store ? (store.storeName || store.companyName) : undefined

                return (
                  <div key={integration.id}>
                    <IntegrationCard
                      integration={integration}
                      onConfigure={() => handleConfigureClick(integration)}
                      onToggle={() => handleToggleEnabled(integration)}
                      onDisconnect={() => handleDisconnect(integration)}
                      onTest={() => handleTestConnection(integration)}
                      onDelete={() => handleDeleteIntegration(integration)}
                      isTesting={testingId === integration.id}
                      storeName={storeName}
                    />

                    {testResults[integration.id] && (
                      <div
                        className={`mt-2 px-4 py-2 rounded-md text-sm font-medium animate-fade-in ${
                          testResults[integration.id]?.success
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {testResults[integration.id]?.message}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* E-commerce Integrations */}
        {ecommerceIntegrations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">E-commerce Platforms</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ecommerceIntegrations.map((integration) => {
                const store = stores.find(s => s.id === integration.storeId)
                const storeName = store ? (store.storeName || store.companyName) : undefined

                return (
                  <div key={integration.id}>
                    <IntegrationCard
                      integration={integration}
                      onConfigure={() => handleConfigureClick(integration)}
                      onToggle={() => handleToggleEnabled(integration)}
                      onDisconnect={() => handleDisconnect(integration)}
                      onTest={() => handleTestConnection(integration)}
                      onDelete={() => handleDeleteIntegration(integration)}
                      isTesting={testingId === integration.id}
                      storeName={storeName}
                    />

                    {testResults[integration.id] && (
                      <div
                        className={`mt-2 px-4 py-2 rounded-md text-sm font-medium animate-fade-in ${
                          testResults[integration.id]?.success
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {testResults[integration.id]?.message}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <>
          {selectedIntegration.name === 'USPS' && (
            <USPSConfigModal
              isOpen={showConfigModal}
              onClose={() => {
                setShowConfigModal(false)
                setSelectedIntegration(null)
              }}
              integration={selectedIntegration as any}
              onSave={handleSaveConfig}
            />
          )}

          {selectedIntegration.name === 'UPS' && (
            <UPSConfigModal
              isOpen={showConfigModal}
              onClose={() => {
                setShowConfigModal(false)
                setSelectedIntegration(null)
              }}
              integration={selectedIntegration as any}
              onSave={handleSaveConfig}
            />
          )}
        </>
      )}

      {/* Shopify Config Modal */}
      <ShopifyConfigModal
        isOpen={showShopifyModal}
        onClose={() => {
          setShowShopifyModal(false)
          setSelectedIntegration(null)
        }}
        onSave={handleSaveShopify}
        existingIntegration={selectedIntegration as ShopifyIntegration}
        selectedStoreId={selectedStoreId}
      />

      {/* Browse Integrations Modal */}
      <BrowseIntegrationsModal
        isOpen={showBrowseModal}
        onClose={() => setShowBrowseModal(false)}
        onAddIntegration={handleAddIntegration}
        existingIntegrationIds={filteredIntegrations.map(i => {
          // ✅ Better approach: Use name field instead of ID prefix
          // Convert to lowercase for consistent comparison (e.g., "Shopify" → "shopify")
          return i.name.toLowerCase()
        })}
        selectedStoreId={selectedStoreId}
      />

      {/* ✅ Notification Component */}
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
        autoClose={true}
        autoCloseDuration={3000}
      />
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <IntegrationsContent />
    </Suspense>
  )
}
