//file path: src/lib/api/usersApi.ts

import { apiRequest } from './baseApi'

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  id: string
  accountId: string
  email: string
  name: string | null
  role: 'ADMIN' | 'USER' | 'VIEWER' | 'WAREHOUSE_MANAGER' | 'WAREHOUSE_USER' | 'ACCOUNTANT' | 'BUYER'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'
  customRoleId: string | null
  customRole?: CustomRole | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomRole {
  id: string
  accountId: string
  name: string
  description: string
  baseRole: string
  permissions: Record<string, boolean>
  restrictions: Record<string, any>
  warehouseAccess: string[] | null
  storeAccess: string[] | null
  orderAccess: string[] | null
  productAccess: string[] | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserStats {
  total: number
  active: number
  pending: number
  inactive: number
  suspended: number
  byRole: Record<string, number>
}

export interface CreateUserData {
  email: string
  name?: string
  password: string
  role: string
  customRoleId?: string
}

export interface UpdateUserData {
  email?: string
  name?: string
  role?: string
  customRoleId?: string | null
  status?: string
}

export interface InviteUserData {
  email: string
  name?: string
  role: string
  customRoleId?: string
}

export interface PresetRole {
  role: string
  name: string
  description: string
  permissions: Record<string, boolean>
}

// ============================================================================
// USER API CLASS
// ============================================================================

export class UsersAPI {
  // ==========================================================================
  // USER CRUD
  // ==========================================================================

  /**
   * Get all users in the account
   */
  static async getUsers(): Promise<User[]> {
    return apiRequest('/users')
  }

  /**
   * Get user statistics
   */
  static async getStats(): Promise<UserStats> {
    return apiRequest('/users/stats')
  }

  /**
   * Get single user by ID
   */
  static async getUserById(userId: string): Promise<User> {
    return apiRequest(`/users/${userId}`)
  }

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserData): Promise<User> {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE'
    })
  }

  // ==========================================================================
  // ROLE MANAGEMENT
  // ==========================================================================

  /**
   * Update user's role
   */
  static async updateUserRole(
    userId: string,
    role: string,
    customRoleId?: string | null
  ): Promise<User> {
    return apiRequest(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, customRoleId })
    })
  }

  /**
   * Assign role to user (via user-roles endpoint)
   */
  static async assignRole(
    userId: string,
    baseRole?: string,
    customRoleId?: string
  ): Promise<User> {
    return apiRequest(`/user-roles/${userId}/assign-role`, {
      method: 'POST',
      body: JSON.stringify({ baseRole, customRoleId })
    })
  }

  /**
   * Remove custom role from user
   */
  static async removeCustomRole(userId: string): Promise<User> {
    return apiRequest(`/user-roles/${userId}/custom-role`, {
      method: 'DELETE'
    })
  }

  /**
   * Get user's effective permissions
   */
  static async getUserPermissions(userId: string): Promise<{
    user: { id: string; email: string; name: string; baseRole: string }
    customRole: { id: string; name: string; description: string } | null
    permissions: Record<string, boolean>
    resourceAccess: {
      warehouses: string[] | null
      stores: string[] | null
      orders: string[] | null
      products: string[] | null
    } | null
  }> {
    return apiRequest(`/user-roles/${userId}/permissions`)
  }

  // ==========================================================================
  // STATUS MANAGEMENT
  // ==========================================================================

  /**
   * Update user status
   */
  static async updateUserStatus(userId: string, status: string): Promise<User> {
    return apiRequest(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  }

  // ==========================================================================
  // INVITATION MANAGEMENT
  // ==========================================================================

  /**
   * Invite a new user
   */
  static async inviteUser(data: InviteUserData): Promise<{
    user: User
    tempPassword: string
  }> {
    return apiRequest('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Bulk invite users
   */
  static async bulkInviteUsers(users: InviteUserData[]): Promise<Array<{
    email: string
    success: boolean
    user: User | null
    tempPassword: string | null
    error: string | null
  }>> {
    return apiRequest('/users/bulk-invite', {
      method: 'POST',
      body: JSON.stringify({ users })
    })
  }

  /**
   * Resend invitation
   */
  static async resendInvitation(userId: string): Promise<{
    success: boolean
    message: string
    tempPassword: string
  }> {
    return apiRequest(`/users/${userId}/resend-invitation`, {
      method: 'POST'
    })
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(userId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/users/${userId}/invitation`, {
      method: 'DELETE'
    })
  }

  // ==========================================================================
  // PASSWORD MANAGEMENT
  // ==========================================================================

  /**
   * Reset user's password (admin action)
   */
  static async resetPassword(userId: string, newPassword: string): Promise<{
    success: boolean
    message: string
  }> {
    return apiRequest(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    })
  }

  // ==========================================================================
  // ROLES API
  // ==========================================================================

  /**
   * Get all custom roles
   */
  static async getRoles(): Promise<CustomRole[]> {
    return apiRequest('/roles')
  }

  /**
   * Get preset role list
   */
  static async getPresetRoles(): Promise<PresetRole[]> {
    return apiRequest('/roles/presets/list')
  }

  /**
   * Create custom role
   */
  static async createRole(data: {
    name: string
    description?: string
    baseRole: string
    permissions?: Record<string, boolean>
    warehouseAccess?: string[]
    storeAccess?: string[]
    orderAccess?: string[]
    productAccess?: string[]
  }): Promise<CustomRole> {
    return apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * Update custom role
   */
  static async updateRole(roleId: string, data: Partial<CustomRole>): Promise<CustomRole> {
    return apiRequest(`/roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  /**
   * Delete custom role
   */
  static async deleteRole(roleId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/roles/${roleId}`, {
      method: 'DELETE'
    })
  }

  /**
   * Toggle role active status
   */
  static async toggleRole(roleId: string): Promise<CustomRole> {
    return apiRequest(`/roles/${roleId}/toggle`, {
      method: 'POST'
    })
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(roleId: string): Promise<{
    role: { id: string; name: string; description: string }
    users: User[]
  }> {
    return apiRequest(`/user-roles/by-role/${roleId}`)
  }
}
