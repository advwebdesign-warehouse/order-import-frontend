'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import ReactCountryFlag from "react-country-flag"

interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
  currency: string
  image?: string
  variant?: string
  weight?: number
  meta?: {
    color?: string
    size?: string
    material?: string
    [key: string]: any
  }
}

interface Address {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  countryCode: string
  phone?: string
}

interface PackingSlipProps {
  isOpen: boolean
  onClose: () => void
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    totalAmount: number
    currency: string
    status: string
    fulfillmentStatus: string
    platform: string
    orderDate: string
    items: OrderItem[]
    shippingAddress: Address
    billingAddress: Address
    shippingMethod: string
    shippingCost?: number
    taxAmount?: number
    fees?: number
    handlingFee?: number
    discounts?: {
      code: string
      amount: number
      description: string
    }[]
    trackingNumber?: string
    notes?: string
  }
  companyInfo?: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
    phone?: string
    email?: string
    website?: string
  }
}

export default function PackingSlip({ isOpen, onClose, order, companyInfo }: PackingSlipProps) {
  const defaultCompanyInfo = {
    name: 'Your Company Name',
    address: '123 Business Street',
    city: 'Your City',
    state: 'ST',
    zip: '12345',
    country: 'United States',
    phone: '+1 (555) 123-4567',
    email: 'orders@yourcompany.com',
    website: 'www.yourcompany.com'
  }

  const company = companyInfo || defaultCompanyInfo

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateTotalWeight = () => {
    return order.items.reduce((sum, item) => {
      const itemWeight = item.weight || 0
      return sum + (itemWeight * item.quantity)
    }, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // This would integrate with a PDF generation library
    console.log('Generate PDF for order:', order.orderNumber)
    // For now, just trigger print dialog
    window.print()
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                {/* Header with actions - hidden in print */}
                <div className="print:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-medium text-gray-900">Packing Slip Preview</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      <PrinterIcon className="h-4 w-4" />
                      Print
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Packing Slip Content */}
                <div className="p-8 print:p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8 print:mb-6">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">{company.name}</h1>
                      <div className="mt-2 text-sm text-gray-600">
                        <div>{company.address}</div>
                        <div>{company.city}, {company.state} {company.zip}</div>
                        <div>{company.country}</div>
                        {company.phone && <div>Phone: {company.phone}</div>}
                        {company.email && <div>Email: {company.email}</div>}
                        {company.website && <div>Web: {company.website}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-2xl font-bold text-gray-900 print:text-xl">PACKING SLIP</h2>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="font-medium">Date: {formatDate(new Date().toISOString())}</div>
                        <div>Order #{order.orderNumber}</div>
                        <div>Platform: {order.platform}</div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <ReactCountryFlag
                          countryCode={order.shippingAddress.countryCode}
                          svg
                          style={{ width: '20px', height: '14px', marginRight: '8px' }}
                        />
                        Ship To
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-200">
                        <div className="font-medium text-gray-900">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </div>
                        {order.shippingAddress.company && (
                          <div className="text-gray-700">{order.shippingAddress.company}</div>
                        )}
                        <div className="mt-1 text-gray-700">
                          <div>{order.shippingAddress.address1}</div>
                          {order.shippingAddress.address2 && <div>{order.shippingAddress.address2}</div>}
                          <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
                          <div>{order.shippingAddress.country}</div>
                          {order.shippingAddress.phone && <div>Phone: {order.shippingAddress.phone}</div>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order Date:</span>
                            <span className="font-medium">{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping Method:</span>
                            <span className="font-medium">{order.shippingMethod}</span>
                          </div>
                          {order.trackingNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tracking:</span>
                              <span className="font-mono text-sm">{order.trackingNumber}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Weight:</span>
                            <span className="font-medium">{calculateTotalWeight().toFixed(2)} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Items:</span>
                            <span className="font-medium">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8 print:mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Pack</h3>
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 print:bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              SKU
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Variant
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Weight (kg)
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                              Packed
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {order.items.map((item, index) => (
                            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-white'}>
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  {item.image && (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-10 w-10 rounded-md object-cover mr-3 print:hidden"
                                    />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                    {item.meta && (
                                      <div className="text-xs text-gray-500">
                                        {Object.entries(item.meta).map(([key, value]) => (
                                          <span key={key} className="mr-2">
                                            {key}: {value}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-sm font-mono text-gray-900">
                                {item.sku}
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-500">
                                {item.variant || '-'}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right text-sm text-gray-900">
                                {item.weight ? (item.weight * item.quantity).toFixed(2) : '-'}
                              </td>
                              <td className="px-4 py-4 text-center print:hidden">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {order.notes && (
                    <div className="mb-8 print:mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Instructions</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:bg-white print:border-gray-300">
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-gray-200 pt-6 print:pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Packing Checklist</h4>
                        <ul className="space-y-1">
                          <li>☐ All items present and correct</li>
                          <li>☐ Items properly protected</li>
                          <li>☐ Shipping label attached</li>
                          <li>☐ Return slip included</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Quality Check</h4>
                        <ul className="space-y-1">
                          <li>☐ Items match order</li>
                          <li>☐ No damage or defects</li>
                          <li>☐ Correct quantities</li>
                          <li>☐ Package secure</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Packed By</h4>
                        <div className="mt-6 border-b border-gray-300 w-32"></div>
                        <div className="mt-1 text-xs">Signature</div>
                        <div className="mt-4 text-xs">Date: _____________</div>
                      </div>
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
