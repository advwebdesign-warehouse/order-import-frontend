//file path: src/app/dashboard/integrations/components/UPSConfigModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, InformationCircleIcon, ChevronDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { UPSIntegration, Environment } from '../types/integrationTypes'

interface UPSConfigModalProps {
  isOpen: boolean
  onClose: () => void
  integration: UPSIntegration
  onSave: (integrationId: string, config: any) => void
}

// Progress stages for visual feedback
type SyncStage = 'idle' | 'saving-config' | 'updating-boxes' | 'updating-services' | 'success'

export default function UPSConfigModal({
  isOpen,
  onClose,
  integration,
  onSave
}: UPSConfigModalProps) {
  const [accountNumber, setAccountNumber] = useState(integration.config?.accountNumber || '')
  const [environment, setEnvironment] = useState<Environment>(integration.config?.environment || 'sandbox')
  const [showInstructions, setShowInstructions] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStage, setSyncStage] = useState<SyncStage>('idle')

  const isConnected = integration.status === 'connected' && integration.config.accessToken

  const handleConnect = async () => {
    if (!accountNumber || accountNumber.length !== 6) {
      alert('Please enter a valid 6-character UPS Account Number')
      return
    }

    // Check if UPS credentials are configured
    const clientId = process.env.NEXT_PUBLIC_UPS_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_UPS_REDIRECT_URI || 'https://orders-warehouse.adv.design/api/auth/ups/callback'

    if (!clientId) {
      alert('UPS integration is not configured. Please contact support.')
      console.error('❌ Missing NEXT_PUBLIC_UPS_CLIENT_ID environment variable')
      return
    }

    setConnecting(true)

    try {
      // Save account number and environment first
      onSave(integration.id, {
        accountNumber,
        environment,
        apiUrl: environment === 'production'
          ? 'https://onlinetools.ups.com'
          : 'https://wwwcie.ups.com'
      })

      // Generate OAuth URL and redirect
      const state = `ups_${Date.now()}_${environment}`

      // Store state and account info in COOKIES (accessible server-side)
      document.cookie = `ups_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`
      document.cookie = `ups_account_number=${accountNumber}; path=/; max-age=600; SameSite=Lax`
      document.cookie = `ups_environment=${environment}; path=/; max-age=600; SameSite=Lax`

      // Build authorization URL - MUST include redirect_uri!
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'read write',
        state: state
      })

      const baseUrl = environment === 'production'
        ? 'https://www.ups.com'
        : 'https://wwwcie.ups.com'

      const authUrl = `${baseUrl}/security/v1/oauth/authorize?${params.toString()}`

      console.log('========================================')
      console.log('[UPS OAuth] Full Authorization URL:')
      console.log(authUrl)
      console.log('========================================')
      console.log('[UPS OAuth] Client ID:', clientId?.substring(0, 10) + '...')
      console.log('[UPS OAuth] Redirect URI:', redirectUri)
      console.log('[UPS OAuth] State:', state)
      console.log('[UPS OAuth] Environment:', environment)
      console.log('========================================')

      // Redirect to UPS authorization
      window.location.href = authUrl
    } catch (error: any) {
      console.error('❌ Connection error:', error)
      alert(error.message || 'Failed to initiate UPS connection')
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect UPS?')) return

    setSyncing(true)
    setSyncStage('saving-config')

    try {
      // Save disconnected config
      onSave(integration.id, {
        accountNumber: '',
        accessToken: undefined,
        refreshToken: undefined,
        tokenExpiry: undefined,
        environment: 'sandbox',
        apiUrl: 'https://wwwcie.ups.com'
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      // Success
      setSyncStage('success')
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Reload page
      window.location.reload()
    } catch (error) {
      console.error('[UPS Config] Disconnect error:', error)
      setSyncing(false)
      setSyncStage('idle')
    }
  }

  const handleSyncData = async () => {
    if (!integration.config?.accessToken) {
      alert('Please connect to UPS first')
      return
    }

    setSyncing(true)
    setSyncStage('saving-config')

    try {
      // Step 1: Saving configuration (visual only)
      console.log('[UPS Config] Starting sync...')
      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 2: Update Boxes
      setSyncStage('updating-boxes')
      console.log('[UPS Config] Updating boxes...')

      const boxesResponse = await fetch('/api/shipping/boxes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: ['UPS'],
          credentials: {
            accessToken: integration.config.accessToken,
            environment: integration.config.environment
          }
        })
      })

      if (boxesResponse.ok) {
        const boxesData = await boxesResponse.json()
        console.log(`✅ Synced ${boxesData.count} UPS boxes`)

        // Store boxes in localStorage for all warehouses
        if (boxesData.boxes && boxesData.boxes.length > 0) {
          const warehousesStr = localStorage.getItem('warehouses')
          const warehouses = warehousesStr ? JSON.parse(warehousesStr) : []

          if (warehouses.length > 0) {
            warehouses.forEach((warehouse: any) => {
              const storageKey = `shipping_boxes_${warehouse.id}`
              const existingBoxes = localStorage.getItem(storageKey)
              const parsed = existingBoxes ? JSON.parse(existingBoxes) : []

              // Keep custom boxes, replace UPS boxes
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
      console.log('[UPS Config] Updating services...')

      const servicesResponse = await fetch('/api/shipping/services/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carriers: ['UPS'],
          credentials: {
            accessToken: integration.config.accessToken,
            environment: integration.config.environment
          }
        })
      })

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        console.log(`✅ Synced ${servicesData.count} UPS services`)

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
      console.log('[UPS Config] ✅ All sync operations completed successfully')

      // Wait 2 seconds before reloading
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Reload the page to refresh all components
      console.log('[UPS Config] 🔄 Reloading page to refresh data...')
      window.location.reload()
    } catch (error) {
      console.error('[UPS Config] Sync error:', error)
      setSyncing(false)
      setSyncStage('idle')
      alert('Failed to sync data. Please try again.')
    }
  }

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
                      <span className="text-3xl">📦</span>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Configure UPS Integration
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
                  {/* Connection Status */}
                  {isConnected && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-900">✅ Connected</p>
                          <p className="text-sm text-green-700 mt-1">
                            Account: {integration.config.accountNumber}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Environment: {integration.config.environment}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSyncData}
                            disabled={syncing}
                            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sync Data
                          </button>
                          <button
                            onClick={handleDisconnect}
                            disabled={syncing}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="rounded-md bg-blue-50 border border-blue-200">
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors rounded-md"
                    >
                      <div className="flex items-center">
                        <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-3" />
                        <h3 className="text-sm font-medium text-blue-800">
                          How UPS Integration Works
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
                        showInstructions ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4">
                        <div className="text-sm text-blue-700 space-y-3">
                          <div>
                            <p className="font-medium mb-2">🔐 OAuth 2.0 Integration</p>
                            <p className="mb-2">
                              This integration uses secure OAuth 2.0 authorization. You will authorize our platform
                              to access your UPS account without sharing your credentials.
                            </p>
                          </div>

                          <div>
                            <p className="font-medium mb-1">Steps:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                              <li>Enter your <strong>6-character UPS Account Number</strong></li>
                              <li>Select <strong>Sandbox</strong> (testing) or <strong>Production</strong> (live)</li>
                              <li>Click <strong>Connect with UPS</strong></li>
                              <li>You will be redirected to UPS login page</li>
                              <li>Sign in with your UPS credentials</li>
                              <li>Authorize our app to access your account</li>
                              <li>You will be redirected back - all set! 🎉</li>
                            </ol>
                          </div>

                          <div>
                            <p className="font-medium mb-1">🔍 Your UPS Account Number:</p>
                            <p>Found on your UPS invoices or in your UPS account profile.</p>
                          </div>

                          <div className="bg-blue-100 border border-blue-300 rounded p-2">
                            <p className="text-xs">
                              <strong>Need a UPS account?</strong> Visit{' '}
                              <a href="https://www.ups.com/doapp/signup"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-medium"
                              >
                                UPS.com
                              </a>
                              {' '}to create a free shipping account.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Form */}
                  {!isConnected && (
                    <>
                      {/* Environment Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Environment
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setEnvironment('sandbox')}
                            disabled={syncing}
                            className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              environment === 'sandbox'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`text-2xl mb-2 ${
                              environment === 'sandbox' ? 'opacity-100' : 'opacity-50'
                            }`}>
                              🧪
                            </div>
                            <div className="text-sm font-medium text-gray-900">Sandbox</div>
                            <div className="text-xs text-gray-500 mt-1 text-center">
                              Testing Environment
                            </div>
                            {environment === 'sandbox' && (
                              <div className="absolute top-2 right-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEnvironment('production')}
                            disabled={syncing}
                            className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              environment === 'production'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`text-2xl mb-2 ${
                              environment === 'production' ? 'opacity-100' : 'opacity-50'
                            }`}>
                              🚀
                            </div>
                            <div className="text-sm font-medium text-gray-900">Production</div>
                            <div className="text-xs text-gray-500 mt-1 text-center">
                              Live Shipping
                            </div>
                            {environment === 'production' && (
                              <div className="absolute top-2 right-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          UPS Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="accountNumber"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
                          disabled={syncing}
                          placeholder="ENTER 6-CHARACTER ACCOUNT NUMBER"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Found on your UPS invoices (e.g., A12B3C)
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={onClose}
                      disabled={syncing}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isConnected ? 'Close' : 'Cancel'}
                    </button>

                    {!isConnected && (
                      <button
                        onClick={handleConnect}
                        disabled={connecting || syncing || !accountNumber || accountNumber.length !== 6}
                        className="px-6 py-2 text-sm font-medium text-white bg-[#351C15] rounded-md hover:bg-[#4a2920] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {connecting ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Connecting...
                          </>
                        ) : (
                          <>
                            <span>📦</span>
                            Connect with UPS
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Progress Notification - Appears below buttons */}
                  {syncing && currentStageInfo && (
                    <>
                      <style>
                        {`
                          @keyframes slideProgress {
                            0% {
                              transform: translateX(-50%);
                            }
                            100% {
                              transform: translateX(0%);
                            }
                          }
                        `}
                      </style>
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
                    </>
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
