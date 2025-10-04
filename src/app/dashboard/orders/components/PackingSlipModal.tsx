//file path: app/dashboard/orders/components/PackingSlipModal.tsx

'use client'

import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import ReactCountryFlag from "react-country-flag"
import { Order } from '../utils/orderTypes'
import { transformToDetailedOrder } from '../utils/orderUtils'
import { printMultiplePackingSlips } from '../utils/packingSlipGenerator'
import PackingSlip from '../PackingSlip'

interface PackingSlipModalProps {
  orders: Order[]
  isOpen: boolean
  onClose: () => void
  warehouseName?: string
  packedOrders?: Set<string>
  onOrderPacked?: (orderId: string) => void
  fulfillmentStatusOptions?: Array<{ value: string; label: string; color: string }>
  onUpdateFulfillmentStatus?: (orderIds: string[], status: string) => Promise<void>
}

export default function PackingSlipModal({
  orders,
  isOpen,
  onClose,
  warehouseName = 'Warehouse',
  packedOrders = new Set<string>(),
  onOrderPacked = () => {},
  fulfillmentStatusOptions = [],
  onUpdateFulfillmentStatus
}: PackingSlipModalProps) {
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null)

  const getStatusLabel = (statusCode: string) => {
    const status = fulfillmentStatusOptions.find(s => s.value === statusCode)
    return status?.label || statusCode.replace(/_/g, ' ')
  }

  const getStatusColor = (statusCode: string) => {
    const status = fulfillmentStatusOptions.find(s => s.value === statusCode)
    if (status?.color) {
      return status.color
    }
    if (statusCode === 'PICKING') return 'bg-yellow-100 text-yellow-800'
    if (statusCode === 'PACKED') return 'bg-indigo-100 text-indigo-800'
    return 'bg-gray-100 text-gray-800'
  }

  const totalOrders = orders.length
  const totalItems = orders.reduce((sum, order) => sum + (order.itemCount || 0), 0)

  // Calculate how many orders are marked as packed
  const packedOrdersCount = packedOrders.size

  const ordersByShipping = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const method = order.requestedShipping || 'Standard'
      if (!acc[method]) acc[method] = 0
      acc[method]++
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [orders])

  const handlePrintAll = () => {
    const ordersWithDetails = orders.map(transformToDetailedOrder)
    printMultiplePackingSlips(ordersWithDetails)
  }

  const handlePrintSingle = (order: Order) => {
    const orderWithDetails = transformToDetailedOrder(order)
    printMultiplePackingSlips([orderWithDetails])
  }

  const handlePreviewOrder = (order: Order) => {
    setPreviewOrder(order)
  }

  const handleSetToPacked = async () => {
    if (!onUpdateFulfillmentStatus) {
      alert('Update function not available')
      return
    }

    // Only get orders that are marked as packed (checked)
    const packedOrderIds = Array.from(packedOrders)

    if (packedOrderIds.length === 0) {
      alert('Please mark at least one order as packed before setting to packed status.')
      return
    }

    // Get order numbers for confirmation message
    const packedOrderNumbers = orders
      .filter(o => packedOrderIds.includes(o.id))
      .map(o => o.orderNumber)
      .join(', ')

    const confirmed = window.confirm(
      `Set ${packedOrderIds.length} packed order(s) to PACKED status?\n\nOrders: ${packedOrderNumbers}`
    )

    if (confirmed) {
      await onUpdateFulfillmentStatus(packedOrderIds, 'PACKED')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 print-modal" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 print:hidden" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto print:overflow-visible">
            <div className="flex min-h-full items-center justify-center p-4 text-center print:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all print:transform-none print:shadow-none print:rounded-none print:max-w-none print-content">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 print:hidden">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Packing Slips - {warehouseName}
                      </Dialog.Title>
                      <div className="mt-1 text-sm text-gray-500">
                        {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} • {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {onUpdateFulfillmentStatus && (
                        <button
                          onClick={handleSetToPacked}
                          disabled={packedOrdersCount === 0}
                          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                          title={packedOrdersCount === 0 ? "Please mark orders as packed first" : `Set ${packedOrdersCount} packed order(s) to Packed status`}
                        >
                          Set to Packed
                          {packedOrdersCount > 0 && (
                            <span className="ml-2 rounded-full bg-indigo-800 px-2 py-0.5 text-xs">
                              {packedOrdersCount}
                            </span>
                          )}
                        </button>
                      )}
                      <button
                        onClick={handlePrintAll}
                        className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                      >
                        <PrinterIcon className="h-4 w-4 mr-2" />
                        Print All ({totalOrders})
                      </button>
                      <button
                        onClick={onClose}
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  {/* Print Header - Only visible during print */}
                  <div className="hidden print:block px-6 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Packing Slips - {warehouseName}</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Generated: {new Date().toLocaleString()} • {totalOrders} orders • {totalItems} items
                    </p>
                  </div>

                  {/* Two Column Content */}
                  <div className="flex h-[600px] print:h-auto">
                    {/* Left Column - Orders to Pack */}
                    <div className="w-1/2 border-r border-gray-200 print:w-1/2 print:border-r">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print:bg-white">
                        <h4 className="text-sm font-medium text-gray-900">Orders to Pack</h4>
                        <p className="text-xs text-gray-500 mt-1">Complete order details for packing</p>
                      </div>
                      <div className="overflow-y-auto h-[calc(600px-60px)] px-6 py-4 print:h-auto print:overflow-visible">
                        {orders.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No orders available</p>
                        ) : (
                          <div className="space-y-3">
                            {orders.map((order) => (
                              <div
                                key={order.id}
                                className={`border rounded-lg p-4 transition-all print:break-inside-avoid print:bg-white print:border-gray-400 ${
                                  packedOrders.has(order.id)
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {/* Order Header */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <ReactCountryFlag
                                      countryCode={order.countryCode}
                                      svg
                                      style={{ width: '20px', height: '15px' }}
                                    />
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-900">
                                        {order.orderNumber}
                                      </h5>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(order.orderDate)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium print:bg-white print:text-gray-900 print:border print:border-gray-400 ${getStatusColor(order.fulfillmentStatus)}`}>
                                      {getStatusLabel(order.fulfillmentStatus)}
                                    </span>
                                    {packedOrders.has(order.id) && (
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 print:hidden" />
                                    )}
                                  </div>
                                </div>

                                {/* Customer & Shipping Address */}
                                {(() => {
                                  const orderWithDetails = transformToDetailedOrder(order)
                                  const addr = orderWithDetails.shippingAddress
                                  return (
                                    <div className="mb-3 p-2 bg-gray-50 rounded print:bg-white print:border print:border-gray-300">
                                      <p className="text-xs text-gray-600 whitespace-pre-line">
                                        {addr.firstName} {addr.lastName}
                                        {addr.address1 && `\n${addr.address1}`}
                                        {`\n${addr.city}, ${addr.state} ${addr.zip}`}
                                        {`\n${addr.country}`}
                                        {addr.phone && `\nPhone: ${addr.phone}`}
                                      </p>
                                    </div>
                                  )
                                })()}

                                {/* Items List */}
                                <div className="space-y-1 mb-3">
                                  <p className="text-xs font-medium text-gray-700">Items ({order.itemCount}):</p>
                                  <div className="ml-2 space-y-1">
                                    {transformToDetailedOrder(order).items.map((item, idx) => (
                                      <p key={idx} className="text-xs text-gray-600">
                                        • {item.name} x{item.quantity}
                                      </p>
                                    ))}
                                  </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 print:bg-white print:border print:border-gray-400">
                                      {order.requestedShipping}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handlePreviewOrder(order)}
                                      className="p-1 text-gray-400 hover:text-indigo-600 print:hidden"
                                      title="Preview packing slip"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handlePrintSingle(order)}
                                      className="p-1 text-gray-400 hover:text-green-600 print:hidden"
                                      title="Print packing slip"
                                    >
                                      <PrinterIcon className="h-4 w-4" />
                                    </button>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        id={`order-${order.id}`}
                                        checked={packedOrders.has(order.id)}
                                        onChange={() => onOrderPacked(order.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded print:appearance-auto"
                                      />
                                      <span className="ml-2 text-xs text-gray-700">Packed</span>
                                    </label>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Packing Summary */}
                    <div className="w-1/2 print:w-1/2 print:block">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print:bg-white">
                        <h4 className="text-sm font-medium text-gray-900">Packing Summary</h4>
                        <p className="text-xs text-gray-500 mt-1">Overview of all orders to pack</p>
                      </div>
                      <div className="overflow-y-auto h-[calc(600px-60px)] px-6 py-4 print:h-auto print:overflow-visible">
                        <div className="space-y-6">
                          {/* Summary Stats */}
                          <div className="grid grid-cols-2 gap-4 print:break-inside-avoid">
                            <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:border print:border-gray-200">
                              <div className="text-2xl font-bold text-blue-900 print:text-gray-900">{totalOrders}</div>
                              <div className="text-sm text-blue-700 print:text-gray-800">Total Orders</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg print:bg-white print:border print:border-gray-200">
                              <div className="text-2xl font-bold text-green-900 print:text-gray-900">{totalItems}</div>
                              <div className="text-sm text-green-700 print:text-gray-800">Total Items</div>
                            </div>
                          </div>

                          {/* Shipping Methods */}
                          <div className="print:break-inside-avoid">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Shipping Methods</h5>
                            <div className="space-y-2">
                              {ordersByShipping.map(([method, count]) => (
                                <div key={method} className="flex items-center justify-between text-sm">
                                  <span className="flex items-center space-x-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span>{method}</span>
                                  </span>
                                  <span className="text-gray-600">{count} {count === 1 ? 'order' : 'orders'}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Countries Summary */}
                          <div className="print:break-inside-avoid">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Shipping Destinations</h5>
                            <div className="space-y-2">
                              {Object.entries(
                                orders.reduce((acc, order) => {
                                  acc[order.country] = (acc[order.country] || 0) + 1
                                  return acc
                                }, {} as Record<string, number>)
                              ).map(([country, count]) => {
                                const order = orders.find(o => o.country === country)
                                return (
                                  <div key={country} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-2">
                                      <ReactCountryFlag
                                        countryCode={order?.countryCode || 'US'}
                                        svg
                                        style={{ width: '16px', height: '12px' }}
                                      />
                                      <span>{country}</span>
                                    </div>
                                    <span className="text-gray-600">{count} {count === 1 ? 'order' : 'orders'}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Packing Progress */}
                          <div className="print:break-inside-avoid">
                            <h5 className="text-sm font-medium text-gray-900 mb-3">Packing Progress</h5>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, totalOrders > 0 ? (packedOrders.size / totalOrders) * 100 : 0)}%`
                                }}
                              ></div>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              {Math.min(packedOrders.size, totalOrders)} of {totalOrders} orders packed
                              ({totalOrders > 0 ? Math.min(100, Math.round((packedOrders.size / totalOrders) * 100)) : 0}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 print:hidden">
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
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">
                          Progress: {Math.min(packedOrders.size, totalOrders)}/{totalOrders} orders
                        </span>
                        <button
                          onClick={onClose}
                          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Single Order Preview Modal */}
      {previewOrder && (
        <PackingSlip
          isOpen={!!previewOrder}
          onClose={() => setPreviewOrder(null)}
          order={transformToDetailedOrder(previewOrder)}
        />
      )}
    </>
  )
}
