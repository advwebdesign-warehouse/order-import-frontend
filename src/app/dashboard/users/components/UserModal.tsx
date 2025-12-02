//file path: app/dashboard/users/components/UserModal.tsx

'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import {
  XMarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { User, CustomRole, PresetRole } from '@/lib/api/usersApi'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: UserFormData) => Promise<void>
  user?: User | null  // If provided, we're editing
  presetRoles: PresetRole[]
  customRoles: CustomRole[]
  mode: 'create' | 'edit' | 'invite'
}

export interface UserFormData {
  email: string
  name: string
  password: string
  role: string
  customRoleId: string | null
}

// Role display names
const ROLE_NAMES: Record<string, string> = {
  ADMIN: 'Administrator',
  USER: 'Standard User',
  VIEWER: 'Viewer',
  WAREHOUSE_MANAGER: 'Warehouse Manager',
  WAREHOUSE_USER: 'Warehouse User',
  ACCOUNTANT: 'Accountant',
  BUYER: 'Buyer'
}

type RoleSelection = {
  type: 'preset' | 'custom'
  role: string
  customRoleId: string | null
  label: string
}

export default function UserModal({
  isOpen,
  onClose,
  onSave,
  user,
  presetRoles,
  customRoles,
  mode
}: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'USER',
    customRoleId: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Build role options
  const roleOptions: RoleSelection[] = [
    ...presetRoles.map(r => ({
      type: 'preset' as const,
      role: r.role,
      customRoleId: null,
      label: r.name
    })),
    ...customRoles.filter(r => r.isActive).map(r => ({
      type: 'custom' as const,
      role: r.baseRole,
      customRoleId: r.id,
      label: `${r.name} (Custom)`
    }))
  ]

  // Get current selection
  const currentSelection = formData.customRoleId
    ? roleOptions.find(r => r.customRoleId === formData.customRoleId)
    : roleOptions.find(r => r.type === 'preset' && r.role === formData.role)

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user && mode === 'edit') {
        setFormData({
          email: user.email,
          name: user.name || '',
          password: '',
          role: user.role,
          customRoleId: user.customRoleId
        })
      } else {
        setFormData({
          email: '',
          name: '',
          password: '',
          role: 'USER',
          customRoleId: null
        })
      }
      setErrors({})
      setShowPassword(false)
    }
  }, [isOpen, user, mode])

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required'
    } else if (mode === 'create' && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to save user' })
    } finally {
      setSaving(false)
    }
  }

  // Handle role selection
  const handleRoleSelect = (selection: RoleSelection) => {
    setFormData(prev => ({
      ...prev,
      role: selection.role,
      customRoleId: selection.customRoleId
    }))
  }

  // Generate random password
  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setFormData(prev => ({ ...prev, password }))
    setShowPassword(true)
  }

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Create New User'
      case 'edit': return 'Edit User'
      case 'invite': return 'Invite User'
      default: return 'User'
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    {getTitle()}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  {/* Error message */}
                  {errors.submit && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-700">{errors.submit}</p>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                      placeholder="john@example.com"
                      disabled={mode === 'edit'}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>

                  {/* Password (only for create mode) */}
                  {mode === 'create' && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <div className="relative flex flex-grow items-stretch focus-within:z-10">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className={`block w-full rounded-none rounded-l-md sm:text-sm ${
                              errors.password
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                            }`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Generate
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Minimum 8 characters
                      </p>
                    </div>
                  )}

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <Listbox value={currentSelection} onChange={handleRoleSelect}>
                      <div className="relative mt-1">
                        <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
                          <span className="block truncate">
                            {currentSelection?.label || 'Select role'}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                          </span>
                        </Listbox.Button>

                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {/* Preset Roles */}
                            <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                              Standard Roles
                            </div>
                            {roleOptions.filter(r => r.type === 'preset').map((option) => (
                              <Listbox.Option
                                key={option.role}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                  }`
                                }
                                value={option}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      {option.label}
                                    </span>
                                    {selected && (
                                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                        active ? 'text-white' : 'text-indigo-600'
                                      }`}>
                                        <CheckIcon className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}

                            {/* Custom Roles */}
                            {roleOptions.filter(r => r.type === 'custom').length > 0 && (
                              <>
                                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 mt-1">
                                  Custom Roles
                                </div>
                                {roleOptions.filter(r => r.type === 'custom').map((option) => (
                                  <Listbox.Option
                                    key={option.customRoleId}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                      }`
                                    }
                                    value={option}
                                  >
                                    {({ selected, active }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {option.label}
                                        </span>
                                        {selected && (
                                          <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                            active ? 'text-white' : 'text-indigo-600'
                                          }`}>
                                            <CheckIcon className="h-5 w-5" />
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </>
                            )}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : mode === 'invite' ? 'Send Invitation' : 'Save User'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
