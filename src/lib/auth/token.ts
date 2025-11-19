//file path: src/lib/auth/token-secure.ts

/**
 * 🔒 PRODUCTION-READY SECURE TOKEN MANAGEMENT
 *
 * This implementation uses httpOnly cookies set by the backend.
 * This is the MOST SECURE approach for storing JWT tokens.
 *
 * ✅ SECURITY BENEFITS:
 * - httpOnly flag: JavaScript cannot access the token (XSS protection)
 * - Secure flag: Only sent over HTTPS (MITM protection)
 * - SameSite=Strict: Prevents CSRF attacks
 * - Shorter expiration: Reduced attack window
 * - Backend-controlled: Client cannot manipulate cookies
 *
 * 🔄 REQUIRED BACKEND CHANGES:
 *
 * 1. Update login endpoint to set httpOnly cookie:
 *
 *    router.post('/login', async (req, res) => {
 *      // ... validate credentials ...
 *      const token = jwt.sign({ userId, accountId }, secret, { expiresIn: '7d' })
 *
 *      // Set httpOnly cookie
 *      res.cookie('auth_token', token, {
 *        httpOnly: true,        // Cannot be accessed by JavaScript
 *        secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
 *        sameSite: 'strict',    // CSRF protection
 *        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
 *        path: '/'
 *      })
 *
 *      res.json({ user, account }) // Don't send token in response body
 *    })
 *
 * 2. Update logout endpoint to clear cookie:
 *
 *    router.post('/logout', (req, res) => {
 *      res.clearCookie('auth_token', {
 *        httpOnly: true,
 *        secure: process.env.NODE_ENV === 'production',
 *        sameSite: 'strict',
 *        path: '/'
 *      })
 *      res.json({ success: true })
 *    })
 *
 * 3. Update auth middleware to read from cookies:
 *
 *    export function authenticateToken(req, res, next) {
 *      const token = req.cookies.auth_token // Read from cookie
 *
 *      if (!token) {
 *        return res.status(401).json({ error: 'Access token required' })
 *      }
 *
 *      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
 *        if (err) return res.status(403).json({ error: 'Invalid token' })
 *        req.user = user
 *        next()
 *      })
 *    }
 *
 * 4. Install cookie-parser in backend:
 *    npm install cookie-parser
 *
 *    // In server.ts
 *    import cookieParser from 'cookie-parser'
 *    app.use(cookieParser())
 */

/**
 * Check if user has an auth cookie
 *
 * Note: We cannot read httpOnly cookies from JavaScript.
 * The only way to know if we're authenticated is to:
 * 1. Try an API request and see if it succeeds
 * 2. Have the backend tell us (via a /auth/status endpoint)
 */
export function hasAuthToken(): boolean {
  // With httpOnly cookies, we cannot check on client-side
  // We need to verify with the backend
  console.warn('[Token] Cannot check httpOnly cookie from JavaScript. Use verifySession() instead.')
  return false // Unknown - must verify with backend
}

/**
 * Client-side token management is not possible with httpOnly cookies.
 * All token operations are handled by the backend.
 *
 * Use these API methods instead:
 * - AccountAPI.login() - Backend sets httpOnly cookie
 * - AccountAPI.logout() - Backend clears httpOnly cookie
 * - AccountAPI.verifySession() - Check if still authenticated
 */

/**
 * Get authentication status from backend
 * This is the ONLY way to check auth status with httpOnly cookies
 */
export async function getAuthStatus(): Promise<{
  authenticated: boolean
  user?: any
  account?: any
}> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include', // Important: Send cookies with request
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        authenticated: true,
        user: data.user,
        account: data.account
      }
    }

    return { authenticated: false }
  } catch (error) {
    console.error('[Token] Failed to get auth status:', error)
    return { authenticated: false }
  }
}

/**
 * All token operations are handled by the backend.
 * These functions throw errors to remind developers.
 */

export function getAuthToken(): never {
  throw new Error(
    '❌ Cannot access httpOnly cookies from JavaScript. ' +
    'Use AccountAPI.verifySession() to check authentication.'
  )
}

export function setAuthToken(): never {
  throw new Error(
    '❌ Cannot set httpOnly cookies from JavaScript. ' +
    'The backend sets the cookie during login (AccountAPI.login()).'
  )
}

export function clearAuthToken(): never {
  throw new Error(
    '❌ Cannot clear httpOnly cookies from JavaScript. ' +
    'Use AccountAPI.logout() to logout (backend clears the cookie).'
  )
}

export function decodeToken(): never {
  throw new Error(
    '❌ Cannot decode httpOnly cookies from JavaScript. ' +
    'Use AccountAPI.verifySession() to get user info.'
  )
}

export function getCurrentUserFromToken(): never {
  throw new Error(
    '❌ Cannot read httpOnly cookies from JavaScript. ' +
    'Use AccountAPI.verifySession() or getAuthStatus() to get user info.'
  )
}

export function isTokenExpired(): never {
  throw new Error(
    '❌ Cannot check httpOnly cookie expiration from JavaScript. ' +
    'Use AccountAPI.verifySession() to check if session is valid.'
  )
}

/**
 * MIGRATION GUIDE:
 *
 * 1. Update backend to set httpOnly cookies (see comments above)
 * 2. Replace import:
 *    - OLD: import { ... } from '@/lib/auth/token'
 *    - NEW: import { ... } from '@/lib/auth/token-secure'
 * 3. Update API requests to include credentials:
 *    fetch(url, { credentials: 'include' })
 * 4. Update CORS to allow credentials:
 *    app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
 * 5. Replace token checks with backend verification:
 *    - OLD: if (hasAuthToken()) { ... }
 *    - NEW: const { authenticated } = await getAuthStatus()
 * 6. Test thoroughly in development before deploying
 */
