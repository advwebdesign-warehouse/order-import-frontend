//file path: src/app/dashboard/integrations/components/ShopifyConfigModal.tsx

'use client'

import { Fragment, useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import {
  ShopifyIntegration,
  EcommerceWarehouseConfig,
  SyncDirection,
  Integration
} from '../types/integrationTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import EcommerceWarehouseRouting from './EcommerceWarehouseRouting'
import EcommerceInventorySync from './EcommerceInventorySync'
import WarehouseRequiredWarning from './WarehouseRequiredWarning'
import { IntegrationAPI } from '@/lib/api/integrationApi'

// Progress stages for visual feedback
type SyncStage = 'idle' | 'starting-sync' | 'syncing-products' | 'syncing-orders' | 'success'

interface ShopifyConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (integration: Partial<ShopifyIntegration>) => Promise<void>
  onTest?: () => Promise<{ success: boolean; message: string }> // ✅ Test handler
  onSync?: (progressCallback?: (stage: 'starting' | 'products' | 'orders' | 'complete') => void) => Promise<void>
  existingIntegration?: ShopifyIntegration
  selectedStoreId: string
  selectedStoreName?: string
  warehouses: Warehouse[]
  allIntegrations?: Integration[]  // ⭐ Use proper Integration union type
  isTesting?: boolean
  isSyncing?: boolean
}

