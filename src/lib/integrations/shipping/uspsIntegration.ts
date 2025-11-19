//file path: src/lib/integrations/shipping/uspsIntegration.ts

import { ShippingIntegrationService, IntegrationConfig, SyncResult, TestConnectionResult } from '../base/baseIntegration'

/**
 * USPS Integration Implementation
 * Extends ShippingIntegrationService base class
 *
 * This class provides a unified interface for USPS shipping operations
 * All operations call the backend API routes at /api/shipping/usps/*
 */
export class USPSIntegration extends ShippingIntegrationService {
  constructor(config: IntegrationConfig) {
    super(config)
  }

  /**
   * Test connection to USPS
   * Calls backend API which validates credentials
   */
  async testConnection(): Promise<TestConnectionResult> {
    try {
      console.log('[USPSIntegration] Testing connection...')

      const response = await fetch('/api/shipping/usps/test', {
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
        message: result.message || 'USPS connection successful',
        details: result
      }
    } catch (error: any) {
      console.error('[USPSIntegration] Connection test failed:', error)
      return {
        success: false,
        error: error.message || 'Connection test failed'
      }
    }
  }

  /**
   * Create shipping label
   * Calls backend API to generate USPS label
   */
  async createLabel(shipment: any): Promise<any> {
    try {
      console.log('[USPSIntegration] Creating label...')

      const response = await fetch('/api/shipping/usps/labels', {
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
        throw new Error(errorData.error || 'Failed to create label')
      }

      const result = await response.json()
      return result.label
    } catch (error: any) {
      console.error('[USPSIntegration] Label creation failed:', error)
      throw error
    }
  }

  /**
   * Get shipping rates
   * Calls backend API to fetch USPS rates
   */
  async getRates(shipment: any): Promise<any> {
    try {
      console.log('[USPSIntegration] Getting rates...')

      const response = await fetch('/api/shipping/usps/rates', {
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
      console.error('[USPSIntegration] Rate calculation failed:', error)
      throw error
    }
  }

  /**
   * Track package
   * Calls backend API to get tracking information
   */
  async trackPackage(trackingNumber: string): Promise<any> {
    try {
      console.log('[USPSIntegration] Tracking package:', trackingNumber)

      const response = await fetch('/api/shipping/usps/tracking', {
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
      console.error('[USPSIntegration] Package tracking failed:', error)
      throw error
    }
  }

  /**
   * Validate address
   * Calls backend API to validate address with USPS
   */
  async validateAddress(address: any): Promise<any> {
    try {
      console.log('[USPSIntegration] Validating address...')

      const response = await fetch('/api/shipping/usps/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          storeId: this.config.storeId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to validate address')
      }

      const result = await response.json()
      return result.address
    } catch (error: any) {
      console.error('[USPSIntegration] Address validation failed:', error)
      throw error
    }
  }

  /**
   * Get available services
   * Calls backend API to get USPS service types
   */
  async getAvailableServices(): Promise<any[]> {
    try {
      console.log('[USPSIntegration] Getting available services...')

      const response = await fetch(`/api/shipping/usps/services?storeId=${this.config.storeId}`, {
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
      console.error('[USPSIntegration] Failed to get services:', error)
      throw error
    }
  }

  /**
   * Get available containers
   * Calls backend API to get USPS container types
   */
  async getAvailableContainers(originZip: string, destZip: string): Promise<any[]> {
    try {
      console.log('[USPSIntegration] Getting available containers...')

      const response = await fetch(
        `/api/shipping/usps/containers?storeId=${this.config.storeId}&originZip=${originZip}&destZip=${destZip}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || 'Failed to get containers')
      }

      const result = await response.json()
      return result.containers
    } catch (error: any) {
      console.error('[USPSIntegration] Failed to get containers:', error)
      throw error
    }
  }

  /**
   * Get supported features
   */
  getSupportedFeatures(): string[] {
    return [
      'labelGeneration',
      'rateCalculation',
      'addressValidation',
      'tracking',
      'domesticShipping'
    ]
  }

  /**
   * Check if feature is supported
   */
  supportsFeature(feature: string): boolean {
    return this.getSupportedFeatures().includes(feature)
  }
}
