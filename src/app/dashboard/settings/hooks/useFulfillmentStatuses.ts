//file path: app/dashboard/settings/hooks/useFulfillmentStatuses.ts

import { useState, useEffect } from 'react'
import { FulfillmentStatus } from '../types'
import { DEFAULT_FULFILLMENT_STATUSES } from '../constants'

export function useFulfillmentStatuses() {
  const [statuses, setStatuses] = useState<FulfillmentStatus[]>(DEFAULT_FULFILLMENT_STATUSES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage or API
    const loadStatuses = () => {
      try {
        const saved = localStorage.getItem('fulfillmentStatuses')
        if (saved) {
          const parsed = JSON.parse(saved)
          // Ensure all statuses have the needsPicking field (migration)
          const migratedStatuses = parsed.map((status: any) => ({
            ...status,
            needsPicking: status.needsPicking !== undefined
              ? status.needsPicking
              : ['PENDING', 'ASSIGNED', 'PROCESSING'].includes(status.value)
          }))
          setStatuses(migratedStatuses)
        }
      } catch (error) {
        console.error('Error loading fulfillment statuses:', error)
      } finally {
        setLoading(false)
      }
    }

    // Delay loading to avoid hydration issues
    const timer = setTimeout(loadStatuses, 0)
    return () => clearTimeout(timer)
  }, [])

  const updateStatuses = (newStatuses: FulfillmentStatus[]) => {
    setStatuses(newStatuses)
    localStorage.setItem('fulfillmentStatuses', JSON.stringify(newStatuses))
  }

  return {
    statuses,
    loading,
    updateStatuses
  }
}
