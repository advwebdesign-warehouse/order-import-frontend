//file path: src/lib/auth/authUtils.ts

import { AccountAPI } from '../api/accountApi'

/**
 * Logout user and clear session
 * Redirects to login page
 * Updated for httpOnly cookies
 */
export async function logout() {
  if (typeof window === 'undefined') return

  console.log('[Auth] 🚪 Logging out...')

  try {
    // Call backend logout endpoint to clear httpOnly cookie
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Important: Send cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[Auth] Logout error:', error)
    // Continue with redirect even if logout fails
  }

  // Redirect to login
  window.location.href = '/sign-in'
}

/**
 * Check if user is currently logged in
 * For httpOnly cookies, we need to verify with backend
 * @returns Promise<boolean> indicating if user has a valid session
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    await AccountAPI.verifySession()
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get current session info from backend
 * Throws error if session is invalid
 * Updated for httpOnly cookies
 */
export async function getCurrentSession() {
  try {
    return await AccountAPI.verifySession()
  } catch (error) {
    console.error('[Auth] Invalid session:', error)
    await logout()
    throw error
  }
}

/**
 * Get current account ID from session
 * Returns null if not authenticated
 */
export async function getCurrentAccountId(): Promise<string | null> {
  try {
    const session = await AccountAPI.verifySession()
    return session.user.accountId
  } catch (error) {
    console.error('[Auth] Failed to get account ID:', error)
    return null
  }
}

/**
 * Middleware to protect pages/components
 * Redirects to login if not authenticated
 * Updated for httpOnly cookies
 *
 * Usage in a component:
 *
 * useEffect(() => {
 *   requireAuth()
 * }, [])
 */
export async function requireAuth() {
  if (typeof window === 'undefined') return

  const loggedIn = await isLoggedIn()

  if (!loggedIn) {
    console.warn('[Auth] ⚠️ Not authenticated, redirecting to login')
    window.location.href = '/sign-in'
  }
}
