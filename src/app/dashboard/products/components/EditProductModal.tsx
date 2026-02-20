//file path: app/dashboard/products/components/EditProductModal.tsx

'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Product } from '../utils/productTypes'
import { Store } from '../../stores/utils/storeTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import { ProductAPI } from '@/lib/api/productApi'
import { getMainImage, formatCurrency } from '../utils/productUtils'
import {
  PRODUCT_STATUS_COLORS,
  PRODUCT_TYPE_COLORS,
  VISIBILITY_COLORS,
  STOCK_STATUS_COLORS,
} from '../constants/productConstants'

// ============================================================================
// Types
// ============================================================================

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  stores?: Store[]
  warehouses?: Warehouse[]
  onSave: (updatedProduct: Product) => void
}

type TabId = 'basic' | 'pricing' | 'inventory' | 'organization' | 'physical' | 'seo'

interface Tab {
  id: TabId
  label: string
}

const TABS: Tab[] = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'organization', label: 'Organization' },
  { id: 'physical', label: 'Physical' },
  { id: 'seo', label: 'SEO' },
]

// ============================================================================
// Form Data Interface (mirrors editable product fields)
// ============================================================================

interface ProductFormData {
  // Basic
  name: string
  sku: string
  description: string
  shortDescription: string
  type: Product['type']
  status: Product['status']
  visibility: Product['visibility']

  // Pricing
  price: string
  comparePrice: string
  costPrice: string
  currency: string

  // Inventory
  stockQuantity: string
  stockStatus: Product['stockStatus']
  trackQuantity: boolean
  stockThreshold: string

  // Organization
  category: string
  vendor: string
  brand: string
  tags: string

  // Physical
  weight: string
  weightUnit: 'g' | 'kg' | 'oz' | 'lb'
  dimensionLength: string
  dimensionWidth: string
  dimensionHeight: string
  dimensionUnit: 'cm' | 'in'
  barcode: string

  // SEO
  metaTitle: string
  metaDescription: string
  seoSlug: string
}

