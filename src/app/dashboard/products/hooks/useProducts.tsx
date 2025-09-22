import { useState, useEffect } from 'react'
import { Product } from '../utils/productTypes'

// Mock data with parent/child relationships
const mockProducts: Product[] = [
  // Parent product (configurable) - Warehouse 1
  {
    id: '1',
    sku: 'TSH-001',
    name: 'Premium Cotton T-Shirt',
    description: 'High-quality cotton t-shirt available in multiple colors and sizes',
    shortDescription: 'Premium cotton t-shirt',
    type: 'configurable',
    status: 'active',
    visibility: 'visible',
    price: 29.99,
    comparePrice: 39.99,
    costPrice: 15.00,
    currency: 'USD',
    stockQuantity: 150,
    stockStatus: 'in_stock',
    stockThreshold: 20,
    trackQuantity: true,
    weight: 0.2,
    dimensions: {
      length: 25,
      width: 20,
      height: 1,
      unit: 'cm'
    },
    category: 'Apparel',
    tags: ['cotton', 'casual', 'unisex'],
    images: [
      {
        id: '1',
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        altText: 'Premium Cotton T-Shirt',
        position: 1,
        isMain: true
      }
    ],
    variants: [
      {
        id: 'v1',
        sku: 'TSH-001-BL-S',
        name: 'Blue Small',
        price: 29.99,
        stockQuantity: 25,
        stockStatus: 'in_stock',
        attributes: [
          { name: 'color', value: 'blue', displayName: 'Color' },
          { name: 'size', value: 'S', displayName: 'Size' }
        ],
        weight: 0.2
      },
      {
        id: 'v2',
        sku: 'TSH-001-BL-M',
        name: 'Blue Medium',
        price: 29.99,
        stockQuantity: 30,
        stockStatus: 'in_stock',
        attributes: [
          { name: 'color', value: 'blue', displayName: 'Color' },
          { name: 'size', value: 'M', displayName: 'Size' }
        ],
        weight: 0.2
      }
    ],
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    publishedAt: '2025-01-02T10:00:00Z',
    vendor: 'Premium Clothing Co.',
    brand: 'PremiumWear',
    barcode: '1234567890123',
    // Warehouse data
    warehouseId: '1',
    warehouseName: 'Warehouse 1',
    warehouseStock: [
      {
        warehouseId: '1',
        warehouseName: 'Warehouse 1',
        stockQuantity: 150,
        reservedQuantity: 10,
        availableQuantity: 140,
        location: 'A1-B2'
      }
    ]
  },

  // Variant products (children) - Warehouse 1
  {
    id: '2',
    sku: 'TSH-001-BL-S',
    name: 'Premium Cotton T-Shirt - Blue Small',
    description: 'Premium cotton t-shirt in blue, size small',
    type: 'variant',
    status: 'active',
    visibility: 'hidden',
    price: 29.99,
    comparePrice: 39.99,
    costPrice: 15.00,
    currency: 'USD',
    stockQuantity: 25,
    stockStatus: 'in_stock',
    trackQuantity: true,
    weight: 0.2,
    category: 'Apparel',
    tags: ['cotton', 'casual', 'unisex', 'blue', 'small'],
    images: [
      {
        id: '2',
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        altText: 'Premium Cotton T-Shirt Blue Small',
        position: 1,
        isMain: true
      }
    ],
    parentId: '1',
    parentSku: 'TSH-001',
    parentName: 'Premium Cotton T-Shirt',
    variantAttributes: [
      { name: 'color', value: 'blue', displayName: 'Color' },
      { name: 'size', value: 'S', displayName: 'Size' }
    ],
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    vendor: 'Premium Clothing Co.',
    brand: 'PremiumWear',
    barcode: '1234567890124',
    // Warehouse data
    warehouseId: '1',
    warehouseName: 'Warehouse 1',
    warehouseStock: [
      {
        warehouseId: '1',
        warehouseName: 'Warehouse 1',
        stockQuantity: 25,
        reservedQuantity: 2,
        availableQuantity: 23,
        location: 'A1-B2-S1'
      }
    ]
  },

  {
    id: '3',
    sku: 'TSH-001-BL-M',
    name: 'Premium Cotton T-Shirt - Blue Medium',
    description: 'Premium cotton t-shirt in blue, size medium',
    type: 'variant',
    status: 'active',
    visibility: 'hidden',
    price: 29.99,
    comparePrice: 39.99,
    costPrice: 15.00,
    currency: 'USD',
    stockQuantity: 30,
    stockStatus: 'in_stock',
    trackQuantity: true,
    weight: 0.2,
    category: 'Apparel',
    tags: ['cotton', 'casual', 'unisex', 'blue', 'medium'],
    images: [
      {
        id: '3',
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        altText: 'Premium Cotton T-Shirt Blue Medium',
        position: 1,
        isMain: true
      }
    ],
    parentId: '1',
    parentSku: 'TSH-001',
    parentName: 'Premium Cotton T-Shirt',
    variantAttributes: [
      { name: 'color', value: 'blue', displayName: 'Color' },
      { name: 'size', value: 'M', displayName: 'Size' }
    ],
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-09-15T14:30:00Z',
    vendor: 'Premium Clothing Co.',
    brand: 'PremiumWear',
    barcode: '1234567890125',
    // Warehouse data
    warehouseId: '1',
    warehouseName: 'Warehouse 1',
    warehouseStock: [
      {
        warehouseId: '1',
        warehouseName: 'Warehouse 1',
        stockQuantity: 30,
        reservedQuantity: 3,
        availableQuantity: 27,
        location: 'A1-B2-M1'
      }
    ]
  },

  // Simple product - East Coast Warehouse
  {
    id: '4',
    sku: 'MUG-001',
    name: 'Ceramic Coffee Mug',
    description: 'High-quality ceramic coffee mug with company logo',
    shortDescription: 'Ceramic coffee mug',
    type: 'simple',
    status: 'active',
    visibility: 'visible',
    price: 14.99,
    comparePrice: 19.99,
    costPrice: 8.00,
    currency: 'USD',
    stockQuantity: 75,
    stockStatus: 'in_stock',
    stockThreshold: 10,
    trackQuantity: true,
    weight: 0.4,
    dimensions: {
      length: 12,
      width: 9,
      height: 10,
      unit: 'cm'
    },
    category: 'Accessories',
    tags: ['ceramic', 'coffee', 'drinkware'],
    images: [
      {
        id: '4',
        url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
        altText: 'Ceramic Coffee Mug',
        position: 1,
        isMain: true
      }
    ],
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-09-14T16:20:00Z',
    publishedAt: '2025-01-16T10:00:00Z',
    vendor: 'Drinkware Plus',
    brand: 'CeramicPro',
    barcode: '2345678901234',
    upc: '023456789012',
    // Warehouse data
    warehouseId: '2',
    warehouseName: 'East Coast Warehouse',
    warehouseStock: [
      {
        warehouseId: '2',
        warehouseName: 'East Coast Warehouse',
        stockQuantity: 75,
        reservedQuantity: 5,
        availableQuantity: 70,
        location: 'B2-C1'
      }
    ]
  },

  // Another simple product with low stock - European Hub
  {
    id: '5',
    sku: 'NOTE-001',
    name: 'Leather Notebook',
    description: 'Premium leather-bound notebook with lined pages',
    shortDescription: 'Leather notebook',
    type: 'simple',
    status: 'active',
    visibility: 'visible',
    price: 24.99,
    comparePrice: 34.99,
    costPrice: 12.00,
    currency: 'USD',
    stockQuantity: 8,
    stockStatus: 'low_stock',
    stockThreshold: 10,
    trackQuantity: true,
    weight: 0.3,
    category: 'Stationery',
    tags: ['leather', 'notebook', 'writing'],
    images: [
      {
        id: '5',
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
        altText: 'Leather Notebook',
        position: 1,
        isMain: true
      }
    ],
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-09-16T09:15:00Z',
    publishedAt: '2025-02-02T10:00:00Z',
    vendor: 'Stationery World',
    brand: 'LeatherCraft',
    barcode: '3456789012345',
    // Warehouse data
    warehouseId: '3',
    warehouseName: 'European Hub',
    warehouseStock: [
      {
        warehouseId: '3',
        warehouseName: 'European Hub',
        stockQuantity: 8,
        reservedQuantity: 1,
        availableQuantity: 7,
        location: 'C3-D2'
      }
    ]
  },

  // Draft product - Warehouse 1
  {
    id: '6',
    sku: 'PEN-001',
    name: 'Premium Ballpoint Pen',
    description: 'High-quality ballpoint pen with metal body',
    shortDescription: 'Premium ballpoint pen',
    type: 'simple',
    status: 'draft',
    visibility: 'hidden',
    price: 12.99,
    comparePrice: 16.99,
    costPrice: 6.00,
    currency: 'USD',
    stockQuantity: 0,
    stockStatus: 'out_of_stock',
    trackQuantity: true,
    weight: 0.05,
    category: 'Stationery',
    tags: ['pen', 'writing', 'metal'],
    images: [
      {
        id: '6',
        url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop',
        altText: 'Premium Ballpoint Pen',
        position: 1,
        isMain: true
      }
    ],
    createdAt: '2025-09-10T10:00:00Z',
    updatedAt: '2025-09-16T11:45:00Z',
    vendor: 'Writing Tools Inc.',
    brand: 'PenMaster',
    // Warehouse data
    warehouseId: '1',
    warehouseName: 'Warehouse 1',
    warehouseStock: [
      {
        warehouseId: '1',
        warehouseName: 'Warehouse 1',
        stockQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        location: 'A3-B1'
      }
    ]
  }
]

