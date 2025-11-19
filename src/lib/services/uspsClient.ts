//file path: src/lib/services/uspsClient.ts

/**
 * USPS Client - Frontend API calls to backend
 * ✅ Uses existing baseApi pattern for authentication
 * ✅ No longer uses localStorage for credentials - fetched from database by backend
 * ✅ Passes storeId to all endpoints for proper integration lookup
 */

import { apiRequest } from '@/lib/api/baseApi'

/**
 * Get shipping rates - Backend will fetch credentials from database
 */
export async function getShippingRates(shipment: any, storeId: string) {
  if (!storeId) throw new Error('Store ID is required')
  return apiRequest('/shipping/usps/rates', {
    method: 'POST',
    body: JSON.stringify({ shipment, storeId })
  })
}

/**
 * Validate address - Backend will fetch credentials from database
 */
export async function validateAddress(address: any, storeId: string) {
  if (!storeId) throw new Error('Store ID is required')
  return apiRequest('/shipping/usps/validate', {
    method: 'POST',
    body: JSON.stringify({ address, storeId })
  })
}

/**
 * Create shipping label - Backend will fetch credentials from database
 */
export async function createShippingLabel(shipment: any, storeId: string) {
  if (!storeId) throw new Error('Store ID is required')  // ✅ ADDED: Validation
  return apiRequest('/shipping/usps/labels', {
    method: 'POST',
    body: JSON.stringify({ shipment, storeId })
  })
}

/**
 * Track package - Backend will fetch credentials from database
 */
export async function trackPackage(trackingNumber: string, storeId: string) {
  if (!storeId) throw new Error('Store ID is required')  // ✅ ADDED: Validation
  return apiRequest('/shipping/usps/tracking', {
    method: 'POST',
    body: JSON.stringify({ trackingNumber, storeId })
  })
}

/**
 * Get available services - Backend will fetch credentials from database
 */
export async function getAvailableServices(storeId: string) {
  if (!storeId) throw new Error('Store ID is required')  // ✅ ADDED: Validation
  
  return apiRequest(`/shipping/usps/services?storeId=${storeId}`, {
    method: 'GET'
  })
}

/**
 * Get available containers - Backend will fetch credentials from database
 */
export async function getAvailableContainers(storeId: string, originZip?: string, destZip?: string) {
  if (!storeId) throw new Error('Store ID is required')  // ✅ ADDED: Validation

  const params = new URLSearchParams()
  params.append('storeId', storeId)  // ✅ FIXED: Added storeId
  if (originZip) params.append('originZip', originZip)
  if (destZip) params.append('destZip', destZip)

  const queryString = params.toString()
  const endpoint = `/shipping/usps/containers?${queryString}`

  return apiRequest(endpoint, {
    method: 'GET'
  })
}
