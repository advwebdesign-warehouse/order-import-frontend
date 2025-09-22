//file path: app/dashboard/warehouses/[id]/layout/components/LocationFormatModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { LocationFormat } from '../../../utils/warehouseTypes'

interface LocationFormatModalProps {
  currentFormat?: LocationFormat
  onSave: (format: LocationFormat) => Promise<void>
  onClose: () => void
}

const SEPARATORS = [
  { value: '-', label: 'Dash (-)', example: 'A-01-2-B' },
  { value: '.', label: 'Dot (.)', example: 'A.01.2.B' },
  { value: '_', label: 'Underscore (_)', example: 'A_01_2_B' },
  { value: '/', label: 'Slash (/)', example: 'A/01/2/B' },
  { value: '', label: 'No separator', example: 'A012B' }
]

const PATTERN_PRESETS = [
  {
    name: 'Standard (Zone-Aisle-Shelf-Bin)',
    pattern: '{zone}-{aisle}-{shelf}-{bin}',
    description: 'Most common format for warehouse locations'
  },
  {
    name: 'Compact (Zone-Aisle-Bin)',
    pattern: '{zone}-{aisle}-{bin}',
    description: 'Simplified format without shelf level'
  },
  {
    name: 'Full Path (Zone-Aisle-Shelf-Level-Bin)',
    pattern: '{zone}-{aisle}-{shelf}{level}-{bin}',
    description: 'Detailed format with shelf level included'
  },
  {
    name: 'Numeric (Zone-Aisle only)',
    pattern: '{zone}-{aisle}',
    description: 'Basic format for simple warehouse layouts'
  }
]

