//file path: src/app/dashboard/integrations/components/IntegrationCard.tsx

'use client'

import { useState } from 'react'
import { Switch } from '@headlessui/react'
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { Integration } from '../types/integrationTypes'

// Helper function to get store URL from different integration configs
function getStoreUrl(integration: Integration): string | null {
  if (integration.type !== 'ecommerce') return null

  const config = integration.config as any

  // Shopify uses storeUrl
  if ('storeUrl' in config && config.storeUrl) {
    return config.storeUrl
  }

  // WooCommerce uses storeUrl
  if ('storeUrl' in config && config.storeUrl) {
    return config.storeUrl
  }

  return null
}

interface IntegrationCardProps {
  integration: Integration
  onConfigure: () => void
  onToggle: () => void
  onDisconnect: () => void
  onTest: () => Promise<boolean>
  onDelete: () => void
  isTesting?: boolean
  storeName?: string
}

export default function IntegrationCard({
  integration,
  onConfigure,
  onToggle,
  onDisconnect,
  onTest,
  onDelete,
  isTesting = false,
  storeName
}: IntegrationCardProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [testMessage, setTestMessage] = useState<string>('')

  const statusConfig = {
    connected: {
      icon: CheckCircleIcon,
      color: 'text-green-500',
      bg: 'bg-green-50',
      text: 'Connected'
    },
    disconnected: {
      icon: XCircleIcon,
      color: 'text-gray-400',
      bg: 'bg-gray-50',
      text: 'Not Connected'
    },
    error: {
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
      text: 'Connection Error'
    }
  }

  // ⭐ Handle undefined status (when not in database schema)
  const integrationStatus = integration.status || 'disconnected'
  const status = statusConfig[integrationStatus]
  const StatusIcon = status.icon

  // Handle toggle with connection test
  const handleToggle = async () => {
    if (integration.enabled) {
      onToggle()
      return
    }

    if (integration.status !== 'connected') {
      setTestMessage('Please configure and connect the integration first')
      setTimeout(() => setTestMessage(''), 3000)
      return
    }

    setIsToggling(true)
    setTestMessage('Testing connection...')

    try {
      const testPassed = await onTest()

      if (testPassed) {
        setTestMessage('✅ Test passed! Enabling...')
        onToggle()
        setTimeout(() => setTestMessage(''), 2000)
      } else {
        setTestMessage('❌ Connection test failed. Please check your configuration.')
        setTimeout(() => setTestMessage(''), 4000)
      }
    } catch (error) {
      setTestMessage('❌ Test failed. Please try again.')
      setTimeout(() => setTestMessage(''), 3000)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header with Delete Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {integration.icon && (
              <>
                {integration.icon.startsWith('http') || integration.icon.startsWith('/') ? (
                  <img
                    src={integration.icon}
                    alt={`${integration.name} logo`}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-3xl">{integration.icon}</span>
                )}
              </>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {integration.description}
              </p>

              {/* Shop URL Display for E-commerce Integrations */}
              {(() => {
                const storeUrl = getStoreUrl(integration)
                if (!storeUrl) return null

                return (
                  <div className="mt-2 flex items-center space-x-1 text-xs">
                    <span className="font-medium text-gray-600">Shop:</span>
                    <a
                      href={`https://${storeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      {storeUrl}
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )
              })()}

              {/* Store Name Display */}
              {storeName && (
                <div className="flex items-center mt-2 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded-md w-fit">
                  <BuildingStorefrontIcon className="h-4 w-4 mr-1.5 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700">{storeName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={onDelete}
            className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete integration"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Status with Environment Badge */}
        <div className="mt-4 flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${status.bg}`}>
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
            <span className={`text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>

          {/* Environment Badge */}
          {integration.status === 'connected' &&
           integration.type === 'shipping' &&
           integration.config?.environment && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                integration.config.environment === 'production'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {integration.config.environment === 'production' ? (
                <>
                  <span className="mr-1">🚀</span>
                  Production
                </>
              ) : (
                <>
                  <span className="mr-1">🧪</span>
                  Sandbox
                </>
              )}
            </span>
          )}
        </div>

        {/* Features */}
        {integration.type === 'shipping' && integration.features && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Features</p>
            <div className="flex flex-wrap gap-2">
              {integration.features.labelGeneration && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Label Generation
                </span>
              )}
              {integration.features.rateCalculation && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Rate Calculation
                </span>
              )}
              {integration.features.addressValidation && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Address Validation
                </span>
              )}
              {integration.features.tracking && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  Tracking
                </span>
              )}
            </div>
          </div>
        )}

        {/* Connection Info */}
        {integration.connectedAt && (
          <div className="mt-4 text-xs text-gray-500">
            Connected {new Date(integration.connectedAt).toLocaleDateString()}
          </div>
        )}

        {/* Test Message */}
        {testMessage && (
          <div className={`mt-3 text-xs font-medium ${
            testMessage.includes('✅') ? 'text-green-600' :
            testMessage.includes('❌') ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {testMessage}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onConfigure}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-1" />
              Configure
            </button>

            {integration.status === 'connected' && (
              <>
                <button
                  onClick={onTest}
                  disabled={isTesting}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing...' : 'Test'}
                </button>

                <button
                  onClick={onDisconnect}
                  className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Disconnect"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>

          {/* Smart Toggle for Enable/Disable */}
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${
              integration.status !== 'connected' ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {integration.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <Switch
              checked={integration.enabled}
              onChange={handleToggle}
              disabled={isToggling || (integration.status !== 'connected' && !integration.enabled)}
              className={`${
                integration.enabled ? 'bg-blue-600' :
                integration.status !== 'connected' ? 'bg-gray-200 cursor-not-allowed' :
                'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="sr-only">
                {integration.enabled ? 'Disable' : 'Enable'} integration
              </span>
              <span
                className={`${
                  integration.enabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isToggling ? 'animate-pulse' : ''
                }`}
              />
            </Switch>
          </div>
        </div>
      </div>
    </div>
  )
}
