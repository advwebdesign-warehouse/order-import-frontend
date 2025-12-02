//file path: app/dashboard/users/components/UserFilters.tsx

'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface UserFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
  onClearFilters: () => void
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUSPENDED', label: 'Suspended' }
]

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'USER', label: 'Standard User' },
  { value: 'VIEWER', label: 'Viewer' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { value: 'WAREHOUSE_USER', label: 'Warehouse User' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'BUYER', label: 'Buyer' }
]

export default function UserFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  onClearFilters
}: UserFiltersProps) {
  const hasActiveFilters = searchTerm || statusFilter || roleFilter

  const getStatusLabel = () => STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || 'Status'
  const getRoleLabel = () => ROLE_OPTIONS.find(o => o.value === roleFilter)?.label || 'Role'

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="Search by name or email..."
        />
      </div>

      {/* Status Filter */}
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          {getStatusLabel()}
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {STATUS_OPTIONS.map((option) => (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      onClick={() => onStatusFilterChange(option.value)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } ${
                        statusFilter === option.value ? 'font-semibold text-indigo-600' : 'text-gray-700'
                      } block w-full px-4 py-2 text-left text-sm`}
                    >
                      {option.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Role Filter */}
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          <FunnelIcon className="h-4 w-4 text-gray-400" />
          {getRoleLabel()}
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {ROLE_OPTIONS.map((option) => (
                <Menu.Item key={option.value}>
                  {({ active }) => (
                    <button
                      onClick={() => onRoleFilterChange(option.value)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } ${
                        roleFilter === option.value ? 'font-semibold text-indigo-600' : 'text-gray-700'
                      } block w-full px-4 py-2 text-left text-sm`}
                    >
                      {option.label}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-x-1.5 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
        >
          <XMarkIcon className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  )
}
