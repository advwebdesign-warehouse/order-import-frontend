//file path: app/dashboard/shipping/data/carrierServices.ts

import { CarrierService } from '../utils/shippingTypes'

export const USPS_SERVICES: Omit<CarrierService, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    carrier: 'USPS',
    serviceCode: 'PRIORITY',
    serviceName: 'Priority Mail',
    displayName: 'USPS Priority Mail',
    description: '1-3 business days',
    serviceType: 'both',
    estimatedDays: '1-3 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 70,
      maxDimensions: { length: 108, width: 108, height: 108 }
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'PRIORITY_EXPRESS',
    serviceName: 'Priority Mail Express',
    displayName: 'USPS Priority Mail Express',
    description: 'Overnight to 2-day guarantee',
    serviceType: 'both',
    estimatedDays: '1-2 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 70,
      maxDimensions: { length: 108, width: 108, height: 108 }
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'FIRST_CLASS',
    serviceName: 'First-Class Mail',
    displayName: 'USPS First-Class Mail',
    description: '1-5 business days',
    serviceType: 'domestic',
    estimatedDays: '1-5 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: false,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 15.999,
      maxDimensions: { length: 22, width: 18, height: 15 }
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'GROUND_ADVANTAGE',
    serviceName: 'Ground Advantage',
    displayName: 'USPS Ground Advantage',
    description: '2-5 business days',
    serviceType: 'domestic',
    estimatedDays: '2-5 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 70,
      maxDimensions: { length: 130, width: 130, height: 130 }
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'MEDIA_MAIL',
    serviceName: 'Media Mail',
    displayName: 'USPS Media Mail',
    description: '2-8 business days (books, media only)',
    serviceType: 'domestic',
    estimatedDays: '2-8 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 70
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'PRIORITY_MAIL_INTERNATIONAL',
    serviceName: 'Priority Mail International',
    displayName: 'USPS Priority Mail International',
    description: '6-10 business days',
    serviceType: 'international',
    estimatedDays: '6-10 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 70
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'PRIORITY_MAIL_EXPRESS_INTERNATIONAL',
    serviceName: 'Priority Mail Express International',
    displayName: 'USPS Priority Mail Express International',
    description: '3-5 business days',
    serviceType: 'international',
    estimatedDays: '3-5 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 5000
    },
    restrictions: {
      maxWeight: 70
    }
  },
  {
    carrier: 'USPS',
    serviceCode: 'FIRST_CLASS_MAIL_INTERNATIONAL',
    serviceName: 'First-Class Mail International',
    displayName: 'USPS First-Class Mail International',
    description: '7-21 business days',
    serviceType: 'international',
    estimatedDays: '7-21 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: false,
      insuranceAvailable: false,
      saturdayDelivery: false
    },
    restrictions: {
      maxWeight: 4
    }
  }
]

export const UPS_SERVICES: Omit<CarrierService, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    carrier: 'UPS',
    serviceCode: 'UPS_GROUND',
    serviceName: 'Ground',
    displayName: 'UPS Ground',
    description: '1-5 business days',
    serviceType: 'domestic',
    estimatedDays: '1-5 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'UPS',
    serviceCode: 'UPS_3_DAY_SELECT',
    serviceName: '3 Day Select',
    displayName: 'UPS 3 Day Select',
    description: '3 business days',
    serviceType: 'domestic',
    estimatedDays: '3 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'UPS',
    serviceCode: 'UPS_2ND_DAY_AIR',
    serviceName: '2nd Day Air',
    displayName: 'UPS 2nd Day Air',
    description: '2 business days',
    serviceType: 'domestic',
    estimatedDays: '2 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'UPS',
    serviceCode: 'UPS_NEXT_DAY_AIR',
    serviceName: 'Next Day Air',
    displayName: 'UPS Next Day Air',
    description: 'Next business day',
    serviceType: 'domestic',
    estimatedDays: '1 business day',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'UPS',
    serviceCode: 'UPS_WORLDWIDE_EXPRESS',
    serviceName: 'Worldwide Express',
    displayName: 'UPS Worldwide Express',
    description: '1-3 business days',
    serviceType: 'international',
    estimatedDays: '1-3 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'UPS',
    serviceCode: 'UPS_WORLDWIDE_SAVER',
    serviceName: 'Worldwide Saver',
    displayName: 'UPS Worldwide Saver',
    description: '1-3 business days',
    serviceType: 'international',
    estimatedDays: '1-3 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  }
]

export const FEDEX_SERVICES: Omit<CarrierService, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    carrier: 'FedEx',
    serviceCode: 'FEDEX_GROUND',
    serviceName: 'Ground',
    displayName: 'FedEx Ground',
    description: '1-5 business days',
    serviceType: 'domestic',
    estimatedDays: '1-5 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'FedEx',
    serviceCode: 'FEDEX_2_DAY',
    serviceName: '2Day',
    displayName: 'FedEx 2Day',
    description: '2 business days',
    serviceType: 'domestic',
    estimatedDays: '2 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'FedEx',
    serviceCode: 'FEDEX_EXPRESS_SAVER',
    serviceName: 'Express Saver',
    displayName: 'FedEx Express Saver',
    description: '3 business days',
    serviceType: 'domestic',
    estimatedDays: '3 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'FedEx',
    serviceCode: 'FEDEX_STANDARD_OVERNIGHT',
    serviceName: 'Standard Overnight',
    displayName: 'FedEx Standard Overnight',
    description: 'Next business day',
    serviceType: 'domestic',
    estimatedDays: '1 business day',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: true,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'FedEx',
    serviceCode: 'FEDEX_INTERNATIONAL_ECONOMY',
    serviceName: 'International Economy',
    displayName: 'FedEx International Economy',
    description: '2-5 business days',
    serviceType: 'international',
    estimatedDays: '2-5 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  },
  {
    carrier: 'FedEx',
    serviceCode: 'FEDEX_INTERNATIONAL_PRIORITY',
    serviceName: 'International Priority',
    displayName: 'FedEx International Priority',
    description: '1-3 business days',
    serviceType: 'international',
    estimatedDays: '1-3 business days',
    isActive: true,
    features: {
      trackingIncluded: true,
      signatureAvailable: true,
      insuranceAvailable: true,
      saturdayDelivery: false,
      maxInsuranceValue: 50000
    },
    restrictions: {
      maxWeight: 150
    }
  }
]
