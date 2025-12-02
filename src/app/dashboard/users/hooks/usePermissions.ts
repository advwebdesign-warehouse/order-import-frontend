//file path: app/dashboard/shared/hooks/usePermissions.ts

import { useMemo } from 'react'
import { useAccountInitialization } from '@/hooks/useAccountInitialization'

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

// Base role permissions - single source of truth
export const BASE_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  ADMIN: {
    // Full access
    canManageUsers: true,
    canManageRoles: true,
    canManageStores: true,
    canManageWarehouses: true,
    canManageOrders: true,
    canManageProducts: true,
    canManageIntegrations: true,
    canViewFinancials: true,
    canEditFinancials: true,
    canDeleteAnything: true,
    // Granular
    canViewOrders: true,
    canCreateOrders: true,
    canEditOrders: true,
    canDeleteOrders: true,
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewWarehouses: true,
    canEditWarehouses: true,
    canCreateWarehouses: true,
    canDeleteWarehouses: true,
    canViewStores: true,
    canCreateStores: true,
    canEditStores: true,
    canDeleteStores: true,
  },
  USER: {
    canViewOrders: true,
    canCreateOrders: true,
    canEditOrders: true,
    canViewProducts: true,
    canEditProducts: true,
    canViewWarehouses: true,
    canViewStores: true,
    // Explicitly denied
    canManageUsers: false,
    canManageRoles: false,
    canDeleteOrders: false,
    canDeleteProducts: false,
  },
  VIEWER: {
    canViewOrders: true,
    canViewProducts: true,
    canViewWarehouses: true,
    canViewStores: true,
    canViewFinancials: false,
    // All edit/create/delete denied
    canEditOrders: false,
    canEditProducts: false,
    canManageUsers: false,
    canDeleteOrders: false,
    canDeleteProducts: false,
  },
  WAREHOUSE_MANAGER: {
    // Order management
    canViewOrders: true,
    canEditOrders: true,
    canUpdateOrderStatus: true,
    canAssignWarehouse: true,
    // Warehouse management
    canViewWarehouses: true,
    canEditWarehouses: true,
    canManageInventory: true,
    // Product viewing
    canViewProducts: true,
    canEditStock: true,
    // ✅ User management - can manage warehouse users
    canManageUsers: true,
    canManageWarehouseUsers: true,
    // Restrictions
    canManageRoles: false,
    canDeleteOrders: false,
    canManageStores: false,
  },
  WAREHOUSE_USER: {
    canViewOrders: true,
    canUpdateOrderStatus: true,
    canScanProducts: true,
    canPickOrders: true,
    canPackOrders: true,
    canViewInventory: true,
    canViewProducts: true,
    // All management denied
    canEditOrders: false,
    canDeleteOrders: false,
    canManageUsers: false,
  },
  ACCOUNTANT: {
    canViewOrders: true,
    canViewFinancials: true,
    canExportData: true,
    canViewReports: true,
    canViewProducts: true,
    canViewWarehouses: true,
    canViewStores: true,
    // All edit denied
    canEditOrders: false,
    canEditProducts: false,
    canManageUsers: false,
  },
  BUYER: {
    canViewProducts: true,
    canEditProducts: true,
    canCreateProducts: true,
    canManageSuppliers: true,
    canViewOrders: true,
    canCreatePurchaseOrders: true,
    // Restrictions
    canDeleteProducts: false,
    canManageUsers: false,
  }
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 100,
  WAREHOUSE_MANAGER: 70,
  ACCOUNTANT: 60,
  BUYER: 60,
  USER: 50,
  WAREHOUSE_USER: 40,
  VIEWER: 30,
}

// ============================================================================
// PERMISSION HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: any, permission: string): boolean {
  if (!user) return false

  // Admin has all permissions
  if (user.role === 'ADMIN') return true

  // Check base role permissions
  const basePermissions = BASE_ROLE_PERMISSIONS[user.role] || {}
  if (basePermissions[permission]) return true

  // Check custom role permissions if exists
  if (user.customRole?.permissions?.[permission]) return true

  return false
}

