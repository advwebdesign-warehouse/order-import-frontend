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
  // Form state - Only Shopify credentials
  const [shopUrl, setShopUrl] = useState(existingIntegration?.config?.shopUrl || '')
  const [apiKey, setApiKey] = useState(existingIntegration?.config?.apiKey || '')
  const [accessToken, setAccessToken] = useState(existingIntegration?.config?.accessToken || '')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!shopUrl.trim()) {
      newErrors.shopUrl = 'Shop URL is required'
    } else if (!shopUrl.includes('.myshopify.com')) {
      newErrors.shopUrl = 'Must be a valid Shopify URL (e.g., your-store.myshopify.com)'
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API Key is required'
    }

    if (!accessToken.trim()) {
      newErrors.accessToken = 'Access Token is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSaving(true)

    try {
      const integration: Partial<ShopifyIntegration> = {
        id: existingIntegration?.id || `shopify-${selectedStoreId}-${Date.now()}`,
        name: 'Shopify',
        type: 'ecommerce',
        status: 'connected',
        enabled: true,
        storeId: selectedStoreId,
        description: 'Shopify integration',
        icon: '/logos/shopify-logo.svg',
        config: {
          shopUrl: shopUrl.trim(),
          apiKey: apiKey.trim(),
          accessToken: accessToken.trim()
        },
        connectedAt: existingIntegration?.connectedAt || new Date().toISOString()
      }

      onSave(integration)
      onClose()
    } catch (error) {
      console.error('Error saving Shopify integration:', error)
      alert('Failed to save integration. Please try again.')
    } finally {
      setIsSaving(false)
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
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {existingIntegration ? 'Edit' : 'Configure'} Shopify Integration
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-gray-500">
                      Connect your Shopify store to automatically sync orders and inventory
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      {/* Shopify Credentials */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">Shopify Credentials</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Shop URL *
                          </label>
                          <input
                            type="text"
                            value={shopUrl}
                            onChange={(e) => setShopUrl(e.target.value)}
                            placeholder="your-store.myshopify.com"
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.shopUrl ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500`}
                          />
                          {errors.shopUrl && (
                            <p className="mt-1 text-sm text-red-600">{errors.shopUrl}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            API Key *
                          </label>
                          <input
                            type="text"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.apiKey ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500`}
                          />
                          {errors.apiKey && (
                            <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Access Token *
                          </label>
                          <input
                            type="password"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.accessToken ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500`}
                          />
                          {errors.accessToken && (
                            <p className="mt-1 text-sm text-red-600">{errors.accessToken}</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : existingIntegration ? 'Update' : 'Connect'}
                        </button>
                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
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
