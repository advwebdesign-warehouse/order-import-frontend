//file path: app/dashboard/shipping/components/AddBoxModal.tsx

'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ShippingBox, BoxType, ServiceType } from '../utils/shippingTypes'

interface AddBoxModalProps {
     isOpen: boolean
     onClose: () => void
     onSave: (box: Partial<ShippingBox>, applyToAllWarehouses?: boolean) => void
     box?: ShippingBox | null
     selectedWarehouseId: string
     allWarehouses: Array<{ id: string; name: string }>
   }

export default function AddBoxModal({
  isOpen,
  onClose,
  onSave,
  box,
  selectedWarehouseId,
  allWarehouses
}: AddBoxModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    boxType: 'custom' as BoxType,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'in' as 'in' | 'cm'
    },
    weight: {
      maxWeight: 0,
      tareWeight: 0,
      unit: 'lbs' as 'lbs' | 'kg'
    },
    description: '',
    isActive: true,
    availableFor: 'both' as ServiceType
  })

  // ✅ ADD THIS - Get carrier name dynamically
  const getCarrierName = (): string => {
    if (!box) return 'Carrier'

    // For custom boxes with carrierType
    if (box.boxType === 'custom' && (box as any).carrierType) {
      return (box as any).carrierType.toUpperCase()
    }

    // For carrier boxes
    if (box.boxType !== 'custom') {
      return box.boxType.toUpperCase()
    }

    return 'Carrier'
  }

  const carrierName = getCarrierName()

  const [applyToAllWarehouses, setApplyToAllWarehouses] = useState(false)

  // Show "Apply to All Warehouses" option when:
  // 1. Editing a carrier box (not custom)
  // 2. AND a specific warehouse is selected (not "All Warehouses")
  // 3. AND there are multiple warehouses
  const showApplyToAll = box &&
                          box.boxType !== 'custom' &&
                          selectedWarehouseId !== '' &&
                          allWarehouses.length > 1

  useEffect(() => {
    if (box) {
      setFormData({
        name: box.name,
        boxType: box.boxType,
        dimensions: box.dimensions,
        weight: box.weight,
        description: box.description || '',
        isActive: box.isActive,
        availableFor: box.availableFor
      })
    } else {
      // Reset form
      setFormData({
        name: '',
        boxType: 'custom',
        dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
        weight: { maxWeight: 0, tareWeight: 0, unit: 'lbs' },
        description: '',
        isActive: true,
        availableFor: 'both'
      })
    }
    setApplyToAllWarehouses(false)
  }, [box, isOpen])

  const handleSave = () => {
    onSave(formData, applyToAllWarehouses)
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-semibold text-gray-900">
                    Edit Box Dimensions
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                {/* Info banner for carrier boxes */}
                {box && box.boxType !== 'custom' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">📦 Carrier Box:</span> You can modify dimensions and box weight for your own packaging. Max weight limit is set by {((box as any).carrierType || box.boxType).toUpperCase()}.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Box Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Box Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Small Product Box"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Optional description"
                    />
                  </div>

                  {/* Service Type Badge - Read Only (for carrier boxes) */}
                  {box && (box as any).mailClass && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
                        {(box as any).mailClass.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {/* Dimensions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dimensions (L × W × H) *
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.length || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Length"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.width || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Width"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.dimensions.height || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Height"
                      />
                      <select
                        value={formData.dimensions.unit}
                        onChange={(e) => setFormData({
                          ...formData,
                          dimensions: { ...formData.dimensions, unit: e.target.value as 'in' | 'cm' }
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="in">inches</option>
                        <option value="cm">cm</option>
                      </select>
                    </div>
                  </div>

                  {/* Weight Limits */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight Limits *
                    </label>

                    {/* Always show as read-only since all boxes originate from USPS */}
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Max Weight (Carrier Limit)</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Set by {carrierName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {formData.weight.maxWeight}
                            <span className="text-base font-normal text-gray-600 ml-1">
                              {formData.weight.unit}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Box Weight (Tare Weight) - Always Editable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Box Weight (Tare Weight)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Weight</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.weight.tareWeight || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            weight: { ...formData.weight, tareWeight: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="0.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Weight of empty box
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Unit</label>
                        <select
                          value={formData.weight.unit}
                          onChange={(e) => setFormData({
                            ...formData,
                            weight: { ...formData.weight, unit: e.target.value as 'lbs' | 'kg' }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="lbs">lbs</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Availability - ALWAYS READ-ONLY (all boxes from USPS) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available For
                    </label>

                    {/* Always show as read-only since all boxes originate from USPS */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Service Availability</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Set by {carrierName} for this service type
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-semibold text-gray-900">
                            {formData.availableFor === 'both' ? 'Domestic & International' :
                             formData.availableFor === 'domestic' ? 'Domestic Only' : 'International Only'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Apply to All Warehouses - Only show when editing carrier box in specific warehouse */}
                  {showApplyToAll && (
                    <div className="border-t pt-4">
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyToAllWarehouses}
                          onChange={(e) => setApplyToAllWarehouses(e.target.checked)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">
                            Apply to All Warehouses
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            Update this carrier box in all {allWarehouses.length} warehouses.
                            This will sync the settings across: {allWarehouses.map(w => w.name).join(', ')}.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.name || formData.dimensions.length === 0}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {box ?
                      (applyToAllWarehouses ? 'Update All Warehouses' : 'Update Box')
                      : 'Add Box'
                    }
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
