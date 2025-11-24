//file path: src/lib/api/accountApi.ts

import { apiRequest } from './baseApi'

export interface LoginResponse {
  // ✅ NO TOKEN FIELD - it's in httpOnly cookie!
  user: {
    id: string
    accountId: string
    email: string
    name: string
    role: string
    isPlatformAdmin?: boolean  // ✅ Added for platform admin support
  }
  account: {
    id: string
    companyName: string
    email: string
    plan: string
    status: string
    createdAt: string
    updatedAt: string
  }
}

// ✅ Added missing RegisterResponse interface
export interface RegisterResponse {
  user: {
    id: string
    accountId: string
    email: string
    name: string
    role: string
    isPlatformAdmin?: boolean
  }
  account: {
    id: string
    companyName: string
    email: string
    plan: string
    status: string
    createdAt: string
    updatedAt: string
  }
  store: {
    id: string
    storeName: string
  }
}

export class AccountAPI {
  /**
   * Login user - backend sets httpOnly cookie
   * ✅ No token handling needed on frontend!
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    // ✅ Backend sets httpOnly cookie automatically
    // ✅ No localStorage, no token management needed!
  }

  /**
   * Register new user - backend sets httpOnly cookie
   * ✅ No token handling needed on frontend!
   */
  static async register(userData: {
    email: string
    password: string
    name?: string
    companyName?: string
  }): Promise<RegisterResponse> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    // ✅ Backend sets httpOnly cookie automatically
  }

  /**
   * Logout user - backend clears httpOnly cookie
   */
  static async logout(): Promise<{ success: boolean; message: string }> {
    return apiRequest('/auth/logout', {
      method: 'POST'
    })
    // ✅ Backend clears httpOnly cookie
  }

  /**
   * Get current user's account details
   */
  static async getCurrentAccount() {
    return apiRequest('/accounts/current')
  }

  /**
   * Get current user info
   */
  static async getCurrentUser() {
    return apiRequest('/users/current')
  }

  /**
   * Update account details
   */
  static async updateAccount(accountId: string, data: any) {
    return apiRequest(`/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * Verify current session (checks if cookie is valid)
   * Returns user and account info if valid
   * ✅ httpOnly cookie sent automatically
   */
  static async verifySession(): Promise<{
    user: {
      id: string
      accountId: string
      email: string
      name: string
      role: string
      isPlatformAdmin?: boolean
    }
    account: {
      id: string
      companyName: string
      email: string
      plan: string
      status: string
    }
  }> {
    return apiRequest('/auth/me')
  }
}
