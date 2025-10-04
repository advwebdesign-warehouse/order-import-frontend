//file path: app/dashboard/orders/components/PickingListModal.tsx

'use client'

import { Fragment, useMemo, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PrinterIcon, DocumentArrowDownIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Order, OrderWithDetails } from '../utils/orderTypes'
import { downloadPickingListCSV } from '../utils/pickingListExporter'

interface PickingListModalProps {
  orders: OrderWithDetails[]
  isOpen: boolean
  onClose: () => void
  warehouseName?: string
  maxOrdersLimit?: string
  totalOrdersCount?: number
  limitedOrdersCount?: number
  itemsCount?: number
  pickedItems?: Set<string>
  pickedOrders?: Set<string>
  onItemPicked?: (sku: string) => void
  onOrderPicked?: (orderId: string) => void
  onUpdateFulfillmentStatus?: (orderIds: string[], status: string) => void
  fulfillmentStatusOptions?: Array<{ value: string; label: string; color: string }>
}

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
  onOrderPicked = () => {},
  onUpdateFulfillmentStatus,
  fulfillmentStatusOptions = []
}: PickingListModalProps) {

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

  const ordersForPicking = orders
  const actualOrdersCount = limitedOrdersCount ?? orders.length
  const totalOrders = totalOrdersCount ?? orders.length
  const totalItemsToPick = itemsCount ?? orders.reduce((total, order) => total + (order.itemCount || 0), 0)

  // Calculate how many orders are marked as packed
  const packedOrdersCount = pickedOrders.size

  const consolidatedItems = useMemo(() => {
    const itemMap = new Map<string, ItemDetail>()

    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
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
              location: item.location || `A${Math.floor(Math.random() * 9) + 1}-B${Math.floor(Math.random() * 5) + 1}`,
              orders: [{
                orderNumber: order.orderNumber,
                quantity: item.quantity
              }]
            })
          }
        })
      }
    })

    return Array.from(itemMap.values()).sort((a, b) => {
      return (a.location || '').localeCompare(b.location || '')
    })
  }, [orders])

  useEffect(() => {
    const handleBeforePrint = () => {
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
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleExport = () => {
    downloadPickingListCSV(ordersForPicking, warehouseName)
  }

  const handleSetToPicking = () => {
    if (!onUpdateFulfillmentStatus) {
      alert('Update function not available')
      return
    }

    // Only get orders that are marked as packed (checked)
    const packedOrderIds = Array.from(pickedOrders)

    if (packedOrderIds.length === 0) {
      alert('Please mark at least one order as packed before setting to picking.')
      return
    }

    // Get order numbers for confirmation message
    const packedOrderNumbers = orders
      .filter(o => packedOrderIds.includes(o.id))  // ✅ FIXED: was pickedOrderIds
      .map(o => o.orderNumber)
      .join(', ')

    const confirmed = window.confirm(
      `Set ${packedOrderIds.length} packed order(s) to PICKING status?\n\nOrders: ${packedOrderNumbers}`
    )

    if (confirmed) {
      onUpdateFulfillmentStatus(packedOrderIds, 'PICKING')
      // Optional: Clear the packed orders after updating
      // packedOrderIds.forEach(id => onOrderPicked(id))
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
                      {onUpdateFulfillmentStatus && (
                        <button
                          onClick={handleSetToPicking}
                          disabled={packedOrdersCount === 0}
                          className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-yellow-600"
                          title={packedOrdersCount === 0 ? "Please mark orders as packed first" : `Set ${packedOrdersCount} packed order(s) to Picking status`}
                        >
                          Set to Picking
                          {packedOrdersCount > 0 && (
                            <span className="ml-2 rounded-full bg-yellow-800 px-2 py-0.5 text-xs">
                              {packedOrdersCount}
                            </span>
                          )}
                        </button>
                      )}
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
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium print:bg-white print:text-gray-900 print:border print:border-gray-400 ${getStatusColor(order.fulfillmentStatus)}`}>
                                      {getStatusLabel(order.fulfillmentStatus)}
                                    </span>
                                    {pickedOrders.has(order.id) && (
                                      <CheckCircleIcon className="h-5 w-5 text-green-600 print:hidden" />
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1 mb-3">
                                  <p className="text-xs font-medium text-gray-700">Items:</p>
                                  <div className="ml-2 space-y-1">
                                    {order.items && order.items.map((item, idx) => (
                                      <p key={idx} className="text-xs text-gray-600">
                                        • {item.name} x{item.quantity}
                                      </p>
                                    ))}
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
