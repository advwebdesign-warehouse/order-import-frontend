//file path: src/app/dashboard/shared/components/StoreSelector.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'

interface Store {
  id: string
  companyName: string
  storeName?: string
}

interface StoreSelectorProps {
  stores: Store[]
  selectedStoreIds: string[]
  onStoreChange: (storeIds: string[]) => void
  className?: string
  disabled?: boolean
  allowMultiple?: boolean
}

export default function StoreSelector({
  stores,
  selectedStoreIds,
  onStoreChange,
  className = '',
  disabled = false,
  allowMultiple = true
}: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getDisplayText = () => {
    if (selectedStoreIds.length === 0) {
      return 'All Stores'
    }
    if (selectedStoreIds.length === 1) {
      const store = stores.find(s => s.id === selectedStoreIds[0])
      return store ? (store.storeName || store.companyName) : 'Select Store'
    }
    return `${selectedStoreIds.length} stores selected`
  }

  const handleStoreToggle = (storeId: string) => {
    if (allowMultiple) {
      if (storeId === '') {
        // "All Stores" selected
        onStoreChange([])
      } else {
        const newSelection = selectedStoreIds.includes(storeId)
          ? selectedStoreIds.filter(id => id !== storeId)
          : [...selectedStoreIds, storeId]
        onStoreChange(newSelection)
      }
    } else {
      onStoreChange(storeId === '' ? [] : [storeId])
      setIsOpen(false)
    }
  }

  const isStoreSelected = (storeId: string) => {
    if (storeId === '') {
      return selectedStoreIds.length === 0
    }
    return selectedStoreIds.includes(storeId)
  }

  if (stores.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No stores available
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative w-full cursor-pointer rounded-md border-0 bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center">
          <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          <span className="block truncate">{getDisplayText()}</span>
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {/* All Stores Option */}
          <div
            onClick={() => handleStoreToggle('')}
            className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 ${
              isStoreSelected('') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="block font-medium">All Stores</span>
                <span className="block text-xs text-gray-500">
                  View orders from all stores
                </span>
              </div>
            </div>
            {isStoreSelected('') && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>

          {/* Individual Stores */}
          {stores.map((store) => (
            <div
              key={store.id}
              onClick={() => handleStoreToggle(store.id)}
              className={`relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100 ${
                isStoreSelected(store.id) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center">
                <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="block font-medium truncate">
                    {store.storeName || store.companyName}
                  </span>
                </div>
              </div>
              {isStoreSelected(store.id) && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
