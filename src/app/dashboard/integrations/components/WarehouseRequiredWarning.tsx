//file path: src/app/dashboard/integrations/components/WarehouseRequiredWarning.tsx

'use client'

import { ExclamationTriangleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface WarehouseRequiredWarningProps {
  storeName: string
  storeId: string
  onClose?: () => void
}

export default function WarehouseRequiredWarning({
  storeName,
  storeId,
  onClose
}: WarehouseRequiredWarningProps) {
  const router = useRouter()

  const handleConfigureWarehouse = () => {
    // Close the current modal if callback provided
    if (onClose) {
      onClose()
    }

    // Navigate to stores page with query params to open the specific store's warehouse config
    router.push(`/dashboard/stores?action=edit&storeId=${storeId}`)
  }

  return (
    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-yellow-800">
            Warehouse Configuration Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700 space-y-2">
            <p>
              Before connecting this integration, you need to configure at least one warehouse for <span className="font-medium">{storeName}</span>.
            </p>
            <p>
              Warehouses are required for order routing and shipping label generation. Orders will be automatically assigned to warehouses based on shipping address.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {/* Primary Action - Configure Warehouse */}
            <button
              type="button"
              onClick={handleConfigureWarehouse}
              className="inline-flex items-center gap-x-2 rounded-md bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600 transition-colors"
            >
              <BuildingOffice2Icon className="h-5 w-5" />
              Configure Warehouse Now
            </button>

            {/* Info Box */}
            <div className="rounded-md bg-yellow-100 p-3 border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">What you'll need:</span>
                    <br />
                    • At least one warehouse location
                    <br />
                    • Default warehouse for fallback
                    <br />
                    • (Optional) Region-based routing for multi-warehouse setups
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
