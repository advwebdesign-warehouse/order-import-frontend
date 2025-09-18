import { useState, useEffect, useMemo } from 'react'
import { Product, ProductFilterState } from '../utils/productTypes'
import { DEFAULT_PRODUCT_FILTERS } from '../constants/productConstants'

export function useProductFilters(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTERS)

  // Filter products based on current search and filter settings
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search term filtering (search in name, sku, description, tags)
      const matchesSearch = searchTerm === '' ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.vendor && product.vendor.toLowerCase().includes(searchTerm.toLowerCase()))

      // Status filtering
      const matchesStatus = filters.status === '' || product.status === filters.status

      // Visibility filtering
      const matchesVisibility = filters.visibility === '' || product.visibility === filters.visibility

      // Type filtering
      const matchesType = filters.type === '' || product.type === filters.type

      // Stock status filtering
      const matchesStockStatus = filters.stockStatus === '' || product.stockStatus === filters.stockStatus

      // Category filtering
      const matchesCategory = filters.category === '' || product.category === filters.category

      // Vendor filtering
      const matchesVendor = filters.vendor === '' || product.vendor === filters.vendor

      // Brand filtering
      const matchesBrand = filters.brand === '' || product.brand === filters.brand

      // Price range filtering
      let matchesPriceRange = true
      if (filters.priceMin && !isNaN(parseFloat(filters.priceMin))) {
        matchesPriceRange = matchesPriceRange && product.price >= parseFloat(filters.priceMin)
      }
      if (filters.priceMax && !isNaN(parseFloat(filters.priceMax))) {
        matchesPriceRange = matchesPriceRange && product.price <= parseFloat(filters.priceMax)
      }

      // Tags filtering
      const matchesTags = filters.tags.length === 0 ||
        filters.tags.some(tag => product.tags.includes(tag))

      // Has variants filtering - Fixed with Boolean() wrapper
      let matchesHasVariants = true
      if (filters.hasVariants === 'yes') {
        matchesHasVariants = Boolean(product.variants && product.variants.length > 0)
      } else if (filters.hasVariants === 'no') {
        matchesHasVariants = Boolean(!product.variants || product.variants.length === 0)
      }

      // Parent/child filtering
      let matchesParentChild = true
      if (filters.parentOnly) {
        // Show only parent products (no parentId)
        matchesParentChild = !product.parentId
      } else if (!filters.includeVariants) {
        // Exclude variant products (those with parentId)
        matchesParentChild = !product.parentId
      }
      // If includeVariants is true and parentOnly is false, show all products

      return matchesSearch &&
             matchesStatus &&
             matchesVisibility &&
             matchesType &&
             matchesStockStatus &&
             matchesCategory &&
             matchesVendor &&
             matchesBrand &&
             matchesPriceRange &&
             matchesTags &&
             matchesHasVariants &&
             matchesParentChild
    })
  }, [products, searchTerm, filters])

  // Get unique values for filter dropdowns - Fixed with Array.from() for Vercel compatibility
  const filterOptions = useMemo(() => {
    return {
      categories: Array.from(new Set(products.map(p => p.category).filter(Boolean))),
      vendors: Array.from(new Set(products.map(p => p.vendor).filter(Boolean))),
      brands: Array.from(new Set(products.map(p => p.brand).filter(Boolean))),
      tags: Array.from(new Set(products.flatMap(p => p.tags))),
      statuses: ['active', 'inactive', 'draft', 'archived'],
      visibilities: ['visible', 'hidden', 'catalog', 'search'],
      types: ['simple', 'variant', 'bundle', 'configurable'],
      stockStatuses: ['in_stock', 'out_of_stock', 'low_stock', 'backorder']
    }
  }, [products])

  // Helper function to reset filters to defaults
  const resetFilters = () => {
    setSearchTerm('')
    setFilters(DEFAULT_PRODUCT_FILTERS)
  }

  return {
    searchTerm,
    setSearchTerm,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    filteredProducts,
    filterOptions,
    resetFilters
  }
}
