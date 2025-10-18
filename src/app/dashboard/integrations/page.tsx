//file path: src/app/dashboard/integrations/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
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
import { Integration } from './types/integrationTypes'

function IntegrationsContent() {
  const searchParams = useSearchParams()
  const { settings, loading, updateIntegration, testIntegration } = useIntegrations()
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } | null }>({})
  const [testingId, setTestingId] = useState<string | null>(null)

  // Handle UPS OAuth callback success - MUST BE HERE AT THE TOP WITH OTHER HOOKS
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
      alert(`UPS connection failed: ${upsError}${upsErrorDescription ? ` - ${upsErrorDescription}` : ''}`)
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
  }, [searchParams, updateIntegration])

  const handleConfigureClick = (integration: Integration) => {
    setSelectedIntegration(integration)
    setShowConfigModal(true)
  }

  const handleSaveConfig = async (integrationId: string, config: any) => {
    const success = updateIntegration(integrationId, {
      config,
      status: 'connected',
      enabled: true,
      connectedAt: new Date().toISOString()
    })

    if (success) {
      setShowConfigModal(false)
      setSelectedIntegration(null)
    }
  }

  const handleToggleEnabled = async (integration: Integration) => {
    updateIntegration(integration.id, {
      enabled: !integration.enabled
    })
  }

  const getDisconnectedConfig = (integration: Integration): any => {
    if (integration.type === 'shipping') {
      return {
        ...integration.config,
        consumerKey: '',
        consumerSecret: '',
        accessToken: undefined,
        tokenExpiry: undefined
      }
    }

    if (integration.type === 'ecommerce') {
      const baseConfig: any = {}

      if (integration.name === 'Shopify') {
        baseConfig.shopUrl = ''
        baseConfig.accessToken = ''
        baseConfig.apiKey = ''
      } else if (integration.name === 'WooCommerce') {
        baseConfig.storeUrl = ''
        baseConfig.consumerKey = ''
        baseConfig.consumerSecret = ''
      }

      return baseConfig
    }

    return {}
  }

  const handleDisconnect = async (integration: Integration) => {
    if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      updateIntegration(integration.id, {
        status: 'disconnected',
        enabled: false,
        config: getDisconnectedConfig(integration)
      })
    }
  }

  const handleTestConnection = async (integration: Integration) => {
    // Handle UPS OAuth test separately
    if (integration.id === 'ups') {
      // ✅ READ FRESH DATA FROM LOCALSTORAGE
      const stored = localStorage.getItem('orderSync_integrations')
      const freshIntegration = stored
        ? JSON.parse(stored).integrations.find((i: Integration) => i.id === 'ups')
        : null

      console.log('[Test] Fresh integration from localStorage:', freshIntegration)
      console.log('[Test] Has accessToken?', !!freshIntegration?.config?.accessToken)

      // ✅ Type guard: Check if this is a UPS integration with accessToken
      if (!freshIntegration || freshIntegration.name !== 'UPS' || !freshIntegration.config?.accessToken) {
        console.log('[Test] ❌ No access token found!')
        setTestResults(prev => ({
          ...prev,
          ups: { success: false, message: 'Please connect to UPS first by clicking "Configure"' }
        }))

        setTimeout(() => {
          setTestResults(prev => ({
            ...prev,
            ups: null
          }))
        }, 5000)
        return
      }

      setTestingId(integration.id)
      setTestResults(prev => ({
        ...prev,
        [integration.id]: null
      }))

      try {
        const response = await fetch('/api/integrations/ups/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: freshIntegration.config.accessToken,
            environment: freshIntegration.config.environment
          })
        })

        const data = await response.json()

        if (data.success) {
          setTestResults(prev => ({
            ...prev,
            ups: { success: true, message: '✅ UPS connection verified successfully!' }
          }))

          updateIntegration(integration.id, {
            status: 'connected',
            lastSyncAt: new Date().toISOString()
          })
        } else {
          setTestResults(prev => ({
            ...prev,
            ups: { success: false, message: `❌ ${data.error || 'Connection test failed'}` }
          }))

          updateIntegration(integration.id, {
            status: 'error'
          })
        }
      } catch (error) {
        setTestResults(prev => ({
          ...prev,
          ups: { success: false, message: '❌ Failed to test UPS connection' }
        }))

        updateIntegration(integration.id, {
          status: 'error'
        })
      } finally {
        setTestingId(null)

        setTimeout(() => {
          setTestResults(prev => ({
            ...prev,
            ups: null
          }))
        }, 5000)
      }
      return
    }

    // Handle other integrations (USPS, etc.)
    setTestResults(prev => ({
      ...prev,
      [integration.id]: null
    }))

    const result = await testIntegration(integration.id)

    if (result) {
      setTestResults(prev => ({
        ...prev,
        [integration.id]: { success: true, message: 'Connection successful!' }
      }))

      updateIntegration(integration.id, {
        status: 'connected',
        lastSyncAt: new Date().toISOString()
      })
    } else {
      setTestResults(prev => ({
        ...prev,
        [integration.id]: { success: false, message: 'Connection failed. Please check your credentials.' }
      }))

      updateIntegration(integration.id, {
        status: 'error'
      })
    }

    setTimeout(() => {
      setTestResults(prev => ({
        ...prev,
        [integration.id]: null
      }))
    }, 5000)
  }

  const shippingIntegrations = settings.integrations.filter(i => i.type === 'shipping')
  const ecommerceIntegrations = settings.integrations.filter(i => i.type === 'ecommerce')

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
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
            Browse Integrations
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                    {settings.integrations.filter(i => i.status === 'connected').length}
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
                    {settings.integrations.filter(i => i.status === 'disconnected').length}
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
                    {settings.integrations.filter(i => i.status === 'error').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Integrations */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping & Logistics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shippingIntegrations.map((integration) => (
            <div key={integration.id}>
              <IntegrationCard
                integration={integration}
                onConfigure={() => handleConfigureClick(integration)}
                onToggle={() => handleToggleEnabled(integration)}
                onDisconnect={() => handleDisconnect(integration)}
                onTest={() => handleTestConnection(integration)}
                isTesting={testingId === integration.id}
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
          ))}
        </div>
      </div>

      {/* E-commerce Integrations */}
      {ecommerceIntegrations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">E-commerce Platforms</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ecommerceIntegrations.map((integration) => (
              <div key={integration.id}>
                <IntegrationCard
                  integration={integration}
                  onConfigure={() => handleConfigureClick(integration)}
                  onToggle={() => handleToggleEnabled(integration)}
                  onDisconnect={() => handleDisconnect(integration)}
                  onTest={() => handleTestConnection(integration)}
                  isTesting={testingId === integration.id}
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
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Coming Soon</h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500">
            More integrations coming soon: FedEx, DHL, Amazon, eBay, and more
          </p>
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <>
          {selectedIntegration.id === 'usps' && (
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

          {selectedIntegration.id === 'ups' && (
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
