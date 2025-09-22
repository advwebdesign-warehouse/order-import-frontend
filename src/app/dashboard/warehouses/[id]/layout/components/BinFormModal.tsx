//file path: app/dashboard/warehouses/[id]/layout/components/BinFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Zone, Aisle, Shelf, Bin } from '../../../utils/warehouseTypes'
import { validateBinName, validateBinCode } from '../utils/layoutValidation'

export interface BinFormData {
  name: string
  code: string
  position: number
  capacity: number
}

interface BinFormModalProps {
  show: boolean
  editingBin: Bin | null
  selectedZone: Zone | null
  selectedAisle: Aisle | null
  selectedShelf: Shelf | null
  onClose: () => void
  onSubmit: (formData: BinFormData) => Promise<void>
}

export default function BinFormModal({
  show,
  editingBin,
  selectedZone,
  selectedAisle,
  selectedShelf,
  onClose,
  onSubmit
}: BinFormModalProps) {
  const [formData, setFormData] = useState<BinFormData>({
    name: '',
    code: '',
    position: 1,
    capacity: 100
  })
  const [errors, setErrors] = useState<{name?: string, code?: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or editing bin changes
  useEffect(() => {
    if (show) {
      if (editingBin) {
        setFormData({
          name: editingBin.name,
          code: editingBin.code,
          position: editingBin.position,
          capacity: editingBin.capacity || 100
        })
      } else {
        // Suggest next bin values based on existing bins on shelf
        const nextPosition = selectedShelf ? selectedShelf.bins.length + 1 : 1
        setFormData({
          name: `Bin ${nextPosition}`,
          code: `B${nextPosition.toString().padStart(2, '0')}`,
          position: nextPosition,
          capacity: 100
        })
      }
      setErrors({})
      setIsSubmitting(false)
    }
  }, [show, editingBin, selectedShelf])

  // Real-time validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, name: value })

    if (value && selectedShelf) {
      const error = validateBinName(value, selectedShelf, editingBin?.id)
      setErrors(prev => ({ ...prev, name: error?.message }))
    } else {
      setErrors(prev => ({ ...prev, name: undefined }))
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setFormData({ ...formData, code: value })

    if (value && selectedShelf) {
      const error = validateBinCode(value, selectedShelf, editingBin?.id)
      setErrors(prev => ({ ...prev, code: error?.message }))
    } else {
      setErrors(prev => ({ ...prev, code: undefined }))
    }
  }

  const generateLocationCode = () => {
    if (!selectedZone || !selectedAisle || !selectedShelf || !formData.code) {
      return '??-??-??-??'
    }
    return `${selectedZone.code}-${selectedAisle.code}-${selectedShelf.code}-${formData.code}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedShelf) return

    // Final validation
    const nameError = validateBinName(formData.name, selectedShelf, editingBin?.id)
    const codeError = validateBinCode(formData.code, selectedShelf, editingBin?.id)

    if (nameError || codeError) {
      setErrors({
        name: nameError?.message,
        code: codeError?.message
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting bin form:', error)
      alert('Failed to save bin. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!show) return null

  const isFormValid = formData.name && formData.code && !errors.name && !errors.code

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBin ? 'Edit Bin' : 'Create New Bin'}
                {selectedShelf && ` on ${selectedShelf.name}`}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {selectedZone && selectedAisle && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedZone.name} → {selectedAisle.name}
              </p>
            )}
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Bin Name */}
            <div>
              <label htmlFor="bin-name" className="block text-sm font-medium text-gray-700 mb-1">
                Bin Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bin-name"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="e.g., Bin 1"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Bin Code */}
            <div>
              <label htmlFor="bin-code" className="block text-sm font-medium text-gray-700 mb-1">
                Bin Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bin-code"
                required
                maxLength={10}
                value={formData.code}
                onChange={handleCodeChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                  errors.code
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="e.g., B01, B02"
              />
              <p className="mt-1 text-xs text-gray-500">Used in location codes</p>
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Position and Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bin-position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="number"
                  id="bin-position"
                  min="1"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Order on shelf</p>
              </div>

              <div>
                <label htmlFor="bin-capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  id="bin-capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Max items</p>
              </div>
            </div>

            {/* Location Code Preview */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Full Location Code:</p>
              <code className="text-sm font-mono text-indigo-600">
                {generateLocationCode()}
              </code>
              <p className="text-xs text-gray-500 mt-1">
                This is how the bin will be identified in the system
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
                !isFormValid || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              {isSubmitting
                ? 'Saving...'
                : editingBin
                ? 'Update Bin'
                : 'Create Bin'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
