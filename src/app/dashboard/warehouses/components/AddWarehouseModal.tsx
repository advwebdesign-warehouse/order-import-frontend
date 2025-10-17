// app/dashboard/warehouses/components/AddWarehouseModal.tsx
'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Warehouse, DEFAULT_ORDER_STATUS_SETTINGS } from '../utils/warehouseTypes'
import { generateAddressPreview } from '../utils/addressVariables'

interface AddWarehouseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (warehouse: Partial<Warehouse>) => void
  warehouse?: Warehouse | null
  warehouses: Warehouse[]
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'AU', name: 'Australia' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' }
]

const generatePreview = (template: string, variables: any) => {
  return generateAddressPreview(template, variables)
}

export default function AddWarehouseModal({
  isOpen,
  onClose,
  onSave,
  warehouse,
  warehouses
}: AddWarehouseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: {
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      countryCode: 'US'
    },
    contactInfo: {
      managerName: '',
      phone: '',
      email: ''
    },
    settings: {
      allowBackorders: false,  // Keep in settings but not in UI
      trackInventory: true,    // Keep in settings but not in UI
      autoFulfill: false,      // Keep in settings but not in UI
      priority: 1,
      orderStatusSettings: DEFAULT_ORDER_STATUS_SETTINGS
    },
    status: 'active' as 'active' | 'inactive',
    isDefault: false,

    // NEW: Add these fields
    useDifferentReturnAddress: false,
    returnAddress: {
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      countryCode: 'US'
    }
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or warehouse changes
  useEffect(() => {
    if (isOpen) {
      if (warehouse) {
        // Editing existing warehouse
        setFormData({
          name: warehouse.name,
          code: warehouse.code,
          description: warehouse.description || '',
          address: {
            address1: warehouse.address.address1,
            address2: warehouse.address.address2 || '',
            city: warehouse.address.city,
            state: warehouse.address.state,
            zip: warehouse.address.zip,
            country: warehouse.address.country,
            countryCode: warehouse.address.countryCode
          },
          contactInfo: {
            managerName: warehouse.contactInfo.managerName || '',
            phone: warehouse.contactInfo.phone || '',
            email: warehouse.contactInfo.email || ''
          },
          settings: { ...warehouse.settings },
          status: warehouse.status,
          isDefault: warehouse.isDefault,

          // NEW: Load return address data
          useDifferentReturnAddress: warehouse.useDifferentReturnAddress || false,
          returnAddress: {
            name: warehouse.returnAddress?.name || '',
            address1: warehouse.returnAddress?.address1 || '',
            address2: warehouse.returnAddress?.address2 || '',
            city: warehouse.returnAddress?.city || '',
            state: warehouse.returnAddress?.state || '',
            zip: warehouse.returnAddress?.zip || '',
            country: warehouse.returnAddress?.country || 'United States',
            countryCode: warehouse.returnAddress?.countryCode || 'US'
          }
        })
      } else {
        // Adding new warehouse - keep existing reset logic plus new fields
        const hasDefault = warehouses.some(w => w.isDefault)
        setFormData({
          name: '',
          code: '',
          description: '',
          address: {
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: 'United States',
            countryCode: 'US'
          },
          contactInfo: {
            managerName: '',
            phone: '',
            email: ''
          },
          settings: {
            allowBackorders: false,
            trackInventory: true,
            autoFulfill: false,
            priority: 1,
            orderStatusSettings: DEFAULT_ORDER_STATUS_SETTINGS
          },
          status: 'active' as 'active' | 'inactive',
          isDefault: !hasDefault, // Set as default if no other default exists
          useDifferentReturnAddress: false,
          returnAddress: {
            name: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            zip: '',
            country: 'United States',
            countryCode: 'US'
          }
        })
      }
      setErrors({})
    }
  }, [isOpen, warehouse, warehouses])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Warehouse name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Warehouse code is required'
    } else if (formData.code.length < 2) {
      newErrors.code = 'Warehouse code must be at least 2 characters'
    } else {
      const existingWarehouse = warehouses.find(w =>
        w.code.toLowerCase() === formData.code.toLowerCase() && w.id !== warehouse?.id
      )
      if (existingWarehouse) {
        newErrors.code = 'Warehouse code already exists'
      }
    }

    if (!formData.address.address1.trim()) {
      newErrors['address.address1'] = 'Address is required'
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required'
    }

    if (!formData.address.state.trim()) {
      newErrors['address.state'] = 'State/Province is required'
    }

    if (!formData.address.zip.trim()) {
      newErrors['address.zip'] = 'ZIP/Postal code is required'
    }

    // NEW: Validate return address if different return address is checked
    if (formData.useDifferentReturnAddress) {
      if (!formData.returnAddress.name?.trim()) {
        newErrors['returnAddress.name'] = 'Return address name is required'
      }
      if (!formData.returnAddress.address1.trim()) {
        newErrors['returnAddress.address1'] = 'Return address is required'
      }
      if (!formData.returnAddress.city.trim()) {
        newErrors['returnAddress.city'] = 'Return city is required'
      }
      if (!formData.returnAddress.state.trim()) {
        newErrors['returnAddress.state'] = 'Return state/province is required'
      }
      if (!formData.returnAddress.zip.trim()) {
        newErrors['returnAddress.zip'] = 'Return ZIP/postal code is required'
      }
    }

    if (formData.contactInfo.email && !isValidEmail(formData.contactInfo.email)) {
      newErrors['contactInfo.email'] = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const warehouseData = {
        ...formData,
        code: formData.code.toUpperCase() // Standardize code format
      }

      await onSave(warehouseData)
    } catch (error) {
      console.error('Error saving warehouse:', error)
      setErrors({ general: 'Failed to save warehouse. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCountryChange = (countryName: string, countryCode: string) => {
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        country: countryName,
        countryCode
      }
    })
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
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mb-6">
                      {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
                    </Dialog.Title>

                    {errors.general && (
                      <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{errors.general}</div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Information */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Warehouse Name *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                errors.name ? 'ring-red-300' : 'ring-gray-300'
                              } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                              placeholder="e.g., Main Warehouse"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Warehouse Code *
                            </label>
                            <input
                              type="text"
                              value={formData.code}
                              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                errors.code ? 'ring-red-300' : 'ring-gray-300'
                              } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                              placeholder="e.g., WH001"
                            />
                            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            placeholder="Optional description of the warehouse"
                          />
                        </div>
                      </div>

                      {/* Address Information */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Address</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 1 *
                            </label>
                            <input
                              type="text"
                              value={formData.address.address1}
                              onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, address1: e.target.value }
                              })}
                              className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                errors['address.address1'] ? 'ring-red-300' : 'ring-gray-300'
                              } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                            />
                            {errors['address.address1'] && (
                              <p className="mt-1 text-sm text-red-600">{errors['address.address1']}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 2
                            </label>
                            <input
                              type="text"
                              value={formData.address.address2}
                              onChange={(e) => setFormData({
                                ...formData,
                                address: { ...formData.address, address2: e.target.value }
                              })}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City *
                              </label>
                              <input
                                type="text"
                                value={formData.address.city}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, city: e.target.value }
                                })}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                  errors['address.city'] ? 'ring-red-300' : 'ring-gray-300'
                                } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                              />
                              {errors['address.city'] && (
                                <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                State/Province *
                              </label>
                              <input
                                type="text"
                                value={formData.address.state}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, state: e.target.value }
                                })}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                  errors['address.state'] ? 'ring-red-300' : 'ring-gray-300'
                                } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                              />
                              {errors['address.state'] && (
                                <p className="mt-1 text-sm text-red-600">{errors['address.state']}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ZIP/Postal Code *
                              </label>
                              <input
                                type="text"
                                value={formData.address.zip}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  address: { ...formData.address, zip: e.target.value }
                                })}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                  errors['address.zip'] ? 'ring-red-300' : 'ring-gray-300'
                                } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                              />
                              {errors['address.zip'] && (
                                <p className="mt-1 text-sm text-red-600">{errors['address.zip']}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country *
                            </label>
                            <select
                              value={formData.address.country}
                              onChange={(e) => {
                                const country = COUNTRIES.find(c => c.name === e.target.value)
                                if (country) {
                                  handleCountryChange(country.name, country.code)
                                }
                              }}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            >
                              {COUNTRIES.map((country) => (
                                <option key={country.code} value={country.name}>
                                  {country.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Return Address Information */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Return Address</h4>

                        <div className="mb-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.useDifferentReturnAddress}
                              onChange={(e) => setFormData({
                                ...formData,
                                useDifferentReturnAddress: e.target.checked
                              })}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Use a different return address for shipping labels
                            </span>
                          </label>
                          <p className="ml-6 mt-1 text-xs text-gray-500">
                            By default, the warehouse address above will be used as the return address.
                            Check this if you need returns sent to a different location.
                          </p>
                        </div>

                        {formData.useDifferentReturnAddress && (
                          <div className="space-y-4 pl-6 border-l-2 border-indigo-200">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Address Name/Label *
                                <span className="text-gray-500 font-normal ml-1">
                                  (e.g., "Chicago - Returns Dept", "Chicago - Return Code #1")
                                </span>
                              </label>
                              <input
                                type="text"
                                value={formData.returnAddress.name || ''}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  returnAddress: { ...formData.returnAddress, name: e.target.value }
                                })}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                  errors['returnAddress.name'] ? 'ring-red-300' : 'ring-gray-300'
                                } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                                placeholder="Chicago - [shop] Returns"
                              />
                              {errors['returnAddress.name'] && (
                                <p className="mt-1 text-sm text-red-600">{errors['returnAddress.name']}</p>
                              )}
                              {/* Helper text with variable examples */}
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-xs font-medium text-blue-900 mb-1">
                                  💡 You can use dynamic variables:
                                </p>
                                <div className="space-y-1 text-xs text-blue-700">
                                  <div className="flex items-start gap-2">
                                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">[shop]</code>
                                    <span>- Shop/store name from the order</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">[warehouse]</code>
                                    <span>- Warehouse name</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">[code]</code>
                                    <span>- Warehouse code</span>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">[platform]</code>
                                    <span>- Platform name (Shopify, Amazon, etc.)</span>
                                  </div>
                                </div>
                                <p className="text-xs text-blue-600 mt-2 font-medium">
                                  Example: "Chicago - [shop] Returns" → "Chicago - My Store Returns"
                                </p>
                              </div>

                              {/* Live Preview */}
                              {formData.returnAddress.name && (
                                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                                  <p className="text-xs text-gray-600 mb-1">Preview example:</p>
                                  <p className="text-sm font-medium text-gray-900">
                                    {generatePreview(formData.returnAddress.name, {
                                      shop: 'Example Shop',
                                      warehouse: formData.name || 'Warehouse Name',
                                      code: formData.code || 'WH-01',
                                      platform: 'Shopify'
                                    })}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Address Line 1 *
                              </label>
                              <input
                                type="text"
                                value={formData.returnAddress.address1}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  returnAddress: { ...formData.returnAddress, address1: e.target.value }
                                })}
                                className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                  errors['returnAddress.address1'] ? 'ring-red-300' : 'ring-gray-300'
                                } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                              />
                              {errors['returnAddress.address1'] && (
                                <p className="mt-1 text-sm text-red-600">{errors['returnAddress.address1']}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Address Line 2
                              </label>
                              <input
                                type="text"
                                value={formData.returnAddress.address2}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  returnAddress: { ...formData.returnAddress, address2: e.target.value }
                                })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  City *
                                </label>
                                <input
                                  type="text"
                                  value={formData.returnAddress.city}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    returnAddress: { ...formData.returnAddress, city: e.target.value }
                                  })}
                                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                    errors['returnAddress.city'] ? 'ring-red-300' : 'ring-gray-300'
                                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                                />
                                {errors['returnAddress.city'] && (
                                  <p className="mt-1 text-sm text-red-600">{errors['returnAddress.city']}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  State/Province *
                                </label>
                                <input
                                  type="text"
                                  value={formData.returnAddress.state}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    returnAddress: { ...formData.returnAddress, state: e.target.value }
                                  })}
                                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                    errors['returnAddress.state'] ? 'ring-red-300' : 'ring-gray-300'
                                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                                />
                                {errors['returnAddress.state'] && (
                                  <p className="mt-1 text-sm text-red-600">{errors['returnAddress.state']}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ZIP/Postal Code *
                                </label>
                                <input
                                  type="text"
                                  value={formData.returnAddress.zip}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    returnAddress: { ...formData.returnAddress, zip: e.target.value }
                                  })}
                                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                                    errors['returnAddress.zip'] ? 'ring-red-300' : 'ring-gray-300'
                                  } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                                />
                                {errors['returnAddress.zip'] && (
                                  <p className="mt-1 text-sm text-red-600">{errors['returnAddress.zip']}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country *
                              </label>
                              <select
                                value={formData.returnAddress.country}
                                onChange={(e) => {
                                  const country = COUNTRIES.find(c => c.name === e.target.value)
                                  if (country) {
                                    setFormData({
                                      ...formData,
                                      returnAddress: {
                                        ...formData.returnAddress,
                                        country: country.name,
                                        countryCode: country.code
                                      }
                                    })
                                  }
                                }}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              >
                                {COUNTRIES.map((country) => (
                                  <option key={country.code} value={country.name}>
                                    {country.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Manager Name
                            </label>
                            <input
                              type="text"
                              value={formData.contactInfo.managerName}
                              onChange={(e) => setFormData({
                                ...formData,
                                contactInfo: { ...formData.contactInfo, managerName: e.target.value }
                              })}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.contactInfo.phone}
                              onChange={(e) => setFormData({
                                ...formData,
                                contactInfo: { ...formData.contactInfo, phone: e.target.value }
                              })}
                              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.contactInfo.email}
                            onChange={(e) => setFormData({
                              ...formData,
                              contactInfo: { ...formData.contactInfo, email: e.target.value }
                            })}
                            className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                              errors['contactInfo.email'] ? 'ring-red-300' : 'ring-gray-300'
                            } focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6`}
                          />
                          {errors['contactInfo.email'] && (
                            <p className="mt-1 text-sm text-red-600">{errors['contactInfo.email']}</p>
                          )}
                        </div>
                      </div>

                      {/* Settings */}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Settings</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={formData.settings.priority}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  settings: { ...formData.settings, priority: parseInt(e.target.value) || 1 }
                                })}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Set as default warehouse</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4" />
                              {warehouse ? 'Update Warehouse' : 'Create Warehouse'}
                            </>
                          )}
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
