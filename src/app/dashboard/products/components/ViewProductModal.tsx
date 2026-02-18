//file path: app/dashboard/products/components/ViewProductModal.tsx

'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Product } from '../utils/productTypes'
import { Store } from '../../stores/utils/storeTypes'
import { Warehouse } from '../../warehouses/utils/warehouseTypes'
import {
  getMainImage,
  getAllImages,
  formatCurrency,
  formatDate,
  formatProductType,
  formatStockStatus,
  getWarehouseName,
  getStoreName,
} from '../utils/productUtils'
import {
  PRODUCT_STATUS_COLORS,
  STOCK_STATUS_COLORS,
  PRODUCT_TYPE_COLORS,
} from '../constants/productConstants'

interface ViewProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  stores: Store[]
  warehouses: Warehouse[]
  onEdit?: (product: Product) => void
}

type TabId = 'details' | 'inventory' | 'variants' | 'media'

export default function ViewProductModal({
  isOpen,
  onClose,
  product,
  stores,
  warehouses,
  onEdit,
}: ViewProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('details')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!product) return null

  const mainImage = getMainImage(product)
  const allImages = getAllImages(product)
  const storeName = product.storeId ? getStoreName(product.storeId, stores) : null
  const hasVariants = product.variants && product.variants.length > 0
  const hasWarehouseStock = product.warehouseStock && product.warehouseStock.length > 0

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: 'details', label: 'Details', show: true },
    { id: 'inventory', label: 'Inventory', show: true },
    { id: 'variants', label: `Variants (${product.variants?.length || 0})`, show: !!hasVariants },
    { id: 'media', label: `Media (${allImages.length})`, show: allImages.length > 0 },
  ]

  const statusColor = PRODUCT_STATUS_COLORS[product.status] || 'bg-gray-100 text-gray-800'
  const stockColor = STOCK_STATUS_COLORS[product.stockStatus] || 'bg-gray-100 text-gray-800'
  const typeColor = PRODUCT_TYPE_COLORS[product.type] || 'bg-gray-100 text-gray-800'

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform rounded-xl bg-white shadow-2xl transition-all">
                {/* ── Header ── */}
                <div className="flex items-start gap-4 border-b border-gray-200 px-6 py-5">
                  {/* Product Image */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title & Meta */}
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </Dialog.Title>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {product.sku || 'No SKU'}
                      </span>
                      {product.externalId && (
                        <span className="text-xs text-gray-400">
                          External: {product.externalId}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                        {product.status}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                        {formatProductType(product.type)}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stockColor}`}>
                        {formatStockStatus(product)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── Tabs ── */}
                <div className="border-b border-gray-200 px-6">
                  <nav className="-mb-px flex gap-6" aria-label="Tabs">
                    {tabs
                      .filter((t) => t.show)
                      .map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                  </nav>
                </div>

                {/* ── Tab Content ── */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                  {/* Details Tab */}
                  {activeTab === 'details' && (
                    <div className="space-y-6">
                      {/* Pricing */}
                      <Section title="Pricing">
                        <Grid>
                          <Field label="Price" value={formatCurrency(product.price, product.currency)} />
                          <Field label="Compare Price" value={product.comparePrice ? formatCurrency(product.comparePrice, product.currency) : '—'} />
                          <Field label="Cost Price" value={product.costPrice ? formatCurrency(product.costPrice, product.currency) : '—'} />
                          <Field label="Currency" value={product.currency} />
                        </Grid>
                      </Section>

                      {/* Integration / Source */}
                      <Section title="Source">
                        <Grid>
                          <Field label="Platform" value={product.platform || '—'} />
                          <Field label="Store" value={storeName || '—'} />
                          <Field label="Integration ID" value={product.integrationId || '—'} mono />
                          <Field label="External ID" value={product.externalId || '—'} mono />
                        </Grid>
                      </Section>

                      {/* Classification */}
                      <Section title="Classification">
                        <Grid>
                          <Field label="Category" value={product.category || '—'} />
                          <Field label="Vendor" value={product.vendor || '—'} />
                          <Field label="Brand" value={product.brand || '—'} />
                          <Field label="Visibility" value={product.visibility} />
                        </Grid>
                        {product.tags && product.tags.length > 0 && (
                          <div className="mt-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {product.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </Section>

                      {/* Physical */}
                      {(product.weight || product.dimensions || product.barcode) && (
                        <Section title="Physical">
                          <Grid>
                            <Field label="Weight" value={product.weight ? `${product.weight} g` : '—'} />
                            <Field
                              label="Dimensions"
                              value={
                                product.dimensions
                                  ? `${product.dimensions.length || 0} × ${product.dimensions.width || 0} × ${product.dimensions.height || 0} ${product.dimensions.unit || 'cm'}`
                                  : '—'
                              }
                            />
                            <Field label="Barcode" value={product.barcode || '—'} mono />
                            <Field label="UPC" value={product.upc || '—'} mono />
                          </Grid>
                        </Section>
                      )}

                      {/* Description */}
                      {product.description && (
                        <Section title="Description">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {product.description}
                          </p>
                        </Section>
                      )}

                      {/* Dates */}
                      <Section title="Dates">
                        <Grid>
                          <Field label="Created" value={formatDate(product.createdAt)} />
                          <Field label="Updated" value={formatDate(product.updatedAt)} />
                          <Field label="Published" value={product.publishedAt ? formatDate(product.publishedAt) : 'Unpublished'} />
                        </Grid>
                      </Section>
                    </div>
                  )}

                  {/* Inventory Tab */}
                  {activeTab === 'inventory' && (
                    <div className="space-y-6">
                      {/* Global Stock */}
                      <Section title="Global Stock">
                        <Grid>
                          <Field label="Stock Status" value={formatStockStatus(product)} />
                          <Field
                            label="Quantity"
                            value={String(
                              hasWarehouseStock
                                ? product.warehouseStock!.reduce((sum, s) => sum + (s.stockQuantity || 0), 0)
                                : (product.stockQuantity ?? 0)
                            )}
                          />
                          <Field label="Track Quantity" value={product.trackQuantity ? 'Yes' : 'No'} />
                          <Field label="Threshold" value={product.stockThreshold ? String(product.stockThreshold) : '—'} />
                        </Grid>
                      </Section>

                      {/* Warehouse Stock */}
                      {hasWarehouseStock && (
                        <Section title="Warehouse Stock">
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Warehouse</th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Quantity</th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Reserved</th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Available</th>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Location</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {product.warehouseStock!.map((stock, idx) => {
                                  const whName = getWarehouseName(stock.warehouseId, warehouses)
                                  const available = stock.availableQuantity ?? (stock.stockQuantity - (stock.reservedQuantity || 0))
                                  return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{whName}</td>
                                      <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{stock.stockQuantity}</td>
                                      <td className="px-4 py-2.5 text-sm text-gray-500 text-right">{stock.reservedQuantity || 0}</td>
                                      <td className="px-4 py-2.5 text-sm text-right">
                                        <span className={available > 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
                                          {available}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-sm text-gray-500 font-mono text-xs">{stock.location || '—'}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </Section>
                      )}

                      {!hasWarehouseStock && (
                        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                          <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-500">No warehouse stock data available.</p>
                          <p className="text-xs text-gray-400">Assign this product to a warehouse to track inventory by location.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Variants Tab */}
                  {activeTab === 'variants' && hasVariants && (
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Variant</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">SKU</th>
                              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</th>
                              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {product.variants!.map((variant, idx) => {
                              const variantStockColor = STOCK_STATUS_COLORS[variant.stockStatus] || 'bg-gray-100 text-gray-800'
                              return (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      {variant.image && (
                                        <img src={variant.image} alt={variant.name} className="h-8 w-8 rounded object-cover border border-gray-200" />
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{variant.name}</div>
                                        <div className="text-xs text-gray-400">
                                          {variant.attributes.map(a => `${a.name}: ${a.value}`).join(' · ')}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-sm text-gray-600 font-mono text-xs">{variant.sku}</td>
                                  <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{formatCurrency(variant.price, product.currency)}</td>
                                  <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{variant.stockQuantity}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStockColor}`}>
                                      {variant.stockStatus.replace('_', ' ')}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Media Tab */}
                  {activeTab === 'media' && allImages.length > 0 && (
                    <div className="space-y-4">
                      {/* Selected Image Preview */}
                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={allImages[selectedImageIndex]?.url}
                          alt={allImages[selectedImageIndex]?.altText || product.name}
                          className="mx-auto max-h-80 object-contain"
                        />
                      </div>

                      {/* Thumbnails */}
                      {allImages.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                          {allImages.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                                selectedImageIndex === idx
                                  ? 'border-indigo-500 ring-1 ring-indigo-500'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img src={img.url} alt={img.altText || ''} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                  <div className="text-xs text-gray-400">
                    ID: <span className="font-mono">{product.id}</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

/* ── Small helper components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h4>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">{children}</div>
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className={`mt-0.5 text-sm text-gray-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
