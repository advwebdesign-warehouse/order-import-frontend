//file path: app/dashboard/users/hooks/useUsers.ts

import { useState, useEffect, useCallback } from 'react'
import { UsersAPI, User, UserStats, CreateUserData, UpdateUserData } from '@/lib/api/usersApi'

interface UseUsersReturn {
  users: User[]
  stats: UserStats | null
  loading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
  createUser: (data: CreateUserData) => Promise<User>
  updateUser: (userId: string, data: UpdateUserData) => Promise<User>
  deleteUser: (userId: string) => Promise<void>
  updateUserStatus: (userId: string, status: string) => Promise<User>
  updateUserRole: (userId: string, role: string, customRoleId?: string | null) => Promise<User>
  inviteUser: (data: { email: string; name?: string; role: string; customRoleId?: string }) => Promise<{ user: User; tempPassword: string }>
  resendInvitation: (userId: string) => Promise<{ success: boolean; tempPassword: string }>
  cancelInvitation: (userId: string) => Promise<void>
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersData, statsData] = await Promise.all([
        UsersAPI.getUsers(),
        UsersAPI.getStats()
      ])

      setUsers(usersData)
      setStats(statsData)
    } catch (err: any) {
      console.error('[useUsers] Error fetching users:', err)
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh users
  const refreshUsers = useCallback(async () => {
    await fetchUsers()
  }, [fetchUsers])

  // Create user
  const createUser = useCallback(async (data: CreateUserData): Promise<User> => {
    try {
      const newUser = await UsersAPI.createUser(data)
      setUsers(prev => [newUser, ...prev])

      // Refresh stats
      const statsData = await UsersAPI.getStats()
      setStats(statsData)

      return newUser
    } catch (err: any) {
      console.error('[useUsers] Error creating user:', err)
      throw err
    }
  }, [])

  // Update user
  const updateUser = useCallback(async (userId: string, data: UpdateUserData): Promise<User> => {
    try {
      const updatedUser = await UsersAPI.updateUser(userId, data)
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))
      return updatedUser
    } catch (err: any) {
      console.error('[useUsers] Error updating user:', err)
      throw err
    }
  }, [])

  // Delete user
  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    try {
      await UsersAPI.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))

      // Refresh stats
      const statsData = await UsersAPI.getStats()
      setStats(statsData)
    } catch (err: any) {
      console.error('[useUsers] Error deleting user:', err)
      throw err
    }
  }, [])

  // Update user status
  const updateUserStatus = useCallback(async (userId: string, status: string): Promise<User> => {
    try {
      const updatedUser = await UsersAPI.updateUserStatus(userId, status)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: updatedUser.status } : u))

      // Refresh stats
      const statsData = await UsersAPI.getStats()
      setStats(statsData)

      return updatedUser
    } catch (err: any) {
      console.error('[useUsers] Error updating user status:', err)
      throw err
    }
  }, [])

  // Update user role
  const updateUserRole = useCallback(async (
    userId: string,
    role: string,
    customRoleId?: string | null
  ): Promise<User> => {
    try {
      const updatedUser = await UsersAPI.updateUserRole(userId, role, customRoleId)
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u))

      // Refresh stats
      const statsData = await UsersAPI.getStats()
      setStats(statsData)

      return updatedUser
    } catch (err: any) {
      console.error('[useUsers] Error updating user role:', err)
      throw err
    }
  }, [])

  // Invite user
  const inviteUser = useCallback(async (data: {
    email: string
    name?: string
    role: string
    customRoleId?: string
  }): Promise<{ user: User; tempPassword: string }> => {
    try {
      const result = await UsersAPI.inviteUser(data)
      setUsers(prev => [result.user, ...prev])

      // Refresh stats
      const statsData = await UsersAPI.getStats()
      setStats(statsData)

      return result
    } catch (err: any) {
      console.error('[useUsers] Error inviting user:', err)
      throw err
    }
  }, [])

  // Resend invitation
  const resendInvitation = useCallback(async (userId: string): Promise<{ success: boolean; tempPassword: string }> => {
    try {
      const result = await UsersAPI.resendInvitation(userId)
      return result
    } catch (err: any) {
      console.error('[useUsers] Error resending invitation:', err)
      throw err
    }
  }, [])

  // Cancel invitation
  const cancelInvitation = useCallback(async (userId: string): Promise<void> => {
    try {
      await UsersAPI.cancelInvitation(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))

      // Refresh stats
      const statsData = await UsersAPI.getStats()
      setStats(statsData)
    } catch (err: any) {
      console.error('[useUsers] Error cancelling invitation:', err)
      throw err
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    stats,
    loading,
    error,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUserRole,
    inviteUser,
    resendInvitation,
    cancelInvitation
  }
}
