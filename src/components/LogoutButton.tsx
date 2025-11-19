//file path: src/components/LogoutButton.tsx

'use client'

import { logout } from '@/lib/auth/authUtils'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Logout button component
 *
 * Usage:
 *
 * import { LogoutButton } from '@/components/LogoutButton'
 *
 * <LogoutButton>Sign Out</LogoutButton>
 *
 * or with custom styling:
 *
 * <LogoutButton className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
 *   Logout
 * </LogoutButton>
 */
export function LogoutButton({ className, children }: LogoutButtonProps) {
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={className || 'px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded'}
    >
      {children || 'Logout'}
    </button>
  )
}
