//file path: app/dashboard/products/components/ProductImageGalleryModal.tsx

'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'
import { Product } from '../utils/productTypes'
import { getAllImages } from '../utils/productUtils'

interface ProductImageGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export default function ProductImageGalleryModal({
  isOpen,
  onClose,
  product,
}: ProductImageGalleryModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const images = product ? getAllImages(product) : []

  // Reset state when product changes
  useEffect(() => {
    setSelectedIndex(0)
    setIsZoomed(false)
  }, [product?.id])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || images.length === 0) return

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))
        break
      case 'ArrowRight':
        e.preventDefault()
        setSelectedIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))
        break
      case 'Escape':
        if (isZoomed) {
          setIsZoomed(false)
        } else {
          onClose()
        }
        break
    }
  }, [isOpen, images.length, isZoomed, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!product) return null

  const currentImage = images[selectedIndex]
  const hasMultipleImages = images.length > 1

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {images.length} {images.length === 1 ? 'image' : 'images'}
                      {product.sku && (
                        <span className="ml-2 font-mono text-xs text-gray-400">
                          {(!product.externalId || product.sku !== product.externalId) ? `SKU: ${product.sku}` : `External: ${product.externalId}`}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="ml-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Image Area */}
                <div className="relative bg-gray-50">
                  {images.length === 0 ? (
                    /* No images state */
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <svg className="h-16 w-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">No images available</p>
                      <p className="text-xs mt-1">Import product images from your integration</p>
                    </div>
                  ) : (
                    <>
                      {/* Image Display */}
                      <div
                        className={`relative flex items-center justify-center overflow-hidden transition-all duration-200 ${
                          isZoomed ? 'h-[500px] cursor-zoom-out' : 'h-[400px] cursor-zoom-in'
                        }`}
                        onClick={() => setIsZoomed(!isZoomed)}
                      >
                        <img
                          src={currentImage?.url}
                          alt={currentImage?.altText || product.name}
                          className={`transition-transform duration-300 ${
                            isZoomed
                              ? 'max-h-full max-w-full object-contain scale-110'
                              : 'max-h-[380px] max-w-full object-contain'
                          }`}
                          draggable={false}
                        />

                        {/* Zoom indicator */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsZoomed(!isZoomed)
                          }}
                          className="absolute top-3 right-3 rounded-lg bg-white/80 p-1.5 text-gray-600 shadow-sm hover:bg-white transition-colors"
                          title={isZoomed ? 'Zoom out' : 'Zoom in'}
                        >
                          {isZoomed ? (
                            <ArrowsPointingInIcon className="h-4 w-4" />
                          ) : (
                            <ArrowsPointingOutIcon className="h-4 w-4" />
                          )}
                        </button>

                        {/* Image counter badge */}
                        {hasMultipleImages && (
                          <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                            {selectedIndex + 1} / {images.length}
                          </div>
                        )}
                      </div>

                      {/* Navigation Arrows (only if multiple images) */}
                      {hasMultipleImages && (
                        <>
                          <button
                            onClick={() => setSelectedIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md hover:bg-white hover:text-gray-900 transition-all"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setSelectedIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow-md hover:bg-white hover:text-gray-900 transition-all"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Thumbnail Strip (only if multiple images) */}
                {hasMultipleImages && (
                  <div className="border-t border-gray-200 bg-white px-6 py-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedIndex(index)
                            setIsZoomed(false)
                          }}
                          className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                            index === selectedIndex
                              ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.altText || `Image ${index + 1}`}
                            className="h-16 w-16 object-cover"
                            draggable={false}
                          />
                          {/* Active indicator dot */}
                          {index === selectedIndex && (
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-indigo-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer with image details */}
                {currentImage && (
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      {currentImage.altText && (
                        <span className="truncate max-w-xs" title={currentImage.altText}>
                          {currentImage.altText}
                        </span>
                      )}
                      {currentImage.width && currentImage.height && (
                        <span className="text-gray-400">
                          {currentImage.width} × {currentImage.height}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400">
                      Use ← → arrow keys to navigate
                    </span>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
