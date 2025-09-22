//file path: app/dashboard/warehouses/[id]/layout/utils/layoutConstants.ts

import {
  ArchiveBoxIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  MapIcon,
  CheckCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { Zone, LocationFormat } from '../../../utils/warehouseTypes'

// Zone types configuration
export const ZONE_TYPES = [
  { value: 'storage', label: 'General Storage', icon: ArchiveBoxIcon, color: '#3B82F6' },
  { value: 'receiving', label: 'Receiving', icon: TruckIcon, color: '#10B981' },
  { value: 'shipping', label: 'Shipping', icon: TruckIcon, color: '#F59E0B' },
  { value: 'returns', label: 'Returns', icon: ExclamationTriangleIcon, color: '#EF4444' },
  { value: 'staging', label: 'Staging', icon: MapIcon, color: '#8B5CF6' },
  { value: 'quality_control', label: 'Quality Control', icon: CheckCircleIcon, color: '#06B6D4' },
  { value: 'custom', label: 'Custom', icon: TagIcon, color: '#6B7280' }
] as const

export const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
]

// Default location format
export const DEFAULT_LOCATION_FORMAT: LocationFormat = {
  pattern: '{zone}-{aisle}-{shelf}-{bin}',
  separator: '-',
  includeZone: true,
  includeAisle: true,
  includeShelf: true,
  includeBin: true
}

// Helper function to get zone type info
export const getZoneTypeInfo = (type: Zone['type']) => {
  return ZONE_TYPES.find(t => t.value === type) || ZONE_TYPES[0]
}
