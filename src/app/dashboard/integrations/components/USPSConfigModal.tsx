//file path: src/app/dashboard/integrations/components/USPSConfigModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, InformationCircleIcon, ChevronDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getCurrentAccountId } from '@/lib/storage/integrationStorage'
import { USPSIntegration, Environment } from '../types/integrationTypes'


interface USPSConfigModalProps {
  isOpen: boolean
  onClose: () => void
  integration: USPSIntegration
  onSave: (integrationId: string, config: any) => void
}

// Progress stages for visual feedback
type SyncStage = 'idle' | 'saving-config' | 'updating-boxes' | 'updating-services' | 'success'

export default function USPSConfigModal({
  isOpen,
  onClose,
  integration,
  onSave
}: USPSConfigModalProps) {
  const [config, setConfig] = useState({
    consumerKey: integration.config?.consumerKey || '',
    consumerSecret: integration.config?.consumerSecret || '',
    environment: integration.config?.environment || 'sandbox' as Environment,
    apiUrl: integration.config?.apiUrl || 'https://api-cat.usps.com'
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStage, setSyncStage] = useState<SyncStage>('idle')
  const [environmentChanged, setEnvironmentChanged] = useState(false)

  const handleEnvironmentChange = (env: Environment) => {
    setConfig({
      ...config,
      environment: env,
      apiUrl: env === 'sandbox'
        ? 'https://apis-tem.usps.com'
        : 'https://apis.usps.com'
    })

    // Mark that environment changed from original
    if (integration.status === 'connected' && integration.config?.environment !== env) {
      setEnvironmentChanged(true)
    } else {
      setEnvironmentChanged(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/integrations/usps/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Connection successful! Your USPS credentials are valid.'
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check your credentials.'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error. Please try again.'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSyncing(true)
    setSyncStage('saving-config')

    try {
      // Step 1: Save config manually to localStorage (don't call onSave yet)
      console.log('[USPS Config] Saving configuration to localStorage...')

      // ✅ Get current account ID
      const accountId = getCurrentAccountId()
      const storageKey = `orderSync_integrations_${accountId}`
      const stored = localStorage.getItem(storageKey)
      const currentSettings = stored ? JSON.parse(stored) : null

      if (currentSettings) {
        // Update the USPS integration
        const updatedIntegrations = currentSettings.integrations.map((int: any) => {
          if (int.id === integration.id) {
            return {
              ...int,
              config,
              status: 'connected',
              enabled: true,
              connectedAt: new Date().toISOString()
            }
          }
          return int
        })

        // Save back to localStorage
        localStorage.setItem(storageKey, JSON.stringify({
          ...currentSettings,
          integrations: updatedIntegrations,
          lastUpdated: new Date().toISOString()
        }))

        console.log('[USPS Config] ✅ Configuration saved to localStorage for account:', accountId)
      }

      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 2: Update Boxes
      setSyncStage('updating-boxes')
      console.log('[USPS Config] Updating boxes...')

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
        console.log(`✅ Synced ${boxesData.count} USPS boxes`)

        // Store boxes in localStorage for all warehouses
        if (boxesData.boxes && boxesData.boxes.length > 0) {
          const warehousesStr = localStorage.getItem('warehouses')
          const warehouses = warehousesStr ? JSON.parse(warehousesStr) : []

          if (warehouses.length > 0) {
            warehouses.forEach((warehouse: any) => {
              const storageKey = `shipping_boxes_${warehouse.id}`
              const existingBoxes = localStorage.getItem(storageKey)
              const parsed = existingBoxes ? JSON.parse(existingBoxes) : []

              // Keep custom boxes, replace USPS boxes
              const customBoxes = parsed.filter((box: any) => box.boxType === 'custom')
              const updated = [...customBoxes, ...boxesData.boxes]

              localStorage.setItem(storageKey, JSON.stringify(updated))
              localStorage.setItem(`boxes_last_sync_${warehouse.id}`, Date.now().toString())
            })
            console.log(`✅ Boxes stored for ${warehouses.length} warehouses`)
          }
        }
      } else {
        console.warn('Failed to sync boxes:', await boxesResponse.text())
      }

      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 3: Update Services
      setSyncStage('updating-services')
      console.log('[USPS Config] Updating services...')

      const servicesResponse = await fetch('/api/shipping/services/sync', {
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

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        console.log(`✅ Synced ${servicesData.count} USPS services`)

        // Store services in localStorage for all warehouses
        if (servicesData.services && servicesData.services.length > 0) {
          const warehousesStr = localStorage.getItem('warehouses')
          const warehouses = warehousesStr ? JSON.parse(warehousesStr) : []

          if (warehouses.length > 0) {
            warehouses.forEach((warehouse: any) => {
              const storageKey = `shipping_services_${warehouse.id}`
              const existingServices = localStorage.getItem(storageKey)
              const parsed = existingServices ? JSON.parse(existingServices) : []

              // Merge services, preserving user preferences
              const merged = servicesData.services.map((apiService: any) => {
                const existing = parsed.find((s: any) =>
                  s.carrier === apiService.carrier && s.serviceCode === apiService.serviceCode
                )

                if (existing) {
                  return { ...apiService, isActive: existing.isActive, id: existing.id, createdAt: existing.createdAt }
                }
                return apiService
              })

              localStorage.setItem(storageKey, JSON.stringify(merged))
              localStorage.setItem(`services_last_sync_${warehouse.id}`, Date.now().toString())
            })
            console.log(`✅ Services stored for ${warehouses.length} warehouses`)
          }
        }
      } else {
        console.warn('Failed to sync services:', await servicesResponse.text())
      }

      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 4: Success!
      setSyncStage('success')
      console.log('[USPS Config] ✅ All sync operations completed successfully')

      // Wait 2 seconds before closing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // NOW notify parent (but we already saved everything manually)
      onSave(integration.id, config)

      // Small delay to let parent update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Reload the page to refresh all components with new data
      console.log('[USPS Config] 🔄 Reloading page to refresh data...')

      // Close modal (config already saved earlier)
      onClose()

      window.location.reload()
    } catch (error) {
      console.error('[USPS Config] Error during sync:', error)
      setSyncing(false)
      setSyncStage('idle')
      setTestResult({
        success: false,
        message: 'Configuration saved, but sync failed. Use "Sync from API" buttons to retry.'
      })
    }
  }


  const isConfigValid =
    (config.consumerKey?.trim().length ?? 0) > 0 &&
    (config.consumerSecret?.trim().length ?? 0) > 0

  // Get stage display information
  const getStageInfo = (stage: SyncStage) => {
    switch (stage) {
      case 'saving-config':
        return { text: 'Saving Configuration...', icon: '💾', color: 'text-blue-600' }
      case 'updating-boxes':
        return { text: 'Updating Boxes...', icon: '📦', color: 'text-blue-600' }
      case 'updating-services':
        return { text: 'Updating Services...', icon: '🚚', color: 'text-blue-600' }
      case 'success':
        return { text: 'Sync Successful!', icon: '✅', color: 'text-green-600' }
      default:
        return null
    }
  }

  const currentStageInfo = getStageInfo(syncStage)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={syncing ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* ✅ Replace emoji with USPS logo */}
                    <img
                      src="/logos/usps-logo.svg"
                      alt="USPS"
                      className="w-10 h-10"
                    />
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Configure USPS Integration
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={syncing}
                    className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
                {/* Connection Status - Only show when connected */}
                {integration.status === 'connected' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-900 flex items-center gap-2">
                          <CheckCircleIcon className="h-5 w-5" />
                          Connected
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Consumer Key: {config.consumerKey.substring(0, 20)}...
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          Connected {new Date(integration.connectedAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect USPS?')) return

                          setSyncing(true)
                          setSyncStage('saving-config')

                          try {
                            // ✅ Use account-based storage
                            const accountId = getCurrentAccountId()
                            const storageKey = `orderSync_integrations_${accountId}`
                            const stored = localStorage.getItem(storageKey)
                            const currentSettings = stored ? JSON.parse(stored) : null

                            if (currentSettings) {
                              const updatedIntegrations = currentSettings.integrations.map((int: any) => {
                                if (int.id === integration.id) {
                                  return {
                                    ...int,
                                    config: {
                                      consumerKey: '',
                                      consumerSecret: '',
                                      environment: 'sandbox',
                                      apiUrl: 'https://apis-tem.usps.com'
                                    },
                                    status: 'disconnected',
                                    enabled: false,
                                    connectedAt: null
                                  }
                                }
                                return int
                              })

                              localStorage.setItem(storageKey, JSON.stringify({
                                ...currentSettings,
                                integrations: updatedIntegrations,
                                lastUpdated: new Date().toISOString()
                              }))

                              console.log('[USPS Config] ✅ Disconnected and saved to localStorage for account:', accountId)
                            }

                            await new Promise(resolve => setTimeout(resolve, 500))

                            // Show success
                            setSyncStage('success')
                            await new Promise(resolve => setTimeout(resolve, 1000))

                            // Close modal
                            onClose()

                            // Reload page
                            window.location.reload()
                          } catch (error) {
                            console.error('[USPS Config] Disconnect error:', error)
                            setSyncing(false)
                            setSyncStage('idle')
                          }
                        }}
                        disabled={syncing}
                        className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                  {/* Info Banner - Collapsible */}
                  <div className="rounded-md bg-blue-50 border border-blue-200">
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-md"
                    >
                      <div className="flex items-center">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3" />
                        <h3 className="text-sm font-medium text-blue-800">
                          Getting Started with USPS Developer Portal
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
                            <p className="font-medium mb-1">Step 1: Create or sign in</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Go to <a href="https://cop.usps.com/cop-navigator?wf=API&showCC=false" target="_blank" rel="noopener noreferrer" className="underline font-medium">Customer Onboarding Portal</a></li>
                              <li>Create New Account or Sign in</li>
                              <li>Complete your business account setup if needed</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-medium mb-1">Step 2: Connect with USPS API</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Click on <strong>"Enroll in SHIP/USPS APIs"</strong> button</li>
                              <li>Click on <strong>"Ship with APIs"</strong></li>
                              <li>Click <strong>"Add App"</strong> button</li>
                              <li>Enter App Name: "Order Management System"</li>
                              <li>Enter Callback URL: <code className="bg-white px-1 rounded text-xs font-mono">https://orders-warehouse.adv.design/api/auth/usps/callback</code></li>
                              <li>Select <strong>"Public Access I - quota (60 request per hour)"</strong></li>
                              <li>Accept Terms and Conditions</li>
                              <li>Click <strong>"Add App"</strong></li>
                              <li>Click <strong>"Request Mailer ID"</strong></li>
                              <li>Select <strong>Associate new Mailer ID to a CRID</strong></li>
                              <li>Select <strong>Select Enterprise Payment Account</strong></li>
                              <li>Under Request Mailer IDs check the 2 checkbox "Outbound" and "Returns"</li>
                              <li>Click <strong>"Request Mailer ID"</strong> button</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-medium mb-1">Step 3: Get Your Credentials</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Find your app in the Developer Portal</li>
                              <li>Copy your <strong>Consumer Key</strong></li>
                              <li>Copy your <strong>Consumer Secret</strong></li>
                              <li>Enter them in the fields below</li>
                              <li>Click "Test Connection" to verify (after approval)</li>
                              <li>Click "Save Configuration"</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Environment Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Environment
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('sandbox')}
                        disabled={syncing}
                        className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          config.environment === 'sandbox'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${
                          config.environment === 'sandbox' ? 'opacity-100' : 'opacity-50'
                        }`}>
                          🧪
                        </div>
                        <div className="text-sm font-medium text-gray-900">Sandbox (CAT)</div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          Customer Acceptance Testing
                        </div>
                        {config.environment === 'sandbox' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('production')}
                        disabled={syncing}
                        className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          config.environment === 'production'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${
                          config.environment === 'production' ? 'opacity-100' : 'opacity-50'
                        }`}>
                          🚀
                        </div>
                        <div className="text-sm font-medium text-gray-900">Production</div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          Live shipping & billing
                        </div>
                        {config.environment === 'production' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Consumer Key - Only show when not connected */}
                  {integration.status !== 'connected' && (
                    <div>
                      <label htmlFor="consumerKey" className="block text-sm font-medium text-gray-700 mb-1">
                        Consumer Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="consumerKey"
                        value={config.consumerKey}
                        onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                        disabled={syncing}
                        placeholder="Enter your USPS Consumer Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Found in your USPS Developer Portal under "Apps"
                      </p>
                    </div>
                  )}

                  {/* Consumer Secret - Only show when not connected */}
                  {integration.status !== 'connected' && (
                    <div>
                      <label htmlFor="consumerSecret" className="block text-sm font-medium text-gray-700 mb-1">
                        Consumer Secret <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? 'text' : 'password'}
                          id="consumerSecret"
                          value={config.consumerSecret}
                          onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                          disabled={syncing}
                          placeholder="Enter your USPS Consumer Secret"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          disabled={syncing}
                          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          {showSecret ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Keep this secret secure - treat it like a password
                      </p>
                    </div>
                  )}

                  {/* Test Result */}
                  {testResult && !syncing && (
                    <div className={`rounded-md p-4 ${
                      testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? '✓ ' : '✗ '}
                        {testResult.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleTest}
                      disabled={
                        integration.status === 'connected'
                          ? testing || syncing  // ✅ When connected, only disable during testing/syncing
                          : !isConfigValid || testing || syncing  // When not connected, check validation
                      }
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {testing ? 'Testing Connection...' : 'Test Connection'}
                    </button>

                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        disabled={syncing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={
                          integration.status === 'connected'
                            ? syncing  // ✅ When connected, only disable during syncing
                            : !isConfigValid || syncing  // When not connected, check validation
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {integration.status === 'connected' && !environmentChanged
                          ? 'Sync USPS'
                          : integration.status === 'connected' && environmentChanged
                          ? 'Reconnect USPS'
                          : 'Connect to USPS'}
                      </button>
                    </div>
                  </div>

                  {/* Progress Notification - Appears below buttons */}
                  {syncing && currentStageInfo && (
                    <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{currentStageInfo.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            syncStage === 'success' ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {currentStageInfo.text}
                          </p>
                          {syncStage !== 'success' && (
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
    </Transition>
  )
}
