// File path: app/dashboard/shared/hooks/useSelection.tsx

import { useState, useCallback } from 'react'

interface SelectableItem {
  id: string
}

export function useSelection<T extends SelectableItem>() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState(false) // ✅ NEW: Track if "select all across pages" is active

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId)
      } else {
        newSelection.add(itemId)
      }
      return newSelection
    })
    // ✅ NEW: Disable selectAllMode when manually toggling items
    setSelectAllMode(false)
  }

  const handleSelectAll = (items: T[]) => {
    const allItemIds = items.map(item => item.id)
    setSelectedItems(prev => {
      // If all current items are selected, deselect all
      if (allItemIds.every(id => prev.has(id))) {
        return new Set()
      } else {
        // Otherwise, select all current items
        return new Set(allItemIds)
      }
    })
    // ✅ NEW: Disable selectAllMode when using page-level select all
    setSelectAllMode(false)
  }

  // ✅ NEW: Select ALL items across all pages
  const handleSelectAllAcrossPages = useCallback((allItems: T[]) => {
    const allIds = new Set(allItems.map(item => item.id))
    setSelectedItems(allIds)
    setSelectAllMode(true)
  }, [])

  const clearSelection = () => {
    setSelectedItems(new Set())
    // ✅ NEW: Also clear selectAllMode
    setSelectAllMode(false)
  }

  const isSelected = (itemId: string) => {
    return selectedItems.has(itemId)
  }

  const isAllSelected = (items: T[]) => {
    return items.length > 0 && items.every(item => selectedItems.has(item.id))
  }

  // ✅ NEW: Check if all items on current page are selected (for banner)
  const areAllCurrentPageSelected = useCallback((currentPageItems: T[]) => {
    if (currentPageItems.length === 0) return false
    return currentPageItems.every(item => selectedItems.has(item.id))
  }, [selectedItems])

  // ✅ NEW: Check if some (but not all) items on current page are selected
  const areSomeCurrentPageSelected = useCallback((currentPageItems: T[]) => {
    if (currentPageItems.length === 0) return false
    const someSelected = currentPageItems.some(item => selectedItems.has(item.id))
    const allSelected = currentPageItems.every(item => selectedItems.has(item.id))
    return someSelected && !allSelected
  }, [selectedItems])

  const getSelectedItemIds = () => {
    return Array.from(selectedItems)
  }

  const selectItems = (itemIds: string[]) => {
    setSelectedItems(new Set(itemIds))
    // ✅ NEW: Disable selectAllMode when programmatically setting items
    setSelectAllMode(false)
  }

  const selectItemsByFilter = (items: T[], filterFn: (item: T) => boolean) => {
    const filteredIds = items.filter(filterFn).map(item => item.id)
    // Fixed: Use Array.from() instead of spread operator for Vercel compatibility
    setSelectedItems(prev => new Set([...Array.from(prev), ...filteredIds]))
    // ✅ NEW: Disable selectAllMode when using filter selection
    setSelectAllMode(false)
  }

  const getSelectedItems = (items: T[]) => {
    return items.filter(item => selectedItems.has(item.id))
  }

  const hasSelection = () => {
    return selectedItems.size > 0
  }

  const getSelectionCount = () => {
    return selectedItems.size
  }

  return {
    selectedItems,
    handleSelectItem,
    handleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    getSelectedItemIds,
    selectItems,
    selectItemsByFilter,
    getSelectedItems,
    hasSelection,
    getSelectionCount,

    // ✅ NEW: SelectAllBanner support
    selectAllMode,
    handleSelectAllAcrossPages,
    areAllCurrentPageSelected,
    areSomeCurrentPageSelected,
  }
}
