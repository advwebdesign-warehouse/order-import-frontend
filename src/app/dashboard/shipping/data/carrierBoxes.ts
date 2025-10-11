//file path: app/dashboard/shipping/data/carrierBoxes.ts

import { ShippingBox } from '../utils/shippingTypes'

export const USPS_BOXES: Omit<ShippingBox, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'USPS Flat Rate Envelope',
    boxType: 'usps',
    carrierCode: 'FLAT RATE ENVELOPE',
    dimensions: { length: 12.5, width: 9.5, height: 0.75, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.1, unit: 'lbs' },
    description: 'Standard flat rate envelope',
    isActive: true,
    flatRate: true,
    flatRatePrice: 9.65,
    availableFor: 'both'
  },
  {
    name: 'USPS Flat Rate Legal Envelope',
    boxType: 'usps',
    carrierCode: 'FLAT RATE LEGAL ENVELOPE',
    dimensions: { length: 15, width: 9.5, height: 0.75, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.1, unit: 'lbs' },
    description: 'Legal size flat rate envelope',
    isActive: true,
    flatRate: true,
    flatRatePrice: 9.95,
    availableFor: 'both'
  },
  {
    name: 'USPS Flat Rate Padded Envelope',
    boxType: 'usps',
    carrierCode: 'FLAT RATE PADDED ENVELOPE',
    dimensions: { length: 12.5, width: 9.5, height: 1, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.2, unit: 'lbs' },
    description: 'Padded flat rate envelope',
    isActive: true,
    flatRate: true,
    flatRatePrice: 10.40,
    availableFor: 'both'
  },
  {
    name: 'USPS Small Flat Rate Box',
    boxType: 'usps',
    carrierCode: 'SM FLAT RATE BOX',
    dimensions: { length: 8.625, width: 5.375, height: 1.625, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.3, unit: 'lbs' },
    description: 'Small flat rate box',
    isActive: true,
    flatRate: true,
    flatRatePrice: 10.40,
    availableFor: 'both'
  },
  {
    name: 'USPS Medium Flat Rate Box',
    boxType: 'usps',
    carrierCode: 'MD FLAT RATE BOX',
    dimensions: { length: 11.25, width: 8.75, height: 6, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.5, unit: 'lbs' },
    description: 'Medium flat rate box (top loading)',
    isActive: true,
    flatRate: true,
    flatRatePrice: 17.05,
    availableFor: 'both'
  },
  {
    name: 'USPS Large Flat Rate Box',
    boxType: 'usps',
    carrierCode: 'LG FLAT RATE BOX',
    dimensions: { length: 12.25, width: 12.25, height: 6, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.6, unit: 'lbs' },
    description: 'Large flat rate box',
    isActive: true,
    flatRate: true,
    flatRatePrice: 22.80,
    availableFor: 'both'
  },
  {
    name: 'USPS Regional Rate Box A',
    boxType: 'usps',
    carrierCode: 'REGIONALRATEBOXA',
    dimensions: { length: 10.125, width: 7.125, height: 5, unit: 'in' },
    weight: { maxWeight: 15, tareWeight: 0.4, unit: 'lbs' },
    description: 'Regional rate box A - price varies by zone',
    isActive: true,
    flatRate: false,
    availableFor: 'domestic'
  },
  {
    name: 'USPS Regional Rate Box B',
    boxType: 'usps',
    carrierCode: 'REGIONALRATEBOXB',
    dimensions: { length: 12.25, width: 10.5, height: 5.5, unit: 'in' },
    weight: { maxWeight: 20, tareWeight: 0.5, unit: 'lbs' },
    description: 'Regional rate box B - price varies by zone',
    isActive: true,
    flatRate: false,
    availableFor: 'domestic'
  },
  {
    name: 'USPS Priority Mail Shoe Box',
    boxType: 'usps',
    carrierCode: 'PRIORITY',
    dimensions: { length: 13.625, width: 7.5, height: 6, unit: 'in' },
    weight: { maxWeight: 70, tareWeight: 0.4, unit: 'lbs' },
    description: 'Priority Mail shoe box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  }
]

