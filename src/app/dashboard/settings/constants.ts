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
  { id: '1', value: 'PENDING', label: 'Pending', color: 'bg-gray-100 text-gray-800', needsShipping: true, isSystem: true, sortOrder: 1 },
  { id: '2', value: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-100 text-blue-800', needsShipping: true, isSystem: false, sortOrder: 2 },
  { id: '3', value: 'PROCESSING', label: 'Processing', color: 'bg-blue-100 text-blue-800', needsShipping: true, isSystem: true, sortOrder: 3 },
  { id: '4', value: 'PICKING', label: 'Picking', color: 'bg-yellow-100 text-yellow-800', needsShipping: true, isSystem: false, sortOrder: 4 },
  { id: '5', value: 'PACKING', label: 'Packing', color: 'bg-yellow-100 text-yellow-800', needsShipping: true, isSystem: false, sortOrder: 5 },
  { id: '6', value: 'PACKED', label: 'Packed', color: 'bg-indigo-100 text-indigo-800', needsShipping: true, isSystem: false, sortOrder: 6 },
  { id: '7', value: 'READY_TO_SHIP', label: 'Ready to Ship', color: 'bg-purple-100 text-purple-800', needsShipping: true, isSystem: false, sortOrder: 7 },
  { id: '8', value: 'SHIPPED', label: 'Shipped', color: 'bg-green-100 text-green-800', needsShipping: false, isSystem: true, sortOrder: 8 },
  { id: '9', value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800', needsShipping: false, isSystem: true, sortOrder: 9 },
  { id: '10', value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800', needsShipping: false, isSystem: true, sortOrder: 10 },
]

export const AVAILABLE_COLORS: ColorOption[] = [
  { value: 'bg-gray-100 text-gray-800', label: 'Gray', preview: 'bg-gray-100 text-gray-800' },
  { value: 'bg-red-100 text-red-800', label: 'Red', preview: 'bg-red-100 text-red-800' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow', preview: 'bg-yellow-100 text-yellow-800' },
  { value: 'bg-green-100 text-green-800', label: 'Green', preview: 'bg-green-100 text-green-800' },
  { value: 'bg-blue-100 text-blue-800', label: 'Blue', preview: 'bg-blue-100 text-blue-800' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Indigo', preview: 'bg-indigo-100 text-indigo-800' },
  { value: 'bg-purple-100 text-purple-800', label: 'Purple', preview: 'bg-purple-100 text-purple-800' },
  { value: 'bg-pink-100 text-pink-800', label: 'Pink', preview: 'bg-pink-100 text-pink-800' },
  { value: 'bg-orange-100 text-orange-800', label: 'Orange', preview: 'bg-orange-100 text-orange-800' },
  { value: 'bg-teal-100 text-teal-800', label: 'Teal', preview: 'bg-teal-100 text-teal-800' },
]
