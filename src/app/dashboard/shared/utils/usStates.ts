//file path: app/dashboard/shared/utils/usStates.ts

/**
 * US States and Regions
 *
 * Provides reusable geographic data for the United States.
 * Used across the application for:
 * - Address forms and validation
 * - Region-based warehouse routing
 * - State selection in various features
 */

export interface USState {
  code: string
  name: string
  region: USRegion
}

export type USRegion = 'West' | 'Midwest' | 'South' | 'Northeast'

/**
 * All 50 US States with their regions
 */
export const US_STATES: USState[] = [
  { code: 'AL', name: 'Alabama', region: 'South' },
  { code: 'AK', name: 'Alaska', region: 'West' },
  { code: 'AZ', name: 'Arizona', region: 'West' },
  { code: 'AR', name: 'Arkansas', region: 'South' },
  { code: 'CA', name: 'California', region: 'West' },
  { code: 'CO', name: 'Colorado', region: 'West' },
  { code: 'CT', name: 'Connecticut', region: 'Northeast' },
  { code: 'DE', name: 'Delaware', region: 'Northeast' },
  { code: 'FL', name: 'Florida', region: 'South' },
  { code: 'GA', name: 'Georgia', region: 'South' },
  { code: 'HI', name: 'Hawaii', region: 'West' },
  { code: 'ID', name: 'Idaho', region: 'West' },
  { code: 'IL', name: 'Illinois', region: 'Midwest' },
  { code: 'IN', name: 'Indiana', region: 'Midwest' },
  { code: 'IA', name: 'Iowa', region: 'Midwest' },
  { code: 'KS', name: 'Kansas', region: 'Midwest' },
  { code: 'KY', name: 'Kentucky', region: 'South' },
  { code: 'LA', name: 'Louisiana', region: 'South' },
  { code: 'ME', name: 'Maine', region: 'Northeast' },
  { code: 'MD', name: 'Maryland', region: 'Northeast' },
  { code: 'MA', name: 'Massachusetts', region: 'Northeast' },
  { code: 'MI', name: 'Michigan', region: 'Midwest' },
  { code: 'MN', name: 'Minnesota', region: 'Midwest' },
  { code: 'MS', name: 'Mississippi', region: 'South' },
  { code: 'MO', name: 'Missouri', region: 'Midwest' },
  { code: 'MT', name: 'Montana', region: 'West' },
  { code: 'NE', name: 'Nebraska', region: 'Midwest' },
  { code: 'NV', name: 'Nevada', region: 'West' },
  { code: 'NH', name: 'New Hampshire', region: 'Northeast' },
  { code: 'NJ', name: 'New Jersey', region: 'Northeast' },
  { code: 'NM', name: 'New Mexico', region: 'West' },
  { code: 'NY', name: 'New York', region: 'Northeast' },
  { code: 'NC', name: 'North Carolina', region: 'South' },
  { code: 'ND', name: 'North Dakota', region: 'Midwest' },
  { code: 'OH', name: 'Ohio', region: 'Midwest' },
  { code: 'OK', name: 'Oklahoma', region: 'South' },
  { code: 'OR', name: 'Oregon', region: 'West' },
  { code: 'PA', name: 'Pennsylvania', region: 'Northeast' },
  { code: 'RI', name: 'Rhode Island', region: 'Northeast' },
  { code: 'SC', name: 'South Carolina', region: 'South' },
  { code: 'SD', name: 'South Dakota', region: 'Midwest' },
  { code: 'TN', name: 'Tennessee', region: 'South' },
  { code: 'TX', name: 'Texas', region: 'South' },
  { code: 'UT', name: 'Utah', region: 'West' },
  { code: 'VT', name: 'Vermont', region: 'Northeast' },
  { code: 'VA', name: 'Virginia', region: 'South' },
  { code: 'WA', name: 'Washington', region: 'West' },
  { code: 'WV', name: 'West Virginia', region: 'South' },
  { code: 'WI', name: 'Wisconsin', region: 'Midwest' },
  { code: 'WY', name: 'Wyoming', region: 'West' }
]

/**
 * US Regions with their state codes
 * Useful for region-based routing and grouping
 */
export const US_REGIONS: Record<USRegion, string[]> = {
  'West': ['CA', 'OR', 'WA', 'NV', 'AZ', 'UT', 'ID', 'MT', 'WY', 'CO', 'NM', 'AK', 'HI'],
  'Midwest': ['IL', 'IN', 'MI', 'OH', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  'South': ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'FL', 'GA', 'SC', 'NC', 'VA', 'WV'],
  'Northeast': ['NY', 'PA', 'NJ', 'CT', 'MA', 'RI', 'VT', 'NH', 'ME', 'DE', 'MD']
}

/**
 * Region adjacency map for geographic proximity
 * Useful for calculating shipping distances and warehouse routing
 */
export const REGION_ADJACENCY: Record<USRegion, USRegion[]> = {
  'West': ['Midwest'],
  'Midwest': ['West', 'South', 'Northeast'],
  'South': ['Midwest', 'West'],
  'Northeast': ['Midwest', 'South']
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get state by code
 */
export function getStateByCode(code: string): USState | undefined {
  return US_STATES.find(s => s.code === code)
}

/**
 * Get state by name
 */
export function getStateByName(name: string): USState | undefined {
  return US_STATES.find(s => s.name === name)
}

/**
 * Get all states in a region
 */
export function getStatesByRegion(region: USRegion): USState[] {
  return US_STATES.filter(s => s.region === region)
}

/**
 * Get region by state code
 */
export function getRegionByStateCode(stateCode: string): USRegion | undefined {
  const state = getStateByCode(stateCode)
  return state?.region
}

/**
 * Check if two states are in the same region
 */
export function areStatesInSameRegion(stateCode1: string, stateCode2: string): boolean {
  const region1 = getRegionByStateCode(stateCode1)
  const region2 = getRegionByStateCode(stateCode2)
  return region1 !== undefined && region1 === region2
}

/**
 * Check if two regions are adjacent
 */
export function areRegionsAdjacent(region1: USRegion, region2: USRegion): boolean {
  return REGION_ADJACENCY[region1]?.includes(region2) || false
}

/**
 * Get distance category between two states
 * Returns: 'same' (same region), 'adjacent' (adjacent regions), or 'far' (non-adjacent)
 */
export function getStateProximity(
  stateCode1: string,
  stateCode2: string
): 'same' | 'adjacent' | 'far' | 'unknown' {
  const region1 = getRegionByStateCode(stateCode1)
  const region2 = getRegionByStateCode(stateCode2)

  if (!region1 || !region2) return 'unknown'
  if (region1 === region2) return 'same'
  if (areRegionsAdjacent(region1, region2)) return 'adjacent'
  return 'far'
}

/**
 * Get all state codes as an array
 */
export function getAllStateCodes(): string[] {
  return US_STATES.map(s => s.code)
}

/**
 * Get all state names as an array
 */
export function getAllStateNames(): string[] {
  return US_STATES.map(s => s.name)
}

/**
 * Validate if a state code is valid
 */
export function isValidStateCode(code: string): boolean {
  return US_STATES.some(s => s.code === code)
}

/**
 * Format state for display (e.g., "CA - California")
 */
export function formatStateDisplay(stateCode: string): string {
  const state = getStateByCode(stateCode)
  return state ? `${state.code} - ${state.name}` : stateCode
}
