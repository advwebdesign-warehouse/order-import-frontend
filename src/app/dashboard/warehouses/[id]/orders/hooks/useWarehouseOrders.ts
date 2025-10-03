// File: app/dashboard/warehouses/[id]/orders/hooks/useWarehouseOrders.ts

import { useState, useEffect } from 'react'
import { Order } from '../../../../orders/utils/orderTypes'

// Enhanced mock orders data with correct warehouse IDs
const mockOrdersData: Order[] = [
  // Existing orders for warehouse 1 (New York Warehouse)
  {
    id: '1',
    orderNumber: 'ORD-2025-001',
    customerName: 'John Smith',
    customerEmail: 'john.smith@email.com',
    totalAmount: 129.97,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'Shopify',
    orderDate: '2025-09-19T10:30:00Z',
    itemCount: 3,
    shippingFirstName: 'John',
    shippingLastName: 'Smith',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '3',
    orderNumber: 'ORD-2025-003',
    customerName: 'Michael Brown',
    customerEmail: 'michael.brown@email.com',
    totalAmount: 156.23,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'BigCommerce',
    orderDate: '2025-09-18T09:45:00Z',
    itemCount: 4,
    shippingFirstName: 'Michael',
    shippingLastName: 'Brown',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '5',
    orderNumber: 'ORD-2025-005',
    customerName: 'David Wilson',
    customerEmail: 'david.wilson@email.com',
    totalAmount: 67.43,
    currency: 'USD',
    status: 'CANCELLED',
    fulfillmentStatus: 'CANCELLED',
    platform: 'Amazon',
    orderDate: '2025-09-16T12:10:00Z',
    itemCount: 2,
    shippingFirstName: 'David',
    shippingLastName: 'Wilson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '7',
    orderNumber: 'ORD-2025-007',
    customerName: 'Robert Taylor',
    customerEmail: 'robert.taylor@email.com',
    totalAmount: 178.91,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'eBay',
    orderDate: '2025-09-18T15:30:00Z',
    itemCount: 2,
    shippingFirstName: 'Robert',
    shippingLastName: 'Taylor',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Ground Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '9',
    orderNumber: 'ORD-2025-009',
    customerName: 'Christopher Lee',
    customerEmail: 'christopher.lee@email.com',
    totalAmount: 425.50,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'WooCommerce',
    orderDate: '2025-09-15T11:05:00Z',
    itemCount: 3,
    shippingFirstName: 'Christopher',
    shippingLastName: 'Lee',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '11',
    orderNumber: 'ORD-2025-011',
    customerName: 'Daniel Garcia',
    customerEmail: 'daniel.garcia@email.com',
    totalAmount: 276.83,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'Amazon',
    orderDate: '2025-09-17T14:15:00Z',
    itemCount: 2,
    shippingFirstName: 'Daniel',
    shippingLastName: 'Garcia',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Ground Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '13',
    orderNumber: 'ORD-2025-013',
    customerName: 'Kevin Rodriguez',
    customerEmail: 'kevin.rodriguez@email.com',
    totalAmount: 512.47,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'Shopify',
    orderDate: '2025-09-14T16:50:00Z',
    itemCount: 2,
    shippingFirstName: 'Kevin',
    shippingLastName: 'Rodriguez',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Overnight Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '15',
    orderNumber: 'ORD-2025-015',
    customerName: 'Brian Walker',
    customerEmail: 'brian.walker@email.com',
    totalAmount: 234.62,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'eBay',
    orderDate: '2025-09-16T10:40:00Z',
    itemCount: 2,
    shippingFirstName: 'Brian',
    shippingLastName: 'Walker',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '17',
    orderNumber: 'ORD-2025-017',
    customerName: 'Thomas Wright',
    customerEmail: 'thomas.wright@email.com',
    totalAmount: 87.33,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'Shopify',
    orderDate: '2025-09-19T16:45:00Z',
    itemCount: 3,
    shippingFirstName: 'Thomas',
    shippingLastName: 'Wright',
    country: 'United Kingdom',
    countryCode: 'GB',
    requestedShipping: 'Standard International',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },

  // Additional orders for warehouse 1 (New York Warehouse)
  {
    id: '19',
    orderNumber: 'ORD-2025-019',
    customerName: 'Patricia Martinez',
    customerEmail: 'patricia.martinez@email.com',
    totalAmount: 295.67,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'Shopify',
    orderDate: '2025-09-20T08:15:00Z',
    itemCount: 4,
    shippingFirstName: 'Patricia',
    shippingLastName: 'Martinez',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '20',
    orderNumber: 'ORD-2025-020',
    customerName: 'Anthony Thompson',
    customerEmail: 'anthony.thompson@email.com',
    totalAmount: 142.88,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'WooCommerce',
    orderDate: '2025-09-20T11:30:00Z',
    itemCount: 2,
    shippingFirstName: 'Anthony',
    shippingLastName: 'Thompson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '21',
    orderNumber: 'ORD-2025-021',
    customerName: 'Sandra Johnson',
    customerEmail: 'sandra.johnson@email.com',
    totalAmount: 389.45,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PACKING',
    platform: 'Amazon',
    orderDate: '2025-09-20T14:20:00Z',
    itemCount: 5,
    shippingFirstName: 'Sandra',
    shippingLastName: 'Johnson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },
  {
    id: '22',
    orderNumber: 'ORD-2025-022',
    customerName: 'Mark Davis',
    customerEmail: 'mark.davis@email.com',
    totalAmount: 198.76,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'BigCommerce',
    orderDate: '2025-09-19T13:45:00Z',
    itemCount: 3,
    shippingFirstName: 'Mark',
    shippingLastName: 'Davis',
    country: 'Canada',
    countryCode: 'CA',
    requestedShipping: 'International Express',
    warehouseId: '1',
    warehouseName: 'New York Warehouse'
  },

  // Existing orders for Warehouse San Diego
  {
    id: '2',
    orderNumber: 'ORD-2025-002',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.johnson@email.com',
    totalAmount: 89.47,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'WooCommerce',
    orderDate: '2025-09-19T14:15:00Z',
    itemCount: 2,
    shippingFirstName: 'Sarah',
    shippingLastName: 'Johnson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '4',
    orderNumber: 'ORD-2025-004',
    customerName: 'Emily Davis',
    customerEmail: 'emily.davis@email.com',
    totalAmount: 203.85,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'Shopify',
    orderDate: '2025-09-17T16:20:00Z',
    itemCount: 2,
    shippingFirstName: 'Emily',
    shippingLastName: 'Davis',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Overnight Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '6',
    orderNumber: 'ORD-2025-006',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa.anderson@email.com',
    totalAmount: 342.18,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PACKING',
    platform: 'Etsy',
    orderDate: '2025-09-19T08:45:00Z',
    itemCount: 3,
    shippingFirstName: 'Lisa',
    shippingLastName: 'Anderson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '8',
    orderNumber: 'ORD-2025-008',
    customerName: 'Jennifer Martinez',
    customerEmail: 'jennifer.martinez@email.com',
    totalAmount: 95.76,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'Shopify',
    orderDate: '2025-09-19T17:20:00Z',
    itemCount: 2,
    shippingFirstName: 'Jennifer',
    shippingLastName: 'Martinez',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '10',
    orderNumber: 'ORD-2025-010',
    customerName: 'Amanda White',
    customerEmail: 'amanda.white@email.com',
    totalAmount: 138.24,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'BigCommerce',
    orderDate: '2025-09-19T13:45:00Z',
    itemCount: 2,
    shippingFirstName: 'Amanda',
    shippingLastName: 'White',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '12',
    orderNumber: 'ORD-2025-012',
    customerName: 'Jessica Thompson',
    customerEmail: 'jessica.thompson@email.com',
    totalAmount: 89.97,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'Etsy',
    orderDate: '2025-09-19T09:30:00Z',
    itemCount: 3,
    shippingFirstName: 'Jessica',
    shippingLastName: 'Thompson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '14',
    orderNumber: 'ORD-2025-014',
    customerName: 'Michelle Lewis',
    customerEmail: 'michelle.lewis@email.com',
    totalAmount: 158.76,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PACKING',
    platform: 'WooCommerce',
    orderDate: '2025-09-18T12:25:00Z',
    itemCount: 3,
    shippingFirstName: 'Michelle',
    shippingLastName: 'Lewis',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '16',
    orderNumber: 'ORD-2025-016',
    customerName: 'Nicole Green',
    customerEmail: 'nicole.green@email.com',
    totalAmount: 321.45,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'ASSIGNED',
    platform: 'Magento',
    orderDate: '2025-09-19T11:15:00Z',
    itemCount: 4,
    shippingFirstName: 'Nicole',
    shippingLastName: 'Green',
    country: 'Canada',
    countryCode: 'CA',
    requestedShipping: 'International Express',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },
  {
    id: '18',
    orderNumber: 'ORD-2025-018',
    customerName: 'Rachel Adams',
    customerEmail: 'rachel.adams@email.com',
    totalAmount: 189.99,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'Amazon',
    orderDate: '2025-09-13T14:20:00Z',
    itemCount: 3,
    shippingFirstName: 'Rachel',
    shippingLastName: 'Adams',
    country: 'Australia',
    countryCode: 'AU',
    requestedShipping: 'International Priority',
    warehouseId: 'bfp9mha4k',
    warehouseName: 'Warehouse San Diego'
  },

  // New orders for warehouse 2 (Chicago Warehouse)
  {
    id: '23',
    orderNumber: 'ORD-2025-023',
    customerName: 'Steven Wilson',
    customerEmail: 'steven.wilson@email.com',
    totalAmount: 267.89,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'Shopify',
    orderDate: '2025-09-20T09:15:00Z',
    itemCount: 3,
    shippingFirstName: 'Steven',
    shippingLastName: 'Wilson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '24',
    orderNumber: 'ORD-2025-024',
    customerName: 'Karen Moore',
    customerEmail: 'karen.moore@email.com',
    totalAmount: 134.56,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'WooCommerce',
    orderDate: '2025-09-20T12:30:00Z',
    itemCount: 2,
    shippingFirstName: 'Karen',
    shippingLastName: 'Moore',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '25',
    orderNumber: 'ORD-2025-025',
    customerName: 'Paul Taylor',
    customerEmail: 'paul.taylor@email.com',
    totalAmount: 445.23,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'Amazon',
    orderDate: '2025-09-19T15:45:00Z',
    itemCount: 4,
    shippingFirstName: 'Paul',
    shippingLastName: 'Taylor',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '26',
    orderNumber: 'ORD-2025-026',
    customerName: 'Nancy Anderson',
    customerEmail: 'nancy.anderson@email.com',
    totalAmount: 178.34,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'BigCommerce',
    orderDate: '2025-09-18T10:20:00Z',
    itemCount: 3,
    shippingFirstName: 'Nancy',
    shippingLastName: 'Anderson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Ground Shipping',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '27',
    orderNumber: 'ORD-2025-027',
    customerName: 'Gary Thomas',
    customerEmail: 'gary.thomas@email.com',
    totalAmount: 356.78,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PACKING',
    platform: 'eBay',
    orderDate: '2025-09-20T14:15:00Z',
    itemCount: 5,
    shippingFirstName: 'Gary',
    shippingLastName: 'Thomas',
    country: 'Canada',
    countryCode: 'CA',
    requestedShipping: 'International Express',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '28',
    orderNumber: 'ORD-2025-028',
    customerName: 'Betty Jackson',
    customerEmail: 'betty.jackson@email.com',
    totalAmount: 92.45,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'Etsy',
    orderDate: '2025-09-20T16:40:00Z',
    itemCount: 2,
    shippingFirstName: 'Betty',
    shippingLastName: 'Jackson',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },
  {
    id: '29',
    orderNumber: 'ORD-2025-029',
    customerName: 'Frank White',
    customerEmail: 'frank.white@email.com',
    totalAmount: 523.67,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'ASSIGNED',
    platform: 'Magento',
    orderDate: '2025-09-20T11:25:00Z',
    itemCount: 6,
    shippingFirstName: 'Frank',
    shippingLastName: 'White',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Overnight Shipping',
    warehouseId: '2',
    warehouseName: 'Chicago Warehouse'
  },

  // New orders for warehouse 3 (Miami Warehouse)
  {
    id: '30',
    orderNumber: 'ORD-2025-030',
    customerName: 'Helen Martinez',
    customerEmail: 'helen.martinez@email.com',
    totalAmount: 198.45,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PICKING',
    platform: 'Shopify',
    orderDate: '2025-09-20T08:30:00Z',
    itemCount: 3,
    shippingFirstName: 'Helen',
    shippingLastName: 'Martinez',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '31',
    orderNumber: 'ORD-2025-031',
    customerName: 'Ralph Rodriguez',
    customerEmail: 'ralph.rodriguez@email.com',
    totalAmount: 287.92,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'WooCommerce',
    orderDate: '2025-09-19T13:20:00Z',
    itemCount: 4,
    shippingFirstName: 'Ralph',
    shippingLastName: 'Rodriguez',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Priority Shipping',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '32',
    orderNumber: 'ORD-2025-032',
    customerName: 'Gloria Lewis',
    customerEmail: 'gloria.lewis@email.com',
    totalAmount: 156.78,
    currency: 'USD',
    status: 'DELIVERED',
    fulfillmentStatus: 'DELIVERED',
    platform: 'Amazon',
    orderDate: '2025-09-18T11:45:00Z',
    itemCount: 2,
    shippingFirstName: 'Gloria',
    shippingLastName: 'Lewis',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Ground Shipping',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '33',
    orderNumber: 'ORD-2025-033',
    customerName: 'Ernest Walker',
    customerEmail: 'ernest.walker@email.com',
    totalAmount: 412.33,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'BigCommerce',
    orderDate: '2025-09-20T15:10:00Z',
    itemCount: 5,
    shippingFirstName: 'Ernest',
    shippingLastName: 'Walker',
    country: 'Mexico',
    countryCode: 'MX',
    requestedShipping: 'International Express',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '34',
    orderNumber: 'ORD-2025-034',
    customerName: 'Frances Hall',
    customerEmail: 'frances.hall@email.com',
    totalAmount: 234.56,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'PACKING',
    platform: 'eBay',
    orderDate: '2025-09-20T09:55:00Z',
    itemCount: 3,
    shippingFirstName: 'Frances',
    shippingLastName: 'Hall',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Express Shipping',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '35',
    orderNumber: 'ORD-2025-035',
    customerName: 'Eugene Allen',
    customerEmail: 'eugene.allen@email.com',
    totalAmount: 89.23,
    currency: 'USD',
    status: 'PENDING',
    fulfillmentStatus: 'PENDING',
    platform: 'Etsy',
    orderDate: '2025-09-20T17:30:00Z',
    itemCount: 2,
    shippingFirstName: 'Eugene',
    shippingLastName: 'Allen',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Standard Shipping',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '36',
    orderNumber: 'ORD-2025-036',
    customerName: 'Marie Young',
    customerEmail: 'marie.young@email.com',
    totalAmount: 345.89,
    currency: 'USD',
    status: 'PROCESSING',
    fulfillmentStatus: 'ASSIGNED',
    platform: 'Magento',
    orderDate: '2025-09-20T12:15:00Z',
    itemCount: 4,
    shippingFirstName: 'Marie',
    shippingLastName: 'Young',
    country: 'Brazil',
    countryCode: 'BR',
    requestedShipping: 'International Priority',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  },
  {
    id: '37',
    orderNumber: 'ORD-2025-037',
    customerName: 'Louis King',
    customerEmail: 'louis.king@email.com',
    totalAmount: 467.12,
    currency: 'USD',
    status: 'SHIPPED',
    fulfillmentStatus: 'SHIPPED',
    platform: 'Shopify',
    orderDate: '2025-09-19T16:25:00Z',
    itemCount: 5,
    shippingFirstName: 'Louis',
    shippingLastName: 'King',
    country: 'United States',
    countryCode: 'US',
    requestedShipping: 'Overnight Shipping',
    warehouseId: '3',
    warehouseName: 'Miami Warehouse'
  }
]

/**
 * Hook to fetch orders for a specific warehouse
 */
export function useWarehouseOrders(warehouseId: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWarehouseOrders = async () => {
      setLoading(true)
      setError(null)

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))

        // Filter orders by warehouse ID
        const warehouseOrders = mockOrdersData.filter(order => order.warehouseId === warehouseId)

        // In a real app, this would be:
        // const response = await fetch(`/api/warehouses/${warehouseId}/orders`)
        // const warehouseOrders = await response.json()

        setOrders(warehouseOrders)
      } catch (err) {
        console.error('Error fetching warehouse orders:', err)
        setError('Failed to load warehouse orders')
      } finally {
        setLoading(false)
      }
    }

    if (warehouseId) {
      fetchWarehouseOrders()
    }
  }, [warehouseId])

  const refreshOrders = async () => {
    const warehouseOrders = mockOrdersData.filter(order => order.warehouseId === warehouseId)
    setOrders(warehouseOrders)
  }

  // Add this function
  const updateOrdersFulfillmentStatus = async (orderIds: string[], newStatus: string) => {
    try {
      // Update the orders in state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          orderIds.includes(order.id)
            ? { ...order, fulfillmentStatus: newStatus }
            : order
        )
      )

      // Also update the mock data for persistence
      mockOrdersData.forEach(order => {
        if (orderIds.includes(order.id)) {
          order.fulfillmentStatus = newStatus
        }
      })

      return true
    } catch (err) {
      console.error('Error updating orders:', err)
      setError('Failed to update orders')
      return false
    }
  }

  const updateStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update order status')

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  const updateFulfillmentStatus = async (orderId: string, newStatus: string): Promise<void> => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillmentStatus: newStatus }),
      })
      if (!response.ok) throw new Error('Failed to update order fulfillment status')

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, fulfillmentStatus: newStatus } : order
        )
      )
    } catch (error) {
      console.error('Error updating order fulfillment status:', error)
      throw error
    }
  }

  // Update return statement:
  return {
    orders,
    loading,
    error,
    refreshOrders,
    updateOrdersFulfillmentStatus,
    updateStatus,              // ADD THIS
    updateFulfillmentStatus    // ADD THIS
  }
}
