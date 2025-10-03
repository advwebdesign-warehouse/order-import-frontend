//file path: app/dashboard/orders/components/EditableStatusCell.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface StatusOption {
  value: string
  label: string
  color: string
}

interface EditableStatusCellProps {
  orderId: string
  currentValue: string
  options: StatusOption[]
  onUpdate: (orderId: string, newValue: string) => Promise<void>
  type: 'status' | 'fulfillmentStatus'
}

export default function EditableStatusCell({
  orderId,
  currentValue,
  options,
  onUpdate,
  type
}: EditableStatusCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find the current option by matching the value (code)
  const currentOption = options.find(opt => opt.value === currentValue)

  // Fallback: create a formatted label from the code if option not found
  const displayLabel = currentOption?.label || currentValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  const colorClasses = currentOption?.color || 'bg-gray-100 text-gray-800'

  // Debug: Log if option not found
  useEffect(() => {
    if (!currentOption && process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ No matching option found for ${type}:`, {
        currentValue,
        availableOptions: options.map(o => o.value)
      })
    }
  }, [currentOption, currentValue, options, type])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStatusChange = async (newValue: string) => {
    if (newValue === currentValue) {
      setIsOpen(false)
      return
    }

    setIsUpdating(true)
    try {
      await onUpdate(orderId, newValue)
      setIsOpen(false)
    } catch (error) {
      console.error(`Failed to update ${type}:`, error)
      alert(`Failed to update ${type}. Please try again.`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          ${colorClasses}
          hover:opacity-80 transition-opacity
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
        `}
      >
        {isUpdating ? (
          <>
            <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            Updating...
          </>
        ) : (
          <>
            {displayLabel}
            <ChevronDownIcon className="h-3 w-3" />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`
                w-full px-3 py-2 text-left text-sm hover:bg-gray-50
                flex items-center justify-between
                ${option.value === currentValue ? 'bg-gray-50' : ''}
              `}
            >
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                {option.label}
              </span>
              {option.value === currentValue && (
                <CheckIcon className="h-4 w-4 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
