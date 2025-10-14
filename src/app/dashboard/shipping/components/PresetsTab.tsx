//file path: app/dashboard/shipping/components/PresetsTab.tsx

'use client'

interface PresetsTabProps {
  selectedWarehouseId: string
}

export default function PresetsTab({ selectedWarehouseId }: PresetsTabProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Presets</h3>
      <p className="text-gray-600 mb-4">
        Coming soon - Create shipping templates and automation rules
        {selectedWarehouseId && ' for this warehouse'}
      </p>
      <div className="text-sm text-gray-500">
        Features: Default carrier selection, auto-box selection, shipping rules by weight/destination
      </div>
    </div>
  )
}
