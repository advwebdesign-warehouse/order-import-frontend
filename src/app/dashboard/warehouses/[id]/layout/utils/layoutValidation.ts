//file path: app/dashboard/warehouses/[id]/layout/utils/layoutValidation.ts

import { Zone, Aisle, Shelf } from '../../../utils/warehouseTypes'

export interface ValidationError {
  field: string
  message: string
}

// Zone validation functions
export const validateZoneName = (name: string, zones: Zone[], editingZone?: Zone | null): ValidationError | null => {
  if (!name.trim()) {
    return { field: 'name', message: 'Zone name is required' }
  }

  const isDuplicate = zones.some(zone =>
    zone.name.toLowerCase() === name.toLowerCase() &&
    (!editingZone || zone.id !== editingZone.id)
  )

  if (isDuplicate) {
    return { field: 'name', message: `Zone name "${name}" already exists` }
  }

  return null
}

export const validateZoneCode = (code: string, zones: Zone[], editingZone?: Zone | null): ValidationError | null => {
  if (!code.trim()) {
    return { field: 'code', message: 'Zone code is required' }
  }

  if (code.length > 10) {
    return { field: 'code', message: 'Zone code must be 10 characters or less' }
  }

  const isDuplicate = zones.some(zone =>
    zone.code.toLowerCase() === code.toLowerCase() &&
    (!editingZone || zone.id !== editingZone.id)
  )

  if (isDuplicate) {
    return { field: 'code', message: `Zone code "${code}" already exists` }
  }

  return null
}

// Aisle validation functions
export const validateAisleName = (name: string, zone: Zone, editingAisle?: Aisle | null): ValidationError | null => {
  if (!name.trim()) {
    return { field: 'name', message: 'Aisle name is required' }
  }

  const isDuplicate = zone.aisles.some(aisle =>
    aisle.name.toLowerCase() === name.toLowerCase() &&
    (!editingAisle || aisle.id !== editingAisle.id)
  )

  if (isDuplicate) {
    return { field: 'name', message: `Aisle name "${name}" already exists in this zone` }
  }

  return null
}

export const validateAisleCode = (code: string, zone: Zone, editingAisle?: Aisle | null): ValidationError | null => {
  if (!code.trim()) {
    return { field: 'code', message: 'Aisle code is required' }
  }

  if (code.length > 10) {
    return { field: 'code', message: 'Aisle code must be 10 characters or less' }
  }

  const isDuplicate = zone.aisles.some(aisle =>
    aisle.code.toLowerCase() === code.toLowerCase() &&
    (!editingAisle || aisle.id !== editingAisle.id)
  )

  if (isDuplicate) {
    return { field: 'code', message: `Aisle code "${code}" already exists in this zone` }
  }

  return null
}

// Bin validation functions
export const validateBinName = (name: string, shelf: Shelf, editingBinId?: string): ValidationError | null => {
  if (!name.trim()) {
    return { field: 'name', message: 'Bin name is required' }
  }

  const isDuplicate = shelf.bins.some(bin =>
    bin.name.toLowerCase() === name.toLowerCase() &&
    (!editingBinId || bin.id !== editingBinId)
  )

  if (isDuplicate) {
    return { field: 'name', message: `Bin name "${name}" already exists on this shelf` }
  }

  return null
}

export const validateBinCode = (code: string, shelf: Shelf, editingBinId?: string): ValidationError | null => {
  if (!code.trim()) {
    return { field: 'code', message: 'Bin code is required' }
  }

  if (code.length > 10) {
    return { field: 'code', message: 'Bin code must be 10 characters or less' }
  }

  const isDuplicate = shelf.bins.some(bin =>
    bin.code.toLowerCase() === code.toLowerCase() &&
    (!editingBinId || bin.id !== editingBinId)
  )

  if (isDuplicate) {
    return { field: 'code', message: `Bin code "${code}" already exists on this shelf` }
  }

  return null
}

// General validation helpers
export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value.trim()) {
    return { field: fieldName, message: `${fieldName} is required` }
  }
  return null
}

export const validateNumericRange = (
  value: number,
  fieldName: string,
  min?: number,
  max?: number
): ValidationError | null => {
  if (min !== undefined && value < min) {
    return { field: fieldName, message: `${fieldName} must be at least ${min}` }
  }

  if (max !== undefined && value > max) {
    return { field: fieldName, message: `${fieldName} must be no more than ${max}` }
  }

  return null
}

// Batch validation helper
export const validateForm = (validators: (() => ValidationError | null)[]): ValidationError[] => {
  return validators.map(validator => validator()).filter(error => error !== null) as ValidationError[]
}
