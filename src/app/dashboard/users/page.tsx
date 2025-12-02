//file path: app/dashboard/users/page.tsx

'use client'

import { useState, useMemo } from 'react'
import {
  PlusIcon,
  UserGroupIcon,
  UserPlusIcon,
  ArrowPathIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'

// Hooks
import { useUsers } from './hooks/useUsers'
import { useRoles } from './hooks/useRoles'
import { useAccountInitialization } from '@/hooks/useAccountInitialization'

// Components
import UsersTable from './components/UsersTable'
import UserModal, { UserFormData } from './components/UserModal'
import UserFilters from './components/UserFilters'
import { withAuth } from '../shared/components/withAuth'

// Permission helpers from layout
import { hasPermission, getBaseRolePermissions } from '../layout'

// Types
import { User, PresetRole, CustomRole } from '@/lib/api/usersApi'

// ============================================================================
// PERMISSION-BASED ROLE FILTERING
// ============================================================================

/**
 * Get the roles that the current user is allowed to assign
 * - Admin: Can assign any role
 * - Warehouse Manager: Can only assign WAREHOUSE_USER
 * - Custom roles: Based on their specific permissions
 */
function getAllowedRolesToAssign(
  currentUser: any,
  presetRoles: PresetRole[],
  customRoles: CustomRole[]
): { presetRoles: PresetRole[]; customRoles: CustomRole[] } {
  if (!currentUser) {
    return { presetRoles: [], customRoles: [] }
  }

  // Admin can assign any role
  if (currentUser.role === 'ADMIN') {
    return { presetRoles, customRoles }
  }

  // Check if user can manage roles (only admins and custom roles with this permission)
  const canManageRoles = hasPermission(currentUser, 'canManageRoles')

  // Warehouse Manager can only create warehouse users
  if (currentUser.role === 'WAREHOUSE_MANAGER') {
    const warehouseRoles = presetRoles.filter(r =>
      r.role === 'WAREHOUSE_USER' || r.role === 'VIEWER'
    )
    // Can assign custom roles that are based on warehouse roles
    const warehouseCustomRoles = customRoles.filter(r =>
      r.isActive && (r.baseRole === 'WAREHOUSE_USER' || r.baseRole === 'VIEWER')
    )
    return { presetRoles: warehouseRoles, customRoles: warehouseCustomRoles }
  }

  // Custom role with canManageUsers permission
  if (currentUser.customRole?.permissions?.canManageUsers) {
    // Check if they have specific role restrictions
    const allowedRoles = currentUser.customRole.permissions.allowedRolesToCreate

    if (allowedRoles && Array.isArray(allowedRoles)) {
      const filteredPreset = presetRoles.filter(r => allowedRoles.includes(r.role))
      const filteredCustom = customRoles.filter(r =>
        r.isActive && allowedRoles.includes(r.baseRole)
      )
      return { presetRoles: filteredPreset, customRoles: filteredCustom }
    }

    // Default: can only create users with same or lower permissions
    // For now, allow creating viewers and their own role level
    const userBaseRole = currentUser.customRole.baseRole || currentUser.role
    const lowerRoles = ['VIEWER', 'WAREHOUSE_USER']

    const filteredPreset = presetRoles.filter(r =>
      lowerRoles.includes(r.role) || r.role === userBaseRole
    )
    const filteredCustom = customRoles.filter(r =>
      r.isActive && (lowerRoles.includes(r.baseRole) || r.baseRole === userBaseRole)
    )
    return { presetRoles: filteredPreset, customRoles: filteredCustom }
  }

  // Default fallback - very restricted
  return {
    presetRoles: presetRoles.filter(r => r.role === 'VIEWER'),
    customRoles: []
  }
}

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================
interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-lg font-semibold text-gray-900">{value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
function UsersPageContent({ accountId }: { accountId: string }) {
  // Get current user
  const { user: currentUser } = useAccountInitialization()

  // Users and roles data
  const {
    users,
    stats,
    loading: usersLoading,
    error: usersError,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUserRole,
    inviteUser,
    resendInvitation,
    cancelInvitation
  } = useUsers()

  const {
    customRoles,
    presetRoles,
    loading: rolesLoading
  } = useRoles()

  // UI State
  const [showUserModal, setShowUserModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'invite'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // ✅ Permission checks
  const canManageUsers = hasPermission(currentUser, 'canManageUsers')
  const canManageRoles = hasPermission(currentUser, 'canManageRoles')
  const isAdmin = currentUser?.role === 'ADMIN'
  const isWarehouseManager = currentUser?.role === 'WAREHOUSE_MANAGER'

  // ✅ Get allowed roles for this user
  const allowedRoles = useMemo(() => {
    return getAllowedRolesToAssign(currentUser, presetRoles, customRoles)
  }, [currentUser, presetRoles, customRoles])

  // ✅ Filter users based on what this user can see
  const visibleUsers = useMemo(() => {
    // Admin can see all users
    if (isAdmin) return users

    // Warehouse Manager can only see warehouse-related users
    if (isWarehouseManager) {
      return users.filter(u =>
        u.role === 'WAREHOUSE_USER' ||
        u.role === 'WAREHOUSE_MANAGER' ||
        u.role === 'VIEWER'
      )
    }

    // Custom role with limited visibility
    if (currentUser?.customRole?.permissions?.canManageUsers) {
      const viewableRoles = currentUser.customRole.permissions.viewableRoles
      if (viewableRoles && Array.isArray(viewableRoles)) {
        return users.filter(u => viewableRoles.includes(u.role))
      }
    }

    // Default: can only see lower-level users
    return users.filter(u =>
      u.role === 'VIEWER' ||
      u.role === 'WAREHOUSE_USER'
    )
  }, [users, currentUser, isAdmin, isWarehouseManager])

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return visibleUsers.filter(user => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesName = user.name?.toLowerCase().includes(search)
        const matchesEmail = user.email.toLowerCase().includes(search)
        if (!matchesName && !matchesEmail) return false
      }

      // Status filter
      if (statusFilter && user.status !== statusFilter) {
        return false
      }

      // Role filter
      if (roleFilter && user.role !== roleFilter) {
        return false
      }

      return true
    })
  }, [visibleUsers, searchTerm, statusFilter, roleFilter])

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setRoleFilter('')
  }

  // Open modal for creating user
  const handleCreateUser = () => {
    setSelectedUser(null)
    setModalMode('create')
    setShowUserModal(true)
  }

  // Open modal for inviting user
  const handleInviteUser = () => {
    setSelectedUser(null)
    setModalMode('invite')
    setShowUserModal(true)
  }

  // Open modal for editing user
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setModalMode('edit')
    setShowUserModal(true)
  }

  // Save user (create or update)
  const handleSaveUser = async (data: UserFormData) => {
    if (modalMode === 'edit' && selectedUser) {
      // Update existing user
      await updateUser(selectedUser.id, {
        name: data.name,
        role: data.role,
        customRoleId: data.customRoleId
      })
    } else if (modalMode === 'invite') {
      // Invite user
      const result = await inviteUser({
        email: data.email,
        name: data.name || undefined,
        role: data.role,
        customRoleId: data.customRoleId || undefined
      })

      // Show temp password (in development)
      if (process.env.NODE_ENV === 'development' && result.tempPassword) {
        alert(`User invited! Temporary password: ${result.tempPassword}`)
      }
    } else {
      // Create new user
      await createUser({
        email: data.email,
        name: data.name || undefined,
        password: data.password,
        role: data.role,
        customRoleId: data.customRoleId || undefined
      })
    }
  }

  // Delete user
  const handleDeleteUser = async (user: User) => {
    // Check if user can delete this specific user
    if (!isAdmin && user.role === 'ADMIN') {
      alert('You do not have permission to delete admin users')
      return
    }

    if (!confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteUser(user.id)
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
  }

  // Update user status
  const handleUpdateStatus = async (user: User, status: string) => {
    // Check if user can update this specific user
    if (!isAdmin && user.role === 'ADMIN') {
      alert('You do not have permission to update admin users')
      return
    }

    try {
      await updateUserStatus(user.id, status)
    } catch (err: any) {
      alert(err.message || 'Failed to update user status')
    }
  }

  // Resend invitation
  const handleResendInvitation = async (user: User) => {
    try {
      const result = await resendInvitation(user.id)

      if (process.env.NODE_ENV === 'development' && result.tempPassword) {
        alert(`Invitation resent! New temporary password: ${result.tempPassword}`)
      } else {
        alert('Invitation resent successfully!')
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resend invitation')
    }
  }

  // Cancel invitation
  const handleCancelInvitation = async (user: User) => {
    if (!confirm(`Are you sure you want to cancel the invitation for ${user.email}?`)) {
      return
    }

    try {
      await cancelInvitation(user.id)
    } catch (err: any) {
      alert(err.message || 'Failed to cancel invitation')
    }
  }

  // Reset password
  const handleResetPassword = async (user: User) => {
    if (!isAdmin && user.role === 'ADMIN') {
      alert('You do not have permission to reset admin passwords')
      return
    }

    const newPassword = prompt('Enter new password (minimum 8 characters):')
    if (!newPassword) return

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    try {
      alert('Password reset functionality coming soon!')
    } catch (err: any) {
      alert(err.message || 'Failed to reset password')
    }
  }

  // View permissions
  const handleViewPermissions = async (user: User) => {
    alert('Permissions view coming soon!')
  }

  // ✅ Check if user has access
  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ShieldExclamationIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-1">
          You don't have permission to manage users.
        </p>
      </div>
    )
  }

  // Loading state
  if (usersLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    )
  }

  // Error state
  if (usersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading users</h3>
        <p className="text-red-600 text-sm mt-1">{usersError}</p>
        <button
          onClick={refreshUsers}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Manage all team members and their access permissions'
              : isWarehouseManager
                ? 'Manage warehouse team members'
                : 'Manage team members'
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={refreshUsers}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleInviteUser}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <UserPlusIcon className="h-4 w-4" />
            Invite User
          </button>
          <button
            onClick={handleCreateUser}
            className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      {/* ✅ Permission Notice for non-admins */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You can only manage {
              isWarehouseManager
                ? 'warehouse team members (pickers, packers, viewers)'
                : 'users with roles you have permission to assign'
            }.
          </p>
        </div>
      )}

      {/* Stats - only show full stats for admin */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={isAdmin ? "Total Users" : "Team Members"}
            value={isAdmin ? stats.total : visibleUsers.length}
            icon={UserGroupIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Active"
            value={isAdmin ? stats.active : visibleUsers.filter(u => u.status === 'ACTIVE').length}
            icon={UserGroupIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Pending Invitations"
            value={isAdmin ? stats.pending : visibleUsers.filter(u => u.status === 'PENDING').length}
            icon={UserPlusIcon}
            color="bg-yellow-500"
          />
          <StatCard
            title="Inactive / Suspended"
            value={isAdmin
              ? stats.inactive + stats.suspended
              : visibleUsers.filter(u => u.status === 'INACTIVE' || u.status === 'SUSPENDED').length
            }
            icon={UserGroupIcon}
            color="bg-gray-500"
          />
        </div>
      )}

      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        onClearFilters={handleClearFilters}
      />

      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {visibleUsers.length} users
      </div>

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        currentUserId={currentUser?.id || ''}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onUpdateStatus={handleUpdateStatus}
        onResendInvitation={handleResendInvitation}
        onCancelInvitation={handleCancelInvitation}
        onResetPassword={handleResetPassword}
        onViewPermissions={handleViewPermissions}
      />

      {/* User Modal - with filtered roles */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setSelectedUser(null)
        }}
        onSave={handleSaveUser}
        user={selectedUser}
        presetRoles={allowedRoles.presetRoles}
        customRoles={allowedRoles.customRoles}
        mode={modalMode}
      />
    </div>
  )
}

// Export with auth HOC
export default withAuth(UsersPageContent)
