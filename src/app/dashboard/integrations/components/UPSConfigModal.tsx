//file path: src/app/dashboard/integrations/components/UPSConfigModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, InformationCircleIcon, ChevronDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getCurrentAccountId } from '@/lib/storage/integrationStorage'
import { UPSIntegration, Environment } from '../types/integrationTypes'

interface UPSConfigModalProps {
  isOpen: boolean
  onClose: () => void
  integration: UPSIntegration
  onSave: (integrationId: string, config: any) => void
  onTest?: () => Promise<{ success: boolean; message: string }>
  isTesting?: boolean
}

// Progress stages for visual feedback
type SyncStage = 'idle' | 'saving-config' | 'updating-boxes' | 'updating-services' | 'success'

export default function UPSConfigModal({
  isOpen,
  onClose,
  integration,
  onSave,
  onTest,
  isTesting = false
}: UPSConfigModalProps) {
  const [accountNumber, setAccountNumber] = useState(integration.config?.accountNumber || '')
  const [environment, setEnvironment] = useState<Environment>(integration.config?.environment || 'sandbox')
  const [showInstructions, setShowInstructions] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStage, setSyncStage] = useState<SyncStage>('idle')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [environmentChanged, setEnvironmentChanged] = useState(false)

  const isConnected = integration.status === 'connected' && integration.config?.accessToken

  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env)

    // Mark that environment changed from original
    if (isConnected && integration.config?.environment !== env) {
      setEnvironmentChanged(true)
    } else {
      setEnvironmentChanged(false)
    }
  }

  const handleTest = async () => {
    if (!onTest) {
      console.warn('[UPS Modal] No onTest handler provided')
      setTestResult({ success: false, message: 'Test function not available' })
      return
    }

    if (!integration.config?.accessToken) {
      setTestResult({
        success: false,
        message: 'No access token found. Please reconnect to UPS.'
      })
      setTimeout(() => setTestResult(null), 3000)
      return
    }

    setTestResult(null)

    try {
      const result = await onTest()
      setTestResult(result)

      setTimeout(() => {
        setTestResult(null)
      }, 5000)
    } catch (error: any) {
      console.error('[UPS Modal] Test failed:', error)
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed'
      })

      setTimeout(() => {
        setTestResult(null)
      }, 5000)
    }
  }

  const handleConnect = async () => {
    if (!accountNumber || accountNumber.length !== 6) {
      alert('Please enter a valid 6-character UPS Account Number')
      return
    }

    const clientId = process.env.NEXT_PUBLIC_UPS_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_UPS_REDIRECT_URI || 'https://orders-warehouse.adv.design/api/auth/ups/callback'

    if (!clientId) {
      alert('UPS integration is not configured. Please contact support.')
      console.error('❌ Missing NEXT_PUBLIC_UPS_CLIENT_ID environment variable')
      return
    }

    setConnecting(true)

    try {
      onSave(integration.id, {
        accountNumber,
        environment,
        apiUrl: environment === 'production'
          ? 'https://onlinetools.ups.com'
          : 'https://wwwcie.ups.com'
      })

      const state = `ups_${Date.now()}_${environment}`

      // ✅ FIX: Add storeId to cookies
      document.cookie = `ups_oauth_state=${state}; path=/; max-age=600; SameSite=Lax`
      document.cookie = `ups_account_number=${accountNumber}; path=/; max-age=600; SameSite=Lax`
      document.cookie = `ups_environment=${environment}; path=/; max-age=600; SameSite=Lax`
      document.cookie = `ups_store_id=${integration.storeId}; path=/; max-age=600; SameSite=Lax`

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'read',
        type: 'ups_com_api',
        state: state
      })

      const authUrl = `https://www.ups.com/lasso/signin?${params.toString()}`

      console.log('[UPS OAuth] Redirecting to UPS authorization...')
      console.log('[UPS OAuth] Store ID saved in cookie:', integration.storeId)
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
                accountNumber: '',
                accessToken: undefined,
                refreshToken: undefined,
                tokenExpiry: undefined,
                environment: 'sandbox',
                apiUrl: 'https://wwwcie.ups.com'
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

        console.log('[UPS Config] ✅ Disconnected for account:', accountId)
      }

      setTimeout(() => {
        setSyncStage('success')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }, 1000)

    } catch (error: any) {
      console.error('❌ Disconnect error:', error)
      alert(error.message || 'Failed to disconnect UPS')
      setSyncing(false)
      setSyncStage('idle')
    }
  }

  const handleSave = async () => {
    if (environmentChanged) {
      if (!confirm('Changing the environment will require reconnecting to UPS. Continue?')) {
        return
      }
      // Disconnect first, then user can reconnect with new environment
      handleDisconnect()
      return
    }

    setSyncing(true)
    setSyncStage('saving-config')

    try {
      // Fetch UPS services
      setSyncStage('updating-services')
      const servicesResponse = await fetch('/api/integrations/ups/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: integration.config?.accessToken,
          environment: integration.config?.environment
        })
      })

      const servicesData = await servicesResponse.json()

      if (!servicesResponse.ok || !servicesData.success) {
        throw new Error(servicesData.error || 'Failed to fetch UPS services')
      }

      console.log('[UPS Config] ✅ Fetched services:', servicesData.services?.length || 0)

      // Fetch UPS packaging
      setSyncStage('updating-boxes')
      const packagingResponse = await fetch('/api/integrations/ups/packaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: integration.config?.accessToken,
          environment: integration.config?.environment
        })
      })

      const packagingData = await packagingResponse.json()

      if (!packagingResponse.ok || !packagingData.success) {
        throw new Error(packagingData.error || 'Failed to fetch UPS packaging')
      }

      console.log('[UPS Config] ✅ Fetched packaging:', packagingData.packaging?.length || 0)

      // Save to localStorage
      const accountId = getCurrentAccountId()
      const storageKey = `orderSync_integrations_${accountId}`
      const stored = localStorage.getItem(storageKey)
      const currentSettings = stored ? JSON.parse(stored) : null

      if (currentSettings) {
        // Update integrations
        const updatedIntegrations = currentSettings.integrations.map((int: any) => {
          if (int.id === integration.id) {
            return {
              ...int,
              services: servicesData.services || [],
              packaging: packagingData.packaging || []
            }
          }
          return int
        })

        localStorage.setItem(storageKey, JSON.stringify({
          ...currentSettings,
          integrations: updatedIntegrations,
          lastUpdated: new Date().toISOString()
        }))

        console.log('[UPS Config] ✅ Saved to localStorage')
      }

      setSyncStage('success')
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error: any) {
      console.error('❌ Save error:', error)
      alert(error.message || 'Failed to sync UPS data')
      setSyncing(false)
      setSyncStage('idle')
    }
  }

  const isConfigValid = accountNumber.length === 6

  // Stage display mapping
  const stageInfo: Record<SyncStage, { icon: string; text: string }> = {
    idle: { icon: '', text: '' },
    'saving-config': { icon: '💾', text: 'Saving configuration...' },
    'updating-boxes': { icon: '📦', text: 'Syncing UPS packaging options...' },
    'updating-services': { icon: '🚚', text: 'Syncing UPS services...' },
    success: { icon: '✅', text: 'Sync complete!' }
  }

  const currentStageInfo = stageInfo[syncStage]

  return (
    <Transition show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30" />
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
                      <img
                        src="/logos/ups-logo.svg"
                        alt="UPS"
                        className="w-10 h-10"
                      />
                      <div className="text-left">
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          UPS Configuration
                        </Dialog.Title>
                        <p className="text-sm text-gray-900 mt-0.5">
                          {isConnected ? 'Manage your UPS integration' : 'Connect your UPS account'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      disabled={syncing}
                      className="text-gray-400 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {/* Connection Status */}
                  {isConnected && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Connected to UPS</p>
                          <p className="text-xs text-green-700 mt-0.5">
                            Account: {integration.config?.accountNumber} • {integration.config?.environment === 'production' ? '🚀 Production' : '🧪 Sandbox'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div>
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="flex items-center justify-between w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100"
                    >
                      <div className="flex items-center">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">
                          {isConnected ? 'Need help?' : 'How to connect UPS'}
                        </span>
                      </div>
                      <ChevronDownIcon
                        className={`h-5 w-5 text-blue-600 transition-transform ${
                          showInstructions ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showInstructions && (
                      <div className="mt-2 rounded-lg border border-blue-200 bg-white overflow-hidden">
                        <div className="px-4 pb-4">
                          <div className="text-sm text-blue-700 space-y-3">
                            <div>
                              <p className="font-medium mb-2">🔐 OAuth 2.0 Integration</p>
                              <p className="mb-2">
                                This integration uses secure OAuth 2.0 authorization.
                              </p>
                            </div>
                            <div>
                              <p className="font-medium mb-1">Steps:</p>
                              <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Enter your <strong>6-character UPS Account Number</strong></li>
                                <li>Select <strong>Sandbox</strong> or <strong>Production</strong></li>
                                <li>Click <strong>Connect to UPS</strong></li>
                                <li>Sign in with your UPS credentials</li>
                                <li>Authorize our app</li>
                                <li>You'll be redirected back! 🎉</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Environment Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Environment</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('sandbox')}
                        disabled={syncing}
                        className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors disabled:opacity-50 ${
                          environment === 'sandbox' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${environment === 'sandbox' ? 'opacity-100' : 'opacity-50'}`}>🧪</div>
                        <div className="text-sm font-medium">Sandbox</div>
                        <div className="text-xs text-gray-500 mt-1">Testing Environment</div>
                        {environment === 'sandbox' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEnvironmentChange('production')}
                        disabled={syncing}
                        className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors disabled:opacity-50 ${
                          environment === 'production' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-2xl mb-2 ${environment === 'production' ? 'opacity-100' : 'opacity-50'}`}>🚀</div>
                        <div className="text-sm font-medium">Production</div>
                        <div className="text-xs text-gray-500 mt-1">Live Shipping</div>
                        {environment === 'production' && (
                          <div className="absolute top-2 right-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Account Number */}
                  {!isConnected && (
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
                        placeholder="Enter 6-character account number"
                        maxLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Found on your UPS invoices
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
                    {isConnected ? (
                      <button
                        onClick={handleTest}
                        disabled={isTesting || syncing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isTesting ? 'Testing Connection...' : 'Test Connection'}
                      </button>
                    ) : (
                      <div></div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        disabled={syncing}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>

                      {isConnected ? (
                        <button
                          onClick={handleSave}
                          disabled={syncing}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {environmentChanged ? 'Reconnect UPS' : 'Sync UPS'}
                        </button>
                      ) : (
                        <button
                          onClick={handleConnect}
                          disabled={connecting || syncing || !isConfigValid}
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
                              Connect to UPS
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Notification */}
                  {syncing && currentStageInfo && (
                    <>
                      <style>{`
                        @keyframes slideProgress {
                          0% { transform: translateX(-50%); }
                          100% { transform: translateX(0%); }
                        }
                      `}</style>
                      <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
                        <div className="flex items-center">
                          <span className="text-xl mr-3">{currentStageInfo.icon}</span>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${syncStage === 'success' ? 'text-green-700' : 'text-blue-700'}`}>
                              {currentStageInfo.text}
                            </p>
                            {syncStage !== 'success' && (
                              <div className="mt-2 w-full bg-blue-200 rounded-full h-2 overflow-hidden relative">
                                <div
                                  className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 rounded-full"
                                  style={{ width: '200%', animation: 'slideProgress 1.5s linear infinite' }}
                                ></div>
                              </div>
                            )}
                          </div>
                          {syncStage === 'success' && <CheckCircleIcon className="h-6 w-6 text-green-600 ml-2" />}
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
