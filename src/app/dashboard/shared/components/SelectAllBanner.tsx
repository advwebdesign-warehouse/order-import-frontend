// File path: app/dashboard/shared/components/SelectAllBanner.tsx

'use client'

import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SelectAllBannerProps {
  currentPageCount: number
  totalCount: number
  allSelected: boolean
  onSelectAll: () => void
  onClear: () => void
  itemName?: string // e.g., "products", "orders", "customers"
}

export default function SelectAllBanner({
  currentPageCount,
  totalCount,
  allSelected,
  onSelectAll,
  onClear,
  itemName = 'items'
}: SelectAllBannerProps) {
  // Don't show banner if no items are selected or if already selected all
  if (currentPageCount === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            {allSelected ? (
              <span className="text-blue-900">
                <span className="font-semibold">All {totalCount} {itemName}</span> are selected.
              </span>
            ) : (
              <span className="text-blue-900">
                All <span className="font-semibold">{currentPageCount} {itemName}</span> on this page are selected.{' '}
                <button
                  onClick={onSelectAll}
                  className="font-semibold text-blue-700 hover:text-blue-800 underline"
                >
                  Select all {totalCount} {itemName}
                </button>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClear}
          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors"
          title="Clear selection"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
