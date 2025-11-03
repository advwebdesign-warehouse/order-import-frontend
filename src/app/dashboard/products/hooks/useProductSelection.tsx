//file path: app/dashboard/products/hooks/useProductSelection.tsx

import { useSelection } from '../../shared/hooks/useSelection'
import { Product } from '../utils/productTypes'

/**
 * Product-specific selection hook that extends the generic useSelection
 * with product-specific functionality
 */
export function useProductSelection() {
  const selection = useSelection<Product>()

  // Product-specific selection methods
  const selectProductsByStatus = (products: Product[], status: string) => {
    selection.selectItemsByFilter(products, product => product.status === status)
  }

  const selectProductsByType = (products: Product[], type: string) => {
    selection.selectItemsByFilter(products, product => product.type === type)
  }

  const selectProductsByCategory = (products: Product[], category: string) => {
    selection.selectItemsByFilter(products, product => product.category === category)
  }

  const selectProductsByStockStatus = (products: Product[], stockStatus: string) => {
    selection.selectItemsByFilter(products, product => product.stockStatus === stockStatus)
  }

  const selectLowStockProducts = (products: Product[]) => {
    selection.selectItemsByFilter(products, product => {
      if (!product.trackQuantity) return false
      const threshold = product.stockThreshold || 10
      return product.stockQuantity <= threshold && product.stockQuantity > 0
    })
  }

  const selectOutOfStockProducts = (products: Product[]) => {
    selection.selectItemsByFilter(products, product =>
      product.trackQuantity && product.stockQuantity === 0
    )
  }

  const selectParentProductsOnly = (products: Product[]) => {
    selection.selectItemsByFilter(products, product => !product.parentId)
  }

  const selectVariantProductsOnly = (products: Product[]) => {
    selection.selectItemsByFilter(products, product => !!product.parentId)
  }

  return {
    ...selection,
    // Product-specific methods
    selectProductsByStatus,
    selectProductsByType,
    selectProductsByCategory,
    selectProductsByStockStatus,
    selectLowStockProducts,
    selectOutOfStockProducts,
    selectParentProductsOnly,
    selectVariantProductsOnly,
    // Aliases for better naming in product context
    selectedProducts: selection.selectedItems,
    handleSelectProduct: selection.handleSelectItem,
    getSelectedProducts: selection.getSelectedItems,
  }
}