// ============================================================================
// Component
// ============================================================================

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  stores = [],
  warehouses = [],
  onSave,
}: EditProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [formData, setFormData] = useState<ProductFormData>(getDefaultFormData())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Reset form when product changes
  useEffect(() => {
    if (product && isOpen) {
      setFormData(productToFormData(product))
      setActiveTab('basic')
      setSaveError(null)
      setSyncWarning(null)
      setHasChanges(false)
    }
  }, [product, isOpen])

  // ============================================================================
  // Helpers
  // ============================================================================

  function getDefaultFormData(): ProductFormData {
    return {
      name: '',
      sku: '',
      description: '',
      shortDescription: '',
      type: 'simple',
      status: 'active',
      visibility: 'visible',
      price: '0',
      comparePrice: '',
      costPrice: '',
      currency: 'USD',
      stockQuantity: '0',
      stockStatus: 'in_stock',
      trackQuantity: true,
      stockThreshold: '10',
      category: '',
      vendor: '',
      brand: '',
      tags: '',
      weight: '',
      weightUnit: 'lb',
      dimensionLength: '',
      dimensionWidth: '',
      dimensionHeight: '',
      dimensionUnit: 'in',
      barcode: '',
      metaTitle: '',
      metaDescription: '',
      seoSlug: '',
    }
  }

  function productToFormData(p: Product): ProductFormData {
    return {
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      type: p.type || 'simple',
      status: p.status || 'active',
      visibility: p.visibility || 'visible',
      price: p.price?.toString() || '0',
      comparePrice: p.comparePrice?.toString() || '',
      costPrice: p.costPrice?.toString() || '',
      currency: p.currency || 'USD',
      stockQuantity: p.stockQuantity?.toString() || '0',
      stockStatus: p.stockStatus || 'in_stock',
      trackQuantity: p.trackQuantity ?? true,
      stockThreshold: p.stockThreshold?.toString() || '10',
      category: p.category || '',
      vendor: p.vendor || '',
      brand: p.brand || '',
      tags: p.tags?.join(', ') || '',
      weight: p.weight?.toString() || '',
      weightUnit: p.weightUnit || 'lb',
      dimensionLength: p.dimensionLength?.toString() || '',
      dimensionWidth: p.dimensionWidth?.toString() || '',
      dimensionHeight: p.dimensionHeight?.toString() || '',
      dimensionUnit: p.dimensionUnit || 'in',
      barcode: p.barcode || '',
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      seoSlug: p.seoSlug || '',
    }
  }

  function formDataToUpdates(fd: ProductFormData): Partial<Product> {
    const updates: Partial<Product> = {}

    // Only include fields that differ from the original product
    if (!product) return updates

    if (fd.name !== (product.name || '')) updates.name = fd.name
    if (fd.sku !== (product.sku || '')) updates.sku = fd.sku
    if (fd.description !== (product.description || '')) updates.description = fd.description
    if (fd.shortDescription !== (product.shortDescription || '')) updates.shortDescription = fd.shortDescription
    if (fd.type !== product.type) updates.type = fd.type
    if (fd.status !== product.status) updates.status = fd.status
    if (fd.visibility !== product.visibility) updates.visibility = fd.visibility

    const newPrice = parseFloat(fd.price) || 0
    if (newPrice !== product.price) updates.price = newPrice

    const newComparePrice = fd.comparePrice ? parseFloat(fd.comparePrice) : undefined
    if (newComparePrice !== product.comparePrice) updates.comparePrice = newComparePrice

    const newCostPrice = fd.costPrice ? parseFloat(fd.costPrice) : undefined
    if (newCostPrice !== product.costPrice) updates.costPrice = newCostPrice

    if (fd.currency !== product.currency) updates.currency = fd.currency

    const newQuantity = parseInt(fd.stockQuantity, 10) || 0
    if (newQuantity !== product.stockQuantity) updates.stockQuantity = newQuantity

    if (fd.stockStatus !== product.stockStatus) updates.stockStatus = fd.stockStatus
    if (fd.trackQuantity !== product.trackQuantity) updates.trackQuantity = fd.trackQuantity

    const newThreshold = fd.stockThreshold ? parseInt(fd.stockThreshold, 10) : undefined
    if (newThreshold !== product.stockThreshold) updates.stockThreshold = newThreshold

    if (fd.category !== (product.category || '')) updates.category = fd.category || undefined
    if (fd.vendor !== (product.vendor || '')) updates.vendor = fd.vendor || undefined
    if (fd.brand !== (product.brand || '')) updates.brand = fd.brand || undefined

    const newTags = fd.tags ? fd.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    if (JSON.stringify(newTags) !== JSON.stringify(product.tags)) updates.tags = newTags

    const newWeight = fd.weight ? parseFloat(fd.weight) : undefined
    if (newWeight !== product.weight) updates.weight = newWeight
    if (fd.weightUnit !== (product.weightUnit || 'lb')) updates.weightUnit = fd.weightUnit

    // Flat dimension columns (match DB schema)
    const newLength = fd.dimensionLength ? parseFloat(fd.dimensionLength) : undefined
    if (newLength !== product.dimensionLength) updates.dimensionLength = newLength
    const newWidth = fd.dimensionWidth ? parseFloat(fd.dimensionWidth) : undefined
    if (newWidth !== product.dimensionWidth) updates.dimensionWidth = newWidth
    const newHeight = fd.dimensionHeight ? parseFloat(fd.dimensionHeight) : undefined
    if (newHeight !== product.dimensionHeight) updates.dimensionHeight = newHeight
    if (fd.dimensionUnit !== (product.dimensionUnit || 'in')) updates.dimensionUnit = fd.dimensionUnit

    if (fd.barcode !== (product.barcode || '')) updates.barcode = fd.barcode || undefined
    if (fd.metaTitle !== (product.metaTitle || '')) updates.metaTitle = fd.metaTitle || undefined
    if (fd.metaDescription !== (product.metaDescription || '')) updates.metaDescription = fd.metaDescription || undefined
    if (fd.seoSlug !== (product.seoSlug || '')) updates.seoSlug = fd.seoSlug || undefined

    return updates
  }

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleFieldChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!product) return

    // Validate required fields
    if (!formData.name.trim()) {
      setSaveError('Product name is required')
      setActiveTab('basic')
      return
    }
    if (!formData.sku.trim()) {
      setSaveError('SKU is required')
      setActiveTab('basic')
      return
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setSaveError('Price must be a valid non-negative number')
      setActiveTab('pricing')
      return
    }

    const updates = formDataToUpdates(formData)

    // No changes detected
    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSyncWarning(null)

    try {
      console.log('[EditProductModal] Saving product updates:', updates)
      const result = await ProductAPI.updateProduct(product.id, updates)

      // Check for sync warning (207 response from backend)
      if (result?._syncWarning) {
        setSyncWarning(result._syncWarning)
      }

      console.log('[EditProductModal] ✅ Product updated successfully')

      // Merge updates with original product to return full updated product
      const updatedProduct: Product = { ...product, ...updates, updatedAt: new Date().toISOString() }
      onSave(updatedProduct)

      // If there's a sync warning, keep modal open briefly to show it
      if (result?._syncWarning) {
        setTimeout(() => {
          onClose()
        }, 3000)
      } else {
        onClose()
      }
    } catch (error: any) {
      console.error('[EditProductModal] ❌ Failed to save:', error)
      setSaveError(error.message || 'Failed to save product. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges && !isSaving) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const imageUrl = product ? getMainImage(product) : null
  const storeName = product?.storeId
    ? stores.find(s => s.id === product.storeId)?.storeName || 'Unknown Store'
    : null

  const renderInput = (
    label: string,
    field: keyof ProductFormData,
    options?: {
      type?: string
      placeholder?: string
      required?: boolean
      disabled?: boolean
      helpText?: string
      prefix?: string
      suffix?: string
      rows?: number
    }
  ) => {
    const { type = 'text', placeholder, required, disabled, helpText, prefix, suffix, rows } = options || {}
    const value = formData[field]

    if (rows) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={value as string}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isSaving}
            rows={rows}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
        </div>
      )
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className={prefix || suffix ? 'flex rounded-md shadow-sm' : ''}>
          {prefix && (
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
              {prefix}
            </span>
          )}
          <input
            type={type}
            value={value as string}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isSaving}
            className={`block w-full ${prefix ? 'rounded-none rounded-r-md' : suffix ? 'rounded-none rounded-l-md' : 'rounded-md'} border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          {suffix && (
            <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
              {suffix}
            </span>
          )}
        </div>
        {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      </div>
    )
  }

  const renderSelect = (
    label: string,
    field: keyof ProductFormData,
    options: { value: string; label: string }[],
    extra?: { helpText?: string; disabled?: boolean }
  ) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={formData[field] as string}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          disabled={extra?.disabled || isSaving}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {extra?.helpText && <p className="mt-1 text-xs text-gray-500">{extra.helpText}</p>}
      </div>
    )
  }

  const renderToggle = (label: string, field: keyof ProductFormData, helpText?: string) => {
    return (
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {helpText && <p className="text-xs text-gray-500">{helpText}</p>}
        </div>
        <button
          type="button"
          onClick={() => handleFieldChange(field, !formData[field])}
          disabled={isSaving}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            formData[field] ? 'bg-indigo-600' : 'bg-gray-200'
          } disabled:opacity-50`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              formData[field] ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  // ============================================================================
  // Tab Content Renderers
  // ============================================================================

  const renderBasicTab = () => (
    <div className="space-y-4">
      {/* Product Image + Platform Info Header */}
      <div className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product?.name}
            className="h-16 w-16 rounded-md object-cover border border-gray-200"
          />
        ) : (
          <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No img</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {product?.platform && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                {product.platform}
              </span>
            )}
            {storeName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {storeName}
              </span>
            )}
            {product?.externalId && (
              <span className="text-xs text-gray-400">
                External: {product.externalId}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            ID: {product?.id}
          </p>
        </div>
      </div>

      {renderInput('Product Name', 'name', { required: true, placeholder: 'Enter product name' })}
      {renderInput('SKU', 'sku', {
        required: true,
        placeholder: 'Enter SKU',
        helpText: product?.platform === 'Shopify' ? 'Changes will sync to Shopify automatically.' : undefined,
      })}

      <div className="grid grid-cols-3 gap-4">
        {renderSelect('Type', 'type', [
          { value: 'simple', label: 'Simple' },
          { value: 'variant', label: 'Variant' },
          { value: 'bundle', label: 'Bundle' },
          { value: 'configurable', label: 'Configurable' },
        ])}
        {renderSelect('Status', 'status', [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'draft', label: 'Draft' },
          { value: 'archived', label: 'Archived' },
        ])}
        {renderSelect('Visibility', 'visibility', [
          { value: 'visible', label: 'Visible' },
          { value: 'hidden', label: 'Hidden' },
          { value: 'catalog', label: 'Catalog Only' },
          { value: 'search', label: 'Search Only' },
        ])}
      </div>

      {renderInput('Short Description', 'shortDescription', {
        placeholder: 'Brief product summary',
        rows: 2,
      })}
      {renderInput('Description', 'description', {
        placeholder: 'Full product description',
        rows: 4,
      })}
    </div>
  )

  const renderPricingTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {renderInput('Price', 'price', {
          type: 'number',
          required: true,
          prefix: '$',
          placeholder: '0.00',
          helpText: product?.platform === 'Shopify' ? 'Price changes will sync to Shopify.' : undefined,
        })}
        {renderInput('Compare At Price', 'comparePrice', {
          type: 'number',
          prefix: '$',
          placeholder: '0.00',
          helpText: 'Original price before discount (strikethrough price)',
        })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {renderInput('Cost Price', 'costPrice', {
          type: 'number',
          prefix: '$',
          placeholder: '0.00',
          helpText: 'Your cost per unit (not visible to customers)',
        })}
        {renderSelect('Currency', 'currency', [
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
          { value: 'GBP', label: 'GBP (£)' },
          { value: 'CAD', label: 'CAD (C$)' },
          { value: 'AUD', label: 'AUD (A$)' },
        ])}
      </div>

      {/* Margin Calculator */}
      {formData.costPrice && formData.price && parseFloat(formData.costPrice) > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Margin Calculator</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Profit</span>
              <p className="font-medium text-green-600">
                ${(parseFloat(formData.price) - parseFloat(formData.costPrice)).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Margin</span>
              <p className="font-medium">
                {((1 - parseFloat(formData.costPrice) / parseFloat(formData.price)) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <span className="text-gray-500">Markup</span>
              <p className="font-medium">
                {(((parseFloat(formData.price) - parseFloat(formData.costPrice)) / parseFloat(formData.costPrice)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderInventoryTab = () => (
    <div className="space-y-4">
      {renderToggle('Track Quantity', 'trackQuantity', 'Enable inventory tracking for this product')}

      {formData.trackQuantity && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {renderInput('Stock Quantity', 'stockQuantity', {
              type: 'number',
              placeholder: '0',
              helpText: product?.platform === 'Shopify' ? 'Inventory changes will sync to Shopify.' : undefined,
            })}
            {renderInput('Low Stock Threshold', 'stockThreshold', {
              type: 'number',
              placeholder: '10',
              helpText: 'Alert when stock falls below this number',
            })}
          </div>

          {renderSelect('Stock Status', 'stockStatus', [
            { value: 'in_stock', label: 'In Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' },
            { value: 'low_stock', label: 'Low Stock' },
            { value: 'backorder', label: 'Backorder' },
          ])}
        </>
      )}

      {/* Warehouse Stock Summary */}
      {product?.warehouseStock && product.warehouseStock.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Warehouse Stock</h4>
          <div className="space-y-2">
            {product.warehouseStock.map(stock => {
              const wh = warehouses.find(w => w.id === stock.warehouseId)
              return (
                <div key={stock.warehouseId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{wh?.name || stock.warehouseId}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{stock.stockQuantity} units</span>
                    {stock.reservedQuantity ? (
                      <span className="text-xs text-orange-600">({stock.reservedQuantity} reserved)</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
            <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2 mt-2">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold">
                {product.warehouseStock.reduce((sum, s) => sum + (s.stockQuantity || 0), 0)} units
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Edit warehouse-specific quantities from the main products table with a warehouse selected.
          </p>
        </div>
      )}
    </div>
  )

  const renderOrganizationTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {renderInput('Category', 'category', { placeholder: 'e.g. Snowboards' })}
        {renderInput('Vendor', 'vendor', { placeholder: 'e.g. Burton' })}
      </div>
      {renderInput('Brand', 'brand', { placeholder: 'e.g. Burton Snowboards' })}
      {renderInput('Tags', 'tags', {
        placeholder: 'tag1, tag2, tag3',
        helpText: 'Comma-separated list of tags',
      })}

      {/* Parent product info (read-only) */}
      {product?.parentId && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-1">Variant Of</h4>
          <p className="text-sm text-blue-600">{product.parentName || product.parentId}</p>
          {product.variantAttributes && product.variantAttributes.length > 0 && (
            <div className="mt-1 flex gap-2">
              {product.variantAttributes.map((attr, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {attr.name}: {attr.value}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderPhysicalTab = () => (
    <div className="space-y-4">
      {renderInput('Weight', 'weight', {
        type: 'number',
        placeholder: '0',
        suffix: 'kg',
      })}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => handleFieldChange('weight', e.target.value)}
              placeholder="0"
              disabled={isSaving}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <select
            value={formData.weightUnit}
            onChange={(e) => handleFieldChange('weightUnit', e.target.value)}
            disabled={isSaving}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="lb">lb</option>
            <option value="oz">oz</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            value={formData.dimensionLength}
            onChange={(e) => handleFieldChange('dimensionLength', e.target.value)}
            placeholder="Length"
            disabled={isSaving}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <input
            type="number"
            value={formData.dimensionWidth}
            onChange={(e) => handleFieldChange('dimensionWidth', e.target.value)}
            placeholder="Width"
            disabled={isSaving}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <input
            type="number"
            value={formData.dimensionHeight}
            onChange={(e) => handleFieldChange('dimensionHeight', e.target.value)}
            placeholder="Height"
            disabled={isSaving}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <select
            value={formData.dimensionUnit}
            onChange={(e) => handleFieldChange('dimensionUnit', e.target.value)}
            disabled={isSaving}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="in">in</option>
            <option value="cm">cm</option>
          </select>
        </div>
      </div>

      {renderInput('Barcode', 'barcode', {
        placeholder: 'UPC, EAN, ISBN, etc.',
        helpText: 'Universal product identifier',
      })}
    </div>
  )

  const renderSeoTab = () => (
    <div className="space-y-4">
      {renderInput('Meta Title', 'metaTitle', {
        placeholder: product?.name || 'SEO title',
        helpText: `${formData.metaTitle.length}/70 characters recommended`,
      })}
      {renderInput('Meta Description', 'metaDescription', {
        placeholder: 'Brief description for search engines',
        rows: 3,
        helpText: `${formData.metaDescription.length}/160 characters recommended`,
      })}
      {renderInput('URL Slug', 'seoSlug', {
        placeholder: 'product-url-slug',
        helpText: 'URL-friendly identifier',
      })}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicTab()
      case 'pricing': return renderPricingTab()
      case 'inventory': return renderInventoryTab()
      case 'organization': return renderOrganizationTab()
      case 'physical': return renderPhysicalTab()
      case 'seo': return renderSeoTab()
      default: return null
    }
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  if (!product) return null

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      Edit Product
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 px-6">
                  <nav className="flex space-x-6 -mb-px overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                  {renderTabContent()}
                </div>

                {/* Errors & Warnings */}
                {(saveError || syncWarning) && (
                  <div className="px-6 pb-2">
                    {saveError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                        {saveError}
                      </div>
                    )}
                    {syncWarning && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 mt-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        {syncWarning}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {hasChanges ? (
                      <span className="text-orange-500 font-medium">Unsaved changes</span>
                    ) : (
                      <span>No changes</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSaving}
                      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges}
                      className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
