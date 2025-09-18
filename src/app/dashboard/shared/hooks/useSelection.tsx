import { useState } from 'react'

interface SelectableItem {
  id: string
}

export function useSelection<T extends SelectableItem>() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

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
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  const isSelected = (itemId: string) => {
    return selectedItems.has(itemId)
  }

  const isAllSelected = (items: T[]) => {
    return items.length > 0 && items.every(item => selectedItems.has(item.id))
  }

  const getSelectedItemIds = () => {
    return Array.from(selectedItems)
  }

  const selectItems = (itemIds: string[]) => {
    setSelectedItems(new Set(itemIds))
  }

  const selectItemsByFilter = (items: T[], filterFn: (item: T) => boolean) => {
    const filteredIds = items.filter(filterFn).map(item => item.id)
    // Fixed: Use Array.from() instead of spread operator for Vercel compatibility
    setSelectedItems(prev => new Set([...Array.from(prev), ...filteredIds]))
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
    getSelectionCount
  }
}
