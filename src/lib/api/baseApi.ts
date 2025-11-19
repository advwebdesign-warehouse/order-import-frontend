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
