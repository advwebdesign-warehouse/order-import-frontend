'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import ReactCountryFlag from "react-country-flag"

const CountryFlag = ({ countryCode }: { countryCode: string }) => {
  return (
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
}

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

interface OrderDetailsProps {
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
}

export default function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
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

  const calculateSubtotal = () => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTotalWeight = () => {
    return order.items.reduce((sum, item) => {
      const itemWeight = item.weight || 0
      return sum + (itemWeight * item.quantity)
    }, 0)
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  }

  const fulfillmentColors = {
    PENDING: 'bg-gray-100 text-gray-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    PICKING: 'bg-yellow-100 text-yellow-800',
    PACKED: 'bg-indigo-100 text-indigo-800',
    READY_TO_SHIP: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-green-100 text-green-800',
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
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
                      Order Details: {order.orderNumber}
                    </Dialog.Title>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Order Summary */}
                      <div className="lg:col-span-2">
                        {/* Order Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900">Order Information</h4>
                              <dl className="mt-2 text-sm">
                                <div className="flex justify-between py-1">
                                  <dt className="text-gray-500">Order Number:</dt>
                                  <dd className="font-medium">{order.orderNumber}</dd>
                                </div>
                                <div className="flex justify-between py-1">
                                  <dt className="text-gray-500">Date:</dt>
                                  <dd>{formatDate(order.orderDate)}</dd>
                                </div>
                                <div className="flex justify-between py-1">
                                  <dt className="text-gray-500">Platform:</dt>
                                  <dd>{order.platform}</dd>
                                </div>
                                <div className="flex justify-between py-1">
                                  <dt className="text-gray-500">Customer:</dt>
                                  <dd>{order.customerName}</dd>
                                </div>
                                <div className="flex justify-between py-1">
                                  <dt className="text-gray-500">Email:</dt>
                                  <dd>{order.customerEmail}</dd>
                                </div>
                              </dl>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Status</h4>
                              <div className="mt-2 space-y-2">
                                <div>
                                  <span className="text-sm text-gray-500">Order Status:</span>
                                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                                    {order.status}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Fulfillment:</span>
                                  <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${fulfillmentColors[order.fulfillmentStatus as keyof typeof fulfillmentColors]}`}>
                                    {order.fulfillmentStatus.replace('_', ' ')}
                                  </span>
                                </div>
                                {order.trackingNumber && (
                                  <div className="flex justify-between py-1">
                                    <dt className="text-sm text-gray-500">Tracking:</dt>
                                    <dd className="text-sm font-mono">{order.trackingNumber}</dd>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white border rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-gray-900">Order Items ({order.items.length})</h4>
                              <div className="text-sm text-gray-500">
                                Total Weight: <span className="font-medium">{calculateTotalWeight().toFixed(2)} kg</span>
                              </div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200">
                            {order.items.map((item) => (
                              <div key={item.id} className="p-4">
                                <div className="flex items-start space-x-4">
                                  {/* Product Image Placeholder */}
                                  <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                    {item.image ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                      <span className="text-gray-400 text-xs">IMG</span>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                                        {item.variant && (
                                          <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                                        )}

                                        {/* Product Meta */}
                                        {item.meta && Object.keys(item.meta).length > 0 && (
                                          <div className="mt-2">
                                            <h6 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Product Details</h6>
                                            <div className="mt-1 grid grid-cols-2 gap-x-4 text-sm">
                                              {Object.entries(item.meta).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                  <span className="text-gray-500 capitalize">{key}:</span>
                                                  <span className="text-gray-900">{value}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {item.weight && (
                                          <p className="text-sm text-gray-500 mt-1">Weight: {item.weight} kg</p>
                                        )}
                                      </div>

                                      <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatCurrency(item.price, item.currency)} × {item.quantity}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900">
                                          {formatCurrency(item.price * item.quantity, item.currency)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Sidebar with addresses and totals */}
                      <div className="space-y-6">
                        {/* Order Total */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Subtotal:</dt>
                              <dd>{formatCurrency(calculateSubtotal(), order.currency)}</dd>
                            </div>

                            {/* Shipping Cost */}
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Shipping:</dt>
                              <dd>
                                {order.shippingCost ?
                                  formatCurrency(order.shippingCost, order.currency) :
                                  'Calculated at checkout'
                                }
                              </dd>
                            </div>

                            {/* Tax */}
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Tax:</dt>
                              <dd>
                                {order.taxAmount ?
                                  formatCurrency(order.taxAmount, order.currency) :
                                  'Included'
                                }
                              </dd>
                            </div>

                            {/* Fees */}
                            {order.fees && order.fees > 0 && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Fees:</dt>
                                <dd>{formatCurrency(order.fees, order.currency)}</dd>
                              </div>
                            )}

                            {/* Handling Fee */}
                            {order.handlingFee && order.handlingFee > 0 && (
                              <div className="flex justify-between">
                                <dt className="text-gray-500">Handling:</dt>
                                <dd>{formatCurrency(order.handlingFee, order.currency)}</dd>
                              </div>
                            )}

                            {/* Discounts - Support for multiple discounts */}
                            {order.discounts && order.discounts.length > 0 && (
                              <div className="space-y-1">
                                {order.discounts.map((discount, index) => (
                                  <div key={index} className="flex justify-between text-green-600">
                                    <dt className="text-sm">
                                      {discount.description} ({discount.code}):
                                    </dt>
                                    <dd className="text-sm">-{formatCurrency(discount.amount, order.currency)}</dd>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Legacy single discount support (fallback) */}
                            {(!order.discounts || order.discounts.length === 0) && order.discount && order.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <dt>Discount {order.discountCode && `(${order.discountCode})`}:</dt>
                                <dd>-{formatCurrency(order.discount, order.currency)}</dd>
                              </div>
                            )}

                            {/* Total Weight */}
                            <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-200">
                              <dt className="text-gray-500">Total Weight:</dt>
                              <dd className="font-medium">{calculateTotalWeight().toFixed(2)} kg</dd>
                            </div>

                            <div className="border-t border-gray-200 pt-2 flex justify-between font-medium">
                              <dt>Total:</dt>
                              <dd className="text-lg">{formatCurrency(order.totalAmount, order.currency)}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <CountryFlag countryCode={order.shippingAddress.countryCode} />
                            <span className="ml-2">Shipping Address</span>
                          </h4>
                          <address className="text-sm text-gray-600 not-italic leading-relaxed">
                            {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                            {order.shippingAddress.company && (
                              <>{order.shippingAddress.company}<br /></>
                            )}
                            {order.shippingAddress.address1}<br />
                            {order.shippingAddress.address2 && (
                              <>{order.shippingAddress.address2}<br /></>
                            )}
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                            {order.shippingAddress.country}<br />
                            {order.shippingAddress.phone && (
                              <>Phone: {order.shippingAddress.phone}</>
                            )}
                          </address>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-500">Shipping Method:</p>
                            <p className="text-sm font-medium text-gray-900">{order.shippingMethod}</p>
                          </div>
                        </div>

                        {/* Billing Address */}
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <CountryFlag countryCode={order.billingAddress.countryCode} />
                            <span className="ml-2">Billing Address</span>
                          </h4>
                          <address className="text-sm text-gray-600 not-italic leading-relaxed">
                            {order.billingAddress.firstName} {order.billingAddress.lastName}<br />
                            {order.billingAddress.company && (
                              <>{order.billingAddress.company}<br /></>
                            )}
                            {order.billingAddress.address1}<br />
                            {order.billingAddress.address2 && (
                              <>{order.billingAddress.address2}<br /></>
                            )}
                            {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}<br />
                            {order.billingAddress.country}<br />
                            {order.billingAddress.phone && (
                              <>Phone: {order.billingAddress.phone}</>
                            )}
                          </address>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">Order Notes</h4>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Edit Order
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
