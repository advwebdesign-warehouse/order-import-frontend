//file path: app/dashboard/warehouses/[id]/layout/components/AisleFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Zone, Aisle } from '../../../utils/warehouseTypes'
import { validateAisleName, validateAisleCode } from '../utils/layoutValidation'

export interface AisleFormData {
  name: string
  code: string
  description: string
  maxHeight: number
  width: number
  length: number
  unit: 'feet' | 'meters'
  shelfCount: number
}

interface AisleFormModalProps {
  show: boolean
  editingAisle: Aisle | null
  selectedZone: Zone | null
  onClose: () => void
  onSubmit: (formData: AisleFormData) => Promise<void>
}

export default function AisleFormModal({
  show,
  editingAisle,
  selectedZone,
  onClose,
  onSubmit
}: AisleFormModalProps) {
  const [formData, setFormData] = useState<AisleFormData>({
    name: '',
    code: '',
    description: '',
    maxHeight: 20,
    width: 4,
    length: 40,
    unit: 'feet',
    shelfCount: 4
  })
  const [errors, setErrors] = useState<{name?: string, code?: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or editing aisle changes
  useEffect(() => {
    if (show) {
      if (editingAisle) {
        setFormData({
          name: editingAisle.name,
          code: editingAisle.code,
          description: editingAisle.description || '',
          maxHeight: editingAisle.maxHeight || 20,
          width: editingAisle.width || 4,
          length: editingAisle.length || 40,
          unit: editingAisle.unit || 'feet',
          shelfCount: editingAisle.shelves?.length || 4
        })
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          maxHeight: 20,
          width: 4,
          length: 40,
          unit: 'feet',
          shelfCount: 4
        })
      }
      setErrors({})
      setIsSubmitting(false)
    }
  }, [show, editingAisle])

  // Real-time validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, name: value })

    if (value && selectedZone) {
      const error = validateAisleName(value, selectedZone, editingAisle)
      setErrors(prev => ({ ...prev, name: error?.message }))
    } else {
      setErrors(prev => ({ ...prev, name: undefined }))
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setFormData({ ...formData, code: value })

    if (value && selectedZone) {
      const error = validateAisleCode(value, selectedZone, editingAisle)
      setErrors(prev => ({ ...prev, code: error?.message }))
    } else {
      setErrors(prev => ({ ...prev, code: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedZone) return

    // Final validation
    const nameError = validateAisleName(formData.name, selectedZone, editingAisle)
    const codeError = validateAisleCode(formData.code, selectedZone, editingAisle)

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
      console.error('Error submitting aisle form:', error)
      alert('Failed to save aisle. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!show) return null

  const isFormValid = formData.name && formData.code && !errors.name && !errors.code

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAisle ? 'Edit Aisle' : 'Create New Aisle'}
                {selectedZone && ` in ${selectedZone.name}`}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Aisle Name */}
            <div>
              <label htmlFor="aisle-name" className="block text-sm font-medium text-gray-700 mb-1">
                Aisle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="aisle-name"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="e.g., Aisle 1"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Aisle Code */}
            <div>
              <label htmlFor="aisle-code" className="block text-sm font-medium text-gray-700 mb-1">
                Aisle Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="aisle-code"
                required
                maxLength={10}
                value={formData.code}
                onChange={handleCodeChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                  errors.code
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="e.g., A01, B02"
              />
              <p className="mt-1 text-xs text-gray-500">Used in location codes</p>
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="aisle-width" className="block text-sm font-medium text-gray-700 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  id="aisle-width"
                  min="1"
                  step="0.1"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="aisle-length" className="block text-sm font-medium text-gray-700 mb-1">
                  Length
                </label>
                <input
                  type="number"
                  id="aisle-length"
                  min="1"
                  step="0.1"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="aisle-max-height" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Height
                </label>
                <input
                  type="number"
                  id="aisle-max-height"
                  min="1"
                  step="0.1"
                  value={formData.maxHeight}
                  onChange={(e) => setFormData({ ...formData, maxHeight: parseFloat(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="aisle-unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  id="aisle-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'feet' | 'meters' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="feet">Feet</option>
                  <option value="meters">Meters</option>
                </select>
              </div>
            </div>

            {/* Shelf Count - Only show for new aisles */}
            {!editingAisle && (
              <div>
                <label htmlFor="aisle-shelf-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Shelves
                </label>
                <input
                  type="number"
                  id="aisle-shelf-count"
                  min="1"
                  max="20"
                  value={formData.shelfCount}
                  onChange={(e) => setFormData({ ...formData, shelfCount: parseInt(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Shelves will be automatically created</p>
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="aisle-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="aisle-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Optional description..."
              />
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
                : editingAisle
                ? 'Update Aisle'
                : 'Create Aisle'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
