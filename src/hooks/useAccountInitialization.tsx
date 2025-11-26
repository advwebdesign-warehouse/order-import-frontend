//file path: src/hooks/useAccountInitialization.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AccountAPI } from '@/lib/api/accountApi'

// ✅ Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/login',
  '/verify-email',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',  // Landing page (if you have one)
]

/**
 * Check if current path is a public route
 */
function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function useAccountInitialization() {
  const router = useRouter()
  const pathname = usePathname()
  const [isValidating, setIsValidating] = useState(true)
  const [sessionData, setSessionData] = useState<{
    user: any
    account: any
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ✅ FIX: Wait for pathname to be available before doing anything
    if (!pathname) {
      console.log('[Account Init] ⏳ Waiting for pathname...')
      return
    }

    // ✅ Skip auth check for public routes
    if (isPublicRoute(pathname)) {
      console.log('[Account Init] 📖 Public route, skipping auth check:', pathname)
      setIsValidating(false)
      return
    }

    async function validateSession() {
      console.log('[Account Init] 🚀 Validating session...')

      try {
        // Verify session with backend (httpOnly cookie is sent automatically)
        const data = await AccountAPI.verifySession()

        console.log('[Account Init] ✅ Valid session:', {
          userId: data.user.id,
          accountId: data.user.accountId,
          email: data.user.email
        })

        setSessionData(data)
        setIsValidating(false)
      } catch (error: any) {
        console.error('[Account Init] ❌ Session verification failed:', error.message)
        handleInvalidSession()
      }
    }

    function handleInvalidSession() {
      setIsValidating(false)
      setSessionData(null)

      // ✅ Only redirect if NOT already on a public route
      if (!isPublicRoute(pathname)) {
        console.log('[Account Init] Redirecting to login...')
        router.push('/sign-in')
      }
    }

    validateSession()
  }, [router, pathname])

  return {
    isValidating,
    user: sessionData?.user || null,
    account: sessionData?.account || null
  }
}

/**
 * Hook to check if user is authenticated
 * Returns boolean - use for conditional rendering
 * Updated for httpOnly cookies
 */
export function useIsAuthenticated(): boolean {
  const [isAuth, setIsAuth] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        await AccountAPI.verifySession()
        setIsAuth(true)
      } catch (error) {
        setIsAuth(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [])

  return isAuth
}

/**
 * Hook to get current account ID from backend session
 * Returns null if not authenticated
 * Updated for httpOnly cookies
 *
 * Example:
 *
 * function MyComponent() {
 *   const { accountId, loading } = useCurrentAccountId()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!accountId) return <div>Not authenticated</div>
 *
 *   return <div>Account: {accountId}</div>
 * }
 */
export function useCurrentAccountId(): {
  accountId: string | null
  loading: boolean
  user: any
  account: any
} {
  const [accountId, setAccountId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [account, setAccount] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAccountId() {
      try {
        const session = await AccountAPI.verifySession()
        setAccountId(session.user.accountId)
        setUser(session.user)
        setAccount(session.account)
      } catch (error) {
        console.error('[useCurrentAccountId] Failed to get account ID:', error)
        setAccountId(null)
        setUser(null)
        setAccount(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAccountId()
  }, [])

  return { accountId, loading, user, account }
}

/**
 * Hook to get current user ID from backend session
 * Returns null if not authenticated
 * Updated for httpOnly cookies
 */
export function useCurrentUserId(): {
  userId: string | null
  loading: boolean
} {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserId() {
      try {
        const session = await AccountAPI.verifySession()
        setUserId(session.user.id)
      } catch (error) {
        console.error('[useCurrentUserId] Failed to get user ID:', error)
        setUserId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserId()
  }, [])

  return { userId, loading }
}

/**
 * Hook to get full user info from API
 * Returns user data or null if not authenticated
 * Updated for httpOnly cookies
 *
 * Example:
 *
 * function MyComponent() {
 *   const { user, loading } = useCurrentUser()
 *
 *   if (loading) return <div>Loading...</div>
 *   if (!user) return <div>Not authenticated</div>
 *
 *   return <div>Welcome, {user.name}!</div>
 * }
 */
export function useCurrentUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await AccountAPI.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('[useCurrentUser] Failed to fetch user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}
