//file path: src/app/dashboard/integrations/components/ShopifyConfigModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ShopifyIntegration } from '../types/integrationTypes'

interface ShopifyConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (integration: Partial<ShopifyIntegration>) => void
  existingIntegration?: ShopifyIntegration
  selectedStoreId: string
}

export default function ShopifyConfigModal({
  isOpen,
  onClose,
  onSave,
  existingIntegration,
  selectedStoreId
}: ShopifyConfigModalProps) {
  // OAuth flow only
  const [shopUrl, setShopUrl] = useState(existingIntegration?.config?.shopUrl || '')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleOAuthConnect = async () => {
    if (!shopUrl.trim()) {
      setErrors({ shopUrl: 'Shop URL is required to start OAuth' })
      return
    }

    // Normalize and validate shop URL
    let normalizedShop = shopUrl.trim().toLowerCase()
    normalizedShop = normalizedShop.replace(/^https?:\/\//, '')
    normalizedShop = normalizedShop.replace(/\/$/, '')
    normalizedShop = normalizedShop.split('/')[0]

    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`
    }

    // Validate format
    if (!normalizedShop.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
      setErrors({ shopUrl: 'Must be a valid Shopify URL (e.g., your-store.myshopify.com)' })
      return
    }

    setIsAuthenticating(true)
    setErrors({})

    try {
      // Build OAuth URL
      const authUrl = `/api/integrations/shopify/auth?shop=${encodeURIComponent(normalizedShop)}&storeId=${encodeURIComponent(selectedStoreId)}`

      console.log('[Shopify Modal] Redirecting to OAuth:', authUrl)

      // Redirect to OAuth
      window.location.href = authUrl
    } catch (error: any) {
      console.error('OAuth initiation error:', error)
      setErrors({ oauth: error.message || 'Failed to start OAuth flow' })
      setIsAuthenticating(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                    disabled={isAuthenticating}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {existingIntegration ? 'Reconnect' : 'Connect'} Shopify Store
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-500">
                      Connect your Shopify store to automatically sync orders, products, and inventory
                    </p>

                    {/* Error display */}
                    {errors.oauth && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-600">{errors.oauth}</p>
                      </div>
                    )}

                    {/* OAuth Flow */}
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Shop URL *
                        </label>
                        <input
                          type="text"
                          value={shopUrl}
                          onChange={(e) => {
                            setShopUrl(e.target.value)
                            setErrors({})
                          }}
                          placeholder="your-store.myshopify.com"
                          disabled={isAuthenticating}
                          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                            errors.shopUrl ? 'border-red-300' : 'border-gray-300'
                          } focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                        />
                        {errors.shopUrl && (
                          <p className="mt-1 text-sm text-red-600">{errors.shopUrl}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Enter your Shopify store URL (e.g., my-store.myshopify.com)
                        </p>
                      </div>

                      {/* OAuth Info Box */}
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          🔐 Secure OAuth Connection
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• You'll be redirected to Shopify to authorize access</li>
                          <li>• We never store your Shopify password</li>
                          <li>• You can revoke access anytime from your Shopify admin</li>
                        </ul>
                      </div>

                      {/* Connect Button */}
                      <button
                        type="button"
                        onClick={handleOAuthConnect}
                        disabled={isAuthenticating || !shopUrl.trim()}
                        className="w-full inline-flex justify-center items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAuthenticating ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting...
                          </>
                        ) : (
                          '🔗 Connect with Shopify'
                        )}
                      </button>

                      {/* Cancel Button */}
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isAuthenticating}
                        className="w-full inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
