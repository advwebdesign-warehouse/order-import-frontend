//file path: src/app/dashboard/integrations/page.tsx

'use client'

import { useState } from 'react'
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useIntegrations } from './hooks/useIntegrations'
import IntegrationCard from './components/IntegrationCard'
import USPSConfigModal from './components/USPSConfigModal'
import { Integration } from './types/integrationTypes'

export default function IntegrationsPage() {
  const { settings, loading, updateIntegration, testIntegration } = useIntegrations()
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } | null }>({})

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

  /**
   * Get default config for disconnecting an integration
   * Preserves user preferences while clearing credentials
   */
  const getDisconnectedConfig = (integration: Integration): any => {
    if (integration.type === 'shipping') {
      // All shipping integrations follow similar pattern
      // Preserve environment settings, clear credentials
      return {
        ...integration.config,
        consumerKey: '',
        consumerSecret: '',
        accessToken: undefined,
        tokenExpiry: undefined
      }
    }

    if (integration.type === 'ecommerce') {
      // Ecommerce integrations - clear all
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

    // Default: clear all config
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
    // Clear any existing result for this integration
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

    // Auto-dismiss after 5 seconds
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
              />

              {/* Test Result Message - Shows under the card */}
              {testResults[integration.id] && (
                <div
                  className={`mt-2 px-4 py-2 rounded-md text-sm font-medium animate-fade-in ${
                    testResults[integration.id]?.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {testResults[integration.id]?.success ? '✓ ' : '✗ '}
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
                />

                {/* Test Result Message - Shows under the card */}
                {testResults[integration.id] && (
                  <div
                    className={`mt-2 px-4 py-2 rounded-md text-sm font-medium animate-fade-in ${
                      testResults[integration.id]?.success
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {testResults[integration.id]?.success ? '✓ ' : '✗ '}
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
            More integrations coming soon: FedEx, UPS, DHL, Amazon, eBay, and more
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
        </>
      )}
    </div>
  )
}
