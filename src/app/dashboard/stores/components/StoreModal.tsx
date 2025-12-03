//file path: app/dashboard/stores/components/StoreModal.tsx

'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { Store, StoreFormData, US_STATES } from '../utils/storeTypes'
import { storeApi } from '@/app/services/storeApi'
import { UploadAPI } from '@/app/services/uploadApi'

interface StoreModalProps {
  store: Store | null
  onClose: (updated: boolean) => void
}

export default function StoreModal({ store, onClose }: StoreModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [oldLogoUrl, setOldLogoUrl] = useState<string | null>(null)

  // Store Information Form State - All fields explicitly set to ensure controlled inputs
  const [formData, setFormData] = useState<StoreFormData>({
    storeName: store?.storeName ?? '',
    logo: store?.logo ?? '',
    website: store?.website ?? '',
    email: store?.email ?? '',
    phone: store?.phone ?? '',
    address1: store?.address.address1 ?? '',
    address2: store?.address.address2 ?? '',
    city: store?.address.city ?? '',
    state: store?.address.state ?? '',
    zip: store?.address.zip ?? '',
    country: store?.address.country ?? 'United States',
    countryCode: store?.address.countryCode ?? 'US'
  })

  const [logoUploadMethod, setLogoUploadMethod] = useState<'upload' | 'url'>('upload')

  const handleChange = (field: keyof StoreFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError(null)
    }
  }

  // ✅ UPDATED: Extract filename from new URL structure
  const extractFilename = (logoUrl: string): string | null => {
    if (!logoUrl || !logoUrl.startsWith('/uploads/')) return null

    // Extract filename from path: /uploads/[accountId]/logos/[filename]
    const parts = logoUrl.split('/')
    return parts[parts.length - 1] // Get last part (filename)
  }

  // Upload logo to server (SAME AS BEFORE)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        logo: 'Logo file is too large. Maximum size is 2MB.'
      }))
      return
    }

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        logo: 'Logo must be a PNG, JPG, or WEBP image.'
      }))
      return
    }

    try {
      setIsUploadingLogo(true)

      setErrors(prev => {
        const { logo, ...rest } = prev
        return rest
      })

      // ✅ Use UploadAPI instead of inline fetch
      const data = await UploadAPI.uploadLogo(file)

      // ✅ FIXED: Use component state, not FormData object
      // Save old logo for deletion (if it's a server-uploaded file)
      if (formData.logo && formData.logo.startsWith('/uploads/')) {
        setOldLogoUrl(formData.logo)
      }

      handleChange('logo', data.url)

      console.log('✅ Logo uploaded:', data.url)

    } catch (error: any) {
      console.error('❌ Logo upload failed:', error)
      setErrors(prev => ({
        ...prev,
        logo: error.message || 'Failed to upload logo. Please try again.'
      }))
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // When deleting, now need to specify uploadType
  const deleteOldLogo = async (logoUrl: string) => {
    const filename = extractFilename(logoUrl)
    if (!filename) return

    try {
      await UploadAPI.deleteFile(filename, 'logos')
      console.log('🗑️  Old logo deleted:', filename)
    } catch (error) {
      console.error('Failed to delete old logo:', error)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.storeName?.trim()) {
      newErrors.storeName = 'Store name is required'
    }

    if (!formData.address1?.trim()) {
      newErrors.address1 = 'Address is required'
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state?.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.zip?.trim()) {
      newErrors.zip = 'ZIP code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSaving(true)
    setApiError(null)

    try {
      const storeData: Partial<Store> = {
              storeName: formData.storeName!,
        ...(formData.logo && { logo: formData.logo }),
        ...(formData.website && { website: formData.website }),
        ...(formData.email && { email: formData.email }),
        ...(formData.phone && { phone: formData.phone }),
        address: {
          address1: formData.address1,
          ...(formData.address2 && { address2: formData.address2 }),
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          countryCode: formData.countryCode
        }
      }

      if (store) {
        // Update existing store via API
        await storeApi.updateStore(store.id, storeData)
      } else {
        // Create new store via API
        await storeApi.createStore(storeData)
      }

      onClose(true)
    } catch (error: any) {
      console.error('Error saving store:', error)
      setApiError(error.message || 'Failed to save store. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose(false)}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                {/* Header */}
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex items-start justify-between">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {store ? 'Edit Store' : 'Add Store'}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={() => onClose(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Store information will be used for order-related documents such as packing slips and shipping labels.
                  </p>
                </div>

                  {/* API Error Message */}
                  {apiError && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{apiError}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pb-4 sm:px-6">
                    <div className="space-y-6">
                      {/* Store Information */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Store Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Store Name *
                            </label>
                            <input
                              type="text"
                              value={formData.storeName ?? ''}
                              onChange={(e) => handleChange('storeName', e.target.value)}
                              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                                errors.storeName ? 'border-red-300' : 'border-gray-300'
                              } focus:border-indigo-500 focus:ring-indigo-500`}
                              placeholder="2nd Store"
                            />
                            {errors.storeName && (
                              <p className="mt-1 text-sm text-red-600">{errors.storeName}</p>
                            )}
                          </div>

                          {/* Logo Upload Section */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Store Logo <span className="text-gray-500 text-xs">PNG, JPG up to 2MB</span>
                            </label>

                            <div className="flex gap-2 mb-3">
                              <button
                                type="button"
                                onClick={() => setLogoUploadMethod('upload')}
                                className={`px-3 py-1.5 text-sm rounded-md ${
                                  logoUploadMethod === 'upload'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300'
                                }`}
                              >
                                Upload Logo
                              </button>
                              <button
                                type="button"
                                onClick={() => setLogoUploadMethod('url')}
                                className={`px-3 py-1.5 text-sm rounded-md ${
                                  logoUploadMethod === 'url'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-gray-700 border border-gray-300'
                                }`}
                              >
                                Use URL
                              </button>
                            </div>

                            {logoUploadMethod === 'upload' ? (
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/jpg,image/webp"
                                  onChange={handleLogoUpload}
                                  disabled={isUploadingLogo}
                                  className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-md file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-indigo-50 file:text-indigo-700
                                    hover:file:bg-indigo-100
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                {isUploadingLogo && (
                                  <div className="absolute right-2 top-2">
                                    <CloudArrowUpIcon className="h-5 w-5 text-indigo-600 animate-pulse" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <input
                                type="url"
                                value={formData.logo ?? ''}
                                onChange={(e) => handleChange('logo', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="https://example.com/logo.png"
                              />
                            )}

                            {/* ✅ ADD: Logo error display */}
                            {errors.logo && (
                              <p className="mt-1 text-sm text-red-600">{errors.logo}</p>
                            )}

                            {formData.logo && (
                              <div className="mt-2">
                                <img
                                  src={formData.logo.startsWith('/')
                                    ? formData.logo // Server-uploaded files are served from /public
                                    : formData.logo // External URLs
                                  }
                                  alt="Store logo preview"
                                  className="h-16 w-auto object-contain border border-gray-200 rounded"
                                  onError={(e) => {
                                    console.error('Failed to load logo image')
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Store Address</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {/* Address Line 1 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              value={formData.address1 ?? ''}
                              onChange={(e) => handleChange('address1', e.target.value)}
                              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                                errors.address1 ? 'border-red-300' : 'border-gray-300'
                              } focus:border-indigo-500 focus:ring-indigo-500`}
                              placeholder="123 Main Street"
                            />
                            {errors.address1 && (
                              <p className="mt-1 text-sm text-red-600">{errors.address1}</p>
                            )}
                          </div>

                          {/* Address Line 2 */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              value={formData.address2 ?? ''}
                              onChange={(e) => handleChange('address2', e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Suite 100"
                            />
                          </div>

                          {/* City, State, ZIP */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                City *
                              </label>
                              <input
                                type="text"
                                value={formData.city ?? ''}
                                onChange={(e) => handleChange('city', e.target.value)}
                                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                                  errors.city ? 'border-red-300' : 'border-gray-300'
                                } focus:border-indigo-500 focus:ring-indigo-500`}
                                placeholder="San Diego"
                              />
                              {errors.city && (
                                <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                State *
                              </label>
                              <select
                                value={formData.state ?? ''}
                                onChange={(e) => handleChange('state', e.target.value)}
                                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                                  errors.state ? 'border-red-300' : 'border-gray-300'
                                } focus:border-indigo-500 focus:ring-indigo-500`}
                              >
                                <option value="">Select State</option>
                                {US_STATES.map(state => (
                                  <option key={state.code} value={state.code}>
                                    {state.name}
                                  </option>
                                ))}
                              </select>
                              {errors.state && (
                                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                ZIP Code *
                              </label>
                              <input
                                type="text"
                                value={formData.zip ?? ''}
                                onChange={(e) => handleChange('zip', e.target.value)}
                                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                                  errors.zip ? 'border-red-300' : 'border-gray-300'
                                } focus:border-indigo-500 focus:ring-indigo-500`}
                                placeholder="92101"
                              />
                              {errors.zip && (
                                <p className="mt-1 text-sm text-red-600">{errors.zip}</p>
                              )}
                            </div>
                          </div>

                          {/* Country */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Country *
                            </label>
                            <select
                              value={formData.country ?? 'United States'}
                              onChange={(e) => {
                                handleChange('country', e.target.value)
                                handleChange('countryCode', e.target.value === 'United States' ? 'US' : 'OTHER')
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Mexico">Mexico</option>
                            </select>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                    <button
                      type="submit"
                      disabled={isSaving || isUploadingLogo}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : isUploadingLogo ? 'Uploading logo...' : store ? 'Update Store' : 'Add Store'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onClose(false)}
                      disabled={isSaving || isUploadingLogo}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
