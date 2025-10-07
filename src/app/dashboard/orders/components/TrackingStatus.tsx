//file path: app/dashboard/orders/components/TrackingStatus.tsx

'use client'

import { useState } from 'react'
import {
  TruckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { ShippingLabel } from '../utils/orderTypes'

interface TrackingStatusProps {
  shippingLabel: ShippingLabel
  onRefresh?: () => void
}

export default function TrackingStatus({ shippingLabel, onRefresh }: TrackingStatusProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!onRefresh) return

    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusConfig = () => {
    switch (shippingLabel.trackingCategory) {
      case 'delivered':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Delivered'
        }
      case 'out_for_delivery':
        return {
          icon: TruckIcon,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Out for Delivery'
        }
      case 'in_transit':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'In Transit'
        }
      case 'exception':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Exception'
        }
      default:
        return {
          icon: TruckIcon,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Shipped'
        }
    }
  }

  const config = getStatusConfig()
  const StatusIcon = config.icon

  return (
    <div className={`border ${config.border} ${config.bg} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <StatusIcon className={`h-6 w-6 ${config.color} mt-0.5`} />
          <div>
            <h4 className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </h4>
            <p className="text-sm text-gray-700 mt-1">
              {shippingLabel.trackingStatus || 'No tracking information available'}
            </p>
            {shippingLabel.trackingLocation && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {shippingLabel.trackingLocation}
              </p>
            )}
            {shippingLabel.trackingLastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {new Date(shippingLabel.trackingLastUpdate).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh tracking"
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Tracking Events */}
      {shippingLabel.trackingEvents && shippingLabel.trackingEvents.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Tracking History</h5>
          <div className="space-y-2">
            {shippingLabel.trackingEvents.slice(0, 3).map((event, index) => (
              <div key={index} className="flex items-start space-x-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">{event.status}</p>
                  <p className="text-gray-500">{event.location}</p>
                  <p className="text-gray-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tracking Number */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Tracking #: <span className="font-mono font-medium text-gray-700">{shippingLabel.trackingNumber}</span>
        </p>
      </div>
    </div>
  )
}
