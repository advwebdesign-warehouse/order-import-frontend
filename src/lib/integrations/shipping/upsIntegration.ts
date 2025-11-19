//file path: src/lib/integrations/shipping/upsIntegration.ts

import { ShippingIntegrationService, IntegrationConfig, SyncResult, TestConnectionResult } from '../base/baseIntegration'

/**
 * UPS Integration Implementation
 * Extends ShippingIntegrationService base class
 *
 * This class provides a unified interface for UPS shipping operations
 * All operations call the backend API routes at /api/shipping/ups/*
 */
export class UPSIntegration extends ShippingIntegrationService {
  constructor(config: IntegrationConfig) {
    super(config)
  }

  /**
   * Test connection to UPS
   * Calls backend API which validates OAuth credentials
   */
  async testConnection(): Promise<TestConnectionResult> {
    try {
      console.log('[UPSIntegration] Testing connection...')

      const response = await fetch('/api/shipping/ups/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: this.config.storeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `API error: ${response.statusText}`)
      }

      const result = await response.json()

      return {
        success: result.success,
        message: result.message || 'UPS connection successful',
        details: result
      }
    } catch (error: any) {
      console.error('[UPSIntegration] Connection test failed:', error)
      return {
        success: false,
        error: error.message || 'Connection test failed'
      }
    }
  }

  /**
   * Create shipping label
   * Calls backend API to generate UPS label
   * Note: May not be fully implemented yet on backend
   */
  async createLabel(shipment: any): Promise<any> {
    try {
      console.log('[UPSIntegration] Creating label...')

      const response = await fetch('/api/shipping/ups/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shipment,
          storeId: this.config.storeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))

        // Handle 501 (Not Implemented) gracefully
        if (response.status === 501) {
          throw new Error('Label creation not yet implemented for UPS. Feature coming soon.')
        }

        throw new Error(errorData.error || 'Failed to create label')
      }

      const result = await response.json()
      return result.label
    } catch (error: any) {
      console.error('[UPSIntegration] Label creation failed:', error)
      throw error
    }
  }

  /**
   * Get shipping rates
   * Calls backend API to fetch UPS rates
   */
  async getRates(shipment: any): Promise<any> {
    try {
      console.log('[UPSIntegration] Getting rates...')

      const response = await fetch('/api/shipping/ups/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shipment,
          storeId: this.config.storeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to get rates')
      }

      const result = await response.json()
      return result.rates
    } catch (error: any) {
      console.error('[UPSIntegration] Rate calculation failed:', error)
      throw error
    }
  }

  /**
   * Track package
   * Calls backend API to get tracking information
   */
  async trackPackage(trackingNumber: string): Promise<any> {
    try {
      console.log('[UPSIntegration] Tracking package:', trackingNumber)

      const response = await fetch('/api/shipping/ups/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackingNumber,
          storeId: this.config.storeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to track package')
      }

      const result = await response.json()
      return result.tracking
    } catch (error: any) {
      console.error('[UPSIntegration] Package tracking failed:', error)
      throw error
    }
  }

  /**
   * Refresh OAuth access token
   * Calls backend API to refresh the UPS OAuth token
   */
  async refreshAccessToken(): Promise<any> {
    try {
      console.log('[UPSIntegration] Refreshing access token...')

      const response = await fetch('/api/shipping/ups/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId: this.config.storeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to refresh token')
      }

      const result = await response.json()
      return result
    } catch (error: any) {
      console.error('[UPSIntegration] Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Get available services
   * Calls backend API to get UPS service types
   */
  async getAvailableServices(): Promise<any[]> {
    try {
      console.log('[UPSIntegration] Getting available services...')

      const response = await fetch(`/api/shipping/ups/services?storeId=${this.config.storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to get services')
      }

      const result = await response.json()
      return result.services
    } catch (error: any) {
      console.error('[UPSIntegration] Failed to get services:', error)
      throw error
    }
  }

  /**
   * Get available containers
   * Calls backend API to get UPS container/packaging types
   */
  async getAvailableContainers(): Promise<any[]> {
    try {
      console.log('[UPSIntegration] Getting available containers...')

      const response = await fetch(`/api/shipping/ups/containers?storeId=${this.config.storeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to get containers')
      }

      const result = await response.json()
      return result.containers
    } catch (error: any) {
      console.error('[UPSIntegration] Failed to get containers:', error)
      throw error
    }
  }

  /**
   * Get supported features
   */
  getSupportedFeatures(): string[] {
    return [
      'labelGeneration', // Coming soon
      'rateCalculation',
      'tracking',
      'pickupScheduling', // Future feature
      'domesticShipping',
      'internationalShipping',
      'oauthAuthentication'
    ]
  }

  /**
   * Check if feature is supported
   */
  supportsFeature(feature: string): boolean {
    return this.getSupportedFeatures().includes(feature)
  }
}
