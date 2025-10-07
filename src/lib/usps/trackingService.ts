//file path: src/lib/usps/trackingService.ts

import { USPSService } from './uspsService'

export interface TrackingUpdate {
  trackingNumber: string
  status: string
  statusDescription: string
  statusCategory: 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown'
  location: string
  timestamp: string
  deliveryDate?: string
  events: TrackingEvent[]
}

export interface TrackingEvent {
  timestamp: string
  status: string
  location: string
  description: string
}

export class USPSTrackingService {
  private uspsService: USPSService

  constructor(userId?: string, apiUrl?: string) {
    this.uspsService = new USPSService(userId, apiUrl)
  }

  async getTrackingUpdate(trackingNumber: string): Promise<TrackingUpdate | null> {
    try {
      const trackingInfo = await this.uspsService.trackPackage(trackingNumber)

      const status = trackingInfo.Status?.[0] || 'Unknown'
      const statusCategory = this.categorizeStatus(status)

      const events: TrackingEvent[] = []
      if (trackingInfo.TrackSummary) {
        events.push({
          timestamp: trackingInfo.TrackSummary[0].EventTime?.[0] || new Date().toISOString(),
          status: trackingInfo.TrackSummary[0].Event?.[0] || status,
          location: this.formatLocation(trackingInfo.TrackSummary[0]),
          description: trackingInfo.TrackSummary[0].EventDescription?.[0] || ''
        })
      }

      if (trackingInfo.TrackDetail) {
        trackingInfo.TrackDetail.forEach((detail: any) => {
          events.push({
            timestamp: detail.EventTime?.[0] || '',
            status: detail.Event?.[0] || '',
            location: this.formatLocation(detail),
            description: detail.EventDescription?.[0] || ''
          })
        })
      }

      return {
        trackingNumber,
        status,
        statusDescription: trackingInfo.StatusSummary?.[0] || 'No information available',
        statusCategory,
        location: trackingInfo.EventCity?.[0]
          ? `${trackingInfo.EventCity[0]}, ${trackingInfo.EventState?.[0] || ''}`
          : 'Unknown',
        timestamp: trackingInfo.EventTime?.[0] || new Date().toISOString(),
        deliveryDate: trackingInfo.ExpectedDeliveryDate?.[0],
        events
      }
    } catch (error) {
      console.error(`Tracking error for ${trackingNumber}:`, error)
      return null
    }
  }

  async getMultipleTrackingUpdates(trackingNumbers: string[]): Promise<TrackingUpdate[]> {
    const updates: TrackingUpdate[] = []

    for (const trackingNumber of trackingNumbers) {
      const update = await this.getTrackingUpdate(trackingNumber)
      if (update) {
        updates.push(update)
      }
      await this.delay(1000)
    }

    return updates
  }

  private categorizeStatus(status: string): TrackingUpdate['statusCategory'] {
    const statusLower = status.toLowerCase()

    if (statusLower.includes('delivered')) {
      return 'delivered'
    } else if (statusLower.includes('out for delivery')) {
      return 'out_for_delivery'
    } else if (statusLower.includes('in transit') || statusLower.includes('arrived') || statusLower.includes('departed')) {
      return 'in_transit'
    } else if (statusLower.includes('exception') || statusLower.includes('alert') || statusLower.includes('issue')) {
      return 'exception'
    }

    return 'unknown'
  }

  private formatLocation(eventData: any): string {
    const city = eventData.EventCity?.[0] || ''
    const state = eventData.EventState?.[0] || ''
    const zip = eventData.EventZIPCode?.[0] || ''
    const country = eventData.EventCountry?.[0] || ''

    const parts = [city, state, zip, country].filter(Boolean)
    return parts.join(', ') || 'Unknown'
  }

  hasStatusChanged(oldStatus: string, newStatus: string): boolean {
    return oldStatus !== newStatus
  }

  isDelivered(statusCategory: TrackingUpdate['statusCategory']): boolean {
    return statusCategory === 'delivered'
  }

  needsAttention(statusCategory: TrackingUpdate['statusCategory']): boolean {
    return statusCategory === 'exception'
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const trackingService = new USPSTrackingService()
