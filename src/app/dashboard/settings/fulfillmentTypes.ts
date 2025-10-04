//file path: app/dashboard/settings/fulfillmentTypes.ts

export interface FulfillmentStatus {
  id: string
  order: number
  label: string
  code: string
  color: string
  needsShipping: boolean
  needsPicking: boolean  // NEW: Add this field
  type: 'system' | 'custom'
  isEditable: boolean
  createdAt?: string
  updatedAt?: string
}

export interface FulfillmentStatusFormData {
  label: string
  code: string
  color: string
  needsShipping: boolean
  needsPicking: boolean  // NEW: Add this field
}

export const DEFAULT_FULFILLMENT_STATUSES: FulfillmentStatus[] = [
  {
    id: '1',
    order: 1,
    label: 'Pending',
    code: 'PENDING',
    color: 'bg-gray-100 text-gray-800',  // ✅ Actual Tailwind class
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
    color: 'bg-blue-100 text-blue-800',  // ✅ Actual Tailwind class
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
    color: 'bg-yellow-100 text-yellow-800',  // ✅ Actual Tailwind class
    needsShipping: true,
    needsPicking: false,
    type: 'system',
    isEditable: true
  },
  {
    id: '5',
    order: 4,
    label: 'Packing',
    code: 'PACKING',
    color: 'bg-orange-100 text-orange-800',  // ✅ Actual Tailwind class
    needsShipping: true,
    needsPicking: false,
    type: 'system',
    isEditable: true
  },
  {
    id: '6',
    order: 5,
    label: 'Packed',
    code: 'PACKED',
    color: 'bg-indigo-100 text-indigo-800',  // ✅ Actual Tailwind class
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
    color: 'bg-purple-100 text-purple-800',  // ✅ Actual Tailwind class
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
    color: 'bg-green-100 text-green-800',  // ✅ Actual Tailwind class
    needsShipping: false,
    needsPicking: false,
    type: 'system',
    isEditable: false
  }
]
