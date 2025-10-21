//file path: app/dashboard/stores/components/StoreModal.tsx

'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Store, StoreFormData } from '../utils/storeTypes'
import { createStore, updateStore } from '../utils/storeStorage'

interface StoreModalProps {
  store: Store | null
  onClose: (updated: boolean) => void
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
]

const BUSINESS_TYPES = [
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
]

export default function StoreModal({ store, onClose }: StoreModalProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    companyName: '',
    storeName: '',
    logo: '',
    website: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    countryCode: 'US',
    taxId: '',
    businessType: undefined,
    defaultShippingFrom: false
  })

  const [errors, setErrors] = useState<Partial<Record<keyof StoreFormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (store) {
      setFormData({
        companyName: store.companyName,
        storeName: store.storeName || '',
        logo: store.logo || '',
        website: store.website || '',
        email: store.email || '',
        phone: store.phone || '',
        address1: store.address.address1,
        address2: store.address.address2 || '',
        city: store.address.city,
        state: store.address.state,
        zip: store.address.zip,
        country: store.address.country,
        countryCode: store.address.countryCode,
        taxId: store.taxId || '',
        businessType: store.businessType,
        defaultShippingFrom: store.defaultShippingFrom || false
      })
    }
  }, [store])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StoreFormData, string>> = {}

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.address1.trim()) {
      newErrors.address1 = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must start with http:// or https://'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const storeData = {
        companyName: formData.companyName,
        storeName: formData.storeName || undefined,
        logo: formData.logo || undefined,
        website: formData.website || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: {
          address1: formData.address1,
          address2: formData.address2 || undefined,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          countryCode: formData.countryCode
        },
        taxId: formData.taxId || undefined,
        businessType: formData.businessType,
        defaultShippingFrom: formData.defaultShippingFrom
      }

      if (store) {
        updateStore(store.id, storeData)
      } else {
        createStore(storeData)
      }

      onClose(true)
    } catch (error) {
      console.error('Error saving store:', error)
      alert('Failed to save store. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCountryChange = (country: string) => {
    const selectedCountry = COUNTRIES.find(c => c.name === country)
    setFormData(prev => ({
      ...prev,
      country,
      countryCode: selectedCountry?.code || ''
    }))
  }

  return (
    <Transition appear show={true} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    {store ? 'Edit Store' : 'Add New Store'}
                  </Dialog.Title>
                  <button
                    onClick={() => onClose(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Company Information</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                            errors.companyName ? 'border-red-300' : 'border-gray-300'
                          } focus:border-indigo-500 focus:ring-indigo-500`}
                        />
                        {errors.companyName && (
                          <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={formData.storeName}
                          onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <select
                          value={formData.businessType || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            businessType: e.target.value as any || undefined
                          }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Select type...</option>
                          {BUSINESS_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Logo URL
                        </label>
                        <input
                          type="text"
                          value={formData.logo}
                          onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
                          placeholder="https://example.com/logo.png"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tax ID / EIN
                        </label>
                        <input
                          type="text"
                          value={formData.taxId}
                          onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          } focus:border-indigo-500 focus:ring-indigo-500`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Website
                        </label>
                        <input
                          type="text"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://example.com"
                          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                            errors.website ? 'border-red-300' : 'border-gray-300'
                          } focus:border-indigo-500 focus:ring-indigo-500`}
                        />
                        {errors.website && (
                          <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Address</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          value={formData.address1}
                          onChange={(e) => setFormData(prev => ({ ...prev, address1: e.target.value }))}
                          className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                            errors.address1 ? 'border-red-300' : 'border-gray-300'
                          } focus:border-indigo-500 focus:ring-indigo-500`}
                        />
                        {errors.address1 && (
                          <p className="mt-1 text-sm text-red-600">{errors.address1}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={formData.address2}
                          onChange={(e) => setFormData(prev => ({ ...prev, address2: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            City *
                          </label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.city ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500`}
                          />
                          {errors.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            State/Province *
                          </label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.state ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500`}
                          />
                          {errors.state && (
                            <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            ZIP/Postal Code *
                          </label>
                          <input
                            type="text"
                            value={formData.zip}
                            onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                              errors.zip ? 'border-red-300' : 'border-gray-300'
                            } focus:border-indigo-500 focus:ring-indigo-500`}
                          />
                          {errors.zip && (
                            <p className="mt-1 text-sm text-red-600">{errors.zip}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Country *
                        </label>
                        <select
                          value={formData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          {COUNTRIES.map(country => (
                            <option key={country.code} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Settings */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Shipping Settings</h3>
                    <div className="flex items-center">
                      <input
                        id="defaultShipping"
                        type="checkbox"
                        checked={formData.defaultShippingFrom}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          defaultShippingFrom: e.target.checked
                        }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="defaultShipping" className="ml-2 block text-sm text-gray-900">
                        Use this address as default "Ship From" address
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => onClose(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : store ? 'Update Store' : 'Create Store'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
