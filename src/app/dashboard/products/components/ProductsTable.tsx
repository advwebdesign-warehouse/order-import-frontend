//file path: app/dashboard/products/components/ProductsTable.tsx

'use client'

import React, { useState } from 'react'
import {
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  LinkIcon,
  CheckIcon,
  ExclamationTriangleIcon, // Warning icon for missing SKU
  XMarkIcon // Cancel icon
} from '@heroicons/react/24/outline'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Product, ProductColumnConfig, ProductSortState } from '../utils/productTypes'
import {
  PRODUCT_STATUS_COLORS,
  STOCK_STATUS_COLORS,
  PRODUCT_TYPE_COLORS,
  VISIBILITY_COLORS
} from '../constants/productConstants'
import {
  formatCurrency,
  formatDate,
  getMainImage,
  getStockLevel,
  formatStockStatus,
  formatProductType,
  formatVisibility,
  getStoreName
} from '../utils/productUtils'
import { Store } from '../../stores/utils/storeTypes'

// Sticky column configuration
const STICKY_LEFT_COLUMNS = ['select', 'sku']
const STICKY_RIGHT_COLUMNS = ['actions']

// Column widths for sticky positioning
const COLUMN_WIDTHS: Record<string, number> = {
  select: 50,
  sku: 150,
  actions: 100,
}

interface ProductsTableProps {
  products: Product[]
  columns: ProductColumnConfig[]
  sortConfig: ProductSortState
  selectedProducts: Set<string>
  onSort: (field: string) => void
  onSelectProduct: (productId: string) => void
  onSelectAll: () => void
  onViewProduct: (product: Product) => void
  onEditProduct: (product: Product) => void
  onDuplicateProduct: (product: Product) => void
  onColumnReorder: (columns: ProductColumnConfig[]) => void
  onUpdateQuantity?: (productId: string, newQuantity: number) => Promise<void> // Inline quantity update
  onUpdateSku?: (productId: string, newSku: string) => Promise<void> // Inline SKU update
  onUpdatePrice?: (productId: string, newPrice: number, newComparePrice?: number | null) => Promise<void> // Inline price update
  selectedWarehouseId?: string // To display warehouse-specific quantity
  stores?: Store[] // lastSyncAtAdded stores for rendering store names
}

