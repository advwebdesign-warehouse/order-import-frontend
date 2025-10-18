//file path: app/dashboard/integrations/components/IntegrationCard.tsx

'use client'

import { Switch } from '@headlessui/react'
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Integration } from '../types/integrationTypes'

interface IntegrationCardProps {
  integration: Integration
  onConfigure: () => void
  onToggle: () => void
  onDisconnect: () => void
  onTest: () => void
  isTesting?: boolean
}

export default function IntegrationCard({
  integration,
  onConfigure,
  onToggle,
  onDisconnect,
  onTest,
  isTesting = false
}: IntegrationCardProps) {
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

  const status = statusConfig[integration.status]
  const StatusIcon = status.icon

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {integration.icon && (
              <>
                {/* ✅ Check if icon is a URL/path (image) or emoji (text) */}
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {integration.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {integration.description}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${status.bg}`}>
            <StatusIcon className={`h-4 w-4 ${status.color}`} />
            <span className={`text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          {integration.enabled && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              Enabled
            </span>
          )}
        </div>

        {/* Features (for shipping integrations) */}
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

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onConfigure}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-1" />
              Configure
            </button>

            {integration.status === 'connected' && (
              <button
                onClick={onTest}
                disabled={isTesting}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Testing...' : 'Test'}
              </button>
            )}

            {integration.status === 'connected' && (
              <button
                onClick={onDisconnect}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-red-600 hover:text-red-700"
                title="Disconnect"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {integration.status === 'connected' && (
            <Switch
              checked={integration.enabled}
              onChange={onToggle}
              className={`${
                integration.enabled ? 'bg-blue-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  integration.enabled ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          )}
        </div>
      </div>
    </div>
  )
}
