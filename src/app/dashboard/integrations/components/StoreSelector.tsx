//file path: src/app/dashboard/integrations/components/StoreSelector.tsx

'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, BuildingStorefrontIcon } from '@heroicons/react/20/solid'

interface Store {
  id: string
  companyName: string
  storeName?: string
}

interface StoreSelectorProps {
  stores: Store[]
  selectedStoreId: string
  onStoreChange: (storeId: string) => void
  disabled?: boolean
}

export default function StoreSelector({
  stores,
  selectedStoreId,
  onStoreChange,
  disabled = false
}: StoreSelectorProps) {
  const selectedStore = stores.find(s => s.id === selectedStoreId) || null

  const getDisplayName = (store: Store | null) => {
    if (!store) return 'Select a store...'
    return store.storeName || store.companyName
  }

  return (
    <Listbox value={selectedStoreId} onChange={onStoreChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed">
          <span className="flex items-center">
            <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="block truncate">{getDisplayName(selectedStore)}</span>
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {/* ✅ REMOVED: All Stores Option */}

            {/* Individual Stores */}
            {stores.map((store) => (
              <Listbox.Option
                key={store.id}
                value={store.id}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                  }`
                }
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex items-center">
                      <BuildingStorefrontIcon className={`h-5 w-5 mr-2 ${active ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {getDisplayName(store)}
                      </span>
                    </div>
                    {selected && (
                      <span
                        className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                          active ? 'text-white' : 'text-indigo-600'
                        }`}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}
