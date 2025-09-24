// file path: app/dashboard/orders/components/PickingListModal.tsx

'use client'

import { Fragment, useMemo, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Order } from '../utils/orderTypes'
import { downloadPickingListCSV } from '../utils/pickingListExporter'

interface PickingListModalProps {
  orders: Order[]  // Already limited orders
  isOpen: boolean
  onClose: () => void
  warehouseName?: string
  maxOrdersLimit?: string
  totalOrdersCount?: number  // Total orders that need shipping
  limitedOrdersCount?: number  // How many we're actually showing
  itemsCount?: number  // Total items in the limited orders
  // New props for persistent state (made optional for backward compatibility)
  pickedItems?: Set<string>
  pickedOrders?: Set<string>
  onItemPicked?: (sku: string) => void
  onOrderPicked?: (orderId: string) => void
}

// Mock item details - in real app this would come from the order details
interface ItemDetail {
  sku: string
  name: string
  totalQuantity: number
  location?: string
  orders: {
    orderNumber: string
    quantity: number
  }[]
}

export default function PickingListModal({
  orders,
  isOpen,
  onClose,
  warehouseName = 'Warehouse',
  maxOrdersLimit = 'all',
  totalOrdersCount,
  limitedOrdersCount,
  itemsCount,
  pickedItems = new Set<string>(),
  pickedOrders = new Set<string>(),
  onItemPicked = () => {},
  onOrderPicked = () => {}
}: PickingListModalProps) {

  // Use provided counts or calculate from orders if not provided
  const ordersForPicking = orders
  const actualOrdersCount = limitedOrdersCount ?? orders.length
  const totalOrders = totalOrdersCount ?? orders.length
  const totalItemsToPick = itemsCount ?? orders.reduce((total, order) => total + (order.itemCount || 0), 0)

  // Consolidate items across all orders for the left column
  const consolidatedItems = useMemo(() => {
    const itemMap = new Map<string, ItemDetail>()

    // Mock data - in real app, you'd extract this from actual order items
    orders.forEach((order) => {
      // Simulate different items for each order
      const mockItems = [
        { sku: 'TSH-001', name: 'Premium T-Shirt', quantity: Math.ceil(order.itemCount / 3) },
        { sku: 'HOD-001', name: 'Cotton Hoodie', quantity: Math.floor(order.itemCount / 3) },
        { sku: 'CAP-001', name: 'Baseball Cap', quantity: order.itemCount % 3 || 1 }
      ].filter(item => item.quantity > 0)

      mockItems.forEach(item => {
        if (itemMap.has(item.sku)) {
          const existing = itemMap.get(item.sku)!
          existing.totalQuantity += item.quantity
          existing.orders.push({
            orderNumber: order.orderNumber,
            quantity: item.quantity
          })
        } else {
          itemMap.set(item.sku, {
            sku: item.sku,
            name: item.name,
            totalQuantity: item.quantity,
            location: `A${Math.floor(Math.random() * 9) + 1}-B${Math.floor(Math.random() * 5) + 1}`,
            orders: [{
              orderNumber: order.orderNumber,
              quantity: item.quantity
            }]
          })
        }
      })
    })

    return Array.from(itemMap.values()).sort((a, b) => {
      // Sort by location for efficient picking route
      return (a.location || '').localeCompare(b.location || '')
    })
  }, [orders])

  // Force checkboxes to update their visual state before printing
  useEffect(() => {
    const handleBeforePrint = () => {
      // Force all checked checkboxes to have the checked attribute set
      pickedItems.forEach(sku => {
        const checkbox = document.getElementById(`item-${sku}`) as HTMLInputElement
        if (checkbox) {
          checkbox.checked = true
          checkbox.setAttribute('checked', 'checked')
        }
      })
      pickedOrders.forEach(orderId => {
        const checkbox = document.getElementById(`order-${orderId}`) as HTMLInputElement
        if (checkbox) {
          checkbox.checked = true
          checkbox.setAttribute('checked', 'checked')
        }
      })
    }

    window.addEventListener('beforeprint', handleBeforePrint)
    return () => window.removeEventListener('beforeprint', handleBeforePrint)
  }, [pickedItems, pickedOrders])

  const handlePrint = () => {
    // Ensure checkboxes are set before print
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleExport = () => {
    // Use the export function from pickingListExporter
    downloadPickingListCSV(ordersForPicking, warehouseName)
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
                        Picking List - {warehouseName}
                      </Dialog.Title>
                      <div className="mt-1 text-sm text-gray-500">
                        {actualOrdersCount} {actualOrdersCount === 1 ? 'order' : 'orders'} • {totalItemsToPick} {totalItemsToPick === 1 ? 'item' : 'items'} to pick
                        {actualOrdersCount < totalOrders && (
                          <span className="ml-1 text-amber-600">
                            (Limited to {actualOrdersCount} of {totalOrders} orders)
                          </span>
                        )}
                      </div>
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
                        Export CSV
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
                    <h1 className="text-2xl font-bold text-gray-900">Picking List - {warehouseName}</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Generated: {new Date().toLocaleString()} • {actualOrdersCount} orders • {totalItemsToPick} items
                    </p>
                  </div>

                  {/* Two Column Content */}
                  <div className="flex h-[600px] print:h-auto">
                    {/* Left Column - Items to Pick */}
                    <div className="w-1/2 border-r border-gray-200 print:w-1/2 print:border-r">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print:bg-white">
                        <h4 className="text-sm font-medium text-gray-900">Items to Pick</h4>
                        <p className="text-xs text-gray-500 mt-1">Sorted by location for efficient picking</p>
                      </div>
                      <div className="overflow-y-auto h-[calc(600px-60px)] px-6 py-4 print:h-auto print:overflow-visible">
                        {consolidatedItems.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No items to pick</p>
                        ) : (
                          <div className="space-y-3">
                            {consolidatedItems.map((item) => (
                              <div
                                key={item.sku}
                                className={`border rounded-lg p-4 transition-all print:break-inside-avoid print:bg-white print:border-gray-400 ${
                                  pickedItems.has(item.sku)
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        id={`item-${item.sku}`}
                                        checked={pickedItems.has(item.sku)}
                                        onChange={() => onItemPicked(item.sku)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded print:appearance-auto"
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {item.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          SKU: {item.sku}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mt-2 ml-7">
                                      <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-gray-900">
                                          Qty: {item.totalQuantity}
                                        </span>
                                        {item.location && (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 print:bg-white print:text-gray-900 print:border print:border-gray-400 print:rounded-none">
                                            Location: {item.location}
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-1">
                                        <p className="text-xs text-gray-600">
                                          For orders: {item.orders.map(o => `${o.orderNumber} (${o.quantity})`).join(', ')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {pickedItems.has(item.sku) && (
                                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 print:hidden" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Orders */}
                    <div className="w-1/2 print:w-1/2 print:block">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print:bg-white">
                        <h4 className="text-sm font-medium text-gray-900">Orders Breakdown</h4>
                        <p className="text-xs text-gray-500 mt-1">Items grouped by order for packing</p>
                      </div>
                      <div className="overflow-y-auto h-[calc(600px-60px)] px-6 py-4 print:h-auto print:overflow-visible">
                        {ordersForPicking.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">No orders available</p>
                        ) : (
                          <div className="space-y-3">
                            {ordersForPicking.map((order) => (
                              <div
                                key={order.id}
                                className={`border rounded-lg p-4 transition-all print:bg-white print:border-gray-400 ${
                                  pickedOrders.has(order.id)
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {order.orderNumber}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {order.customerName} • {formatDate(order.orderDate)}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium print:bg-white print:text-gray-900 print:border print:border-gray-400 ${
                                      order.fulfillmentStatus === 'PICKING' ? 'bg-yellow-100 text-yellow-800' :
                                      order.fulfillmentStatus === 'PACKED' ? 'bg-indigo-100 text-indigo-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.fulfillmentStatus}
                                    </span>
                                    {pickedOrders.has(order.id) && (
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 print:hidden" />
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1 mb-3">
                                  <p className="text-xs font-medium text-gray-700">Items:</p>
                                  <div className="ml-2 space-y-1">
                                    <p className="text-xs text-gray-600">• Premium T-Shirt x{Math.ceil(order.itemCount / 3)}</p>
                                    {Math.floor(order.itemCount / 3) > 0 && (
                                      <p className="text-xs text-gray-600">• Cotton Hoodie x{Math.floor(order.itemCount / 3)}</p>
                                    )}
                                    {(order.itemCount % 3 || 1) > 0 && order.itemCount > 1 && (
                                      <p className="text-xs text-gray-600">• Baseball Cap x{order.itemCount % 3 || 1}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                  <span className="text-xs text-gray-500">
                                    {order.requestedShipping}
                                  </span>
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      id={`order-${order.id}`}
                                      checked={pickedOrders.has(order.id)}
                                      onChange={() => onOrderPicked(order.id)}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded print:appearance-auto"
                                    />
                                    <span className="ml-2 text-xs text-gray-700">Packed</span>
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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
                          Progress: {pickedItems.size}/{consolidatedItems.length} items, {pickedOrders.size}/{ordersForPicking.length} orders
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
  )
}
