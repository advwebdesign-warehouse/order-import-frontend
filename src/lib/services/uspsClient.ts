//file path: src/lib/services/uspsClient.ts

import { getUserIntegrations } from '@/lib/storage/integrationStorage'

/**
 * Get USPS credentials from localStorage for the current user
 */
function getUSPSCredentials() {
  const integrations = getUserIntegrations()
  const uspsIntegration = integrations?.integrations.find(
    i => i.id === 'usps' && i.enabled
  )

  if (uspsIntegration && uspsIntegration.type === 'shipping' && uspsIntegration.name === 'USPS') {
    return {
      consumerKey: uspsIntegration.config.consumerKey,
      consumerSecret: uspsIntegration.config.consumerSecret,
      environment: uspsIntegration.config.environment
    }
  }

  return null
}

/**
 * Get shipping rates - Client-side function that includes credentials
 */
export async function getShippingRates(shipment: any) {
  const credentials = getUSPSCredentials()

  if (!credentials) {
    throw new Error('USPS not configured. Please set up USPS integration in settings.')
  }

  const response = await fetch('/api/shipping/usps/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shipment,
      credentials
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get shipping rates')
  }

  return await response.json()
}

/**
 * Validate address - Client-side function that includes credentials
 */
export async function validateAddress(address: any) {
  const credentials = getUSPSCredentials()

  if (!credentials) {
    throw new Error('USPS not configured. Please set up USPS integration in settings.')
  }

  const response = await fetch('/api/shipping/usps/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address,
      credentials
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to validate address')
  }

  return await response.json()
}

/**
 * Create shipping label - Client-side function that includes credentials
 */
export async function createShippingLabel(shipment: any) {
  const credentials = getUSPSCredentials()

  if (!credentials) {
    throw new Error('USPS not configured. Please set up USPS integration in settings.')
  }

  const response = await fetch('/api/shipping/usps/labels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shipment,
      credentials
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create shipping label')
  }

  return await response.json()
}

/**
 * Track package - Client-side function that includes credentials
 */
export async function trackPackage(trackingNumber: string) {
  const credentials = getUSPSCredentials()

  if (!credentials) {
    throw new Error('USPS not configured. Please set up USPS integration in settings.')
  }

  const response = await fetch('/api/shipping/usps/tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingNumber,
      credentials
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to track package')
  }

  return await response.json()
}
