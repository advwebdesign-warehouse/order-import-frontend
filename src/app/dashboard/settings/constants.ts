//file path: app/dashboard/settings/constants.ts

import {
  TruckIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { FulfillmentStatus, ColorOption, SettingsTab } from './types'

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'fulfillment', name: 'Fulfillment', icon: TruckIcon },
  { id: 'notifications', name: 'Notifications', icon: BellIcon }
]

export const DEFAULT_FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  {
    id: '1',
    order: 1,
    label: 'Pending',
    code: 'PENDING',
    color: 'bg-gray-100 text-gray-800',
    needsShipping: true,
    needsPicking: true,
    type: 'system',
    isEditable: false
  },
  {
    id: '3',
    order: 2,
    label: 'Processing',
    code: 'PROCESSING',
    color: 'bg-blue-100 text-blue-800',
    needsShipping: true,
    needsPicking: true,
    type: 'system',
    isEditable: false
  },
  {
    id: '4',
    order: 3,
    label: 'Picking',
    code: 'PICKING',
    color: 'bg-yellow-100 text-yellow-800',
    needsShipping: true,
    needsPicking: false,
    type: 'custom',
    isEditable: true
  },
  {
    id: '5',
    order: 4,
    label: 'Packing',
    code: 'PACKING',
    color: 'bg-orange-100 text-orange-800',
    needsShipping: true,
    needsPicking: false,
    type: 'custom',
    isEditable: true
  },
  {
    id: '6',
    order: 5,
    label: 'Packed',
    code: 'PACKED',
    color: 'bg-indigo-100 text-indigo-800',
    needsShipping: true,
    needsPicking: false,
    type: 'custom',
    isEditable: true
  },
  {
    id: '7',
    order: 6,
    label: 'Ready to Ship',
    code: 'READY_TO_SHIP',
    color: 'bg-purple-100 text-purple-800',
    needsShipping: true,
    needsPicking: false,
    type: 'custom',
    isEditable: true
  },
  {
    id: '8',
    order: 7,
    label: 'Shipped',
    code: 'SHIPPED',
    color: 'bg-green-100 text-green-800',
    needsShipping: false,
    needsPicking: false,
    type: 'system',
    isEditable: false
  },
  {
    id: '9',
    order: 8,
    label: 'Delivered',
    code: 'DELIVERED',
    color: 'bg-green-100 text-green-800',
    needsShipping: false,
    needsPicking: false,
    type: 'system',
    isEditable: false
  },
  {
    id: '10',
    order: 9,
    label: 'Cancelled',
    code: 'CANCELLED',
    color: 'bg-red-100 text-red-800',
    needsShipping: false,
    needsPicking: false,
    type: 'system',
    isEditable: false
  }
]

export const AVAILABLE_COLORS: ColorOption[] = [
  { value: 'bg-gray-100 text-gray-800', label: 'Gray' },
  { value: 'bg-red-100 text-red-800', label: 'Red' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { value: 'bg-green-100 text-green-800', label: 'Green' },
  { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Indigo' },
  { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
  { value: 'bg-pink-100 text-pink-800', label: 'Pink' },
  { value: 'bg-orange-100 text-orange-800', label: 'Orange' },
  { value: 'bg-cyan-100 text-cyan-800', label: 'Cyan' }
]
