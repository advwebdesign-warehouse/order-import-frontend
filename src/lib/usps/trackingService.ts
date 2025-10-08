//file path: src/lib/usps/trackingService.ts

import { USPSServiceV2, USPSTrackingInfo } from './uspsServiceV2'

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
  private uspsService: USPSServiceV2

  constructor(consumerKey: string, consumerSecret: string, environment: 'sandbox' | 'production') {
    this.uspsService = new USPSServiceV2(consumerKey, consumerSecret, environment)
  }

  async getTrackingUpdate(trackingNumber: string): Promise<TrackingUpdate | null> {
    try {
      const trackingInfo: USPSTrackingInfo = await this.uspsService.trackPackage(trackingNumber)

      // Convert new API format to our TrackingUpdate format
      const events: TrackingEvent[] = trackingInfo.events.map(event => ({
        timestamp: event.eventTimestamp,
        status: event.eventType,
        location: this.formatLocation(event),
        description: event.eventType
      }))

      // Get latest event for current location
      const latestEvent = trackingInfo.events[0]
      const location = latestEvent
        ? this.formatLocation(latestEvent)
        : 'Unknown'

      return {
        trackingNumber,
        status: trackingInfo.status,
        statusDescription: trackingInfo.statusSummary,
        statusCategory: this.categorizeStatus(trackingInfo.statusCategory),
        location,
        timestamp: latestEvent?.eventTimestamp || new Date().toISOString(),
        deliveryDate: trackingInfo.expectedDeliveryDate,
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
      // Rate limiting - wait 1 second between requests
      await this.delay(1000)
    }

    return updates
  }

  private categorizeStatus(statusCategory: string): TrackingUpdate['statusCategory'] {
    const statusLower = statusCategory.toLowerCase()

    if (statusLower.includes('delivered')) {
      return 'delivered'
    } else if (statusLower.includes('out for delivery') || statusLower.includes('out_for_delivery')) {
      return 'out_for_delivery'
    } else if (statusLower.includes('in transit') || statusLower.includes('in_transit')) {
      return 'in_transit'
    } else if (statusLower.includes('exception') || statusLower.includes('alert')) {
      return 'exception'
    }

    return 'unknown'
  }

  private formatLocation(event: any): string {
    const parts = [
      event.eventCity,
      event.eventState,
      event.eventZIP,
      event.eventCountry
    ].filter(Boolean)

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