export default function ShopifyConfigModal({
  isOpen,
  onClose,
  onSave,
  onTest,
  onSync,
  existingIntegration,
  selectedStoreId,
  selectedStoreName = 'this store',
  warehouses,
  allIntegrations = [],
  isTesting = false,
  isSyncing = false
}: ShopifyConfigModalProps) {
  // Check if already connected
  const isConnected = existingIntegration?.status === 'connected' && existingIntegration?.config?.storeUrl

  // OAuth flow only
  const [storeUrl, setstoreUrl] = useState(existingIntegration?.config?.storeUrl || '')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [showReconnect, setShowReconnect] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showInstructions, setShowInstructions] = useState(false)
  const [syncStage, setSyncStage] = useState<SyncStage>('idle')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // ✅ Track if we've initialized settings from props (prevents feedback loop)
  const hasInitializedSettings = useRef(false)

  // ⭐ Warehouse configuration state (from root level per integrationTypes.ts)
  const [warehouseConfig, setWarehouseConfig] = useState<EcommerceWarehouseConfig>(
    existingIntegration?.routingConfig || {
      mode: 'simple',
      primaryWarehouseId: warehouses[0]?.id || '',
      fallbackWarehouseId: undefined,
      enableRegionRouting: false,
      assignments: []
    }
  )

  // ⭐ Inventory sync configuration (from root level per integrationTypes.ts)
  const [inventorySyncEnabled, setInventorySyncEnabled] = useState(
    existingIntegration?.inventorySync || false
  )
  const [syncDirection, setSyncDirection] = useState<SyncDirection>(
    existingIntegration?.syncDirection || 'one_way_to'
  )

  // ⭐ Update warehouse config when warehouses change
  useEffect(() => {
    if (warehouses.length > 0 && !warehouseConfig.primaryWarehouseId) {
      setWarehouseConfig(prev => ({
        ...prev,
        primaryWarehouseId: warehouses[0].id
      }))
    }
  }, [warehouses])

  // ✅ FIX: Only sync from props on FIRST modal open, not every prop change
  // This prevents the feedback loop where parent update → prop change → state reset
  useEffect(() => {
    if (isOpen && existingIntegration && !hasInitializedSettings.current) {
      console.log('[Shopify Modal] Reloading saved configuration:', {
        hasRoutingConfig: !!existingIntegration.routingConfig,
        routingMode: existingIntegration.routingConfig?.mode,
        inventorySync: existingIntegration.inventorySync,
        syncDirection: existingIntegration.syncDirection,
        managesInventory: existingIntegration.managesInventory
      })

      // Load from root-level fields (per integrationTypes.ts)
      if (existingIntegration.routingConfig) {
        setWarehouseConfig(existingIntegration.routingConfig)
      }
      setInventorySyncEnabled(existingIntegration.inventorySync || false)
      setSyncDirection(existingIntegration.syncDirection || 'one_way_to')
      if (existingIntegration.config?.storeUrl) {
        setstoreUrl(existingIntegration.config.storeUrl)
      }

      hasInitializedSettings.current = true
    }

    // ✅ Reset flag when modal closes so next open loads fresh data
    if (!isOpen) {
      hasInitializedSettings.current = false
    }
  }, [isOpen, existingIntegration, warehouses])

  const getStageInfo = (stage: SyncStage) => {
    switch (stage) {
      case 'starting-sync':
        return { text: 'Starting Sync...', icon: '🚀', color: 'text-blue-600' }
      case 'syncing-products':
        return { text: 'Syncing Products...', icon: '📦', color: 'text-blue-600' }
      case 'syncing-orders':
        return { text: 'Syncing Orders...', icon: '🛒', color: 'text-blue-600' }
      case 'success':
        return { text: 'Synchronization completed successfully!', icon: '✅', color: 'text-green-600' }
      default:
        return null
    }
  }

  const currentStageInfo = getStageInfo(syncStage)

  /**
   * ✅ Save config and verify before OAuth
   * No delays, no hacks - waits for actual backend confirmation
   * ✅ Now passes inventorySync and syncDirection through OAuth URL
   */
  const handleOAuthConnect = async () => {
    // ⭐ VALIDATION 1: Check warehouse configuration
    if (warehouses.length === 0) {
      setErrors({ warehouse: 'At least one warehouse is required before connecting Shopify' })
      return
    }

    if (!warehouseConfig.primaryWarehouseId) {
      setErrors({ warehouse: 'Please select a primary warehouse before connecting' })
      return
    }

    if (!storeUrl.trim()) {
      setErrors({ storeUrl: 'Shop URL is required to start OAuth' })
      return
    }

    // Normalize and validate shop URL
    let normalizedShop = storeUrl.trim().toLowerCase()
    normalizedShop = normalizedShop.replace(/^https?:\/\//, '')
    normalizedShop = normalizedShop.replace(/\/$/, '')
    normalizedShop = normalizedShop.split('/')[0]

    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`
    }

    if (!normalizedShop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
      setErrors({ storeUrl: 'Must be a valid Shopify URL (e.g., your-store.myshopify.com)' })
      return
    }

    setIsAuthenticating(true)
    setIsSavingConfig(true)
    setErrors({})

    try {
      console.log('[Shopify Modal] 💾 Saving configuration to backend...')

      // ✅ Step 1: Save config to backend using onSave
      await onSave({
        routingConfig: warehouseConfig,
        inventorySync: inventorySyncEnabled,
        syncDirection: syncDirection,
        managesInventory: inventorySyncEnabled,
        config: {
          storeUrl: normalizedShop,
          accessToken: ''
        }
      })

      console.log('[Shopify Modal] ✅ Config saved via onSave')

      // ✅ Step 2: Verify the save by reading back from backend
      if (existingIntegration) {
        console.log('[Shopify Modal] 🔍 Verifying save by reading from backend...')

        const verified = await IntegrationAPI.getIntegrationById(existingIntegration.id)

        if (!verified) {
          throw new Error('Failed to verify configuration save')
        }

        console.log('[Shopify Modal] ✅ Verified backend has:', {
          hasRoutingConfig: !!verified.routingConfig,
          routingMode: verified.routingConfig?.mode,
          assignmentsCount: verified.routingConfig?.assignments?.length || 0,
          inventorySync: verified.inventorySync,
          managesInventory: verified.managesInventory
        })

        // ✅ Double-check that our config was actually saved
        if (!verified.routingConfig || !verified.routingConfig.primaryWarehouseId) {
          throw new Error('Backend did not save routing configuration')
        }

        if (warehouseConfig.mode === 'advanced' &&
            (!verified.routingConfig.assignments || verified.routingConfig.assignments.length === 0)) {
          throw new Error('Backend did not save warehouse assignments')
        }
      }

      setIsSavingConfig(false)

      // ✅ Step 3: NOW we can safely redirect to OAuth
      // ⭐ Include inventorySync and syncDirection in the OAuth URL
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

      // Build inventory config object to pass through OAuth
      const inventoryConfig = {
        inventorySync: inventorySyncEnabled,
        syncDirection: syncDirection,
        managesInventory: inventorySyncEnabled
      }

      const authUrl = `${API_BASE}/integrations/shopify/auth?shop=${encodeURIComponent(normalizedShop)}&storeId=${encodeURIComponent(selectedStoreId)}&warehouseConfig=${encodeURIComponent(JSON.stringify(warehouseConfig))}&inventoryConfig=${encodeURIComponent(JSON.stringify(inventoryConfig))}`

      console.log('[Shopify Modal] 🚀 Configuration verified, redirecting to OAuth...')
      console.log('[Shopify Modal] 📦 Passing inventory config:', inventoryConfig)

      // Redirect to OAuth - sync will happen automatically after connection
      window.location.href = authUrl

    } catch (error: any) {
      console.error('[Shopify Modal] ❌ Error during save or OAuth:', error)
      setErrors({
        oauth: error.message || 'Failed to save configuration. Please try again.'
      })
      setIsAuthenticating(false)
      setIsSavingConfig(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await onSave({ status: 'disconnected' })
      onClose()
    } catch (error) {
      console.error('[Shopify Modal] Disconnect error:', error)
    }
  }

  const handleTestConnection = async () => {
    if (!onTest) {
      console.warn('[Shopify Modal] No onTest handler provided')
      setTestResult({ success: false, message: 'Test function not available' })
      return
    }

    if (!isConnected) {
      setTestResult({ success: false, message: 'Please connect your Shopify store first' })
      setTimeout(() => setTestResult(null), 3000)
      return
    }

    setTestResult(null) // Clear previous results

    try {
      const result = await onTest()
      setTestResult(result)
      setTimeout(() => setTestResult(null), 5000)
    } catch (error: any) {
      console.error('[Shopify Modal] Test failed:', error)
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed'
      })
      setTimeout(() => setTestResult(null), 5000)
    }
  }

  /**
   * ✅ Save config before sync with verification
   */
  const handleSync = async () => {
    if (!onSync) {
      console.warn('[Shopify Modal] No onSync handler provided')
      setTestResult({ success: false, message: 'Sync function not available' })
      return
    }

    if (!isConnected) {
      setTestResult({ success: false, message: 'Please connect your Shopify store first' })
      setTimeout(() => setTestResult(null), 3000)
      return
    }

    setIsSavingConfig(true)

    try {
      console.log('[Shopify Modal] 💾 Saving configuration before sync...', {
        inventorySyncEnabled,
        syncDirection,
        warehouseConfigMode: warehouseConfig.mode,
        assignmentsCount: warehouseConfig.assignments?.length || 0
      })

      // ✅ Step 1: Save config
      await onSave({
        routingConfig: warehouseConfig,
        inventorySync: inventorySyncEnabled,
        syncDirection: syncDirection,
        managesInventory: inventorySyncEnabled
      })

      console.log('[Shopify Modal] ✅ Config saved')

      // ✅ Step 2: Verify save (optional but recommended)
      if (existingIntegration) {
        const verified = await IntegrationAPI.getIntegrationById(existingIntegration.id)

        // ✅ Use Boolean() for proper type coercion (handles undefined, null, string "true"/"false")
        const backendInventorySync = Boolean(verified?.inventorySync)
        const localInventorySync = Boolean(inventorySyncEnabled)

        if (backendInventorySync !== localInventorySync) {
          // Log the mismatch but don't block - the save might still be propagating
          console.warn('[Shopify Modal] ⚠️ Backend config mismatch detected:', {
            backend: verified?.inventorySync,
            local: inventorySyncEnabled,
            backendCoerced: backendInventorySync,
            localCoerced: localInventorySync
          })
          // Don't throw - proceed with sync anyway since config was just saved
        }

        console.log('[Shopify Modal] ✅ Verified:', {
          inventorySync: verified?.inventorySync,
          syncDirection: verified?.syncDirection,
          managesInventory: verified?.managesInventory
        })
      }

      setIsSavingConfig(false)

      // ✅ Step 3: Start sync
      setTestResult(null) // Clear previous results
      setSyncStage('starting-sync')

      await onSync((stage: 'starting' | 'products' | 'orders' | 'complete') => {
        if (stage === 'starting') {
          setSyncStage('starting-sync')
        } else if (stage === 'products') {
          setSyncStage('syncing-products')
        } else if (stage === 'orders') {
          setSyncStage('syncing-orders')
        } else if (stage === 'complete') {
          setSyncStage('success')
        }
      })

      if (syncStage === 'starting-sync') {
        setSyncStage('success')
      }

      setTimeout(() => setSyncStage('idle'), 2000)

    } catch (error: any) {
      console.error('[Shopify Modal] ❌ Sync error:', error)
      setIsSavingConfig(false)
      setSyncStage('idle')
      setTestResult({
        success: false,
        message: error.message || 'Synchronization failed'
      })
      setTimeout(() => setTestResult(null), 5000)
    }
  }

  // ✅ Handlers for inventory sync changes - notify parent immediately
  const handleInventorySyncChange = useCallback((enabled: boolean) => {
    console.log('[Shopify Modal] 📝 Inventory sync changed:', enabled)
    setInventorySyncEnabled(enabled)
  }, [])

  const handleSyncDirectionChange = useCallback((direction: SyncDirection) => {
    console.log('[Shopify Modal] 📝 Sync direction changed:', direction)
    setSyncDirection(direction)
  }, [])

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:w-full sm:max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    <img
                      src="/logos/shopify-logo.svg"
                      alt="Shopify"
                      className="w-20 h-10"
                    />
                    <div className="text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Shopify Configuration
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        {isConnected
                          ? 'Manage your Shopify integration'
                          : 'Connect your Shopify store to automatically sync orders and products'
                        }
                      </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      disabled={isAuthenticating || isSyncing}
                      type="button"
                      className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Body - Scrollable */}
                <div className="px-6 py-6 overflow-y-auto flex-1">
                  {/* ✅ Saving indicator */}
                  {isSavingConfig && (
                    <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-4">
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Saving configuration...</p>
                          <p className="text-xs text-blue-600 mt-1">Please wait while we save your settings to the backend</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isConnected ? (
                    // Connected State
                    <>
                      {/* Connection Status */}
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-green-800">Connected</p>
                                <p className="text-sm text-green-700">
                                  Store: {existingIntegration.config?.storeUrl}
                                </p>
                                {existingIntegration.lastSyncAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Last synced: {new Date(existingIntegration.lastSyncAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleDisconnect}
                              className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>

                        {/* ⭐ Warehouse Configuration Section (Always Shown) */}
                        <div className="mb-6">
                          {warehouses.length === 0 ? (
                            <WarehouseRequiredWarning
                              storeName={selectedStoreName}
                              storeId={selectedStoreId}
                              onClose={onClose}
                            />
                          ) : (
                            <div className="space-y-6">
                              {/* Step 1: Warehouse Routing */}
                              <EcommerceWarehouseRouting
                                warehouseConfig={warehouseConfig}
                                warehouses={warehouses}
                                onChange={setWarehouseConfig}
                              />

                              {/* ⭐ Product & Inventory Sync - Uses proper Integration[] type */}
                              <div className="border-t border-gray-200 pt-6">
                              <EcommerceInventorySync
                                inventorySyncEnabled={inventorySyncEnabled}
                                syncDirection={syncDirection}
                                onInventorySyncChange={setInventorySyncEnabled}
                                onSyncDirectionChange={setSyncDirection}
                                integrationName="Shopify"
                                primaryWarehouseId={warehouseConfig.primaryWarehouseId}
                                warehouses={warehouses}
                                allIntegrations={allIntegrations}
                                currentIntegrationId={existingIntegration?.id}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Reconnect Section */}
                        {showReconnect && (
                          <div className="mb-6 space-y-4">
                            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                              <div className="flex items-start">
                                <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div className="ml-3">
                                  <h3 className="text-sm font-medium text-yellow-800">Reconnecting Your Store</h3>
                                  <p className="mt-1 text-sm text-yellow-700">
                                    To reconnect or change stores, confirm your shop URL below and click "Reconnect to Shopify"
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Shop URL <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={storeUrl}
                                onChange={(e) => {
                                  setstoreUrl(e.target.value)
                                  setErrors({})
                                }}
                                placeholder="your-store.myshopify.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                              {errors.storeUrl && (
                                <p className="mt-1 text-sm text-red-600">{errors.storeUrl}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleOAuthConnect}
                              disabled={isAuthenticating || !storeUrl.trim()}
                              className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isAuthenticating ? 'Reconnecting...' : 'Reconnect to Shopify'}
                            </button>

                            <button
                              type="button"
                              onClick={handleDisconnect}
                              className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-md hover:bg-red-100"
                            >
                              Disconnect Integration
                            </button>
                          </div>
                          )}

                          {/* ✅ Test Result Display */}
                          {testResult && (
                          <div
                            className={`rounded-md p-4 ${
                              testResult.success
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <p
                              className={`text-sm font-medium ${
                                testResult.success ? 'text-green-800' : 'text-red-800'
                              }`}
                            >
                            {testResult.success ? '✓ ' : '✗ '}
                            {testResult.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // OAuth Connection Flow
                    <>
                    {/* Not Connected - Setup Flow */}

                    {/* ⭐ STEP 1: Warehouse Configuration (Required FIRST) */}
                    <div className="mb-6">
                      <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-sm font-medium mr-2">1</span>
                        Configure Warehouse Routing
                      </h4>

                      {warehouses.length === 0 ? (
                        <WarehouseRequiredWarning
                          storeName={selectedStoreName}
                          storeId={selectedStoreId}
                          onClose={onClose}
                        />
                      ) : (
                        <div className="space-y-6">
                          {/* Step 1: Warehouse Routing */}
                          <EcommerceWarehouseRouting
                            warehouseConfig={warehouseConfig}
                            warehouses={warehouses}
                            onChange={setWarehouseConfig}
                          />

                            {/* ⭐ Product & Inventory Sync - Uses proper Integration[] type */}
                          <div className="border-t border-gray-200 pt-6">
                            <EcommerceInventorySync
                              inventorySyncEnabled={inventorySyncEnabled}
                              syncDirection={syncDirection}
                              onInventorySyncChange={setInventorySyncEnabled}
                              onSyncDirectionChange={setSyncDirection}
                              integrationName="Shopify"
                              primaryWarehouseId={warehouseConfig.primaryWarehouseId}
                              warehouses={warehouses}
                              allIntegrations={allIntegrations}
                              currentIntegrationId={existingIntegration?.id}
                            />
                          </div>

                          {errors.warehouse && (
                            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                              {errors.warehouse}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ⭐ STEP 2: Connect to Shopify */}
                    <div className="mb-6">
                      <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-sm font-medium mr-2">2</span>
                        Connect to Shopify
                      </h4>

                      {/* Instructions */}
                      <div className="rounded-md bg-blue-50 border border-blue-200">
                        <button
                          onClick={() => setShowInstructions(!showInstructions)}
                          className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-md"
                        >
                          <div className="flex items-center">
                            <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                            <h3 className="text-sm font-medium text-blue-800">
                              How to connect Shopify
                            </h3>
                          </div>
                          <ChevronDownIcon
                            className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${
                              showInstructions ? 'transform rotate-0' : 'transform -rotate-90'
                            }`}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            showInstructions ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-4 pb-4">
                            <div className="text-sm text-blue-700 space-y-3">
                              <div>
                                <p className="font-medium mb-1">Steps:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                  <li>Configure your warehouse routing above</li>
                                  <li>Enter your Shopify store URL below</li>
                                  <li>Click "Connect to Shopify"</li>
                                  <li>Accept the permissions in Shopify</li>
                                  <li>You'll be redirected back and data will sync automatically</li>
                                </ol>
                              </div>
                              <div className="bg-blue-100 rounded p-2">
                                <p className="text-xs font-medium">✨ Automatic Sync</p>
                                <p className="text-xs">Orders and products will sync automatically when you connect. No manual sync needed!</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Error display */}
                      {errors.oauth && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-600">{errors.oauth}</p>
                        </div>
                      )}

                      {/* OAuth Flow - Shop URL Input Only */}
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Shop URL <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={storeUrl}
                            onChange={(e) => {
                              setstoreUrl(e.target.value)
                              setErrors({})
                            }}
                            placeholder="your-store.myshopify.com"
                            disabled={isAuthenticating || warehouses.length === 0}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.storeUrl ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                          />
                          {errors.storeUrl && (
                            <p className="mt-1 text-sm text-red-600">{errors.storeUrl}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {showReconnect
                              ? 'Confirm your shop URL to reconnect (or enter a different shop)'
                              : 'Enter your Shopify store URL (e.g., your-store.myshopify.com)'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                    </>
                  )}
                </div>

                {/* Footer - Simple version without Sync button */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isAuthenticating || !isConnected || isTesting || isSyncing}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTesting ? 'Testing Connection...' : 'Test Connection'}
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isAuthenticating || isSyncing || isSavingConfig}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isConnected ? 'Close' : 'Cancel'}
                  </button>

                  {/* Sync Button - Only show when connected */}
                  {isConnected && (
                    <button
                      type="button"
                      onClick={handleSync}
                      disabled={isAuthenticating || isTesting || isSyncing || isSavingConfig}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing || isSavingConfig ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {isSavingConfig ? 'Saving...' : 'Syncing...'}
                        </>
                      ) : (
                        'Sync Shopify'
                      )}
                    </button>
                  )}

                  {/* Connect Button - Only show when NOT connected */}
                    {!isConnected && (
                      <button
                        type="button"
                        onClick={handleOAuthConnect}
                        disabled={isAuthenticating || !storeUrl.trim() || warehouses.length === 0 || !warehouseConfig.primaryWarehouseId || isSavingConfig}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAuthenticating || isSavingConfig ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isSavingConfig ? 'Saving Configuration...' : 'Connecting...'}
                          </>
                        ) : (
                          'Connect to Shopify'
                        )}
                      </button>
                    )}
                    </div>
                  </div>


                  {/* Progress Notification - Appears below buttons */}
                  {(isSyncing || syncStage !== 'idle') && currentStageInfo && (
                    <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{currentStageInfo.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            syncStage === 'success' ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {currentStageInfo.text}
                          </p>
                          {syncStage !== 'success' && syncStage !== 'idle' && (
                            <div className="mt-2 w-full bg-blue-200 rounded-full h-2 overflow-hidden relative">
                              <div
                                className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-full"
                                style={{
                                  width: '200%',
                                  animation: 'slideProgress 1.5s linear infinite'
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                        {syncStage === 'success' && (
                          <CheckCircleIcon className="h-6 w-6 text-green-600 ml-2" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
