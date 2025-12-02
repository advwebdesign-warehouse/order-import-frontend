//file path: app/dashboard/users/components/UsersTable.tsx

'use client'

import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  XCircleIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { User, CustomRole } from '@/lib/api/usersApi'

interface UsersTableProps {
  users: User[]
  currentUserId: string
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onUpdateStatus: (user: User, status: string) => void
  onResendInvitation: (user: User) => void
  onCancelInvitation: (user: User) => void
  onResetPassword: (user: User) => void
  onViewPermissions: (user: User) => void
}

// Status badge colors
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-red-100 text-red-800'
}

// Role badge colors
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  USER: 'bg-blue-100 text-blue-800',
  VIEWER: 'bg-gray-100 text-gray-800',
  WAREHOUSE_MANAGER: 'bg-orange-100 text-orange-800',
  WAREHOUSE_USER: 'bg-amber-100 text-amber-800',
  ACCOUNTANT: 'bg-emerald-100 text-emerald-800',
  BUYER: 'bg-cyan-100 text-cyan-800'
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

export default function UsersTable({
  users,
  currentUserId,
  onEdit,
  onDelete,
  onUpdateStatus,
  onResendInvitation,
  onCancelInvitation,
  onResetPassword,
  onViewPermissions
}: UsersTableProps) {

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
              User
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Role
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Last Login
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Created
            </th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId
            const isPending = user.status === 'PENDING'

            return (
              <tr key={user.id} className={isCurrentUser ? 'bg-indigo-50' : ''}>
                {/* User Info */}
                <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {(user.name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {user.name || 'No name'}
                        </span>
                        {isCurrentUser && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}`}>
                      {ROLE_NAMES[user.role] || user.role}
                    </span>
                    {user.customRole && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {user.customRole.name}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[user.status] || 'bg-gray-100 text-gray-800'}`}>
                    {user.status}
                  </span>
                </td>

                {/* Last Login */}
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(user.lastLoginAt)}
                </td>

                {/* Created */}
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>

                {/* Actions */}
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                      <EllipsisVerticalIcon className="h-5 w-5" />
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
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          {/* Edit */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onEdit(user)}
                                className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <PencilIcon className="mr-3 h-4 w-4 text-gray-400" />
                                Edit User
                              </button>
                            )}
                          </Menu.Item>

                          {/* View Permissions */}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => onViewPermissions(user)}
                                className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <ShieldCheckIcon className="mr-3 h-4 w-4 text-gray-400" />
                                View Permissions
                              </button>
                            )}
                          </Menu.Item>

                          <div className="border-t border-gray-100 my-1" />

                          {/* Status Actions */}
                          {isPending ? (
                            <>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onResendInvitation(user)}
                                    className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                  >
                                    <EnvelopeIcon className="mr-3 h-4 w-4 text-gray-400" />
                                    Resend Invitation
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => onCancelInvitation(user)}
                                    className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-red-600`}
                                  >
                                    <XCircleIcon className="mr-3 h-4 w-4 text-red-400" />
                                    Cancel Invitation
                                  </button>
                                )}
                              </Menu.Item>
                            </>
                          ) : (
                            <>
                              {user.status === 'ACTIVE' && (
                                <>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => onUpdateStatus(user, 'INACTIVE')}
                                        className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                        disabled={isCurrentUser}
                                      >
                                        <PauseCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
                                        Deactivate
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => onUpdateStatus(user, 'SUSPENDED')}
                                        className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-orange-600`}
                                        disabled={isCurrentUser}
                                      >
                                        <XCircleIcon className="mr-3 h-4 w-4 text-orange-400" />
                                        Suspend
                                      </button>
                                    )}
                                  </Menu.Item>
                                </>
                              )}
                              {(user.status === 'INACTIVE' || user.status === 'SUSPENDED') && (
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => onUpdateStatus(user, 'ACTIVE')}
                                      className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-green-600`}
                                    >
                                      <CheckCircleIcon className="mr-3 h-4 w-4 text-green-400" />
                                      Activate
                                    </button>
                                  )}
                                </Menu.Item>
                              )}
                            </>
                          )}

                          <div className="border-t border-gray-100 my-1" />

                          {/* Reset Password */}
                          {!isPending && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onResetPassword(user)}
                                  className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                                >
                                  <KeyIcon className="mr-3 h-4 w-4 text-gray-400" />
                                  Reset Password
                                </button>
                              )}
                            </Menu.Item>
                          )}

                          {/* Delete */}
                          {!isCurrentUser && (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => onDelete(user)}
                                  className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-red-600`}
                                >
                                  <TrashIcon className="mr-3 h-4 w-4 text-red-400" />
                                  Delete User
                                </button>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </td>
              </tr>
            )
          })}

          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="text-gray-500">No users found</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
