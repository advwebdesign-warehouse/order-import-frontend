//file path: app/dashboard/users/hooks/useRoles.ts

import { useState, useEffect, useCallback } from 'react'
import { UsersAPI, CustomRole, PresetRole } from '@/lib/api/usersApi'

interface UseRolesReturn {
  customRoles: CustomRole[]
  presetRoles: PresetRole[]
  loading: boolean
  error: string | null
  refreshRoles: () => Promise<void>
  createRole: (data: {
    name: string
    description?: string
    baseRole: string
    permissions?: Record<string, boolean>
    warehouseAccess?: string[]
    storeAccess?: string[]
    orderAccess?: string[]
    productAccess?: string[]
  }) => Promise<CustomRole>
  updateRole: (roleId: string, data: Partial<CustomRole>) => Promise<CustomRole>
  deleteRole: (roleId: string) => Promise<void>
  toggleRole: (roleId: string) => Promise<CustomRole>
}

export function useRoles(): UseRolesReturn {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
  const [presetRoles, setPresetRoles] = useState<PresetRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [customRolesData, presetRolesData] = await Promise.all([
        UsersAPI.getRoles(),
        UsersAPI.getPresetRoles()
      ])

      setCustomRoles(customRolesData)
      setPresetRoles(presetRolesData)
    } catch (err: any) {
      console.error('[useRoles] Error fetching roles:', err)
      setError(err.message || 'Failed to fetch roles')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh roles
  const refreshRoles = useCallback(async () => {
    await fetchRoles()
  }, [fetchRoles])

  // Create custom role
  const createRole = useCallback(async (data: {
    name: string
    description?: string
    baseRole: string
    permissions?: Record<string, boolean>
    warehouseAccess?: string[]
    storeAccess?: string[]
    orderAccess?: string[]
    productAccess?: string[]
  }): Promise<CustomRole> => {
    try {
      const newRole = await UsersAPI.createRole(data)
      setCustomRoles(prev => [...prev, newRole])
      return newRole
    } catch (err: any) {
      console.error('[useRoles] Error creating role:', err)
      throw err
    }
  }, [])

  // Update custom role
  const updateRole = useCallback(async (roleId: string, data: Partial<CustomRole>): Promise<CustomRole> => {
    try {
      const updatedRole = await UsersAPI.updateRole(roleId, data)
      setCustomRoles(prev => prev.map(r => r.id === roleId ? updatedRole : r))
      return updatedRole
    } catch (err: any) {
      console.error('[useRoles] Error updating role:', err)
      throw err
    }
  }, [])

  // Delete custom role
  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      await UsersAPI.deleteRole(roleId)
      setCustomRoles(prev => prev.filter(r => r.id !== roleId))
    } catch (err: any) {
      console.error('[useRoles] Error deleting role:', err)
      throw err
    }
  }, [])

  // Toggle role active status
  const toggleRole = useCallback(async (roleId: string): Promise<CustomRole> => {
    try {
      const updatedRole = await UsersAPI.toggleRole(roleId)
      setCustomRoles(prev => prev.map(r => r.id === roleId ? updatedRole : r))
      return updatedRole
    } catch (err: any) {
      console.error('[useRoles] Error toggling role:', err)
      throw err
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return {
    customRoles,
    presetRoles,
    loading,
    error,
    refreshRoles,
    createRole,
    updateRole,
    deleteRole,
    toggleRole
  }
}

// ============================================================================
// HELPER: Get combined roles (preset + custom) for dropdowns
// ============================================================================
export function useCombinedRoles() {
  const { customRoles, presetRoles, loading, error } = useRoles()

  const allRoles = [
    ...presetRoles.map(r => ({
      value: r.role,
      label: r.name,
      description: r.description,
      isCustom: false,
      customRoleId: undefined
    })),
    ...customRoles.filter(r => r.isActive).map(r => ({
      value: r.baseRole,
      label: r.name,
      description: r.description,
      isCustom: true,
      customRoleId: r.id
    }))
  ]

  return {
    allRoles,
    presetRoles,
    customRoles,
    loading,
    error
  }
}
