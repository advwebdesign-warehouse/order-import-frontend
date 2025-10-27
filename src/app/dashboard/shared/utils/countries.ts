//file path: app/dashboard/shared/utils/countries.ts

export interface Country {
  code: string
  name: string
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States' }
]

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code)
}

/**
 * Get country by name
 */
export function getCountryByName(name: string): Country | undefined {
  return COUNTRIES.find(c => c.name === name)
}
