//file path: src/app/dashboard/orders/components/ShippingModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, TruckIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { getShippingRates, validateAddress } from '@/lib/services/uspsClient'

interface ShippingAddress {
  streetAddress: string
  secondaryAddress?: string
  city: string
  state: string
  zipCode: string
}

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  shippingAddress: ShippingAddress
  items: Array<{
    name: string
    quantity: number
    sku: string
  }>
  total: number
  weight?: number
}

interface ShippingRate {
  mailClass: string
  zone: string
  rate: number
  deliveryDays?: string
  deliveryDate?: string
}

interface Props {
  order: Order
  isOpen: boolean
  onClose: () => void
  onShipmentCreated?: () => void
}

export default function ShippingModal({ order, isOpen, onClose, onShipmentCreated }: Props) {
  const [step, setStep] = useState<'address' | 'dimensions' | 'rates' | 'label'>('address')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Address validation
  const [validatedAddress, setValidatedAddress] = useState<ShippingAddress | null>(null)
  const [addressConfirmed, setAddressConfirmed] = useState(false)

  // Package dimensions
  const [weight, setWeight] = useState(order.weight || 16)
  const [length, setLength] = useState(10)
  const [width, setWidth] = useState(8)
  const [height, setHeight] = useState(6)

  // Shipping rates
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)

  const handleValidateAddress = async () => {
    setLoading(true)
    setError('')

    try {
      const result = await validateAddress({
        streetAddress: order.shippingAddress.streetAddress,
        secondaryAddress: order.shippingAddress.secondaryAddress,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        ZIPCode: order.shippingAddress.zipCode
      })

      setValidatedAddress({
        streetAddress: result.streetAddress,
        secondaryAddress: result.secondaryAddress,
        city: result.city,
        state: result.state,
        zipCode: result.ZIPCode + (result.ZIPPlus4 ? `-${result.ZIPPlus4}` : '')
      })

      setStep('dimensions')
    } catch (err: any) {
      setError(err.message || 'Failed to validate address')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateRates = async () => {
    setLoading(true)
    setError('')

    try {
      const shipment = {
        fromAddress: {
          streetAddress: "475 L'Enfant Plaza SW", // TODO: Get from warehouse settings
          city: 'Washington',
          state: 'DC',
          ZIPCode: '20260'
        },
        toAddress: {
          streetAddress: validatedAddress?.streetAddress || order.shippingAddress.streetAddress,
          secondaryAddress: validatedAddress?.secondaryAddress || order.shippingAddress.secondaryAddress,
          city: validatedAddress?.city || order.shippingAddress.city,
          state: validatedAddress?.state || order.shippingAddress.state,
          ZIPCode: (validatedAddress?.zipCode || order.shippingAddress.zipCode).split('-')[0]
        },
        weight,
        length,
        width,
        height
      }

      const result = await getShippingRates(shipment)
      setRates(result.rates)
      setStep('rates')
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shipping rates')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateLabel = async () => {
    if (!selectedRate) return

    setLoading(true)
    setError('')

    try {
      // TODO: Implement label generation
      console.log('Generating label with rate:', selectedRate)

      // For now, just show success
      alert('Label generation will be implemented in next step!')

      if (onShipmentCreated) {
        onShipmentCreated()
      }

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to generate label')
    } finally {
      setLoading(false)
    }
  }

  const getMailClassDisplayName = (mailClass: string) => {
    const names: Record<string, string> = {
      'USPS_GROUND_ADVANTAGE': 'USPS Ground Advantage',
      'PRIORITY_MAIL': 'Priority Mail',
      'PRIORITY_MAIL_EXPRESS': 'Priority Mail Express',
      'FIRST-CLASS_PACKAGE_SERVICE': 'First-Class Package',
      'PARCEL_SELECT': 'Parcel Select',
      'MEDIA_MAIL': 'Media Mail',
      'LIBRARY_MAIL': 'Library Mail',
      'USPS_RETAIL_GROUND': 'Retail Ground'
    }
    return names[mailClass] || mailClass
  }

  const handleClose = () => {
    setStep('address')
    setValidatedAddress(null)
    setRates([])
    setSelectedRate(null)
    setError('')
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TruckIcon className="h-6 w-6 text-blue-600" />
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          Ship Order {order.orderNumber}
                        </Dialog.Title>
                        <p className="text-sm text-gray-500 mt-1">
                          {step === 'address' && 'Step 1: Validate Address'}
                          {step === 'dimensions' && 'Step 2: Package Dimensions'}
                          {step === 'rates' && 'Step 3: Select Shipping Rate'}
                          {step === 'label' && 'Step 4: Generate Label'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Step 1: Address Validation */}
                  {step === 'address' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">
                          Customer Information
                        </h3>
                        <p className="text-sm text-blue-800">
                          <strong>{order.customer.name}</strong><br />
                          {order.customer.email}
                        </p>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-900 mb-2">
                          Shipping Address (Original)
                        </h3>
                        <p className="text-sm text-yellow-800">
                          {order.shippingAddress.streetAddress}
                          {order.shippingAddress.secondaryAddress && (
                            <>, {order.shippingAddress.secondaryAddress}</>
                          )}
                          <br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                      </div>

                      {validatedAddress && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-green-900 mb-2">
                                Validated Address (USPS Verified)
                              </h3>
                              <p className="text-sm text-green-800">
                                {validatedAddress.streetAddress}
                                {validatedAddress.secondaryAddress && (
                                  <>, {validatedAddress.secondaryAddress}</>
                                )}
                                <br />
                                {validatedAddress.city}, {validatedAddress.state} {validatedAddress.zipCode}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Package Dimensions */}
                  {step === 'dimensions' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">
                          Order Items
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.name} ({item.sku})
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Package Dimensions
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weight (oz) *
                            </label>
                            <input
                              type="number"
                              value={weight}
                              onChange={(e) => setWeight(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Length (in) *
                            </label>
                            <input
                              type="number"
                              value={length}
                              onChange={(e) => setLength(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Width (in) *
                            </label>
                            <input
                              type="number"
                              value={width}
                              onChange={(e) => setWidth(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Height (in) *
                            </label>
                            <input
                              type="number"
                              value={height}
                              onChange={(e) => setHeight(Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              min="1"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          * All fields are required for accurate rate calculation
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Shipping Rates */}
                  {step === 'rates' && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Package:</strong> {weight} oz • {length}" × {width}" × {height}"
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Available Shipping Options
                        </h3>
                        {rates.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No rates available
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {rates.map((rate, index) => (
                              <div
                                key={index}
                                onClick={() => setSelectedRate(rate)}
                                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                  selectedRate === rate
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {getMailClassDisplayName(rate.mailClass)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Zone {rate.zone}
                                      {rate.deliveryDays && ` • ${rate.deliveryDays} days`}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-gray-900">
                                      ${rate.rate.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={() => {
                      if (step === 'dimensions') setStep('address')
                      else if (step === 'rates') setStep('dimensions')
                      else handleClose()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {step === 'address' ? 'Cancel' : 'Back'}
                  </button>

                  <div className="flex space-x-3">
                    {step === 'address' && (
                      <button
                        onClick={handleValidateAddress}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Validating...' : 'Validate & Continue'}
                      </button>
                    )}

                    {step === 'dimensions' && (
                      <button
                        onClick={handleCalculateRates}
                        disabled={loading || !weight || !length || !width || !height}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Calculating...' : 'Calculate Rates'}
                      </button>
                    )}

                    {step === 'rates' && (
                      <button
                        onClick={handleGenerateLabel}
                        disabled={loading || !selectedRate}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Generating...' : 'Generate Label'}
                      </button>
                    )}
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
