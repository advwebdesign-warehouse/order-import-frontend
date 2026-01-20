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
 * - Added apiRequestOptional for non-critical endpoints
 * - ✅ FIXED: Properly handles JSON error responses from backend
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
    // ✅ Try to parse as JSON first (most backends return JSON errors)
    try {
      const errorData = await response.json()

      // Handle different error response formats
      if (errorData.error) {
        throw new Error(errorData.error)
      } else if (errorData.message) {
        throw new Error(errorData.message)
      } else {
        throw new Error(JSON.stringify(errorData))
      }
    } catch (jsonError) {
      // If JSON parsing fails, fall back to text
      try {
        const errorText = await response.text()
        throw new Error(errorText || `API Error: ${response.status}`)
      } catch (textError) {
        // If both fail, throw a generic error
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
    }
  }

  return response.json()
}

/**
 * Optional API request - returns default value on error instead of throwing
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