export function useProducts(warehouseId?: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // In real app: const response = await fetch(`/api/products?warehouseId=${warehouseId || ''}`)
        // const products = await response.json()

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Filter by warehouse if specified
        let filteredProducts = mockProducts
        if (warehouseId) {
          filteredProducts = mockProducts.filter(product => product.warehouseId === warehouseId)
        }

        setProducts(filteredProducts)
        setError(null)
      } catch (err) {
        setError('Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [warehouseId])

  const refetchProducts = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Filter by warehouse if specified
    let filteredProducts = mockProducts
    if (warehouseId) {
      filteredProducts = mockProducts.filter(product => product.warehouseId === warehouseId)
    }

    setProducts([...filteredProducts]) // Force re-render with fresh data
    setLoading(false)
  }

  // Get products by warehouse
  const getProductsByWarehouse = (targetWarehouseId: string): Product[] => {
    return mockProducts.filter(product => product.warehouseId === targetWarehouseId)
  }

  // Get warehouse stock for a product
  const getWarehouseStock = (productId: string, targetWarehouseId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.warehouseStock?.find(stock => stock.warehouseId === targetWarehouseId)
  }

  return {
    products,
    loading,
    error,
    refetchProducts,
    getProductsByWarehouse,
    getWarehouseStock
  }
}
