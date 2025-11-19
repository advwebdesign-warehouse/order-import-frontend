//file path: src/lib/api/accountApi.ts

import { apiRequest } from './baseApi'

export interface LoginResponse {
  token: string
  user: {
    id: string
    accountId: string
    email: string
    name: string
    role: string
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

export class AccountAPI {
  /**
   * Login user and get JWT token
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
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
   * Verify current session (checks if token is valid)
   * Returns user and account info if valid
   */
  static async verifySession(): Promise<{
    user: any
    account: any
  }> {
    return apiRequest('/auth/me')
  }
}
