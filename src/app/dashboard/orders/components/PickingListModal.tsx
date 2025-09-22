// File: app/dashboard/orders/components/PickingListModal.tsx

'use client'

import { useMemo, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { Order } from '../utils/orderTypes'

interface PickingListModalProps {
  orders: Order[]
  isOpen: boolean
  onClose: () => void
  warehouseName?: string
  maxOrdersLimit?: string // Receive from parent instead of managing internally
}

export default function PickingListModal({
  orders,
  isOpen,
  onClose,
  warehouseName = 'Warehouse',
  maxOrdersLimit = 'all'
}: PickingListModalProps) {

  // Calculate the actual limit to apply based on the setting from Options panel
  const actualLimit = useMemo(() => {
    console.log('PickingListModal - maxOrdersLimit:', maxOrdersLimit) // Debug log

    if (maxOrdersLimit === 'all') {
      return orders.length
    }
    if (maxOrdersLimit?.startsWith('custom:')) {
      const customValue = maxOrdersLimit.split(':')[1]
      const parsed = parseInt(customValue)
      const limit = isNaN(parsed) || parsed <= 0 ? orders.length : parsed
      console.log('PickingListModal - custom value:', customValue, 'parsed:', parsed, 'final limit:', limit) // Debug log
      return limit
    }
    // Handle numeric string values (10, 20, 30, 40, 50)
    const parsed = parseInt(maxOrdersLimit)
    const limit = isNaN(parsed) ? orders.length : parsed
    console.log('PickingListModal - numeric value:', maxOrdersLimit, 'parsed:', parsed, 'final limit:', limit) // Debug log
    return limit
  }, [maxOrdersLimit, orders.length])

  // Get the limited orders for picking
  const ordersForPicking = useMemo(() => {
    return orders.slice(0, actualLimit)
  }, [orders, actualLimit])

  // Calculate total items to pick
  const totalItemsToPick = useMemo(() => {
    return ordersForPicking.reduce((total, order) => total + (order.itemCount || 0), 0)
  }, [ordersForPicking])

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    // TODO: Implement CSV export for picking list
    console.log('Exporting picking list:', ordersForPicking)
    alert('Export functionality to be implemented')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Picking List - {warehouseName}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      {ordersForPicking.length} orders • {totalItemsToPick} items to pick
                      {actualLimit < orders.length && (
                        <span className="ml-2 text-indigo-600">
                          (Limited to {actualLimit} of {orders.length} orders)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print
                    </button>
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Export
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Picking List Content */}
                <div className="max-h-96 overflow-y-auto px-6 py-4">
                  {ordersForPicking.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No orders available for picking</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ordersForPicking.map((order, index) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  {order.orderNumber}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {formatDate(order.orderDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-gray-500">
                                {order.platform}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700">Customer:</p>
                              <p className="text-gray-900">{order.customerName}</p>
                              <p className="text-gray-500 text-xs">{order.customerEmail}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Shipping:</p>
                              <p className="text-gray-900">
                                {order.shippingFirstName} {order.shippingLastName}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {order.country} • {order.requestedShipping}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.fulfillmentStatus === 'PICKING' ? 'bg-yellow-100 text-yellow-800' :
                                order.fulfillmentStatus === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                order.fulfillmentStatus === 'PACKING' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.fulfillmentStatus}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              ${order.totalAmount.toFixed(2)} {order.currency}
                            </div>
                          </div>

                          {/* Checkbox for picked status */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Mark as picked
                              </span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Generated on {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
