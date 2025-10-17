// app/dashboard/warehouses/components/WarehouseDetailsModal.tsx
'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PencilIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import ReactCountryFlag from "react-country-flag"
import { Warehouse } from '../utils/warehouseTypes'
import { generateAddressPreview } from '../utils/addressVariables'

interface WarehouseDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  warehouse: Warehouse
  onEdit: (warehouse: Warehouse) => void
}

export default function WarehouseDetailsModal({
  isOpen,
  onClose,
  warehouse,
  onEdit
}: WarehouseDetailsModalProps) {

  const CountryFlag = ({ countryCode }: { countryCode: string }) => (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: '24px',
        height: '16px',
      }}
      title={countryCode}
    />
  )

  const StatusBadge = ({ status }: { status: string }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
        {status}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
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
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mr-3">
                          {warehouse.name}
                        </Dialog.Title>
                        {warehouse.isDefault && (
                          <StarIconSolid className="h-6 w-6 text-yellow-500" title="Default warehouse" />
                        )}
                      </div>
                      <button
                        onClick={() => onEdit(warehouse)}
                        className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit Warehouse
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Code:</dt>
                            <dd className="text-sm font-medium font-mono text-gray-900">{warehouse.code}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Status:</dt>
                            <dd><StatusBadge status={warehouse.status} /></dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Default:</dt>
                            <dd className="text-sm text-gray-900">
                              {warehouse.isDefault ? (
                                <span className="text-green-600">Yes</span>
                              ) : (
                                <span className="text-gray-500">No</span>
                              )}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Priority:</dt>
                            <dd className="text-sm font-medium text-gray-900">{warehouse.settings.priority}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-500">Products:</dt>
                            <dd className="text-sm font-medium text-gray-900">{warehouse.productCount || 0}</dd>
                          </div>
                        </dl>

                        {warehouse.description && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <dt className="text-sm font-medium text-gray-500 mb-1">Description:</dt>
                            <dd className="text-sm text-gray-700">{warehouse.description}</dd>
                          </div>
                        )}
                      </div>

                      {/* Address Information */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <CountryFlag countryCode={warehouse.address.countryCode} />
                          <span className="ml-2">Address</span>
                        </h4>
                        <address className="text-sm text-gray-600 not-italic leading-relaxed">
                          {warehouse.address.address1}<br />
                          {warehouse.address.address2 && (
                            <>{warehouse.address.address2}<br /></>
                          )}
                          {warehouse.address.city}, {warehouse.address.state} {warehouse.address.zip}<br />
                          {warehouse.address.country}
                        </address>
                      </div>

                      {/* Return Address Information - if different */}
                      {warehouse.useDifferentReturnAddress && warehouse.returnAddress && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <CountryFlag countryCode={warehouse.returnAddress.countryCode} />
                            <span className="ml-2">Return Address</span>
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              Different from warehouse
                            </span>
                          </h4>

                          {/* Show template with variables */}
                          {warehouse.returnAddress.name && (
                            <div className="mb-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {warehouse.returnAddress.name}
                              </p>
                              {warehouse.returnAddress.name.includes('[') && (
                                <p className="text-xs text-gray-600 mt-1">
                                  Preview: {generateAddressPreview(warehouse.returnAddress.name, {
                                    shop: 'Example Shop',
                                    warehouse: warehouse.name,
                                    code: warehouse.code,
                                    platform: 'Shopify'
                                  })}
                                </p>
                              )}
                            </div>
                          )}

                          <address className="text-sm text-gray-600 not-italic leading-relaxed">
                            {warehouse.returnAddress.address1}<br />
                            {warehouse.returnAddress.address2 && (
                              <>{warehouse.returnAddress.address2}<br /></>
                            )}
                            {warehouse.returnAddress.city}, {warehouse.returnAddress.state} {warehouse.returnAddress.zip}<br />
                            {warehouse.returnAddress.country}
                          </address>
                          <p className="mt-2 text-xs text-gray-500">
                            This address will be used as the return address on shipping labels
                          </p>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                        {warehouse.contactInfo.managerName || warehouse.contactInfo.phone || warehouse.contactInfo.email ? (
                          <dl className="space-y-2">
                            {warehouse.contactInfo.managerName && (
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Manager:</dt>
                                <dd className="text-sm font-medium text-gray-900">{warehouse.contactInfo.managerName}</dd>
                              </div>
                            )}
                            {warehouse.contactInfo.phone && (
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Phone:</dt>
                                <dd className="text-sm text-gray-900">{warehouse.contactInfo.phone}</dd>
                              </div>
                            )}
                            {warehouse.contactInfo.email && (
                              <div className="flex justify-between">
                                <dt className="text-sm text-gray-500">Email:</dt>
                                <dd className="text-sm text-gray-900">
                                  <a href={`mailto:${warehouse.contactInfo.email}`} className="text-indigo-600 hover:text-indigo-500">
                                    {warehouse.contactInfo.email}
                                  </a>
                                </dd>
                              </div>
                            )}
                          </dl>
                        ) : (
                          <p className="text-sm text-gray-500">No contact information available</p>
                        )}
                      </div>

                      {/* Settings */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Settings</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Track Inventory</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              warehouse.settings.trackInventory
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {warehouse.settings.trackInventory ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Allow Backorders</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              warehouse.settings.allowBackorders
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {warehouse.settings.allowBackorders ? 'Allowed' : 'Not Allowed'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Auto-Fulfill Orders</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              warehouse.settings.autoFulfill
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {warehouse.settings.autoFulfill ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="font-medium text-gray-500">Created:</dt>
                          <dd className="text-gray-900">{formatDate(warehouse.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">Last Updated:</dt>
                          <dd className="text-gray-900">{formatDate(warehouse.updatedAt)}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            // Navigate to products filtered by this warehouse
                            window.location.href = `/dashboard/products?warehouse=${warehouse.id}`
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Products ({warehouse.productCount || 0})
                        </button>

                        <button
                          onClick={() => {
                            // Navigate to orders from this warehouse
                            window.location.href = `/dashboard/orders?warehouse=${warehouse.id}`
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Orders
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