export default function ProductsTable({
  products,
  columns,
  sortConfig,
  selectedProducts,
  onSort,
  onSelectProduct,
  onSelectAll,
  onViewProduct,
  onEditProduct,
  onDuplicateProduct,
  onColumnReorder,
  onUpdateQuantity,
  onUpdateSku, // SKU update handler
  onUpdatePrice, // Price update handler
  selectedWarehouseId, // To display warehouse-specific quantity
  stores = [] // lastSyncAtDefault empty array
}: ProductsTableProps) {

  // State to track which SKU was just copied
  const [copiedSku, setCopiedSku] = useState<string | null>(null)

  // State to track which product name was just copied
  const [copiedProductName, setCopiedProductName] = useState<string | null>(null)

  // State for inline quantity editing
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null)
  const [editingQuantityValue, setEditingQuantityValue] = useState<string>('')
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false)

  // State for inline SKU editing
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null)
  const [editingSkuValue, setEditingSkuValue] = useState<string>('')
  const [isUpdatingSku, setIsUpdatingSku] = useState(false)

  // State for inline product name editing
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editingNameValue, setEditingNameValue] = useState<string>('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  // State for inline price editing
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editingPriceValue, setEditingPriceValue] = useState<string>('')
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)

  // Copy SKU to clipboard
  const handleCopySku = async (sku: string) => {
    try {
      await navigator.clipboard.writeText(sku)
      setCopiedSku(sku)

      // Clear the "copied" indicator after 2 seconds
      setTimeout(() => {
        setCopiedSku(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy SKU:', error)
    }
  }

  // Copy product name to clipboard
  const handleCopyProductName = async (name: string, productId: string) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopiedProductName(productId)

      // Clear the "copied" indicator after 2 seconds
      setTimeout(() => {
        setCopiedProductName(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy product name:', error)
    }
  }

  // Helper: Get quantity for current context (warehouse-specific or global)
  const getProductQuantity = (product: Product): number => {
    if (selectedWarehouseId && product.warehouseStock) {
      // Find warehouse-specific quantity
      const warehouseInventory = product.warehouseStock.find(
        stock => stock.warehouseId === selectedWarehouseId
      )
      return warehouseInventory?.stockQuantity ?? 0
    }
    // ✅ "All Warehouses" → sum actual warehouse inventory entries
    if (product.warehouseStock && product.warehouseStock.length > 0) {
      return product.warehouseStock.reduce((sum, stock) => sum + (stock.stockQuantity ?? 0), 0)
    }
    // Fallback if no warehouse stock entries exist
    return product.stockQuantity
  }

  // Start editing quantity
  const handleStartEditQuantity = (product: Product) => {
    setEditingQuantityId(product.id)
    const currentQuantity = getProductQuantity(product)
    setEditingQuantityValue(currentQuantity.toString())
  }

  // Cancel editing quantity
  const handleCancelEditQuantity = () => {
    setEditingQuantityId(null)
    setEditingQuantityValue('')
    setIsUpdatingQuantity(false)
  }

  // Save edited quantity
  const handleSaveQuantity = async (productId: string) => {
    const newQuantity = parseInt(editingQuantityValue, 10)

    // Validate
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Please enter a valid quantity (0 or greater)')
      return
    }

    // If no handler provided, just update local state
    if (!onUpdateQuantity) {
      console.warn('onUpdateQuantity handler not provided - quantity update not saved')
      handleCancelEditQuantity()
      return
    }

    try {
      setIsUpdatingQuantity(true)
      await onUpdateQuantity(productId, newQuantity)
      handleCancelEditQuantity()
    } catch (error) {
      console.error('Failed to update quantity:', error)
      alert('Failed to update quantity. Please try again.')
      setIsUpdatingQuantity(false)
    }
  }

  // Check if SKU looks like an external ID (needs warning)
  const isSkuMissing = (product: Product): boolean => {
    // Check if SKU matches externalId (fallback SKU)
    if (product.externalId && product.sku === product.externalId) {
      return true
    }
    // Check if SKU is just numeric (likely an ID)
    if (/^\d+$/.test(product.sku)) {
      return true
    }
    // Check if SKU looks like a generic placeholder
    if (!product.sku || product.sku.toLowerCase().includes('unknown')) {
      return true
    }
    return false
  }

  // Start editing SKU
  const handleStartEditSku = (product: Product) => {
    setEditingSkuId(product.id)
    setEditingSkuValue(product.sku)
  }

  // Cancel editing SKU
  const handleCancelEditSku = () => {
    setEditingSkuId(null)
    setEditingSkuValue('')
    setIsUpdatingSku(false)
  }

  // Save edited SKU
  const handleSaveSku = async (productId: string) => {
    const newSku = editingSkuValue.trim()

    // Validate
    if (!newSku) {
      alert('SKU cannot be empty')
      return
    }

    // If no handler provided, warn user
    if (!onUpdateSku) {
      console.warn('onUpdateSku handler not provided - SKU update not saved')
      handleCancelEditSku()
      return
    }

    try {
      setIsUpdatingSku(true)
      await onUpdateSku(productId, newSku)
      handleCancelEditSku()
    } catch (error) {
      console.error('Failed to update SKU:', error)
      alert('Failed to update SKU. Please try again.')
      setIsUpdatingSku(false)
    }
  }

  // Start editing product name
  const handleStartEditName = (product: Product) => {
    setEditingNameId(product.id)
    setEditingNameValue(product.name)
  }

  // Cancel editing product name
  const handleCancelEditName = () => {
    setEditingNameId(null)
    setEditingNameValue('')
    setIsUpdatingName(false)
  }

  // Save edited product name
  const handleSaveName = async (productId: string) => {
    const newName = editingNameValue.trim()

    // Validate
    if (!newName) {
      alert('Product name cannot be empty')
      return
    }

    // Import ProductAPI dynamically to avoid circular dependencies
    try {
      setIsUpdatingName(true)

      const { ProductAPI } = await import('@/lib/api/productApi')
      await ProductAPI.updateProductName(productId, newName)

      console.log('[ProductsTable] ✅ Product name updated successfully')
      handleCancelEditName()

      // Notify parent to refresh products
      if (onUpdateSku) {
        // Reuse the refetch mechanism from SKU updates
        setTimeout(() => {
          window.location.reload() // Simple refresh for now
        }, 500)
      }
    } catch (error: any) {
      console.error('[ProductsTable] ❌ Failed to update product name:', error)
      alert(`Failed to update product name: ${error.message || 'Unknown error'}`)
      setIsUpdatingName(false)
    }
  }

  // Start editing price
  const handleStartEditPrice = (product: Product) => {
    setEditingPriceId(product.id)
    setEditingPriceValue(product.price?.toString() || '0')
  }

  // Cancel editing price
  const handleCancelEditPrice = () => {
    setEditingPriceId(null)
    setEditingPriceValue('')
    setIsUpdatingPrice(false)
  }

  // Save edited price
  const handleSavePrice = async (productId: string) => {
    const newPrice = parseFloat(editingPriceValue)

    // Validate
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Please enter a valid price (0 or greater)')
      return
    }

    // If no handler provided, warn user
    if (!onUpdatePrice) {
      console.warn('onUpdatePrice handler not provided - price update not saved')
      handleCancelEditPrice()
      return
    }

    try {
      setIsUpdatingPrice(true)
      await onUpdatePrice(productId, newPrice)
      handleCancelEditPrice()
    } catch (error: any) {
      console.error('[ProductsTable] Failed to update price:', error)
      alert(`Failed to update price: ${error.message || 'Unknown error'}`)
      setIsUpdatingPrice(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex(item => item.id === active.id)
      const newIndex = columns.findIndex(item => item.id === over.id)
      const newOrder = arrayMove(columns, oldIndex, newIndex)
      onColumnReorder(newOrder)
    }
  }

  // Calculate sticky position for a column
  const getStickyStyle = (columnId: string, isHeader: boolean = false): React.CSSProperties => {
    const visibleColumns = columns.filter(col => col.visible)

    if (STICKY_LEFT_COLUMNS.includes(columnId)) {
      let leftOffset = 0
      for (const col of visibleColumns) {
        if (col.id === columnId) break
        if (STICKY_LEFT_COLUMNS.includes(col.id)) {
          leftOffset += COLUMN_WIDTHS[col.id] || 100
        }
      }
      return {
        position: 'sticky',
        left: leftOffset,
        zIndex: isHeader ? 20 : 10,
      }
    }

    if (STICKY_RIGHT_COLUMNS.includes(columnId)) {
      return {
        position: 'sticky',
        right: 0,
        zIndex: isHeader ? 20 : 10,
      }
    }

    return {}
  }

  // Get CSS classes for sticky columns
  const getStickyClasses = (columnId: string, isHeader: boolean = false): string => {
    const isLeftSticky = STICKY_LEFT_COLUMNS.includes(columnId)
    const isRightSticky = STICKY_RIGHT_COLUMNS.includes(columnId)

    if (!isLeftSticky && !isRightSticky) return ''

    let classes = isHeader ? 'bg-gray-50' : 'bg-white group-hover:bg-gray-50'

    if (isLeftSticky) {
      classes += ' shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]'
    }
    if (isRightSticky) {
      classes += ' shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]'
    }

    return classes
  }

  const SortableHeader = ({ column }: { column: ProductColumnConfig }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: column.id })

    const dragStyle = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    const stickyStyle = getStickyStyle(column.id, true)
    const style = { ...dragStyle, ...stickyStyle }

    if (!column.visible) return null

    const isActive = sortConfig.field === column.field
    const isAsc = isActive && sortConfig.direction === 'asc'
    const stickyClasses = getStickyClasses(column.id, true)

    const handleSortClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (column.sortable) {
        onSort(column.field)
      }
    }

    // Special handling for select column
    if (column.field === 'select') {
      return (
        <th
          ref={setNodeRef}
          style={style}
          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide select-none bg-gray-50 ${stickyClasses} ${
            isDragging ? 'opacity-50' : ''
          }`}
          {...attributes}
        >
          <div className="flex items-center space-x-1">
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-200 flex-shrink-0"
              title="Drag to reorder"
            >
              <Bars3Icon className="h-3 w-3 text-gray-400" />
            </div>
            <input
              type="checkbox"
              checked={products.length > 0 && selectedProducts.size === products.length}
              onChange={onSelectAll}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              title="Select all products on this page"
            />
          </div>
        </th>
      )
    }

    return (
      <th
        ref={setNodeRef}
        style={style}
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide select-none whitespace-nowrap ${stickyClasses} ${
          isDragging ? 'opacity-50' : ''
        }`}
        {...attributes}
      >
        <div className="flex items-center space-x-1">
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-200 flex-shrink-0"
            title="Drag to reorder"
          >
            <Bars3Icon className="h-3 w-3 text-gray-400" />
          </div>
          <div
            className={`flex items-center space-x-1 flex-1 ${column.sortable ? 'cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5' : ''}`}
            onClick={handleSortClick}
          >
            <span className="select-none">
              {column.label}
            </span>
            {column.sortable && (
              <div className="flex flex-col flex-shrink-0">
                <ChevronUpIcon
                  className={`h-3 w-3 ${isActive && isAsc ? 'text-indigo-600' : 'text-gray-300'}`}
                />
                <ChevronDownIcon
                  className={`h-3 w-3 -mt-1 ${isActive && !isAsc ? 'text-indigo-600' : 'text-gray-300'}`}
                />
              </div>
            )}
          </div>
        </div>
      </th>
    )
  }

  const renderCellContent = (column: ProductColumnConfig, product: Product) => {
    switch (column.field) {
      case 'select':
        return (
          <input
            type="checkbox"
            checked={selectedProducts.has(product.id)}
            onChange={() => onSelectProduct(product.id)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        )

      case 'image':
        const imageUrl = getMainImage(product)
        return (
          <div className="w-12 h-12 flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => onViewProduct(product)}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        )

        case 'sku':
          const isSkuEditing = editingSkuId === product.id
          const isSkuCopied = copiedSku === product.sku
          const needsSkuWarning = isSkuMissing(product)

          // SKU rendering with warning and inline editing
          return (
            <div>
              {isSkuEditing ? (
                // Inline editing mode
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSkuValue}
                    onChange={(e) => setEditingSkuValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveSku(product.id)
                      } else if (e.key === 'Escape') {
                        handleCancelEditSku()
                      }
                    }}
                    className="w-32 px-2 py-1 text-sm font-mono border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                    disabled={isUpdatingSku}
                  />
                  <button
                    onClick={() => handleSaveSku(product.id)}
                    disabled={isUpdatingSku}
                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    title="Save SKU"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEditSku}
                    disabled={isUpdatingSku}
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    title="Cancel"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                // Display mode with warning
                <>
                  <div className="flex items-center gap-2">
                    <div
                      onClick={needsSkuWarning ? undefined : () => handleCopySku(product.sku)}
                      className={`group/sku inline-flex items-center gap-1.5 text-sm font-mono font-medium text-gray-900 transition-colors ${
                        needsSkuWarning ? '' : 'hover:text-indigo-600 cursor-pointer'
                      }`}
                      title={needsSkuWarning ? "No SKU — please add a SKU to this product" : "Click to copy SKU"}
                    >
                      {/* ✅ Show warning icon if SKU is missing, otherwise show the SKU */}
                      {needsSkuWarning ? (
                        <ExclamationTriangleIcon
                          className="h-4 w-4 text-amber-500"
                          title="No SKU — please add a SKU to this product"
                        />
                      ) : (
                        <span>{product.sku}</span>
                      )}
                      {/* Only show copy icon when SKU is valid */}
                      {!needsSkuWarning && (
                        isSkuCopied ? (
                          <CheckIcon className="h-3.5 w-3.5 text-green-600 animate-in fade-in zoom-in duration-200" />
                        ) : (
                          <DocumentDuplicateIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/sku:opacity-100 transition-opacity" />
                        )
                      )}
                    </div>

                    {/* Edit button */}
                    {onUpdateSku && (
                      <button
                        onClick={() => handleStartEditSku(product)}
                        className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit SKU"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* ✅ Show external ID only if different from SKU AND SKU is valid */}
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      External: {product.externalId}
                    </div>
                  {/* ✅ Show parent SKU if variant */}
                  {product.parentSku && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Parent: {product.parentSku}
                    </div>
                  )}
                </>
              )}
            </div>
          )

      case 'name':
        const isNameBeingEdited = editingNameId === product.id
        const isNameCopied = copiedProductName === product.id

        return (
          <div className="min-w-[200px] max-w-[300px]">
            {isNameBeingEdited ? (
              // Editing mode - inline input
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveName(product.id)
                    } else if (e.key === 'Escape') {
                      handleCancelEditName()
                    }
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isUpdatingName}
                  autoFocus
                />
                <button
                  onClick={() => handleSaveName(product.id)}
                  disabled={isUpdatingName}
                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                  title="Save"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEditName}
                  disabled={isUpdatingName}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  title="Cancel"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              // Display mode - with copy and edit buttons
              <>
                <div className="flex items-center gap-2 group">
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyProductName(product.name, product.id)
                      }}
                      className="group/name inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-indigo-600 cursor-pointer transition-colors"
                      title="Click to copy product name"
                    >
                      <span>{product.name}</span>
                      {isNameCopied ? (
                        <CheckIcon className="h-3.5 w-3.5 text-green-600 animate-in fade-in zoom-in duration-200" />
                      ) : (
                        <DocumentDuplicateIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                      )}
                    </div>

                  {/* Edit button */}
                  <button
                    onClick={() => handleStartEditName(product)}
                    className="text-blue-600 hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit product name"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                {product.shortDescription && (
                  <div className="text-sm text-gray-500 truncate">
                    {product.shortDescription}
                  </div>
                )}
                {product.parentName && (
                  <div className="text-xs text-gray-500 mt-1">
                    Variant of: {product.parentName}
                  </div>
                )}
              </>
            )}
          </div>
        )

      case 'type':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRODUCT_TYPE_COLORS[product.type as keyof typeof PRODUCT_TYPE_COLORS]}`}>
            {formatProductType(product.type)}
          </span>
        )

      case 'status':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRODUCT_STATUS_COLORS[product.status as keyof typeof PRODUCT_STATUS_COLORS]}`}>
            {product.status}
          </span>
        )

      case 'visibility':
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VISIBILITY_COLORS[product.visibility as keyof typeof VISIBILITY_COLORS]|| 'bg-gray-100 text-gray-800'}`}>
            {formatVisibility(product.visibility)}
          </span>
        )

        case 'platform':
        return (
          <div className="flex items-center">
            {product.platform === 'Shopify' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Shopify
              </span>
            )}
            {product.platform === 'Woocommerce' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                WooCommerce
              </span>
            )}
            {product.platform === 'manual' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Manual
              </span>
            )}
            {!product.platform && (
              <span className="text-gray-400 text-sm">-</span>
            )}
          </div>
        )

        case 'store':
          return (
            <div className="text-sm text-gray-700">
              {product.storeId ? (
                getStoreName(product.storeId, stores)
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )

      case 'stockStatus':
        const stockLevel = getStockLevel(product)
        return (
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STOCK_STATUS_COLORS[product.stockStatus as keyof typeof STOCK_STATUS_COLORS]}`}>
              {formatStockStatus(product)}
            </span>
            {stockLevel.level === 'Out of Stock' && (
              <span className="ml-2 text-red-500" title="Out of stock">⚠️</span>
            )}
            {stockLevel.level === 'Low Stock' && (
              <span className="ml-2 text-yellow-500" title="Low stock level">⚠️</span>
            )}
          </div>
        )

      case 'stockQuantity':
        const isEditingThisQuantity = editingQuantityId === product.id

        return (
          <div className="text-sm">
          {isEditingThisQuantity ? (
            // Edit mode: Show input field
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={editingQuantityValue}
                onChange={(e) => setEditingQuantityValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveQuantity(product.id)
                  } else if (e.key === 'Escape') {
                    handleCancelEditQuantity()
                  }
                }}
                onBlur={() => {
                  // Save on blur (click outside)
                  if (!isUpdatingQuantity) {
                    handleSaveQuantity(product.id)
                  }
                }}
                autoFocus
                disabled={isUpdatingQuantity}
                className="w-20 px-2 py-1 text-sm font-medium text-gray-900 border border-indigo-500 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isUpdatingQuantity && (
                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
              )}
            </div>
          ) : (
            // View mode: Click to edit
            <div>
              <div
                onClick={() => handleStartEditQuantity(product)}
                onDoubleClick={() => handleStartEditQuantity(product)}
                className="inline-flex items-center gap-1.5 font-medium text-gray-900 hover:text-indigo-600 cursor-pointer transition-colors group/qty"
                title="Click to edit quantity"
              >
                <span>{getProductQuantity(product)}</span>
                <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/qty:opacity-100 transition-opacity" />
              </div>
              {product.stockThreshold && (
                <div className="text-xs text-gray-500 mt-1">
                  Threshold: {product.stockThreshold}
                </div>
              )}
            </div>
          )}
          </div>
        )

      case 'price':
        const isEditingThisPrice = editingPriceId === product.id

        return (
          <div className="text-sm">
            {isEditingThisPrice ? (
              // Edit mode: Show input field
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingPriceValue}
                    onChange={(e) => setEditingPriceValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSavePrice(product.id)
                      } else if (e.key === 'Escape') {
                        handleCancelEditPrice()
                      }
                    }}
                    autoFocus
                    disabled={isUpdatingPrice}
                    className="w-24 pl-5 pr-2 py-1 text-sm font-medium text-gray-900 border border-indigo-500 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={() => handleSavePrice(product.id)}
                  disabled={isUpdatingPrice}
                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                  title="Save price"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEditPrice}
                  disabled={isUpdatingPrice}
                  className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                  title="Cancel"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
                {isUpdatingPrice && (
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                )}
              </div>
            ) : (
              // View mode: Click to edit
              <div>
                <div
                  onClick={onUpdatePrice ? () => handleStartEditPrice(product) : undefined}
                  className={`inline-flex items-center gap-1.5 font-medium text-gray-900 transition-colors group/price ${
                    onUpdatePrice ? 'hover:text-indigo-600 cursor-pointer' : ''
                  }`}
                  title={onUpdatePrice ? 'Click to edit price' : undefined}
                >
                  <span>{formatCurrency(product.price, product.currency)}</span>
                  {onUpdatePrice && (
                    <PencilIcon className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/price:opacity-100 transition-opacity" />
                  )}
                </div>
                {product.comparePrice && product.comparePrice > product.price && (
                  <div className="text-xs text-gray-500 line-through">
                    {formatCurrency(product.comparePrice, product.currency)}
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'comparePrice':
        return product.comparePrice ? (
          <div className="text-sm text-gray-700">
            {formatCurrency(product.comparePrice, product.currency)}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )

      case 'costPrice':
        return product.costPrice ? (
          <div className="text-sm text-gray-700">
            {formatCurrency(product.costPrice, product.currency)}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )

      case 'variants':
        return (
          <div className="text-sm">
            {product.variants && product.variants.length > 0 ? (
              <button
                onClick={() => onViewProduct(product)}
                className="text-indigo-600 hover:text-indigo-900 hover:underline"
              >
                {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
              </button>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        )

      case 'category':
        return (
          <div className="text-sm text-gray-700">
            {product.category || '-'}
          </div>
        )

      case 'vendor':
        return (
          <div className="text-sm text-gray-700">
            {product.vendor || '-'}
          </div>
        )

      case 'brand':
        return (
          <div className="text-sm text-gray-700">
            {product.brand || '-'}
          </div>
        )

      case 'weight':
        return (
          <div className="text-sm text-gray-700">
            {product.weight ? `${product.weight} kg` : '-'}
          </div>
        )

      case 'barcode':
        return (
          <div className="text-sm font-mono text-gray-700">
            {product.barcode || '-'}
          </div>
        )

      case 'parentName':
        return (
          <div className="text-sm text-gray-700">
            {product.parentName || '-'}
          </div>
        )

      case 'createdAt':
        return (
          <div className="text-sm text-gray-700 whitespace-nowrap">
            {formatDate(product.createdAt)}
          </div>
        )

      case 'updatedAt':
        return (
          <div className="text-sm text-gray-700 whitespace-nowrap">
            {formatDate(product.updatedAt)}
          </div>
        )

      case 'publishedAt':
        return (
          <div className="text-sm text-gray-700 whitespace-nowrap">
            {product.publishedAt ? formatDate(product.publishedAt) : 'Unpublished'}
          </div>
        )

      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {product.tags.length > 0 ? (
              product.tags.slice(0, 2).map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )}
            {product.tags.length > 2 && (
              <span className="text-xs text-gray-500">
                +{product.tags.length - 2} more
              </span>
            )}
          </div>
        )

      case 'actions':
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewProduct(product)}
              className="text-indigo-600 hover:text-indigo-900"
              title="View Product"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEditProduct(product)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit Product"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDuplicateProduct(product)}
              className="text-green-600 hover:text-green-900"
              title="Duplicate Product"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="mt-8 flow-root">
    {/* ✅ Scroll container with scrollbar on TOP */}
    <div className="shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg max-w-full">
      {/* Outer wrapper - scrollbar-top class flips scrollbar to top */}
      <div className="overflow-x-auto scrollbar-top">
        {/* Inner wrapper - scrollbar-top-content flips content back to normal */}
        <div className="scrollbar-top-content">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
                      {columns.filter(col => col.visible).map((column) => (
                        <SortableHeader key={column.id} column={column} />
                      ))}
                    </SortableContext>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={`group hover:bg-gray-50 ${product.parentId ? 'bg-blue-50/30' : ''}`}
                    >
                    {columns.filter(col => col.visible).map((column) => {
                      const stickyStyle = getStickyStyle(column.id, false)
                      const isLeftSticky = STICKY_LEFT_COLUMNS.includes(column.id)
                      const isRightSticky = STICKY_RIGHT_COLUMNS.includes(column.id)
                      const isSticky = isLeftSticky || isRightSticky

                      return (
                        <td
                          key={`${product.id}-${column.id}`}
                          style={stickyStyle}
                          className={`px-4 py-4 whitespace-nowrap text-sm ${
                            isSticky ? (
                              product.parentId
                                ? 'bg-blue-50 group-hover:bg-blue-100'
                                : 'bg-white group-hover:bg-gray-50'
                            ) : ''
                          } ${isLeftSticky ? 'shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                          } ${isRightSticky ? 'shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                        >
                          {renderCellContent(column, product)}
                        </td>
                      )
                    })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </DndContext>
            </div>
          </div>
        </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8v2.5" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
        </div>
      )}
    </div>
  )
}
