//file path: app/dashboard/shipping/components/AddressesTab.tsx

'use client'

interface AddressesTabProps {
  selectedWarehouseId: string
}

export default function AddressesTab({ selectedWarehouseId }: AddressesTabProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Return Addresses</h3>
      <p className="text-gray-600 mb-4">
        Coming soon - Manage your warehouse and return addresses
        {selectedWarehouseId && ' for this warehouse'}
      </p>
      <div className="text-sm text-gray-500">
        Features: Multiple addresses, default selection, address validation
      </div>
    </div>
  )
}
