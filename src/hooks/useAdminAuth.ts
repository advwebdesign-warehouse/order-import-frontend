//file path: hooks/useAdminAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AccountAPI } from '@/lib/api/accountApi'

/**
 * Admin authentication hook
 * Verifies user has ADMIN role or isPlatformAdmin flag
 * Follows same patterns as useAccountInitialization
 *
 * Usage in admin layout:
 * const { loading, user, isAdmin } = useAdminAuth()
 */
export function useAdminAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function validateAdminAccess() {
      console.log('[Admin Auth] 🔒 Validating admin access...')

      try {
        // Verify session with backend (httpOnly cookie sent automatically)
        const session = await AccountAPI.verifySession()

        console.log('[Admin Auth] ✅ Session valid:', {
          userId: session.user.id,
          email: session.user.email,
          role: session.user.role,
          isPlatformAdmin: session.user.isPlatformAdmin
        })

        // Check if user is ADMIN or PLATFORM_ADMIN
        const hasAdminAccess =
          session.user.role === 'ADMIN' ||
          session.user.isPlatformAdmin === true

        if (!hasAdminAccess) {
          console.error('[Admin Auth] ❌ Access denied: User is not an admin')
          console.error('[Admin Auth] User role:', session.user.role)
          console.error('[Admin Auth] isPlatformAdmin:', session.user.isPlatformAdmin)

          // Redirect to dashboard (not login, since they are authenticated)
          router.push('/dashboard')
          return
        }

        console.log('[Admin Auth] ✅ Admin access granted')
        setUser(session.user)
        setIsAdmin(true)
      } catch (error: any) {
        console.error('[Admin Auth] ❌ Authentication failed:', error.message)

        // Redirect to sign-in (matching your existing pattern)
        router.push('/sign-in')
      } finally {
        setLoading(false)
      }
    }

    validateAdminAccess()
  }, [router])

  return { loading, user, isAdmin }
}

/**
 * Quick admin check hook (doesn't redirect)
 * Useful for conditional rendering
 *
 * Usage:
 * const { isAdmin, loading } = useIsAdmin()
 * if (loading) return <Spinner />
 * if (!isAdmin) return <AccessDenied />
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const session = await AccountAPI.verifySession()
        const hasAdminAccess =
          session.user.role === 'ADMIN' ||
          session.user.isPlatformAdmin === true
        setIsAdmin(hasAdminAccess)
      } catch (error) {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  return { isAdmin, loading }
}
