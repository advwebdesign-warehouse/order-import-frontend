//file path: app/dashboard/settings/types/fulfillmentTypes.ts

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
    color: 'Pending',
    needsShipping: true,
    needsPicking: true,  // NEW: Add default value
    type: 'system',
    isEditable: false
  },
  {
    id: '2',
    order: 2,
    label: 'Assigned',
    code: 'ASSIGNED',
    color: 'Assigned',
    needsShipping: true,
    needsPicking: true,  // NEW: Add default value
    type: 'custom',
    isEditable: true
  },
  {
    id: '3',
    order: 3,
    label: 'Processing',
    code: 'PROCESSING',
    color: 'Processing',
    needsShipping: true,
    needsPicking: true,  // NEW: Add default value
    type: 'system',
    isEditable: false
  },
  {
    id: '4',
    order: 4,
    label: 'Picking',
    code: 'PICKING',
    color: 'Picking',
    needsShipping: true,
    needsPicking: false,  // NEW: Already picked
    type: 'custom',
    isEditable: true
  },
  {
    id: '5',
    order: 5,
    label: 'Packing',
    code: 'PACKING',
    color: 'Packing',
    needsShipping: true,
    needsPicking: false,  // NEW: Already picked
    type: 'custom',
    isEditable: true
  },
  {
    id: '6',
    order: 6,
    label: 'Packed',
    code: 'PACKED',
    color: 'Packed',
    needsShipping: true,
    needsPicking: false,  // NEW: Already picked
    type: 'custom',
    isEditable: true
  },
  {
    id: '7',
    order: 7,
    label: 'Ready to Ship',
    code: 'READY_TO_SHIP',
    color: 'Ready to Ship',
    needsShipping: true,
    needsPicking: false,  // NEW: Already picked
    type: 'custom',
    isEditable: true
  },
  {
    id: '8',
    order: 8,
    label: 'Shipped',
    code: 'SHIPPED',
    color: 'Shipped',
    needsShipping: false,
    needsPicking: false,  // NEW: Already picked and shipped
    type: 'system',
    isEditable: false
  }
]
