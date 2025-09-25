// file path: app/dashboard/orders/components/PackingSlipModal.tsx

'use client'

import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline'
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
  // Packing state management (optional for backward compatibility)
  packedOrders?: Set<string>
  onOrderPacked?: (orderId: string) => void
}

interface OrderSummary {
  id: string
  orderNumber: string
  customerName: string
  itemCount: number
  shippingMethod: string
  country: string
  countryCode: string
  totalAmount: number
  currency: string
}

export default function PackingSlipModal({
  orders,
  isOpen,
  onClose,
  warehouseName = 'Warehouse',
  packedOrders = new Set<string>(),
  onOrderPacked = () => {}
}: PackingSlipModalProps) {
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null)

  // Calculate summary stats
  const totalOrders = orders.length
  const totalItems = orders.reduce((sum, order) => sum + (order.itemCount || 0), 0)
  const totalValue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)

  // Group orders by shipping method for better organization
  const ordersByShipping = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const method = order.requestedShipping || 'Standard'
      if (!acc[method]) acc[method] = []
      acc[method].push(order)
      return acc
    }, {} as Record<string, Order[]>)

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
  }, [orders])

  // Create order summaries
  const orderSummaries: OrderSummary[] = useMemo(() => {
    return orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      itemCount: order.itemCount || 0,
      shippingMethod: order.requestedShipping || 'Standard',
      country: order.country,
      countryCode: order.countryCode,
      totalAmount: order.totalAmount || 0,
      currency: order.currency || 'USD'
    }))
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
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
            <div className="fixed inset-0 bg-black bg-opacity-25 print-hidden" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto print-overflow-visible">
            <div className="flex min-h-full items-center justify-center p-4 text-center print-p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all print-transform-none print-shadow-none print-rounded-none print-max-w-none print-content">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 print-hidden">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Packing Slips - {warehouseName}
                      </Dialog.Title>
                      <div className="mt-1 text-sm text-gray-500">
                        {totalOrders} {totalOrders === 1 ? 'order' : 'orders'} • {totalItems} {totalItems === 1 ? 'item' : 'items'} • {formatCurrency(totalValue, orders[0]?.currency || 'USD')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
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

                  {/* Two Column Content */}
                  <div className="flex h-[600px] print-h-auto">
                    {/* Left Column - Shipping Summary */}
                    <div className="w-1/2 border-r border-gray-200 print-w-half print-border-r">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print-bg-white">
                        <h4 className="text-sm font-medium text-gray-900">Orders by Shipping Method</h4>
                        <p className="text-xs text-gray-500 mt-1">Organized for efficient packing workflow</p>
                      </div>
                      <div className="overflow-y-auto h-[calc(600px-60px)] px-6 py-4 print-h-auto print-overflow-visible">
                        {ordersByShipping.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No orders available</p>
                        ) : (
                          <div className="space-y-4">
                            {ordersByShipping.map(([shippingMethod, methodOrders]) => (
                              <div key={shippingMethod} className="print-break-inside-avoid">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    📦 {shippingMethod}
                                  </h5>
                                  <span className="text-xs text-gray-500">
                                    {methodOrders.length} {methodOrders.length === 1 ? 'order' : 'orders'}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  {methodOrders.map((order) => (
                                    <div
                                      key={order.id}
                                      className={`border rounded-lg p-3 transition-all print-bg-white print-border-gray-400 ${
                                        packedOrders.has(order.id)
                                          ? 'bg-green-50 border-green-300'
                                          : 'bg-white border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <ReactCountryFlag
                                              countryCode={order.countryCode}
                                              svg
                                              style={{ width: '16px', height: '12px' }}
                                            />
                                            <span className="text-sm font-medium text-gray-900">
                                              {order.orderNumber}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            {order.customerName} • {order.itemCount} items
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatCurrency(order.totalAmount, order.currency)}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handlePreviewOrder(order)}
                                            className="p-1 text-gray-400 hover:text-indigo-600 print-hidden"
                                            title="Preview packing slip"
                                          >
                                            <EyeIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handlePrintSingle(order)}
                                            className="p-1 text-gray-400 hover:text-green-600 print-hidden"
                                            title="Print single packing slip"
                                          >
                                            <PrinterIcon className="h-4 w-4" />
                                          </button>
                                          <label className="flex items-center cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={packedOrders.has(order.id)}
                                              onChange={() => onOrderPacked(order.id)}
                                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded print-appearance-auto"
                                            />
                                            <span className="ml-2 text-xs text-gray-700 print-hidden">Packed</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Order Details Summary */}
                    <div className="w-1/2 print-w-half print-block">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print-bg-white">
                        <h4 className="text-sm font-medium text-gray-900">Packing Summary</h4>
                        <p className="text-xs text-gray-500 mt-1">Overview of all orders to pack</p>
                      </div>
                      <div className="overflow-y-auto h-[calc(600px-60px)] px-6 py-4 print-h-auto print-overflow-visible">
                        {orderSummaries.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No orders available</p>
                        ) : (
                          <div className="space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4 print-break-inside-avoid">
                              <div className="bg-blue-50 p-4 rounded-lg print-bg-white print-border print-border-gray-200">
                                <div className="text-2xl font-bold text-blue-900 print-text-gray-900">{totalOrders}</div>
                                <div className="text-sm text-blue-700 print-text-gray-800">Total Orders</div>
                              </div>
                              <div className="bg-green-50 p-4 rounded-lg print-bg-white print-border print-border-gray-200">
                                <div className="text-2xl font-bold text-green-900 print-text-gray-900">{totalItems}</div>
                                <div className="text-sm text-green-700 print-text-gray-800">Total Items</div>
                              </div>
                            </div>

                            {/* Countries Summary */}
                            <div className="print-break-inside-avoid">
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
                            <div className="print-break-inside-avoid">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Packing Progress</h5>
                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${totalOrders > 0 ? (packedOrders.size / totalOrders) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                {packedOrders.size} of {totalOrders} orders packed ({totalOrders > 0 ? Math.round((packedOrders.size / totalOrders) * 100) : 0}%)
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="print-hidden">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h5>
                              <div className="space-y-2">
                                <button
                                  onClick={() => {
                                    orders.forEach(order => {
                                      if (!packedOrders.has(order.id)) {
                                        onOrderPacked(order.id)
                                      }
                                    })
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                                >
                                  ✓ Mark All as Packed
                                </button>
                                <button
                                  onClick={() => {
                                    orders.forEach(order => {
                                      if (packedOrders.has(order.id)) {
                                        onOrderPacked(order.id)
                                      }
                                    })
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  ↺ Reset Packing Status
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 print-hidden">
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
                          {packedOrders.size}/{totalOrders} orders packed
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
