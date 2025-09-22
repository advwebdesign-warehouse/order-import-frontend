'use client'

import React from 'react'
import {
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  LinkIcon
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
  formatVisibility
} from '../utils/productUtils'
import { useSettings } from '../../shared/hooks/useSettings'

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
  onColumnReorder
}: ProductsTableProps) {
  const { settings } = useSettings()
  const isStockManagementEnabled = settings.inventory.manageStock

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

  const SortableHeader = ({ column }: { column: ProductColumnConfig }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: column.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    if (!column.visible) return null

    const isActive = sortConfig.field === column.field
    const isAsc = isActive && sortConfig.direction === 'asc'

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
          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide select-none ${
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
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide select-none ${
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
        return (
          <div>
            <button
              onClick={() => onViewProduct(product)}
              className="text-sm font-mono font-medium text-gray-900 hover:text-gray-700 cursor-pointer"
            >
              {product.sku}
            </button>
            {product.parentSku && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <LinkIcon className="h-3 w-3 mr-1" />
                Parent: {product.parentSku}
              </div>
            )}
          </div>
        )

      case 'name':
        return (
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onViewProduct(product)}
              className="text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer text-left"
            >
              {product.name}
            </button>
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
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VISIBILITY_COLORS[product.visibility as keyof typeof VISIBILITY_COLORS]}`}>
            {formatVisibility(product.visibility)}
          </span>
        )

      // Stock-related columns - only render if stock management is enabled
      case 'stockStatus':
        if (!isStockManagementEnabled) return null

        const stockLevel = getStockLevel(product)
        return (
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STOCK_STATUS_COLORS[product.stockStatus as keyof typeof STOCK_STATUS_COLORS]}`}>
              {formatStockStatus(product.stockStatus)}
            </span>
            {stockLevel === 'critical' && (
              <span className="ml-2 text-red-500" title="Critical stock level">⚠️</span>
            )}
            {stockLevel === 'low' && (
              <span className="ml-2 text-yellow-500" title="Low stock level">⚠️</span>
            )}
          </div>
        )

      case 'stockQuantity':
        if (!isStockManagementEnabled) return null

        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {product.stockQuantity}
            </div>
            {product.stockThreshold && (
              <div className="text-xs text-gray-500">
                Threshold: {product.stockThreshold}
              </div>
            )}
          </div>
        )

      case 'price':
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {formatCurrency(product.price, product.currency)}
            </div>
            {product.comparePrice && product.comparePrice > product.price && (
              <div className="text-xs text-gray-500 line-through">
                {formatCurrency(product.comparePrice, product.currency)}
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
          <div className="text-sm text-gray-700">
            {formatDate(product.createdAt)}
          </div>
        )

      case 'updatedAt':
        return (
          <div className="text-sm text-gray-700">
            {formatDate(product.updatedAt)}
          </div>
        )

      case 'publishedAt':
        return (
          <div className="text-sm text-gray-700">
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
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="min-w-full divide-y divide-gray-300">
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
                      className={`hover:bg-gray-50 ${product.parentId ? 'bg-blue-50/30' : ''}`}
                    >
                      {columns.filter(col => col.visible).map((column) => (
                        <td key={`${product.id}-${column.id}`} className="px-6 py-4 whitespace-nowrap">
                          {renderCellContent(column, product)}
                        </td>
                      ))}
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
