//file path: app/dashboard/shared/hooks/useNotification.ts

'use client'

import { useState, useCallback } from 'react'
import { NotificationType } from '../components/Notification'

interface NotificationState {
  show: boolean
  type: NotificationType
  title: string
  message?: string
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    title: ''
  })

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string
  ) => {
    setNotification({ show: true, type, title, message })
  }, [])

  const showSuccess = useCallback((title: string, message?: string) => {
    showNotification('success', title, message)
  }, [showNotification])

  const showError = useCallback((title: string, message?: string) => {
    showNotification('error', title, message)
  }, [showNotification])

  const showWarning = useCallback((title: string, message?: string) => {
    showNotification('warning', title, message)
  }, [showNotification])

  const showInfo = useCallback((title: string, message?: string) => {
    showNotification('info', title, message)
  }, [showNotification])

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }))
  }, [])

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification
  }
}
