//file path: src/app/dashboard/integrations/hooks/useIntegrationModals.tsx

'use client'

import { useState } from 'react'
import { Integration } from '../types/integrationTypes'

export function useIntegrationModals() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showShopifyModal, setShowShopifyModal] = useState(false)
  const [showUspsModal, setShowUspsModal] = useState(false)
  const [showUpsModal, setShowUpsModal] = useState(false)
  const [showBrowseModal, setShowBrowseModal] = useState(false)

  // Open config modal for specific integration
  const openConfigModal = (integrationId: string) => {
    switch (integrationId) {
      case 'shopify':
        setShowShopifyModal(true)
        break
      case 'usps':
        setShowUspsModal(true)
        break
      case 'ups':
        setShowUpsModal(true)
        break
      default:
        console.warn(`[openConfigModal] No modal for integration: ${integrationId}`)
    }
  }

  // Close all modals
  const closeAllModals = () => {
    setShowShopifyModal(false)
    setShowUspsModal(false)
    setShowUpsModal(false)
    setShowBrowseModal(false)
  }

  // Handle configure click from integration card
  const handleConfigureClick = (integration: Integration) => {
    setSelectedIntegration(integration)

    switch (integration.name.toLowerCase()) {
      case 'shopify':
        setShowShopifyModal(true)
        break
      case 'usps':
        setShowUspsModal(true)
        break
      case 'ups':
        setShowUpsModal(true)
        break
      default:
        console.warn(`[handleConfigureClick] No modal for: ${integration.name}`)
    }
  }

  return {
    // State
    selectedIntegration,
    showShopifyModal,
    showUspsModal,
    showUpsModal,
    showBrowseModal,

    // Setters
    setSelectedIntegration,
    setShowShopifyModal,
    setShowUspsModal,
    setShowUpsModal,
    setShowBrowseModal,

    // Actions
    openConfigModal,
    closeAllModals,
    handleConfigureClick
  }
}
