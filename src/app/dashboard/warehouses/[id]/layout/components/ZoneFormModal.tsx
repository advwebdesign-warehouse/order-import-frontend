//file path: app/dashboard/warehouses/[id]/layout/components/ZoneFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Zone } from '../../../utils/warehouseTypes'
import { ZONE_TYPES, PRESET_COLORS } from '../utils/layoutConstants'
import { validateZoneName, validateZoneCode } from '../utils/layoutValidation'

export interface ZoneFormData {
  name: string
  code: string
  description: string
  color: string
  type: Zone['type']
}

interface ZoneFormModalProps {
  show: boolean
  editingZone: Zone | null
  zones: Zone[]
  onClose: () => void
  onSubmit: (formData: ZoneFormData) => Promise<void>
}

export default function ZoneFormModal({
  show,
  editingZone,
  zones,
  onClose,
  onSubmit
}: ZoneFormModalProps) {
  const [formData, setFormData] = useState<ZoneFormData>({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    type: 'storage'
  })
  const [errors, setErrors] = useState<{name?: string, code?: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes or editing zone changes
  useEffect(() => {
    if (show) {
      if (editingZone) {
        setFormData({
          name: editingZone.name,
          code: editingZone.code,
          description: editingZone.description || '',
          color: editingZone.color || '#3B82F6',
          type: editingZone.type
        })
      } else {
        setFormData({
          name: '',
          code: '',
          description: '',
          color: '#3B82F6',
          type: 'storage'
        })
      }
      setErrors({})
      setIsSubmitting(false)
    }
  }, [show, editingZone])

  // Real-time validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, name: value })

    if (value) {
      const error = validateZoneName(value, zones, editingZone)
      setErrors(prev => ({ ...prev, name: error?.message }))
    } else {
      setErrors(prev => ({ ...prev, name: undefined }))
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setFormData({ ...formData, code: value })

    if (value) {
      const error = validateZoneCode(value, zones, editingZone)
      setErrors(prev => ({ ...prev, code: error?.message }))
    } else {
      setErrors(prev => ({ ...prev, code: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Final validation
    const nameError = validateZoneName(formData.name, zones, editingZone)
    const codeError = validateZoneCode(formData.code, zones, editingZone)

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
      console.error('Error submitting zone form:', error)
      alert('Failed to save zone. Please try again.')
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
                {editingZone ? 'Edit Zone' : 'Create New Zone'}
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
            {/* Zone Name */}
            <div>
              <label htmlFor="zone-name" className="block text-sm font-medium text-gray-700 mb-1">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="zone-name"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="e.g., General Storage"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Zone Code */}
            <div>
              <label htmlFor="zone-code" className="block text-sm font-medium text-gray-700 mb-1">
                Zone Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="zone-code"
                required
                maxLength={10}
                value={formData.code}
                onChange={handleCodeChange}
                className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
                  errors.code
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-indigo-500'
                }`}
                placeholder="e.g., A, RCV, SHIP"
              />
              <p className="mt-1 text-xs text-gray-500">Short identifier used in location codes</p>
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Zone Type */}
            <div>
              <label htmlFor="zone-type" className="block text-sm font-medium text-gray-700 mb-1">
                Zone Type
              </label>
              <select
                id="zone-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Zone['type'] })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {ZONE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone Color
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: formData.color }}
                />
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <div className="flex space-x-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="zone-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="zone-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Optional description of this zone's purpose..."
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
                : editingZone
                ? 'Update Zone'
                : 'Create Zone'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