/**
 * Check if user A can manage user B (based on role hierarchy)
 */
export function canManageUser(currentUser: any, targetUser: any): boolean {
  if (!currentUser || !targetUser) return false

  // Can't manage yourself (except profile)
  if (currentUser.id === targetUser.id) return false

  // Admin can manage everyone
  if (currentUser.role === 'ADMIN') return true

  // Must have canManageUsers permission
  if (!hasPermission(currentUser, 'canManageUsers')) return false

  // Check hierarchy
  const currentLevel = ROLE_HIERARCHY[currentUser.role] || 0
  const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0

  // Can only manage users with lower hierarchy
  return currentLevel > targetLevel
}

/**
 * Get all permissions for a user (base + custom role merged)
 */
export function getEffectivePermissions(user: any): Record<string, boolean> {
  if (!user) return {}

  // Start with base role permissions
  const rolePermissions = BASE_ROLE_PERMISSIONS[user.role]
  const basePermissions: Record<string, boolean> = rolePermissions ? { ...rolePermissions } : {}

  // Merge custom role permissions (custom role overrides base)
  if (user.customRole?.permissions) {
    Object.assign(basePermissions, user.customRole.permissions)
  }

  return basePermissions
}

/**
 * Get roles that a user is allowed to assign to others
 */
export function getAllowedRolesToAssign(user: any): string[] {
  if (!user) return []

  // Admin can assign any role
  if (user.role === 'ADMIN') {
    return Object.keys(BASE_ROLE_PERMISSIONS)
  }

  // Must have canManageUsers permission
  if (!hasPermission(user, 'canManageUsers')) return []

  const currentLevel = ROLE_HIERARCHY[user.role] || 0

  // Can only assign roles with lower hierarchy
  return Object.entries(ROLE_HIERARCHY)
    .filter(([role, level]) => level < currentLevel)
    .map(([role]) => role)
}

// ============================================================================
// REACT HOOK
// ============================================================================

interface UsePermissionsReturn {
  // Current user info
  user: any
  isAdmin: boolean
  isWarehouseManager: boolean
  role: string | null

  // Permission checks
  hasPermission: (permission: string) => boolean
  canManageUser: (targetUser: any) => boolean

  // Computed permissions
  permissions: Record<string, boolean>
  allowedRolesToAssign: string[]

  // Common permission checks
  canManageUsers: boolean
  canManageRoles: boolean
  canManageOrders: boolean
  canManageProducts: boolean
  canManageWarehouses: boolean
  canManageStores: boolean
  canViewFinancials: boolean
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAccountInitialization()

  const role = user?.role || null
  const isAdmin = role === 'ADMIN'
  const isWarehouseManager = role === 'WAREHOUSE_MANAGER'

  // Memoized permission checks
  const permissions = useMemo(() => {
    return getEffectivePermissions(user)
  }, [user])

  const allowedRolesToAssign = useMemo(() => {
    return getAllowedRolesToAssign(user)
  }, [user])

  // Helper functions bound to current user
  const checkPermission = (permission: string): boolean => {
    return hasPermission(user, permission)
  }

  const checkCanManageUser = (targetUser: any): boolean => {
    return canManageUser(user, targetUser)
  }

  return {
    user,
    isAdmin,
    isWarehouseManager,
    role,

    hasPermission: checkPermission,
    canManageUser: checkCanManageUser,

    permissions,
    allowedRolesToAssign,

    // Common shortcuts
    canManageUsers: checkPermission('canManageUsers'),
    canManageRoles: checkPermission('canManageRoles'),
    canManageOrders: checkPermission('canManageOrders'),
    canManageProducts: checkPermission('canManageProducts'),
    canManageWarehouses: checkPermission('canManageWarehouses'),
    canManageStores: checkPermission('canManageStores'),
    canViewFinancials: checkPermission('canViewFinancials'),
  }
}
