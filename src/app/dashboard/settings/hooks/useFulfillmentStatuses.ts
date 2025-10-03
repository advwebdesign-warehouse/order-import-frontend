//file path: app/dashboard/settings/hooks/useFulfillmentStatuses.ts

import { useState, useEffect } from 'react'
import { FulfillmentStatus } from '../types'
import { DEFAULT_FULFILLMENT_STATUSES } from '../fulfillmentTypes'

export function useFulfillmentStatuses() {
  const [statuses, setStatuses] = useState<FulfillmentStatus[]>(DEFAULT_FULFILLMENT_STATUSES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatuses = () => {
      try {
        const saved = localStorage.getItem('fulfillmentStatuses')
        if (saved) {
          const parsed = JSON.parse(saved)

          // Migrate old data structure: rename 'value' to 'code', 'sortOrder' to 'order', 'isSystem' to 'type'
          const migratedStatuses = parsed.map((status: any) => {
            const code = status.code || status.value
            return {
              id: status.id,
              order: status.order || status.sortOrder || 0,
              label: status.label,
              code: code,
              color: status.color,
              needsShipping: status.needsShipping,
              needsPicking: status.needsPicking !== undefined
                ? status.needsPicking
                : ['PENDING', 'PROCESSING'].includes(code),
              type: status.type || (status.isSystem ? 'system' : 'custom'),
              isEditable: status.isEditable !== undefined ? status.isEditable : !status.isSystem
            }
          })

          // Deduplicate by code
          const seenCodes = new Set<string>()
          const deduplicatedStatuses = migratedStatuses.filter((status: any) => {
            if (seenCodes.has(status.code)) {
              console.warn(`⚠️ Duplicate status code removed: ${status.code}`)
              return false
            }
            seenCodes.add(status.code)
            return true
          })

          setStatuses(deduplicatedStatuses)

          // Save migrated data back
          localStorage.setItem('fulfillmentStatuses', JSON.stringify(deduplicatedStatuses))
        }
      } catch (error) {
        console.error('Error loading fulfillment statuses:', error)
      } finally {
        setLoading(false)
      }
    }

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
