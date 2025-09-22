//file path: app/dashboard/warehouses/[id]/layout/components/LayoutStats.tsx
'use client'

import { Zone, LayoutStats } from '../../../utils/warehouseTypes'
import {
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface LayoutStatsProps {
  stats: LayoutStats | null
  zones: Zone[]
}

export default function LayoutStatsComponent({ stats, zones }: LayoutStatsProps) {
  if (!stats) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Layout Statistics</h3>
        <p className="text-sm text-gray-500">No layout data available</p>
      </div>
    )
  }

  // Calculate utilization status
  const getUtilizationStatus = (rate: number) => {
    if (rate >= 90) return { color: 'red', status: 'Critical', icon: ExclamationTriangleIcon }
    if (rate >= 70) return { color: 'yellow', status: 'High', icon: ExclamationTriangleIcon }
    if (rate >= 40) return { color: 'green', status: 'Good', icon: CheckCircleIcon }
    return { color: 'blue', status: 'Low', icon: CheckCircleIcon }
  }

  const utilizationStatus = getUtilizationStatus(stats.utilizationRate)
  const StatusIcon = utilizationStatus.icon

  // Zone type breakdown
  const zoneTypeBreakdown = zones.reduce((acc, zone) => {
    acc[zone.type] = (acc[zone.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statCards = [
    {
      name: 'Total Zones',
      value: stats.totalZones,
      icon: BuildingOffice2Icon,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Total Aisles',
      value: stats.totalAisles,
      icon: ClipboardDocumentListIcon,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      name: 'Total Shelves',
      value: stats.totalShelves,
      icon: RectangleStackIcon,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      name: 'Storage Bins',
      value: stats.totalBins,
      icon: ArchiveBoxIcon,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Layout Statistics</h3>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-5 w-5 text-${utilizationStatus.color}-500`} />
            <span className={`text-sm font-medium text-${utilizationStatus.color}-700`}>
              {utilizationStatus.status} Utilization
            </span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-4`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <dt className={`text-sm font-medium text-${stat.color}-600 truncate`}>
                      {stat.name}
                    </dt>
                    <dd className={`text-2xl font-bold text-${stat.color}-900`}>
                      {stat.value.toLocaleString()}
                    </dd>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Utilization Details */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Storage Utilization</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Occupied Bins</span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.occupiedBins}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Empty Bins</span>
                <span className="text-lg font-semibold text-gray-900">
                  {stats.emptyBins}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Utilization Rate</span>
                <span className={`text-lg font-semibold text-${utilizationStatus.color}-700`}>
                  {stats.utilizationRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Storage Capacity</span>
              <span>{stats.occupiedBins} / {stats.totalBins} bins</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  stats.utilizationRate >= 90
                    ? 'bg-red-500'
                    : stats.utilizationRate >= 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Zone Breakdown */}
      {Object.keys(zoneTypeBreakdown).length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Zone Types</h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(zoneTypeBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {type.replace('_', ' ')}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {count} zone{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h4>
        <div className="space-y-3">
          {stats.utilizationRate >= 90 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-red-800">Storage Critical</h5>
                <p className="text-sm text-red-700">
                  Your warehouse is at {stats.utilizationRate}% capacity. Consider adding more storage locations or optimizing existing space.
                </p>
              </div>
            </div>
          )}

          {stats.utilizationRate < 40 && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-blue-800">Low Utilization</h5>
                <p className="text-sm text-blue-700">
                  Your warehouse is only {stats.utilizationRate}% utilized. Consider consolidating inventory or using excess space for new product lines.
                </p>
              </div>
            </div>
          )}

          {stats.totalZones === 1 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <BuildingOffice2Icon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-yellow-800">Single Zone Layout</h5>
                <p className="text-sm text-yellow-700">
                  Consider creating specialized zones (receiving, shipping, returns) to improve workflow efficiency.
                </p>
              </div>
            </div>
          )}

          {stats.totalAisles === 0 && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-medium text-gray-800">No Aisles Configured</h5>
                <p className="text-sm text-gray-700">
                  Add aisles to your zones to create organized storage locations and improve inventory management.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
