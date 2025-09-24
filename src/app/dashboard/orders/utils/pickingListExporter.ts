// file path: app/dashboard/orders/utils/pickingListExporter.ts
import { Order } from './orderTypes'

interface ConsolidatedItem {
  sku: string
  name: string
  totalQuantity: number
  location?: string
  orders: {
    orderNumber: string
    quantity: number
  }[]
}

/**
 * Generate consolidated items from orders (matching the modal's logic)
 */
function generateConsolidatedItems(orders: Order[]): ConsolidatedItem[] {
  const itemMap = new Map<string, ConsolidatedItem>()

  orders.forEach((order) => {
    // Mock data matching the modal's structure
    const mockItems = [
      { sku: 'TSH-001', name: 'Premium T-Shirt', quantity: Math.ceil((order.itemCount || 0) / 3) },
      { sku: 'HOD-001', name: 'Cotton Hoodie', quantity: Math.floor((order.itemCount || 0) / 3) },
      { sku: 'CAP-001', name: 'Baseball Cap', quantity: (order.itemCount || 0) % 3 || 1 }
    ].filter(item => item.quantity > 0)

    mockItems.forEach(item => {
      if (itemMap.has(item.sku)) {
        const existing = itemMap.get(item.sku)!
        existing.totalQuantity += item.quantity
        existing.orders.push({
          orderNumber: order.orderNumber,
          quantity: item.quantity
        })
      } else {
        itemMap.set(item.sku, {
          sku: item.sku,
          name: item.name,
          totalQuantity: item.quantity,
          location: `A${Math.floor(Math.random() * 9) + 1}-B${Math.floor(Math.random() * 5) + 1}`,
          orders: [{
            orderNumber: order.orderNumber,
            quantity: item.quantity
          }]
        })
      }
    })
  })

  return Array.from(itemMap.values()).sort((a, b) => {
    return (a.location || '').localeCompare(b.location || '')
  })
}

/**
 * Generate CSV content for picking list
 */
export function generatePickingListCSV(orders: Order[], warehouseName: string = 'Warehouse'): string {
  const consolidatedItems = generateConsolidatedItems(orders)

  // Create headers
  const headers = [
    'Location',
    'SKU',
    'Product Name',
    'Total Quantity',
    'Orders',
    'Picked'
  ]

  // Create data rows
  const rows = consolidatedItems.map(item => {
    const orderDetails = item.orders
      .map(o => `${o.orderNumber} (${o.quantity})`)
      .join(' | ')

    return [
      item.location || 'N/A',
      item.sku,
      item.name,
      item.totalQuantity.toString(),
      orderDetails,
      '' // Empty column for picked checkbox
    ]
  })

  // Add summary section
  const totalItems = orders.reduce((sum, order) => sum + (order.itemCount || 0), 0)
  const summaryRows = [
    [],
    ['SUMMARY'],
    ['Total Orders:', orders.length.toString()],
    ['Total Items:', totalItems.toString()],
    ['Unique SKUs:', consolidatedItems.length.toString()],
    ['Warehouse:', warehouseName],
    ['Generated:', new Date().toLocaleString()]
  ]

  // Combine all rows
  const allRows = [
    headers,
    ...rows,
    ...summaryRows
  ]

  // Convert to CSV format
  const csvContent = allRows.map(row => {
    return row.map(cell => {
      const cellStr = String(cell || '')
      // Escape cells that contain commas, quotes, or newlines
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  }).join('\n')

  return csvContent
}

/**
 * Download picking list as CSV file
 */
export function downloadPickingListCSV(orders: Order[], warehouseName: string = 'Warehouse'): void {
  try {
    const csvContent = generatePickingListCSV(orders, warehouseName)

    // Create blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    // Create download link
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    // Generate filename with timestamp
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-') // HH-MM-SS
    const filename = `picking-list-${warehouseName.replace(/\s+/g, '-')}-${dateStr}-${timeStr}.csv`

    // Trigger download
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    console.log(`Successfully exported picking list: ${filename}`)
  } catch (error) {
    console.error('Error exporting picking list:', error)
    alert('Failed to export picking list. Please try again.')
  }
}

/**
 * Generate a detailed picking list CSV with order breakdown
 */
export function generateDetailedPickingListCSV(orders: Order[], warehouseName: string = 'Warehouse'): string {
  // Headers for detailed export
  const headers = [
    'Order Number',
    'Customer Name',
    'Order Date',
    'Platform',
    'Shipping Method',
    'Items Count',
    'Status',
    'SKU',
    'Product Name',
    'Quantity',
    'Location'
  ]

  // Create detailed rows for each item in each order
  const rows: string[][] = []

  orders.forEach(order => {
    const orderDate = new Date(order.orderDate).toLocaleDateString('en-US')

    // Mock items for each order (matching modal structure)
    const mockItems = [
      { sku: 'TSH-001', name: 'Premium T-Shirt', quantity: Math.ceil((order.itemCount || 0) / 3) },
      { sku: 'HOD-001', name: 'Cotton Hoodie', quantity: Math.floor((order.itemCount || 0) / 3) },
      { sku: 'CAP-001', name: 'Baseball Cap', quantity: (order.itemCount || 0) % 3 || 1 }
    ].filter(item => item.quantity > 0)

    mockItems.forEach(item => {
      const location = `A${Math.floor(Math.random() * 9) + 1}-B${Math.floor(Math.random() * 5) + 1}`
      rows.push([
        order.orderNumber,
        order.customerName || '',
        orderDate,
        order.platform || '',
        order.requestedShipping || 'Standard',
        (order.itemCount || 0).toString(),
        order.fulfillmentStatus || order.status || '',
        item.sku,
        item.name,
        item.quantity.toString(),
        location
      ])
    })
  })

  // Combine all data
  const allRows = [headers, ...rows]

  // Convert to CSV
  const csvContent = allRows.map(row => {
    return row.map(cell => {
      const cellStr = String(cell || '')
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  }).join('\n')

  return csvContent
}