export const UPS_BOXES: Omit<ShippingBox, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'UPS Express Envelope',
    boxType: 'ups',
    carrierCode: 'UPS_EXPRESS_ENVELOPE',
    dimensions: { length: 12.5, width: 9.5, height: 0.5, unit: 'in' },
    weight: { maxWeight: 1, tareWeight: 0.05, unit: 'lbs' },
    description: 'UPS Express Envelope',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'UPS Express Pak',
    boxType: 'ups',
    carrierCode: 'UPS_EXPRESS_PAK',
    dimensions: { length: 16, width: 12.75, height: 1, unit: 'in' },
    weight: { maxWeight: 3, tareWeight: 0.1, unit: 'lbs' },
    description: 'UPS Express Pak',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'UPS Small Box',
    boxType: 'ups',
    carrierCode: 'UPS_SMALL_BOX',
    dimensions: { length: 13, width: 11, height: 2, unit: 'in' },
    weight: { maxWeight: 20, tareWeight: 0.3, unit: 'lbs' },
    description: 'UPS Small Express Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'UPS Medium Box',
    boxType: 'ups',
    carrierCode: 'UPS_MEDIUM_BOX',
    dimensions: { length: 16, width: 11, height: 3, unit: 'in' },
    weight: { maxWeight: 30, tareWeight: 0.4, unit: 'lbs' },
    description: 'UPS Medium Express Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'UPS Large Box',
    boxType: 'ups',
    carrierCode: 'UPS_LARGE_BOX',
    dimensions: { length: 18, width: 13, height: 3, unit: 'in' },
    weight: { maxWeight: 30, tareWeight: 0.5, unit: 'lbs' },
    description: 'UPS Large Express Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  }
]

export const FEDEX_BOXES: Omit<ShippingBox, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'FedEx Envelope',
    boxType: 'fedex',
    carrierCode: 'FEDEX_ENVELOPE',
    dimensions: { length: 12.5, width: 9.5, height: 0.5, unit: 'in' },
    weight: { maxWeight: 0.5, tareWeight: 0.05, unit: 'lbs' },
    description: 'FedEx Express Envelope',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'FedEx Pak',
    boxType: 'fedex',
    carrierCode: 'FEDEX_PAK',
    dimensions: { length: 15.5, width: 12, height: 1, unit: 'in' },
    weight: { maxWeight: 3, tareWeight: 0.1, unit: 'lbs' },
    description: 'FedEx Pak',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'FedEx Small Box',
    boxType: 'fedex',
    carrierCode: 'FEDEX_SMALL_BOX',
    dimensions: { length: 12.25, width: 10.875, height: 1.5, unit: 'in' },
    weight: { maxWeight: 20, tareWeight: 0.3, unit: 'lbs' },
    description: 'FedEx Small Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'FedEx Medium Box',
    boxType: 'fedex',
    carrierCode: 'FEDEX_MEDIUM_BOX',
    dimensions: { length: 13.25, width: 11.5, height: 2.375, unit: 'in' },
    weight: { maxWeight: 20, tareWeight: 0.4, unit: 'lbs' },
    description: 'FedEx Medium Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'FedEx Large Box',
    boxType: 'fedex',
    carrierCode: 'FEDEX_LARGE_BOX',
    dimensions: { length: 17.875, width: 12.375, height: 3, unit: 'in' },
    weight: { maxWeight: 20, tareWeight: 0.5, unit: 'lbs' },
    description: 'FedEx Large Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  },
  {
    name: 'FedEx Extra Large Box',
    boxType: 'fedex',
    carrierCode: 'FEDEX_EXTRA_LARGE_BOX',
    dimensions: { length: 20, width: 18, height: 14, unit: 'in' },
    weight: { maxWeight: 40, tareWeight: 0.8, unit: 'lbs' },
    description: 'FedEx Extra Large Box',
    isActive: true,
    flatRate: false,
    availableFor: 'both'
  }
]
