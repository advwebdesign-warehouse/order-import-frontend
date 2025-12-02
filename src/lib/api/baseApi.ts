//file path: src/lib/api/baseApi.ts

/**
 * 🔒 SECURE API CLIENT FOR HTTPONLY COOKIES
 *
 * This version works with httpOnly cookies set by the backend.
 * No token is manually managed on the frontend.
 *
 * Key changes:
 * - credentials: 'include' - Send cookies with every request
 * - No Authorization header - Token is in httpOnly cookie
 * - ✅ NEW: Added apiRequestOptional for non-critical endpoints
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // ✅ CRITICAL: Send httpOnly cookies with request
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // ❌ NO Authorization header - token is in httpOnly cookie
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `API Error: ${response.status}`)
  }

  return response.json()
}

/**
 * ✅ NEW: Optional API request - returns default value on error instead of throwing
 * Use this for endpoints that shouldn't block the app from loading
 * (e.g., integrations, optional data)
 */
export async function apiRequestOptional<T = any>(
  endpoint: string,
  defaultValue: T,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      console.warn(`[API] Optional request to ${endpoint} failed with status ${response.status}`)
      return defaultValue
    }

    return await response.json()
  } catch (error) {
    console.warn(`[API] Optional request to ${endpoint} failed:`, error)
    return defaultValue
  }
}