export default function LocationFormatModal({ currentFormat, onSave, onClose }: LocationFormatModalProps) {
  const [formData, setFormData] = useState<LocationFormat>({
    pattern: '{zone}-{aisle}-{shelf}-{bin}',
    separator: '-',
    includeZone: true,
    includeAisle: true,
    includeShelf: true,
    includeBin: true
  })
  const [isCustomPattern, setIsCustomPattern] = useState(false)
  const [customPattern, setCustomPattern] = useState('')
  const [saving, setSaving] = useState(false)

  // Load current format
  useEffect(() => {
    if (currentFormat) {
      setFormData(currentFormat)

      // Check if it matches a preset
      const matchingPreset = PATTERN_PRESETS.find(preset => preset.pattern === currentFormat.pattern)
      if (!matchingPreset) {
        setIsCustomPattern(true)
        setCustomPattern(currentFormat.pattern)
      }
    }
  }, [currentFormat])

  // Update pattern based on checkboxes
  useEffect(() => {
    if (!isCustomPattern) {
      const parts = []
      if (formData.includeZone) parts.push('{zone}')
      if (formData.includeAisle) parts.push('{aisle}')
      if (formData.includeShelf) parts.push('{shelf}')
      if (formData.includeBin) parts.push('{bin}')

      const newPattern = parts.join(formData.separator)
      setFormData(prev => ({ ...prev, pattern: newPattern }))
    }
  }, [formData.includeZone, formData.includeAisle, formData.includeShelf, formData.includeBin, formData.separator, isCustomPattern])

  const handlePresetSelect = (preset: typeof PATTERN_PRESETS[0]) => {
    setIsCustomPattern(false)
    setFormData(prev => ({
      ...prev,
      pattern: preset.pattern.replace(/-/g, prev.separator),
      includeZone: preset.pattern.includes('{zone}'),
      includeAisle: preset.pattern.includes('{aisle}'),
      includeShelf: preset.pattern.includes('{shelf}'),
      includeBin: preset.pattern.includes('{bin}')
    }))
  }

  const handleCustomPatternChange = (value: string) => {
    setCustomPattern(value)
    setFormData(prev => ({
      ...prev,
      pattern: value,
      includeZone: value.includes('{zone}'),
      includeAisle: value.includes('{aisle}'),
      includeShelf: value.includes('{shelf}'),
      includeBin: value.includes('{bin}')
    }))
  }

  const handleSeparatorChange = (separator: string) => {
    const newFormData = { ...formData, separator }

    if (!isCustomPattern) {
      // Update pattern with new separator
      const parts = []
      if (newFormData.includeZone) parts.push('{zone}')
      if (newFormData.includeAisle) parts.push('{aisle}')
      if (newFormData.includeShelf) parts.push('{shelf}')
      if (newFormData.includeBin) parts.push('{bin}')

      newFormData.pattern = parts.join(separator)
    } else {
      // Update custom pattern with new separator
      const updatedPattern = customPattern.replace(/[-._/]/g, separator)
      setCustomPattern(updatedPattern)
      newFormData.pattern = updatedPattern
    }

    setFormData(newFormData)
  }

  const generatePreview = () => {
    let preview = formData.pattern
    preview = preview.replace('{zone}', 'A')
    preview = preview.replace('{aisle}', '01')
    preview = preview.replace('{shelf}', '2')
    preview = preview.replace('{level}', '1')
    preview = preview.replace('{bin}', 'B')
    return preview || 'No pattern'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pattern.trim()) {
      alert('Please enter a valid pattern')
      return
    }

    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving format:', error)
      alert('Failed to save location format')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Configure Location Format
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Location Format</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This format will be used to generate location codes for all storage locations in your warehouse.
                  Choose a format that works best for your operations team.
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <div className="bg-white border border-gray-200 rounded px-3 py-2">
                <code className="text-lg font-mono text-gray-900">{generatePreview()}</code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Example location using Zone=A, Aisle=01, Shelf=2, Bin=B
              </p>
            </div>

            {/* Preset Patterns */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Preset Patterns</h4>
              <div className="space-y-2">
                {PATTERN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      !isCustomPattern && formData.pattern.replace(new RegExp(formData.separator, 'g'), '-') === preset.pattern
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{preset.name}</h5>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                        <code className="text-xs text-gray-500 mt-1">
                          {preset.pattern.replace(/-/g, formData.separator)}
                        </code>
                      </div>
                      {!isCustomPattern && formData.pattern.replace(new RegExp(formData.separator, 'g'), '-') === preset.pattern && (
                        <CheckIcon className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Separator Selection */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Separator</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SEPARATORS.map((sep) => (
                  <button
                    key={sep.value}
                    type="button"
                    onClick={() => handleSeparatorChange(sep.value)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      formData.separator === sep.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{sep.label}</div>
                    <div className="text-xs text-gray-500 font-mono">{sep.example}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Component Toggles */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Include Components</h4>
              <div className="space-y-3">
                {[
                  { key: 'includeZone', label: 'Zone', desc: 'Zone identifier (e.g., A, B, RCV)' },
                  { key: 'includeAisle', label: 'Aisle', desc: 'Aisle identifier (e.g., 01, 02, A1)' },
                  { key: 'includeShelf', label: 'Shelf', desc: 'Shelf level (e.g., 1, 2, 3)' },
                  { key: 'includeBin', label: 'Bin', desc: 'Bin position (e.g., A, B, 01)' }
                ].map((component) => (
                  <div key={component.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={component.key}
                      checked={formData[component.key as keyof LocationFormat] as boolean}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, [component.key]: e.target.checked }))
                        setIsCustomPattern(false)
                      }}
                      className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <label htmlFor={component.key} className="text-sm font-medium text-gray-900">
                        {component.label}
                      </label>
                      <p className="text-xs text-gray-600">{component.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Pattern */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Custom Pattern</h4>
                <button
                  type="button"
                  onClick={() => setIsCustomPattern(!isCustomPattern)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {isCustomPattern ? 'Use Preset' : 'Custom Pattern'}
                </button>
              </div>

              {isCustomPattern && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customPattern}
                    onChange={(e) => handleCustomPatternChange(e.target.value)}
                    placeholder="e.g., {zone}-{aisle}-{shelf}-{bin}"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    Use placeholders: {'{zone}'}, {'{aisle}'}, {'{shelf}'}, {'{level}'}, {'{bin}'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Format'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
