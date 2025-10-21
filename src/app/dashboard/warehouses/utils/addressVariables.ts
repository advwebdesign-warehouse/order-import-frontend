//file path: app/dashboard/warehouses/utils/addressVariables.ts

export interface AddressVariables {
  shop?: string // ✅ RENAME COMMENT: Store name (from order.storeName)
  warehouse?: string
  code?: string
  platform?: string
}

/**
 * Replace variables in return address name with actual values
 * Supports: [shop], [warehouse], [code], [platform]
 */
export function replaceAddressVariables(
  template: string,
  variables: AddressVariables
): string {
  if (!template) return ''

  let result = template

  // Replace each variable
  if (variables.shop) {
    result = result.replace(/\[shop\]/gi, variables.shop)
  }
  if (variables.warehouse) {
    result = result.replace(/\[warehouse\]/gi, variables.warehouse)
  }
  if (variables.code) {
    result = result.replace(/\[code\]/gi, variables.code)
  }
  if (variables.platform) {
    result = result.replace(/\[platform\]/gi, variables.platform)
  }

  return result
}

/**
 * Get all variables used in a template
 */
export function getUsedVariables(template: string): string[] {
  if (!template) return []

  const variables: string[] = []
  const regex = /\[(\w+)\]/g
  let match

  while ((match = regex.exec(template)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1])
    }
  }

  return variables
}

/**
 * Validate that all variables in template are supported
 */
export function validateAddressVariables(template: string): {
  valid: boolean
  unsupportedVariables: string[]
} {
  const usedVars = getUsedVariables(template)
  const supportedVars = ['shop', 'warehouse', 'code', 'platform']
  const unsupportedVariables = usedVars.filter(v => !supportedVars.includes(v))

  return {
    valid: unsupportedVariables.length === 0,
    unsupportedVariables
  }
}

/**
 * Generate a preview with example values
 */
export function generateAddressPreview(
  template: string,
  exampleValues: AddressVariables
): string {
  return replaceAddressVariables(template, {
    shop: exampleValues.shop || 'Example Shop',
    warehouse: exampleValues.warehouse || 'Warehouse Name',
    code: exampleValues.code || 'WH-01',
    platform: exampleValues.platform || 'Shopify'
  })
}
