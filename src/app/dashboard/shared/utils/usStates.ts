//file path: app/dashboard/shared/utils/usStates.ts

/**
 * US States with Enhanced 9-Region Geographic System
 *
 * More granular than the standard 4-region model for better warehouse distribution
 */

export interface USState {
  code: string
  name: string
  region: USRegion
}

// ✅ ENHANCED: 9 geographic regions instead of 4
export type USRegion =
  | 'New England'          // Northeast corner (6 states)
  | 'Mid-Atlantic'         // NY, NJ, PA (3 states)
  | 'Southeast'            // Atlantic South (12 states)
  | 'Great Lakes'          // Upper Midwest (5 states)
  | 'Plains'               // Central (7 states)
  | 'South Central'        // TX, OK, AR, LA (4 states)
  | 'Mountain'             // Rocky Mountains (8 states)
  | 'Pacific Northwest'    // WA, OR, AK (3 states)
  | 'Pacific'              // CA, HI (2 states)

/**
 * All 50 US States with Enhanced Regional Classification
 */
export const US_STATES: USState[] = [
  // NEW ENGLAND (6 states) - Northeast corner
  { code: 'CT', name: 'Connecticut', region: 'New England' },
  { code: 'ME', name: 'Maine', region: 'New England' },
  { code: 'MA', name: 'Massachusetts', region: 'New England' },
  { code: 'NH', name: 'New Hampshire', region: 'New England' },
  { code: 'RI', name: 'Rhode Island', region: 'New England' },
  { code: 'VT', name: 'Vermont', region: 'New England' },

  // MID-ATLANTIC (3 states) - NY corridor
  { code: 'NJ', name: 'New Jersey', region: 'Mid-Atlantic' },
  { code: 'NY', name: 'New York', region: 'Mid-Atlantic' },
  { code: 'PA', name: 'Pennsylvania', region: 'Mid-Atlantic' },

  // SOUTHEAST (12 states) - Atlantic South
  { code: 'AL', name: 'Alabama', region: 'Southeast' },
  { code: 'DE', name: 'Delaware', region: 'Southeast' },
  { code: 'FL', name: 'Florida', region: 'Southeast' },
  { code: 'GA', name: 'Georgia', region: 'Southeast' },
  { code: 'KY', name: 'Kentucky', region: 'Southeast' },
  { code: 'MD', name: 'Maryland', region: 'Southeast' },
  { code: 'MS', name: 'Mississippi', region: 'Southeast' },
  { code: 'NC', name: 'North Carolina', region: 'Southeast' },
  { code: 'SC', name: 'South Carolina', region: 'Southeast' },
  { code: 'TN', name: 'Tennessee', region: 'Southeast' },
  { code: 'VA', name: 'Virginia', region: 'Southeast' },
  { code: 'WV', name: 'West Virginia', region: 'Southeast' },

  // GREAT LAKES (5 states) - Upper Midwest
  { code: 'IL', name: 'Illinois', region: 'Great Lakes' },
  { code: 'IN', name: 'Indiana', region: 'Great Lakes' },
  { code: 'MI', name: 'Michigan', region: 'Great Lakes' },
  { code: 'OH', name: 'Ohio', region: 'Great Lakes' },
  { code: 'WI', name: 'Wisconsin', region: 'Great Lakes' },

  // PLAINS (7 states) - Central flatlands
  { code: 'IA', name: 'Iowa', region: 'Plains' },
  { code: 'KS', name: 'Kansas', region: 'Plains' },
  { code: 'MN', name: 'Minnesota', region: 'Plains' },
  { code: 'MO', name: 'Missouri', region: 'Plains' },
  { code: 'ND', name: 'North Dakota', region: 'Plains' },
  { code: 'NE', name: 'Nebraska', region: 'Plains' },
  { code: 'SD', name: 'South Dakota', region: 'Plains' },

  // SOUTH CENTRAL (4 states) - TX region
  { code: 'AR', name: 'Arkansas', region: 'South Central' },
  { code: 'LA', name: 'Louisiana', region: 'South Central' },
  { code: 'OK', name: 'Oklahoma', region: 'South Central' },
  { code: 'TX', name: 'Texas', region: 'South Central' },

  // MOUNTAIN (8 states) - Rockies
  { code: 'AZ', name: 'Arizona', region: 'Mountain' },
  { code: 'CO', name: 'Colorado', region: 'Mountain' },
  { code: 'ID', name: 'Idaho', region: 'Mountain' },
  { code: 'MT', name: 'Montana', region: 'Mountain' },
  { code: 'NV', name: 'Nevada', region: 'Mountain' },
  { code: 'NM', name: 'New Mexico', region: 'Mountain' },
  { code: 'UT', name: 'Utah', region: 'Mountain' },
  { code: 'WY', name: 'Wyoming', region: 'Mountain' },

  // PACIFIC NORTHWEST (3 states)
  { code: 'AK', name: 'Alaska', region: 'Pacific Northwest' },
  { code: 'OR', name: 'Oregon', region: 'Pacific Northwest' },
  { code: 'WA', name: 'Washington', region: 'Pacific Northwest' },

  // PACIFIC (2 states) - West Coast
  { code: 'CA', name: 'California', region: 'Pacific' },
  { code: 'HI', name: 'Hawaii', region: 'Pacific' }
]

/**
 * Enhanced Regional Groupings
 */
export const US_REGIONS: Record<USRegion, string[]> = {
  'New England': ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'],
  'Mid-Atlantic': ['NJ', 'NY', 'PA'],
  'Southeast': ['AL', 'DE', 'FL', 'GA', 'KY', 'MD', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  'Great Lakes': ['IL', 'IN', 'MI', 'OH', 'WI'],
  'Plains': ['IA', 'KS', 'MN', 'MO', 'ND', 'NE', 'SD'],
  'South Central': ['AR', 'LA', 'OK', 'TX'],
  'Mountain': ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY'],
  'Pacific Northwest': ['AK', 'OR', 'WA'],
  'Pacific': ['CA', 'HI']
}

/**
 * Enhanced Region Adjacency Map
 * Defines which regions are geographically adjacent for proximity scoring
 */
export const REGION_ADJACENCY: Record<USRegion, USRegion[]> = {
  'New England': ['Mid-Atlantic'],
  'Mid-Atlantic': ['New England', 'Southeast', 'Great Lakes'],
  'Southeast': ['Mid-Atlantic', 'Great Lakes', 'South Central'],
  'Great Lakes': ['Mid-Atlantic', 'Southeast', 'Plains'],
  'Plains': ['Great Lakes', 'South Central', 'Mountain'],
  'South Central': ['Southeast', 'Plains', 'Mountain'],
  'Mountain': ['Plains', 'South Central', 'Pacific Northwest', 'Pacific'],
  'Pacific Northwest': ['Mountain', 'Pacific'],
  'Pacific': ['Pacific Northwest', 'Mountain']
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

/**
 * Get all regions as array
 */
export function getAllRegions(): USRegion[] {
  return [
    'New England',
    'Mid-Atlantic',
    'Southeast',
    'Great Lakes',
    'Plains',
    'South Central',
    'Mountain',
    'Pacific Northwest',
    'Pacific'
  ]
}

/**
 * Get region display info
 */
export function getRegionInfo(region: USRegion): {
  name: string
  stateCount: number
  states: string[]
} {
  return {
    name: region,
    stateCount: US_REGIONS[region].length,
    states: US_REGIONS[region]
  }
}
